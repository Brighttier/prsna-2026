import React, { useState, useRef, useCallback } from 'react';
import { User } from 'lucide-react';

interface CandidateAvatarProps {
    avatar?: string;
    videoUrl?: string;
    name: string;
    size?: 'sm' | 'lg';
    blindMode?: boolean;
}

export const CandidateAvatar: React.FC<CandidateAvatarProps> = ({
    avatar,
    videoUrl,
    name,
    size = 'sm',
    blindMode = false,
}) => {
    const [isHovering, setIsHovering] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const isLg = size === 'lg';
    const sizeClasses = isLg ? 'w-24 h-24 rounded-2xl' : 'w-10 h-10 rounded-full';
    const borderClasses = isLg ? 'border-4 border-slate-50 shadow-md' : 'border border-slate-200';

    const handleMouseEnter = useCallback(() => {
        if (!videoUrl || blindMode) return;
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovering(true);
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
            }
        }, 200);
    }, [videoUrl, blindMode]);

    const handleMouseLeave = useCallback(() => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setIsHovering(false);
        setVideoReady(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, []);

    if (blindMode) {
        return (
            <div className={`${sizeClasses} bg-slate-200 flex items-center justify-center text-slate-400`}>
                <User className={isLg ? 'w-10 h-10' : 'w-5 h-5'} />
            </div>
        );
    }

    const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e2e8f0&color=475569&bold=true&size=${isLg ? 192 : 80}`;

    return (
        <div
            className={`relative ${sizeClasses} overflow-hidden ${borderClasses} cursor-pointer`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <img
                src={avatar || fallbackSrc}
                alt={name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isHovering && videoReady ? 'opacity-0' : 'opacity-100'}`}
            />

            {videoUrl && (
                <video
                    ref={videoRef}
                    src={isHovering ? videoUrl : undefined}
                    playsInline
                    loop
                    preload="none"
                    onCanPlay={() => setVideoReady(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovering && videoReady ? 'opacity-100' : 'opacity-0'}`}
                />
            )}

            {isHovering && videoUrl && !videoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-inherit">
                    <div className={`bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center ${isLg ? 'w-8 h-8' : 'w-5 h-5'}`}>
                        <div className={`w-0 h-0 border-t-transparent border-b-transparent ${isLg ? 'border-l-[8px] border-t-[5px] border-b-[5px] ml-0.5' : 'border-l-[5px] border-t-[3px] border-b-[3px] ml-px'} border-l-black/70`} />
                    </div>
                </div>
            )}
        </div>
    );
};
