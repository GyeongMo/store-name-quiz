import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'correct' | 'wrong';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-accent text-white shadow-[var(--shadow-button)] hover:bg-accent-hover',
  secondary: 'bg-white text-text-primary border-2 border-bubble-2 hover:bg-bubble-2/30',
  correct: 'bg-correct text-white',
  wrong: 'bg-wrong text-white',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-lg rounded-2xl',
  lg: 'px-8 py-4 text-xl rounded-2xl',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        font-bold transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}
