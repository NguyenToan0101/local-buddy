import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'white' | 'glass' | 'dark' | 'soft';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'white',
  padding = 'md',
  hover = false,
}) => {
  const variants = {
    white: 'bg-white border border-gray-100 shadow-sm',
    glass: 'glass-card',
    dark: 'glass-card-dark',
    soft: 'bg-primary/5 border border-primary/10',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-6',
    md: 'p-10',
    lg: 'p-12',
    xl: 'p-16',
  };

  const borderRadius = 'rounded-[48px]'; // Standard premium border radius

  return (
    <div className={`
      ${borderRadius}
      ${variants[variant]}
      ${paddings[padding]}
      ${hover ? 'hover:shadow-premium-hover hover:scale-[1.02] transition-all duration-500' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;
