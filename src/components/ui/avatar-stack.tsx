import React from 'react';
import { View, Text } from 'react-native';
import { Avatar } from './avatar';

interface AvatarStackProps {
  names: string[];
  avatarUrls?: (string | null)[];
  max?: number;
}

export function AvatarStack({ names, avatarUrls, max = 3 }: AvatarStackProps) {
  const displayed = names.slice(0, max);
  const remaining = names.length - max;

  return (
    <View className="flex-row items-center">
      {displayed.map((name, i) => (
        <View
          key={i}
          className="rounded-full border-2 border-white"
          style={i > 0 ? { marginLeft: -6, opacity: 0.8 } : undefined}
        >
          <Avatar name={name} imageUrl={avatarUrls?.[i]} size="sm" />
        </View>
      ))}
      {remaining > 0 && (
        <View
          className="h-8 w-8 items-center justify-center rounded-full bg-versa-muted border-2 border-white"
          style={{ marginLeft: -6 }}
        >
          <Text className="text-xs font-body-bold text-ink-muted">+{remaining}</Text>
        </View>
      )}
    </View>
  );
}
