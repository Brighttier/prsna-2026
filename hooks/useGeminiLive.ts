import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { createPcmBlob, convertBlobToBase64, decodeAudioData } from '../services/geminiService';

interface UseGeminiLiveProps {
  systemInstruction?: string;
  onTranscript?: (text: string, isUser: boolean) => void;
  onTurnComplete?: () => void;
  existingStream?: MediaStream | null;
}

export const useGeminiLive = ({ systemInstruction, onTranscript, onTurnComplete, existingStream }: UseGeminiLiveProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
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
    if (isConnected || isConnecting) return;
    setIsConnecting(true);

    // Check kill switch
    const { store } = await import('../services/store');
    if (!store.isAiAllowed('interview')) {
      setError("AI Interviews are currently disabled by Platform Admin.");
      setIsConnecting(false);
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

      // Resume AudioContexts — they may start in 'suspended' state because the await above
      // broke the synchronous user-gesture chain that browsers require for auto-play
      await audioContextRef.current.resume();
      await inputContextRef.current.resume();

      // Reuse existing stream if provided (avoids duplicate getUserMedia conflicts), otherwise request new one
      const stream = existingStream || await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction || "You are a helpful assistant.",
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setIsConnected(true);
            setIsConnecting(false);

            // Prompt the AI to begin speaking its introduction immediately
            sessionPromiseRef.current?.then(session => {
              session.sendClientContent({
                turns: [{ role: 'user', parts: [{ text: 'Begin the interview now. Start with your introduction.' }] }],
                turnComplete: true
              });
            }).catch(err => console.error("Error sending initial prompt", err));

            // Setup Audio Streaming to Model
            if (!inputContextRef.current || !streamRef.current) {
              console.error("Audio setup failed: inputContext or stream is null");
              setError("Audio initialization failed. Please refresh the page and try again.");
              return;
            }

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
            // Handle Transcriptions (if server supports them)
            if (msg.serverContent?.outputTranscription?.text && onTranscript) {
              onTranscript(msg.serverContent.outputTranscription.text, false);
            }
            if (msg.serverContent?.inputTranscription?.text && onTranscript) {
              onTranscript(msg.serverContent.inputTranscription.text, true);
            }

            // Fallback: capture any text parts from model turn
            const textPart = msg.serverContent?.modelTurn?.parts?.find(p => p.text);
            if (textPart?.text && onTranscript) {
              onTranscript(textPart.text, false);
            }

            // Signal turn completion (AI finished speaking)
            if (msg.serverContent?.turnComplete && onTurnComplete) {
              onTurnComplete();
            }

            // Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current && audioContextRef.current.state !== 'closed') {
              const ctx = audioContextRef.current;
              try {
                // Ensure context is running (browser may auto-suspend after inactivity)
                if (ctx.state === 'suspended') await ctx.resume();
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
          onclose: (e: CloseEvent) => {
            console.log(`Gemini Live Disconnected — code: ${e.code}, reason: "${e.reason}", wasClean: ${e.wasClean}`);
            setIsConnected(false);
            setIsConnecting(false);
            if (e.code !== 1000) {
              setError(`Connection closed unexpectedly (code ${e.code}). Please try again.`);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error("Gemini Live Error", e.message || e);
            setError(e.message || "Connection error occurred. Please try again.");
            setIsConnected(false);
            setIsConnecting(false);
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
      // Critical: Await the connection to catch immediate setup/network errors
      await sessionPromise;

    } catch (err: any) {
      console.error("Lumina connect failed:", err);
      setError(err.message || "Failed to connect to Lumina. Please try again.");
      setIsConnected(false);
      setIsConnecting(false);
      sessionPromiseRef.current = null;

      // Cleanup streams if connection failed (only stop if we created it)
      if (streamRef.current && !existingStream) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      streamRef.current = null;
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

    // Only stop stream tracks if we created it (not shared from parent)
    if (streamRef.current && !existingStream) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;

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
    isConnecting,
    error,
    connect,
    disconnect,
    sendVideoFrame,
    sendContent: useCallback(async (text: string) => {
      if (!isConnected || !sessionPromiseRef.current) return;
      sessionPromiseRef.current.then(session => {
        session.sendRealtimeInput({
          parts: [{ text: `[SYSTEM: CODE_EDITOR_STATE] Current code in editor:\n\n${text}` }]
        });
      });
    }, [isConnected])
  };
};