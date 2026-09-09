import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { colors } from '@/src/lib/design-tokens';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="items-center">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-coral-light">
          <AlertCircle size={28} color={colors.coral.DEFAULT} strokeWidth={1.5} />
        </View>
        <Text className="mb-2 text-base font-semibold text-ink">
          Failed to load
        </Text>
        <Text className="mb-6 text-center text-sm leading-5 text-ink-secondary">
          {message}
        </Text>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            className="rounded-xl border border-warm-border bg-white px-6 py-2.5 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-ink-body">
              Try Again
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
