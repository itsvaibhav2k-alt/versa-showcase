import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { colors, typography, space } from '@/src/lib/design-tokens';

export type CommandResultType = 'confirmation' | 'schedule' | 'ai' | 'email';

interface CommandResultProps {
  text: string;
  type?: CommandResultType;
  onDismiss?: () => void;
}

export function CommandResult({ text, type = 'ai', onDismiss }: CommandResultProps) {
  const isConfirmation = type === 'confirmation' || type === 'email';

  return (
    <View style={styles.container}>
      {/* Inline icon + label + text */}
      <View style={styles.row}>
        {isConfirmation ? (
          <Check size={14} color={colors.sage.DEFAULT} strokeWidth={2} />
        ) : (
          <Sparkles size={14} color={colors.plum.DEFAULT} strokeWidth={1.5} />
        )}
        <Text style={[styles.label, isConfirmation && styles.labelConfirmation]}>
          {isConfirmation ? 'Done' : 'Versa'}
        </Text>
      </View>
      <Text style={styles.text}>{text}</Text>

      {/* Action links */}
      {onDismiss && (
        <View style={styles.actions}>
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Text style={styles.undoLink}>Undo</Text>
          </Pressable>
          <Text style={styles.actionSeparator}> &middot; </Text>
          <Pressable onPress={() => {}} hitSlop={8}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: space[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    ...typography.bodySm,
    color: colors.plum.DEFAULT,
  },
  labelConfirmation: {
    color: colors.sage.DEFAULT,
  },
  text: {
    ...typography.bodyMd,
    color: colors.text.body,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space[2],
  },
  undoLink: {
    ...typography.bodySm,
    color: colors.velvet.DEFAULT,
  },
  actionSeparator: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  editLink: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
});
