import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check, Calendar } from 'lucide-react-native';
import { colors, shadows } from '@/src/lib/design-tokens';

interface FollowUpCardProps {
  action: string;
  dueDate: string | null;
  completed?: boolean;
  onToggle?: (completed: boolean) => void;
}

export function FollowUpCard({
  action,
  dueDate,
  completed: initialCompleted = false,
  onToggle,
}: FollowUpCardProps) {
  const [completed, setCompleted] = useState(initialCompleted);

  const handleToggle = () => {
    const next = !completed;
    setCompleted(next);
    onToggle?.(next);
  };

  return (
    <Pressable
      onPress={handleToggle}
      className="flex-row items-center rounded-xl border border-warm-border border-l-[3px] border-l-velvet bg-white px-4 py-3 active:bg-versa-hover"
      style={shadows.card}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: completed ? 0 : 2,
          borderColor: completed ? undefined : colors.border.strong,
          backgroundColor: completed ? colors.velvet.DEFAULT : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {completed && <Check size={12} color="#fff" strokeWidth={2.5} />}
      </View>

      <Text
        className={`ml-3 flex-1 font-body text-base ${completed ? 'text-ink-muted line-through' : 'text-ink'}`}
        numberOfLines={2}
      >
        {action}
      </Text>

      {dueDate && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 4 }}>
          <Calendar size={12} color={colors.text.muted} strokeWidth={1.5} />
          <Text className="font-body text-sm text-ink-muted">
            {dueDate}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
