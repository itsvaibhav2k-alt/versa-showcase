import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { AnimatedPress } from '@/src/components/ui/animated-press';
import { colors, typography, space, radius } from '@/src/lib/design-tokens';

interface Suggestion {
  id: string;
  label: string;
}

export const COMMAND_SUGGESTIONS: Suggestion[] = [
  { id: '1', label: 'Create a task' },
  { id: '2', label: 'Check my schedule' },
  { id: '3', label: 'Send an email' },
  { id: '4', label: 'Summarize my calls' },
];

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelect: (label: string) => void;
  vertical?: boolean;
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {suggestions.map((suggestion) => (
        <AnimatedPress
          key={suggestion.id}
          onPress={() => onSelect(suggestion.label)}
          style={styles.chip}
        >
          <Text style={styles.chipText}>{suggestion.label}</Text>
        </AnimatedPress>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: space[2],
    paddingHorizontal: space[4],
  },
  chip: {
    backgroundColor: colors.bg.muted,
    borderRadius: radius.full,
    paddingVertical: space[2],
    paddingHorizontal: space[4],
  },
  chipText: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.secondary,
  },
});
