import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Sparkles } from 'lucide-react-native';
import { useVoiceInput } from '@/src/hooks/use-voice-input';
import { useAuth } from '@/src/hooks/use-auth';
import { commandService } from '@/src/services/command.service';
import { VoiceInput } from '@/src/components/command/voice-input';
import { CommandResult, type CommandResultType } from '@/src/components/command/command-result';
import { SuggestionChips, COMMAND_SUGGESTIONS } from '@/src/components/command/suggestion-chip';
import { TextInputBar } from '@/src/components/command/text-input-bar';
import { hapticLight, hapticSuccess } from '@/src/lib/haptics';
import { showToast } from '@/src/components/ui/toast-config';
import { colors, typography, space } from '@/src/lib/design-tokens';

interface ResultItem {
  id: string;
  text: string;
  type: CommandResultType;
  userMessage?: string;
}

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);
  React.useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [delay, opacity]);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.thinkingDot, animStyle]} />;
}

export default function CommandBarScreen() {
  const {
    isAvailable: isVoiceAvailable,
    isRecording,
    transcript,
    meteringLevel,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useVoiceInput();
  const { orgId, userId } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');

  const processCommand = useCallback(async (text: string) => {
    hapticLight();
    setIsProcessing(true);
    setLastUserMessage(text);

    const placeholderResult: ResultItem = {
      id: Date.now().toString(),
      text: `Processing: "${text}"...`,
      type: 'ai',
      userMessage: text,
    };
    setResults((prev) => [placeholderResult, ...prev]);

    if (orgId && userId) {
      const result = await commandService.processCommand(text, orgId, userId);
      if (result.isOk) {
        hapticSuccess();
        setResults((prev) =>
          prev.map((r) =>
            r.id === placeholderResult.id
              ? { ...r, text: result.value.message, type: 'confirmation' as const }
              : r,
          ),
        );
      } else {
        setResults((prev) =>
          prev.map((r) =>
            r.id === placeholderResult.id
              ? {
                  ...r,
                  text: `Could not process command: "${text}". ${result.error}`,
                  type: 'ai' as const,
                }
              : r,
          ),
        );
      }
    } else {
      setResults((prev) =>
        prev.map((r) =>
          r.id === placeholderResult.id
            ? {
                ...r,
                text: `Processing your command: "${text}". Sign in to enable AI processing.`,
              }
            : r,
        ),
      );
    }

    setIsProcessing(false);
    setLastUserMessage('');
  }, [orgId, userId]);

  const handleVoiceToggle = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
      if (transcript) {
        await processCommand(transcript);
        resetTranscript();
      }
    } else {
      await startRecording();
    }
  }, [isRecording, transcript, stopRecording, startRecording, resetTranscript, processCommand]);

  const handleSend = useCallback((text: string) => {
    processCommand(text);
  }, [processCommand]);

  const handleDismiss = useCallback((id: string) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleSuggestion = useCallback((label: string) => {
    handleSend(label);
  }, [handleSend]);

  const handleClear = useCallback(() => {
    hapticLight();
    setResults([]);
    setLastUserMessage('');
    showToast('info', 'Conversation cleared');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={{ flex: 1, paddingBottom: tabBarHeight }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={tabBarHeight + 10}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Versa</Text>
              <Text style={styles.subtitle}>Your AI assistant</Text>
            </View>
            {results.length > 0 && (
              <Pressable onPress={handleClear} hitSlop={8}>
                <Text style={styles.clearLink}>Clear</Text>
              </Pressable>
            )}
          </View>

          {/* Suggestion Chips — horizontal */}
          <View style={styles.chipsContainer}>
            <SuggestionChips
              suggestions={COMMAND_SUGGESTIONS}
              onSelect={handleSuggestion}
            />
          </View>

          {/* Response area */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            {results.length === 0 && (
              <View style={styles.emptyState}>
                <Sparkles size={28} color={colors.text.muted} strokeWidth={1.5} />
                <Text style={styles.emptyText}>
                  Ask me anything or tap the mic
                </Text>
              </View>
            )}

            {/* Thinking indicator */}
            {isProcessing && lastUserMessage !== '' && (
              <>
                {/* User message bubble */}
                <View style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>{lastUserMessage}</Text>
                </View>
                {/* Thinking dots */}
                <View style={styles.thinkingRow}>
                  {[0, 1, 2].map((i) => (
                    <AnimatedDot key={i} delay={i * 200} />
                  ))}
                  <Text style={styles.thinkingText}>Versa is thinking...</Text>
                </View>
              </>
            )}

            {results.map((result) => (
              <React.Fragment key={result.id}>
                {result.userMessage && (
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>{result.userMessage}</Text>
                  </View>
                )}
                <CommandResult
                  text={result.text}
                  type={result.type}
                  onDismiss={() => handleDismiss(result.id)}
                />
              </React.Fragment>
            ))}
          </ScrollView>

          {/* Voice feedback */}
          <VoiceInput active={isRecording} meteringLevel={meteringLevel} />

          {/* Live transcript preview */}
          {isRecording && transcript ? (
            <View style={styles.transcriptPreview}>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
          ) : null}

          {/* Input bar with integrated voice toggle */}
          <TextInputBar
            onSend={handleSend}
            isVoiceActive={isRecording}
            onVoiceToggle={handleVoiceToggle}
            voiceUnavailable={!isVoiceAvailable}
          />
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  header: {
    paddingHorizontal: space[4],
    paddingTop: space[6],
    paddingBottom: space[1],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: 4,
    ...typography.bodyMd,
    color: colors.text.secondary,
  },
  clearLink: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginTop: 8,
  },
  chipsContainer: {
    paddingVertical: space[3],
  },
  resultsContent: {
    paddingHorizontal: space[4],
    paddingBottom: space[4],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: space[4],
    textAlign: 'center',
    ...typography.bodyMd,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.muted,
  },
  userBubble: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: 16,
    borderTopRightRadius: 4,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    maxWidth: '85%',
    alignSelf: 'flex-end',
    marginBottom: space[3],
  },
  userBubbleText: {
    color: colors.text.onVelvet,
    ...typography.bodyMd,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.velvet.DEFAULT,
    marginLeft: 4,
  },
  thinkingText: {
    ...typography.bodySm,
    color: colors.text.muted,
    marginLeft: space[2],
  },
  transcriptPreview: {
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  transcriptText: {
    ...typography.bodyMd,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
