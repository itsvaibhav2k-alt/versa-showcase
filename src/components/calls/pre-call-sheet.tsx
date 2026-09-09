import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Phone, Sparkles } from 'lucide-react-native';
import { VersaBottomSheet } from '@/src/components/ui/versa-bottom-sheet';
import { Avatar } from '@/src/components/ui/avatar';
import { Input } from '@/src/components/ui/input';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';

interface PreCallSheetProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactPhone: string;
  onStartAICall: (purpose: string) => void;
  onStartDirectCall: () => void;
}

type CallType = 'ai' | 'direct';

export function PreCallSheet({
  isOpen,
  onClose,
  contactName,
  contactPhone,
  onStartAICall,
  onStartDirectCall,
}: PreCallSheetProps) {
  const [purpose, setPurpose] = useState('');
  const [callType, setCallType] = useState<CallType>('ai');

  const handleStartCall = () => {
    if (callType === 'ai') {
      onStartAICall(purpose);
    } else {
      onStartDirectCall();
    }
    setPurpose('');
    setCallType('ai');
  };

  const displayName = contactName || contactPhone;

  return (
    <VersaBottomSheet
      isOpen={isOpen}
      onClose={() => {
        setPurpose('');
        setCallType('ai');
        onClose();
      }}
      snapPoints={['55%']}
    >
      {/* Contact info */}
      <View style={styles.contactRow}>
        <Avatar name={displayName} size="lg" />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {displayName}
          </Text>
          {contactPhone && contactPhone !== displayName && (
            <Text style={styles.contactPhone}>{contactPhone}</Text>
          )}
        </View>
      </View>

      {/* Purpose input */}
      <View style={styles.section}>
        <Input
          label="What should Versa discuss?"
          placeholder="e.g., Follow up on Q3 proposal"
          value={purpose}
          onChangeText={setPurpose}
        />
      </View>

      {/* Call type toggle */}
      <View style={styles.section}>
        <Text style={styles.toggleLabel}>CALL TYPE</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleChip, callType === 'ai' && styles.toggleChipActive]}
            onPress={() => setCallType('ai')}
          >
            <Sparkles
              size={14}
              color={callType === 'ai' ? colors.text.onVelvet : colors.text.secondary}
              strokeWidth={1.5}
            />
            <Text style={[styles.toggleChipText, callType === 'ai' && styles.toggleChipTextActive]}>
              AI Call
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleChip, callType === 'direct' && styles.toggleChipActive]}
            onPress={() => setCallType('direct')}
          >
            <Phone
              size={14}
              color={callType === 'direct' ? colors.text.onVelvet : colors.text.secondary}
              strokeWidth={1.5}
            />
            <Text
              style={[styles.toggleChipText, callType === 'direct' && styles.toggleChipTextActive]}
            >
              Direct Call
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Start Call button */}
      <View style={styles.buttonArea}>
        <Pressable
          onPress={handleStartCall}
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
          testID="start-call-btn"
          accessibilityLabel="Start Call"
        >
          <Text style={styles.startButtonText}>Start Call</Text>
        </Pressable>
      </View>
    </VersaBottomSheet>
  );
}

const styles = StyleSheet.create({
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    marginBottom: space[5],
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.headingMd,
    color: colors.text.primary,
  },
  contactPhone: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: space[4],
  },
  toggleLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: space[2],
  },
  toggleRow: {
    flexDirection: 'row',
    gap: space[2],
  },
  toggleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: space[3],
    backgroundColor: colors.bg.muted,
    borderRadius: radius.sm,
  },
  toggleChipActive: {
    backgroundColor: colors.velvet.DEFAULT,
  },
  toggleChipText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  toggleChipTextActive: {
    color: colors.text.onVelvet,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
  buttonArea: {
    marginTop: space[2],
  },
  startButton: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: 12,
    paddingVertical: space[3],
    alignItems: 'center',
    ...shadows.card,
  },
  startButtonPressed: {
    backgroundColor: colors.velvet.pressed,
  },
  startButtonText: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.onVelvet,
  },
});
