import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell, Clock, Moon, Users, UserPlus, Calendar, Mail, Phone, Mic,
  GitBranch, Lock, ShieldCheck, HelpCircle, Shield, Info, ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { useAuth } from '@/src/hooks/use-auth';
import { authService } from '@/src/services/auth.service';
import { Avatar } from '@/src/components/ui/avatar';
import { FlatRow } from '@/src/components/ui/flat-row';
import { showToast } from '@/src/components/ui/toast-config';
import { hapticLight } from '@/src/lib/haptics';
import { webhookService } from '@/src/services/webhook.service';
import { N8N_WEBHOOK_BASE_URL } from '@/src/lib/constants';
import { useTodayDigest } from '@/src/hooks/use-digests';
import { useIntegration, useDisconnectIntegration } from '@/src/hooks/use-integrations';
import { useGoogleCalendarAuth } from '@/src/hooks/use-google-calendar-auth';
import { colors, typography, space } from '@/src/lib/design-tokens';
import type { Integration } from '@/src/services/integrations.service';

interface SettingsRow {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  rightText?: string;
  rightTextColor?: string;
  hideChevron?: boolean;
  onPress?: () => void;
}

interface SettingsSection {
  title: string;
  rows: SettingsRow[];
}

function comingSoon(feature: string) {
  return () => {
    hapticLight();
    showToast('info', 'Coming Soon', `${feature} is on the way`);
  };
}

function buildSettingsSections(
  router: ReturnType<typeof useRouter>,
  options?: {
    calendarIntegration?: Integration | null;
    onCalendarSync?: () => void;
    onCalendarDisconnect?: () => void;
    onDigestSchedule?: () => void;
    onWebhooksTap?: () => void;
  },
): SettingsSection[] {
  return [
    {
      title: 'Preferences',
      rows: [
        {
          icon: Bell, label: 'Notifications', iconColor: colors.velvet.DEFAULT,
          onPress: () => { hapticLight(); router.push('/(modals)/notifications'); },
        },
        { icon: Clock, label: 'Digest Schedule', iconColor: colors.velvet.light, onPress: options?.onDigestSchedule },
        { icon: Moon, label: 'Quiet Hours', iconColor: colors.plum.DEFAULT, rightText: 'Off', onPress: comingSoon('Quiet Hours') },
      ],
    },
    {
      title: 'Team',
      rows: [
        { icon: Users, label: 'Team Management', iconColor: colors.sage.DEFAULT, onPress: comingSoon('Team Management') },
        { icon: UserPlus, label: 'Invite Members', iconColor: colors.sky.DEFAULT, onPress: comingSoon('Invite Members') },
      ],
    },
    {
      title: 'Integrations',
      rows: [
        {
          icon: Calendar,
          label: 'Calendar Sync',
          iconColor: colors.coral.DEFAULT,
          rightText: options?.calendarIntegration ? 'Connected' : undefined,
          rightTextColor: options?.calendarIntegration ? colors.sage.DEFAULT : undefined,
          onPress: options?.calendarIntegration
            ? options.onCalendarDisconnect
            : options?.onCalendarSync,
        },
        {
          icon: Mail, label: 'Email Accounts', iconColor: colors.sky.DEFAULT,
          rightText: '2 Active', rightTextColor: colors.velvet.DEFAULT,
          onPress: comingSoon('Email Accounts'),
        },
        { icon: Phone, label: 'Phone Configuration', iconColor: colors.sage.DEFAULT, onPress: comingSoon('Phone Configuration') },
        { icon: Mic, label: 'Voice Assistant', iconColor: colors.plum.DEFAULT, onPress: comingSoon('Voice Assistant') },
        {
          icon: GitBranch,
          label: 'Webhooks n8n',
          iconColor: colors.velvet.DEFAULT,
          rightText: N8N_WEBHOOK_BASE_URL ? 'Connected' : 'Not Configured',
          rightTextColor: N8N_WEBHOOK_BASE_URL ? colors.sage.DEFAULT : colors.coral.DEFAULT,
          onPress: options?.onWebhooksTap,
        },
      ],
    },
    {
      title: 'Account',
      rows: [
        {
          icon: Lock, label: 'Change Password', iconColor: colors.text.secondary,
          onPress: () => { hapticLight(); showToast('info', 'Coming Soon', 'Use your email provider to reset password'); },
        },
        { icon: ShieldCheck, label: 'Privacy & Security', iconColor: colors.velvet.DEFAULT, onPress: comingSoon('Privacy & Security') },
      ],
    },
    {
      title: 'About',
      rows: [
        {
          icon: HelpCircle, label: 'Help & Support', iconColor: colors.sky.DEFAULT,
          onPress: () => { hapticLight(); Linking.openURL('mailto:support@versa.app'); },
        },
        {
          icon: Shield, label: 'Privacy Policy', iconColor: colors.text.secondary,
          onPress: () => { hapticLight(); Linking.openURL('https://versa.app/privacy'); },
        },
        { icon: Info, label: 'Version', iconColor: colors.text.muted, rightText: '2.0.1', hideChevron: true },
      ],
    },
  ];
}

function SettingsRowItem({ icon: IconComponent, label, iconColor, rightText, rightTextColor, hideChevron, onPress }: SettingsRow) {
  return (
    <FlatRow onPress={onPress} showDivider={true} dividerIndent={44}>
      <IconComponent size={20} color={iconColor} strokeWidth={1.5} />
      <Text style={styles.rowLabel}>{label}</Text>
      {rightText && (
        <Text style={[styles.rowRightText, rightTextColor ? { color: rightTextColor } : undefined]}>
          {rightText}
        </Text>
      )}
      {!hideChevron && (
        <ChevronRight size={11} color={colors.text.muted} strokeWidth={1.5} />
      )}
    </FlatRow>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, organization } = useAuth();
  const calendarIntegration = useIntegration('google_calendar');
  const { connect: connectCalendar } = useGoogleCalendarAuth();
  const disconnectMutation = useDisconnectIntegration();
  const todayDigestQuery = useTodayDigest();

  const handleGenerateBriefing = async () => {
    hapticLight();
    if (!user) return;
    showToast('info', 'Generating', 'Creating your AI briefing...');
    await webhookService.triggerBriefing({
      user_id: user.id,
      organization_id: user.organization_id,
    }).catch(console.warn);
    setTimeout(() => {
      todayDigestQuery.refetch().then((result) => {
        if (result.data) {
          showToast('success', 'Ready', 'Your briefing is ready!');
        }
      });
    }, 5000);
  };

  const handleWebhooksTap = () => {
    hapticLight();
    if (N8N_WEBHOOK_BASE_URL) {
      const truncated = N8N_WEBHOOK_BASE_URL.length > 40
        ? N8N_WEBHOOK_BASE_URL.slice(0, 40) + '...'
        : N8N_WEBHOOK_BASE_URL;
      showToast('success', 'Connected', `Webhook: ${truncated}`);
    } else {
      showToast('warning', 'Not Configured', 'Set EXPO_PUBLIC_N8N_WEBHOOK_URL in your .env');
    }
  };

  const displayUser = {
    full_name: user?.full_name ?? 'User',
    email: user?.email ?? '',
    organization: organization?.name ?? '',
    plan: organization?.plan ?? 'free',
  };

  const settingsSections = buildSettingsSections(router, {
    calendarIntegration,
    onCalendarSync: () => { hapticLight(); connectCalendar(); },
    onCalendarDisconnect: () => { hapticLight(); disconnectMutation.mutate('google_calendar'); },
    onDigestSchedule: handleGenerateBriefing,
    onWebhooksTap: handleWebhooksTap,
  });

  return (
    <SafeAreaView className="flex-1 bg-versa-bg">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: space[8] }}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile — left-aligned inline, no card */}
        <View style={styles.profileRow}>
          <Avatar name={displayUser.full_name} size="xl" />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{displayUser.full_name}</Text>
              {displayUser.plan !== 'free' && (
                <View style={styles.planBadge}>
                  <Text style={styles.planText}>{displayUser.plan}</Text>
                </View>
              )}
            </View>
            <Text style={styles.profileEmail}>{displayUser.email}</Text>
            <Text style={styles.profileOrg}>{displayUser.organization}</Text>
            <Pressable
              onPress={() => { hapticLight(); showToast('info', 'Coming Soon', 'Profile editing is on the way'); }}
              hitSlop={8}
              style={styles.editLink}
            >
              <Text style={styles.editLinkText}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        {/* Settings sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} style={sectionIndex > 0 ? styles.sectionGap : styles.sectionFirst}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.rows.map((row) => (
              <SettingsRowItem key={row.label} {...row} />
            ))}
          </View>
        ))}

        {/* Sign out */}
        <Pressable
          onPress={() => { hapticLight(); authService.signOut(); }}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    paddingHorizontal: space[5],
    paddingTop: space[6],
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[5],
    marginTop: space[6],
  },
  profileInfo: {
    flex: 1,
    marginLeft: space[4],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  profileName: {
    ...typography.headingLg,
    color: colors.text.primary,
  },
  planBadge: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  planText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.onVelvet,
    textTransform: 'uppercase',
  },
  profileEmail: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  profileOrg: {
    ...typography.bodySm,
    color: colors.text.muted,
    marginTop: 2,
  },
  editLink: {
    marginTop: space[2],
  },
  editLinkText: {
    ...typography.bodySm,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.velvet.DEFAULT,
  },
  sectionFirst: {
    marginTop: space[8],
  },
  sectionGap: {
    marginTop: space[8],
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.muted,
    paddingHorizontal: space[4],
    marginBottom: space[2],
  },
  rowLabel: {
    flex: 1,
    marginLeft: space[3],
    ...typography.bodyLg,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
    color: colors.text.primary,
  },
  rowRightText: {
    ...typography.bodySm,
    color: colors.text.muted,
    marginRight: space[2],
  },
  signOutButton: {
    paddingVertical: space[4],
    alignItems: 'center',
    marginTop: space[8],
    marginBottom: space[4],
  },
  signOutText: {
    ...typography.bodyMd,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    color: colors.coral.DEFAULT,
  },
});
