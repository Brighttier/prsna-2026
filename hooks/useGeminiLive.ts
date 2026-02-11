import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { createPcmBlob, convertBlobToBase64, decodeAudioData } from '../services/geminiService';

interface UseGeminiLiveProps {
  systemInstruction?: string;
  onTranscript?: (text: string, isUser: boolean) => void;
}

export const useGeminiLive = ({ systemInstruction, onTranscript }: UseGeminiLiveProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio context and processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Session promise ref to ensure we send data to the correct active session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Video streaming interval
  const videoIntervalRef = useRef<number | null>(null);

  const connect = async () => {
    if (isConnected) return;

    // Check kill switch
    const { store } = await import('../services/store');
    if (!store.isAiAllowed('interview')) {
      setError("AI Interviews are currently disabled by Platform Admin.");
      return;
    }

    try {
      setError(null);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is missing");
      const ai = new GoogleGenAI({ apiKey });

      // Initialize Audio Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction || "You are a helpful assistant.",
          inputAudioTranscription: {}, // Enable user transcription
          outputAudioTranscription: {}, // Enable model transcription
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setIsConnected(true);

            // Setup Audio Streaming to Model
            if (!inputContextRef.current || !streamRef.current) return;

            const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;

            // ScriptProcessor for raw PCM access (Worklet is better but more complex for single file constraint)
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Float32Array(inputData);

              // Convert Float32 (-1 to 1) to Int16 for the API
              const l = pcmData.length;
              const int16Buffer = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16Buffer[i] = pcmData[i] * 32768;
              }

              // Base64 encode raw bytes
              let binary = '';
              const bytes = new Uint8Array(int16Buffer.buffer);
              const len = bytes.byteLength;
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Data = btoa(binary);

              // Use the ref to ensure we use the current session
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: "audio/pcm;rate=16000",
                    data: base64Data
                  }
                });
              }).catch(err => console.error("Error sending input", err));
            };

            source.connect(processor);
            processor.connect(inputContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Transcriptions
            if (msg.serverContent?.outputTranscription?.text && onTranscript) {
              onTranscript(msg.serverContent.outputTranscription.text, false);
            }
            if (msg.serverContent?.inputTranscription?.text && onTranscript) {
              onTranscript(msg.serverContent.inputTranscription.text, true);
            }

            // Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current && audioContextRef.current.state !== 'closed') {
              const ctx = audioContextRef.current;
              try {
                const buffer = await decodeAudioData(audioData, ctx);

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);

                // Schedule playback
                const currentTime = ctx.currentTime;
                if (nextStartTimeRef.current < currentTime) {
                  nextStartTimeRef.current = currentTime;
                }
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
              } catch (e) {
                console.error("Error processing audio message", e);
              }
            }
          },
          onclose: () => {
            console.log("Gemini Live Disconnected");
            setIsConnected(false);
          },
          onerror: (e) => {
            console.error("Gemini Live Error", e);
            setError("Connection error occurred.");
            setIsConnected(false);
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
      // Critical: Await the connection to catch immediate setup/network errors
      await sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to Lumina");
      setIsConnected(false);
      sessionPromiseRef.current = null;

      // Cleanup streams if connection failed
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) audioContextRef.current.close();
      if (inputContextRef.current) inputContextRef.current.close();
    }
  };

  const disconnect = () => {
    // Cleanup Audio Nodes first
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Close Audio Contexts - Check state first to avoid "Cannot close a closed AudioContext" error
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (inputContextRef.current && inputContextRef.current.state !== 'closed') {
      inputContextRef.current.close();
    }

    // Stop Stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop Interval
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }

    sessionPromiseRef.current?.then(session => {
      // @ts-ignore
      if (session.close) session.close();
    }).catch(() => { }); // Ignore errors on close
    sessionPromiseRef.current = null;

    setIsConnected(false);
  };

  const sendVideoFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!isConnected || !sessionPromiseRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth * 0.5; // Scale down for performance
    canvas.height = videoElement.videoHeight * 0.5;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const base64Data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

    sessionPromiseRef.current.then(session => {
      session.sendRealtimeInput({
        media: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
    });
  }, [isConnected]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    }
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendVideoFrame
  };
};