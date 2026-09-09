import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { colors, shadows } from '@/src/lib/design-tokens';

type ButtonVariant = 'primary' | 'neutral' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  accessibilityLabel?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-velvet active:bg-velvet/90',
  neutral: 'bg-versa-muted active:bg-gray-200',
  ghost: 'bg-transparent active:bg-versa-hover',
  destructive: 'bg-coral-light border border-coral/20 active:bg-coral-light/80',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  neutral: 'text-ink-body',
  ghost: 'text-ink',
  destructive: 'text-coral',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 rounded-lg',
  md: 'h-11 px-5 rounded-xl',
  lg: 'h-13 px-6 rounded-xl',
};

const sizeTextClasses: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  title,
  onPress,
  variant = 'neutral',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled }}
      className={`flex-row items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      style={variant === 'primary' ? shadows.card : undefined}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.text.onVelvet : colors.text.body}
          size="small"
        />
      ) : (
        <Text className={`font-body-semibold ${variantTextClasses[variant]} ${sizeTextClasses[size]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
