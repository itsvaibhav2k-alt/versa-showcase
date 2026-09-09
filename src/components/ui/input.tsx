import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { colors } from '@/src/lib/design-tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({
  label,
  error,
  helper,
  className = '',
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-coral'
    : focused
      ? 'border-warm-border-strong'
      : 'border-warm-border';

  return (
    <View>
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-ink-body">
          {label}
        </Text>
      )}
      <TextInput
        className={`h-12 rounded-xl border bg-versa-surface px-4 text-base text-ink ${borderClass} ${className}`}
        placeholderTextColor={colors.text.muted}
        accessibilityLabel={label ? `${label} input` : undefined}
        accessibilityHint={props.placeholder ? `Enter ${props.placeholder.toLowerCase()}` : undefined}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <Text className="mt-1 text-sm text-coral">{error}</Text>
      )}
      {helper && !error && (
        <Text className="mt-1 text-sm text-ink-muted">{helper}</Text>
      )}
    </View>
  );
}
