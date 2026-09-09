import React from 'react';
import { colors } from '@/src/lib/design-tokens';
import type { LucideIcon } from 'lucide-react-native';

interface IconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function Icon({
  icon: LucideComponent,
  size = 20,
  color = colors.text.secondary,
  strokeWidth = 1.5,
  className = '',
}: IconProps) {
  return (
    <LucideComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
