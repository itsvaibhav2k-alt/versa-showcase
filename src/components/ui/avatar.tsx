import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { MEMBER_COLORS, getMemberColor, getMemberTextColor } from '@/src/lib/design-tokens';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Force a specific color (hex). Overrides hash-based assignment. */
  color?: string;
}

const sizeClasses: Record<string, { container: string; text: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-[10px]' },
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-14 w-14', text: 'text-lg' },
  xl: { container: 'h-16 w-16', text: 'text-2xl' },
};

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

export function Avatar({
  name,
  imageUrl,
  size = 'md',
  className = '',
  color,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = name.charAt(0).toUpperCase();
  const bgColor = color ?? getColorFromName(name);
  const textColor = getMemberTextColor(bgColor);
  const { container, text } = sizeClasses[size];

  if (imageUrl && !imgError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className={`rounded-full border border-warm-border ${container} ${className}`}
        onError={() => setImgError(true)}
        accessibilityRole="image"
        accessibilityLabel={`${name} avatar`}
      />
    );
  }

  return (
    <View
      className={`items-center justify-center rounded-full border border-warm-border ${container} ${className}`}
      style={{ backgroundColor: bgColor }}
      accessibilityRole="image"
      accessibilityLabel={`${name} avatar`}
    >
      <Text className={`font-body-bold ${text}`} style={{ color: textColor }}>{initial}</Text>
    </View>
  );
}
