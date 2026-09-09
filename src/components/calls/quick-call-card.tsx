import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Phone, Search } from 'lucide-react-native';
import { ContactChip } from './contact-chip';
import { colors, typography, space, shadows } from '@/src/lib/design-tokens';

interface QuickCallCardProps {
  recentContacts: { name: string; phone: string }[];
  onSubmit: (input: string) => void;
  onContactPress: (contact: { name: string; phone: string }) => void;
  onLayout?: (event: any) => void;
}

export function QuickCallCard({
  recentContacts,
  onSubmit,
  onContactPress,
  onLayout,
}: QuickCallCardProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSubmit(inputValue.trim());
    setInputValue('');
  };

  return (
    <View style={styles.card} onLayout={onLayout}>
      {/* Input row */}
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <Search size={16} color={colors.text.muted} strokeWidth={1.5} />
          <TextInput
            style={styles.input}
            placeholder="Who should Versa call?"
            placeholderTextColor={colors.text.muted}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            testID="quick-call-input"
            accessibilityLabel="Who should Versa call?"
          />
        </View>
        <Pressable
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendButton,
            (!inputValue.trim() || pressed) && styles.sendButtonDimmed,
          ]}
          disabled={!inputValue.trim()}
        >
          <Phone size={18} color={colors.text.onVelvet} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Recent contact chips */}
      {recentContacts.length > 0 && (
        <View style={styles.chipsRow}>
          {recentContacts.map((contact) => (
            <ContactChip
              key={contact.phone}
              name={contact.name}
              phone={contact.phone}
              onPress={() => onContactPress(contact)}
            />
          ))}
        </View>
      )}

      {/* Subtitle */}
      <Text style={styles.subtitle}>Versa will call on your behalf</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: 16,
    padding: space[4],
    gap: 10,
    ...shadows.card,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: space[4],
    gap: space[2],
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: colors.text.body,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.velvet.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDimmed: {
    opacity: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    fontStyle: 'italic',
    color: colors.text.muted,
  },
});
