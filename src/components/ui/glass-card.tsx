
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl",
      className
    )}>
      {children}
    </div>
  );
};
