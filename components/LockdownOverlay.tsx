
import React from 'react';
import { store } from '../services/store';
import { AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';
import { useState, useEffect } from 'react';

export const LockdownOverlay = () => {
    const [isLocked, setIsLocked] = useState(store.getState().settings.killSwitches.global);

    useEffect(() => {
        return store.subscribe(() => {
            setIsLocked(store.getState().settings.killSwitches.global);
        });
    }, []);

    if (!isLocked) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center border-4 border-red-500 animate-bounce-subtle">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ShieldAlert className="w-12 h-12 text-red-600 animate-pulse" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">SYSTEM LOCKDOWN</h1>
                <p className="text-slate-600 mb-8 leading-relaxed">
                    A global administrative kill switch has been triggered. All AI-powered features, including resume screening and Lumina interviews, have been suspended by your platform administrator.
                </p>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <Cpu className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Connection Severed to Gemini API</span>
                    </div>
                    <p className="text-xs text-slate-400">Please contact your infrastructure team for more information.</p>
                </div>
            </div>
        </div>
    );
};
