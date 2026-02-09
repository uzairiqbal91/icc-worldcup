'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    return (
        <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}>
            <div className="text-2xl font-bold">{icon}</div>
            <div className="text-sm font-medium">{message}</div>
            <button
                onClick={onClose}
                className="ml-4 text-white hover:text-gray-200 text-xl font-bold"
            >
                ×
            </button>
        </div>
    );
}
