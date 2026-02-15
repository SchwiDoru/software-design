import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    ...props
}) => {
    const baseStyles = "font-medium rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-hover focus:ring-primary-light",
        secondary: "bg-secondary text-text-main hover:bg-secondary-hover focus:ring-gray-400",
        success: "bg-success text-white hover:bg-success-hover focus:ring-green-400",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400" // Added danger even if not in CSS class yet, useful for Admin
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-6 py-2 text-base",
        lg: "px-8 py-3 text-lg"
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
