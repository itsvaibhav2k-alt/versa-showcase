import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors, space, shadows } from '@/src/lib/design-tokens';

interface QuickComposeCardProps {
  onSubmit: (prompt: string) => void;
}

export function QuickComposeCard({ onSubmit }: QuickComposeCardProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSubmit(inputValue.trim());
    setInputValue('');
  };

  return (
    <View style={styles.card}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Describe the email you want to send..."
          placeholderTextColor={colors.text.muted}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendButton,
            (!inputValue.trim() || pressed) && styles.sendButtonDimmed,
          ]}
          disabled={!inputValue.trim()}
        >
          <Sparkles size={18} color={colors.text.onVelvet} strokeWidth={1.5} />
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Versa drafts and sends on your behalf</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: 16,
    padding: space[3],
    gap: 8,
    ...shadows.card,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg.deep,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: space[3],
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.body,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.velvet.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDimmed: {
    opacity: 0.5,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    fontStyle: 'italic',
    color: colors.text.muted,
  },
});
