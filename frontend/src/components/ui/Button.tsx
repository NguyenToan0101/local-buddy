import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-black uppercase tracking-widest transition-all duration-300 transform active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed leading-none';
  
  const variants = {
    primary: 'bg-primary text-white shadow-primary-glow hover:bg-primary-dark hover:shadow-premium',
    secondary: 'bg-primary/10 text-primary border-2 border-primary/20 hover:bg-primary hover:text-white',
    ghost: 'text-secondary/40 hover:text-secondary hover:bg-surface-dark',
    dark: 'bg-secondary text-white hover:bg-secondary-light shadow-premium',
  };

  const sizes = {
    sm: 'px-6 py-3 text-[10px] rounded-2xl',
    md: 'px-8 py-5 text-xs rounded-3xl',
    lg: 'px-12 py-7 text-sm rounded-[32px]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
