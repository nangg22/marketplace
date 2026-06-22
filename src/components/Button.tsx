import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = 'neo-btn hover-wiggle';
  const variantClasses = {
    primary: 'neo-btn-primary',
    secondary: 'neo-btn-secondary',
    accent: 'neo-btn-accent',
    outline: 'neo-btn-outline',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
