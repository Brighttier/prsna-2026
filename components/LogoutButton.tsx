
import React from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '../services/auth';
import { useNavigate } from 'react-router-dom';

interface LogoutButtonProps {
    variant?: 'icon' | 'full' | 'ghost';
    className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ variant = 'full', className = '' }) => {
    const navigate = useNavigate();
    const baseStyles = "flex items-center gap-2 transition-all duration-200";

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={handleLogout}
                className={`p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg ${className}`}
                title="Logout"
            >
                <LogOut className="w-5 h-5" />
            </button>
        );
    }

    if (variant === 'ghost') {
        return (
            <button
                onClick={handleLogout}
                className={`text-slate-500 hover:text-red-600 font-medium text-sm flex items-center gap-2 ${className}`}
            >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleLogout}
            className={`px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 shadow-sm flex items-center gap-2 ${className}`}
        >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
        </button>
    );
};
