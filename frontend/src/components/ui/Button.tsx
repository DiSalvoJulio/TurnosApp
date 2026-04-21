import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children, variant = 'primary', fullWidth, className, ...props
}) => {
    const baseStyle = "px-6 py-4 rounded-xl font-medium text-lg transition-colors focus:ring-4 focus:outline-none flex justify-center items-center shadow-sm disabled:opacity-50";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300",
        secondary: "bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-300",
    };

    return (
        <button
            className={clsx(baseStyle, variants[variant], fullWidth && "w-full", className)}
            {...props}
        >
            {children}
        </button>
    );
};
