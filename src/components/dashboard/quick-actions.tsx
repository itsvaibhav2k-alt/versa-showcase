import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, Mail, Clock } from 'lucide-react-native';
import { colors, space } from '@/src/lib/design-tokens';

interface QuickAction {
  id: string;
  label: string;
  route: string;
  accessibilityLabel: string;
}

const ACTIONS: QuickAction[] = [
  { id: 'task', label: 'Task', route: '/(modals)/task-create', accessibilityLabel: 'Create new task' },
  { id: 'call', label: 'Call', route: '/(tabs)/comms', accessibilityLabel: 'Make a call' },
  { id: 'email', label: 'Email', route: '/(tabs)/comms?tab=emails', accessibilityLabel: 'Compose email' },
  { id: 'remind', label: 'Remind', route: '/(modals)/reminder-create', accessibilityLabel: 'Set reminder' },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {ACTIONS.map((action) => {
        const isPrimary = action.id === 'task';

        return (
          <Pressable
            key={action.id}
            style={styles.actionOuter}
            onPress={() => router.push(action.route as never)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
          >
            <View style={[styles.iconSquare, isPrimary && styles.iconSquarePrimary]}>
              {action.id === 'task' && (
                <Text style={styles.plusIcon}>+</Text>
              )}
              {action.id === 'call' && (
                <Phone size={18} color={colors.text.secondary} strokeWidth={1.5} />
              )}
              {action.id === 'email' && (
                <Mail size={18} color={colors.text.secondary} strokeWidth={1.5} />
              )}
              {action.id === 'remind' && (
                <Clock size={18} color={colors.text.secondary} strokeWidth={1.5} />
              )}
            </View>
            <Text style={[styles.label, isPrimary && styles.labelPrimary]}>
              {isPrimary ? '+ Task' : action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingTop: space[3],
    paddingBottom: space[4],
  },
  actionOuter: {
    alignItems: 'center',
    gap: 6,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  iconSquarePrimary: {
    backgroundColor: colors.velvet.dim,
    borderColor: colors.velvet.wash,
  },
  plusIcon: {
    fontSize: 19,
    fontWeight: '300',
    color: colors.velvet.DEFAULT,
    marginTop: -1,
  },
  label: {
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.muted,
  },
  labelPrimary: {
    color: colors.velvet.DEFAULT,
  },
});
