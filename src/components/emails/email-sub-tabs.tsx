import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { hapticLight } from '@/src/lib/haptics';
import { colors, typography, space, radius } from '@/src/lib/design-tokens';

type EmailSubTab = 'inbox' | 'sent' | 'drafts';

interface EmailSubTabsProps {
  activeTab: EmailSubTab;
  onSelect: (tab: EmailSubTab) => void;
  inboxCount?: number;
  draftsCount?: number;
}

const TABS: { key: EmailSubTab; label: string }[] = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'sent', label: 'Sent' },
  { key: 'drafts', label: 'Drafts' },
];

export function EmailSubTabs({
  activeTab,
  onSelect,
  inboxCount,
  draftsCount,
}: EmailSubTabsProps) {
  const getLabel = (tab: { key: EmailSubTab; label: string }) => {
    if (tab.key === 'inbox' && inboxCount && inboxCount > 0) {
      return `${tab.label} (${inboxCount})`;
    }
    if (tab.key === 'drafts' && draftsCount && draftsCount > 0) {
      return `${tab.label} (${draftsCount})`;
    }
    return tab.label;
  };

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              hapticLight();
              onSelect(tab.key);
            }}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
          >
            <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
              {getLabel(tab)}
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
    gap: space[2],
    paddingHorizontal: space[5],
    paddingVertical: space[2],
  },
  chip: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipActive: {
    backgroundColor: colors.velvet.DEFAULT,
  },
  chipInactive: {
    backgroundColor: colors.bg.muted,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  chipTextActive: {
    color: colors.text.onVelvet,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
  chipTextInactive: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
