import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const Button = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className = '', 
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors shadow-sm border focus:outline-none focus:ring-2 focus:ring-felixo-purple/20';
  
  const variants = {
    default: 'bg-white text-black border-transparent hover:bg-zinc-200 disabled:opacity-50',
    outline: 'bg-transparent text-white border-white/20 hover:bg-white/5 disabled:opacity-50',
    ghost: 'bg-transparent text-white border-transparent hover:bg-white/5 disabled:opacity-50',
    secondary: 'bg-zinc-800 text-white border-white/10 hover:bg-zinc-700 disabled:opacity-50',
    primary: 'bg-felixo-purple text-white border-felixo-purple hover:bg-felixo-purple-bright disabled:opacity-50'
  };
  
  const sizes = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10 p-2'
  };
  
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const Card = ({ children, className = '', glow = false, ...props }) => {
  const glowClass = glow ? 'felixo-card-glow' : '';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border bg-zinc-900/40 border-white/10 hover:border-white/20 transition-colors backdrop-blur-xl ${glowClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-white/5 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`p-6 border-t border-white/5 flex items-center gap-3 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-white ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-zinc-400 ${className}`}>
    {children}
  </p>
);

export const Badge = ({ children, className = '', color = 'default' }) => {
  const baseClasses = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border';
  
  const colors = {
    default: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    purple: 'bg-felixo-purple/10 text-felixo-purple border-felixo-purple/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  
  return (
    <span className={`${baseClasses} ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

export const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full h-10 rounded-xl bg-zinc-800/50 border border-white/10 px-3 text-sm text-white placeholder:text-zinc-400 outline-none input-glowing-border:focus ${className}`}
    {...props}
  />
);

export const Select = ({ children, className = '', wrapperClassName = '', ...props }) => {
  const currentValue = props.value ?? props.defaultValue ?? '';
  const hasValue = String(currentValue).length > 0;

  return (
    <div className={`group relative w-full ${wrapperClassName}`}>
      <select
        style={{ colorScheme: 'dark' }}
        className={`w-full h-10 rounded-xl bg-zinc-800/50 border-white/10 px-3 pr-10 text-sm outline-none appearance-none transition-colors hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed input-glowing-border:focus [&>option]:bg-zinc-900 [&>option]:text-zinc-100 ${hasValue ? 'text-white' : 'text-zinc-400'} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-felixo-purple ${hasValue ? 'text-zinc-300' : 'text-zinc-500'}`}
      />
    </div>
  );
};

export const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="border border-felixo-purple/30 rounded-2xl w-11/12 max-w-md p-6 shadow-2xl felixo-card-glow bg-zinc-900/80 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
};
