import React, { useState } from 'react';
import { View, TextInput, Platform, StyleSheet } from 'react-native';
import { Sparkles, ArrowUp, Mic, MicOff } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { AnimatedPress } from '@/src/components/ui/animated-press';
import { colors, typography, space, radius } from '@/src/lib/design-tokens';

interface TextInputBarProps {
  onSend: (text: string) => void;
  isVoiceActive?: boolean;
  onVoiceToggle?: () => void;
  voiceUnavailable?: boolean;
}

export function TextInputBar({
  onSend,
  isVoiceActive = false,
  onVoiceToggle,
  voiceUnavailable = false,
}: TextInputBarProps) {
  const [text, setText] = useState('');
  const hasText = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onSend(trimmed);
      setText('');
    }
  };

  return (
    <View style={styles.wrapper}>
      <BlurView
        intensity={40}
        tint="light"
        style={[
          styles.blurContainer,
          isVoiceActive && styles.blurContainerVoice,
        ]}
      >
        {/* Sparkle icon */}
        <Sparkles size={14} color={colors.plum.DEFAULT} strokeWidth={1.5} />

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={isVoiceActive ? 'Listening...' : 'Ask anything...'}
          placeholderTextColor={isVoiceActive ? colors.velvet.DEFAULT : colors.text.muted}
          style={styles.input}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!isVoiceActive}
        />

        {/* Right button: send or mic toggle */}
        {hasText ? (
          <AnimatedPress
            onPress={handleSend}
            style={styles.sendButton}
          >
            <ArrowUp size={16} color={colors.text.onVelvet} strokeWidth={2} />
          </AnimatedPress>
        ) : voiceUnavailable ? (
          <View style={[styles.micButton, styles.micButtonDisabled]}>
            <MicOff
              size={20}
              color={colors.text.muted}
              strokeWidth={1.5}
            />
          </View>
        ) : (
          <AnimatedPress
            onPress={onVoiceToggle}
            style={[
              styles.micButton,
              isVoiceActive && styles.micButtonActive,
            ]}
          >
            <Mic
              size={20}
              color={isVoiceActive ? colors.text.onVelvet : colors.text.secondary}
              strokeWidth={1.5}
            />
          </AnimatedPress>
        )}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: space[4],
    paddingBottom: space[4],
    paddingTop: space[2],
  },
  blurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    backgroundColor: Platform.OS === 'ios'
      ? 'rgba(237, 236, 241, 0.7)'
      : 'rgba(237, 236, 241, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(226, 216, 220, 0.5)',
    overflow: 'hidden',
    gap: space[3],
  },
  blurContainerVoice: {
    backgroundColor: colors.velvet.dim,
    borderColor: 'rgba(105, 48, 109, 0.2)',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: typography.bodyMd.fontSize,
    fontFamily: typography.bodyMd.fontFamily,
    color: colors.text.body,
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.velvet.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.velvet.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: colors.velvet.DEFAULT,
    opacity: 1,
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
});
