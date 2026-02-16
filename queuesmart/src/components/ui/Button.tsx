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
    const baseStyles = "group inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ease-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

    const variants = {
        primary: "bg-gradient-to-r from-accent to-accent-secondary text-accent-foreground shadow-[0_4px_14px_rgba(0,82,255,0.25)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_8px_24px_rgba(0,82,255,0.35)]",
        secondary: "border border-border bg-white text-foreground shadow-sm hover:-translate-y-0.5 hover:border-accent/30 hover:bg-muted",
        success: "bg-success text-white shadow-sm hover:-translate-y-0.5 hover:brightness-110",
        danger: "bg-danger text-white shadow-sm hover:-translate-y-0.5 hover:brightness-110"
    };

    const sizes = {
        sm: "h-10 px-4 text-sm",
        md: "h-12 px-6 text-base",
        lg: "h-14 px-8 text-lg"
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
