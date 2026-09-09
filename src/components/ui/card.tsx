import React from 'react';
import { View } from 'react-native';
import { shadows } from '@/src/lib/design-tokens';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'hero' | 'ai';
}

export function Card({
  children,
  className = '',
  variant = 'hero',
}: CardProps) {
  const base = 'rounded-2xl p-5';
  const variants = {
    hero: 'bg-white border border-warm-border',
    ai: 'bg-plum-light border border-warm-border',
  };

  return (
    <View
      className={`${base} ${variants[variant]} ${className}`}
      style={shadows.card}
    >
      {children}
    </View>
  );
}
