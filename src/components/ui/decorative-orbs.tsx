import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DecorativeOrbsProps {
  variant?: 'dashboard' | 'team' | 'calls' | 'command';
}

const configs = {
  dashboard: [
    { top: 60, right: -80, size: 250, color: 'rgba(105, 48, 109, 0.06)' },
    { top: 400, left: -60, size: 200, color: 'rgba(105, 48, 109, 0.05)' },
  ],
  team: [
    { top: 100, left: -70, size: 220, color: 'rgba(61, 139, 110, 0.06)' },
    { top: 500, right: -50, size: 180, color: 'rgba(105, 48, 109, 0.05)' },
  ],
  calls: [
    { top: 80, right: -60, size: 200, color: 'rgba(74, 111, 165, 0.06)' },
    { top: 450, left: -80, size: 240, color: 'rgba(105, 48, 109, 0.05)' },
  ],
  command: [
    { top: 480, left: -30, size: 280, color: 'rgba(105, 48, 109, 0.06)' },
    { top: 520, right: -40, size: 220, color: 'rgba(105, 48, 109, 0.05)' },
  ],
};

export function DecorativeOrbs({ variant = 'dashboard' }: DecorativeOrbsProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {configs[variant].map((orb, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: orb.top,
            left: (orb as { left?: number }).left,
            right: (orb as { right?: number }).right,
            width: orb.size,
            height: orb.size,
            borderRadius: orb.size / 2,
            backgroundColor: orb.color,
          }}
        />
      ))}
    </View>
  );
}
