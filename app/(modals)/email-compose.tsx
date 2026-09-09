import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Sparkles, ArrowLeft, Briefcase, Heart, Zap } from 'lucide-react-native';
import { supabase, invokeWithTimeout } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/use-auth';
import { sentEmailsService } from '@/src/services/sent-emails.service';
import { showToast } from '@/src/components/ui/toast-config';
import { hapticLight, hapticSuccess, hapticError } from '@/src/lib/haptics';
import { isValidEmail } from '@/src/utils/validation';
import { colors, typography, space, radius, shadows } from '@/src/lib/design-tokens';

type Tone = 'professional' | 'friendly' | 'urgent';
type Phase = 'compose' | 'preview';

const TONE_OPTIONS: { value: Tone; label: string; Icon: typeof Briefcase }[] = [
  { value: 'professional', label: 'Professional', Icon: Briefcase },
  { value: 'friendly', label: 'Friendly', Icon: Heart },
  { value: 'urgent', label: 'Urgent', Icon: Zap },
];

export default function EmailComposeModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    to?: string;
    subject?: string;
    prompt?: string;
    tone?: string;
  }>();
  const { user, organization } = useAuth();

  // Phase 1: Compose fields
  const [to, setTo] = useState(params.to ?? '');
  const [subject, setSubject] = useState(params.subject ?? '');
  const [prompt, setPrompt] = useState(params.prompt ?? '');
  const [tone, setTone] = useState<Tone>((params.tone as Tone) ?? 'professional');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Phase 2: Preview
  const [phase, setPhase] = useState<Phase>('compose');
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Shared state
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Pre-fill from params
  useEffect(() => {
    if (params.to) setTo(params.to);
    if (params.subject) setSubject(params.subject);
    if (params.prompt) setPrompt(params.prompt);
    if (params.tone) setTone(params.tone as Tone);
  }, [params.to, params.subject, params.prompt, params.tone]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!to.trim()) {
      newErrors.to = 'Recipient is required';
    } else if (!isValidEmail(to.trim())) {
      newErrors.to = 'Enter a valid email address';
    }
    if (!prompt.trim()) newErrors.prompt = 'Please describe what to write';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const generateDraft = async (): Promise<{
    subject: string;
    body_html: string;
    body_text: string;
  } | null> => {
    let data;
    let error;
    try {
      const result = await invokeWithTimeout('draft-email', {
        body: {
          to_address: to.trim(),
          to_name: to.trim().split('@')[0],
          intent: prompt.trim(),
          tone,
          from_name: user?.full_name ?? 'User',
          from_title: 'CEO',
          organization_name: organization?.name ?? 'Organization',
        },
      });
      data = result.data;
      error = result.error;
    } catch {
      throw new Error('Email drafting is currently unavailable. Please try again later.');
    }
    if (error) {
      throw new Error('Email drafting is currently unavailable. Please try again later.');
    }
    if (data && data.success === false) {
      throw new Error(data.error || 'Failed to generate email draft.');
    }
    return {
      subject: data?.subject ?? subject.trim(),
      body_html: data?.body_html ?? data?.html_body ?? '',
      body_text: data?.body_text ?? data?.text_body ?? '',
    };
  };

  const saveDraft = async (bodyText: string, bodyHtml: string, finalSubject: string) => {
    if (!user?.id || !organization?.id) return null;

    if (draftId) {
      const result = await sentEmailsService.updateDraft(draftId, {
        to_address: to.trim(),
        to_name: to.trim().split('@')[0],
        subject: finalSubject,
        body_text: bodyText,
        body_html: bodyHtml,
        tone,
        prompt: prompt.trim(),
      });
      return result.isOk ? result.value : null;
    }

    const result = await sentEmailsService.createDraft({
      organization_id: organization.id,
      user_id: user.id,
      to_address: to.trim(),
      to_name: to.trim().split('@')[0],
      subject: finalSubject,
      tone,
      prompt: prompt.trim(),
      body_text: bodyText,
      body_html: bodyHtml,
      ai_drafted: true,
    });
    if (result.isOk) {
      setDraftId(result.value.id);
      return result.value;
    }
    return null;
  };

  // Preview Draft — generates and shows preview
  const handlePreviewDraft = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    setLoading(true);
    try {
      const draft = await generateDraft();
      if (!draft) throw new Error('No draft generated');

      const finalSubject = subject.trim() || draft.subject;
      setGeneratedSubject(finalSubject);
      setGeneratedBody(draft.body_text);
      setGeneratedHtml(draft.body_html);
      setSubject(finalSubject);

      await saveDraft(draft.body_text, draft.body_html, finalSubject);

      hapticSuccess();
      setPhase('preview');
    } catch (e) {
      hapticError();
      const message = e instanceof Error
        ? e.message
        : 'Could not generate draft. Try again.';
      showToast('error', 'Draft Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // Send Now — generates + sends in one step
  const handleSendNow = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    if (!user?.id || !organization?.id) return;
    setLoading(true);
    try {
      const draft = await generateDraft();
      if (!draft) throw new Error('No draft generated');

      const finalSubject = subject.trim() || draft.subject;
      const saved = await saveDraft(draft.body_text, draft.body_html, finalSubject);

      if (saved) {
        const sendResult = await sentEmailsService.send(saved.id);
        if (!sendResult.isOk) {
          // Edge function failed but draft is saved — mark as failed
          await sentEmailsService.markFailed(saved.id);
          throw new Error(sendResult.error);
        }
      }

      hapticSuccess();
      showToast('success', 'Email Sent', 'Your email has been sent successfully');
      router.back();
    } catch (e) {
      hapticError();
      const message = e instanceof Error ? e.message : 'Could not send email. Please try again.';
      showToast('error', 'Send Failed', message);
      if (draftId) {
        await sentEmailsService.markFailed(draftId);
      }
    } finally {
      setLoading(false);
    }
  };

  // Send from preview — sends the previewed/edited content
  const handleSendFromPreview = async () => {
    Keyboard.dismiss();
    if (!user?.id || !organization?.id) return;
    setLoading(true);
    try {
      if (draftId) {
        await sentEmailsService.updateDraft(draftId, {
          body_text: generatedBody,
          subject: generatedSubject,
        });

        const sendResult = await sentEmailsService.send(draftId);
        if (!sendResult.isOk) {
          await sentEmailsService.markFailed(draftId);
          throw new Error(sendResult.error);
        }
      }

      hapticSuccess();
      showToast('success', 'Email Sent', 'Your email has been sent successfully');
      router.back();
    } catch {
      hapticError();
      showToast('error', 'Failed', 'Could not send email');
      if (draftId) {
        await sentEmailsService.markFailed(draftId);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER: Preview Phase ───

  if (phase === 'preview') {
    return (
      <SafeAreaView style={s.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={s.scrollView}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={s.header}>
              <Pressable
                onPress={() => { hapticLight(); setPhase('compose'); }}
                hitSlop={8}
                style={s.backButton}
              >
                <ArrowLeft size={20} color={colors.text.secondary} strokeWidth={1.5} />
              </Pressable>
              <Text style={s.headerTitle}>Preview</Text>
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
            </View>

            {/* To summary */}
            <Text style={s.previewMeta}>
              To: {to.trim().split('@')[0]} ({to.trim()})
            </Text>

            {/* AI Draft Card */}
            <View style={s.previewCard}>
              <View style={s.aiLabelRow}>
                <Sparkles size={14} color={colors.plum.DEFAULT} strokeWidth={1.5} />
                <Text style={s.aiLabelText}>AI DRAFT</Text>
              </View>

              {/* Subject */}
              <Text style={s.sectionLabel}>SUBJECT</Text>
              {isEditing ? (
                <TextInput
                  style={s.editableInput}
                  value={generatedSubject}
                  onChangeText={setGeneratedSubject}
                  placeholder="Subject"
                  placeholderTextColor={colors.text.muted}
                />
              ) : (
                <Text style={s.previewSubject}>{generatedSubject}</Text>
              )}

              {/* Divider */}
              <View style={s.cardDivider} />

              {/* Body */}
              {isEditing ? (
                <TextInput
                  style={s.editableBody}
                  value={generatedBody}
                  onChangeText={setGeneratedBody}
                  multiline
                  textAlignVertical="top"
                  placeholder="Email body"
                  placeholderTextColor={colors.text.muted}
                />
              ) : (
                <Text style={s.previewBody}>{generatedBody}</Text>
              )}

              {/* Edit toggle */}
              <Pressable
                onPress={() => { hapticLight(); setIsEditing(!isEditing); }}
                style={s.editToggle}
              >
                <Text style={s.editToggleText}>
                  {isEditing ? 'Done Editing' : 'Tap to edit'}
                </Text>
              </Pressable>
            </View>

            {/* Action buttons — stacked */}
            <View style={s.buttonsStack}>
              <Pressable
                onPress={handleSendFromPreview}
                disabled={loading}
                style={({ pressed }) => [
                  s.primaryButton,
                  loading && s.buttonDisabled,
                  pressed && s.primaryButtonPressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.text.onVelvet} />
                ) : (
                  <Text style={s.primaryButtonText}>Send Email</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => { hapticLight(); setPhase('compose'); }}
                style={s.ghostButton}
              >
                <Text style={s.ghostButtonText}>Back to Edit</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── RENDER: Compose Phase ───

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={s.scrollView}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Compose Email</Text>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              testID="cancel-compose-btn"
              accessibilityLabel="Cancel"
            >
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
          </View>

          {/* AI Hero Banner */}
          <View style={s.aiBanner}>
            <Sparkles size={18} color={colors.velvet.DEFAULT} strokeWidth={1.5} />
            <Text style={s.aiBannerText}>
              Versa will draft and send on your behalf
            </Text>
          </View>

          {/* Recipient Card — To + Subject grouped */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>TO</Text>
            <TextInput
              style={s.cardInput}
              value={to}
              onChangeText={setTo}
              placeholder="recipient@example.com"
              placeholderTextColor={colors.text.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.to && <Text style={s.errorText}>{errors.to}</Text>}

            <View style={s.cardDivider} />

            <Text style={s.sectionLabel}>SUBJECT (OPTIONAL)</Text>
            <TextInput
              style={s.cardInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Versa generates if blank"
              placeholderTextColor={colors.text.muted}
            />
          </View>

          {/* Prompt Card */}
          <View>
            <Text style={s.sectionLabel}>WHAT SHOULD VERSA WRITE?</Text>
            <View style={s.card}>
              <TextInput
                style={s.promptInput}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="e.g., Follow up on our meeting about the Q3 proposal"
                placeholderTextColor={colors.text.muted}
                multiline
                textAlignVertical="top"
              />
            </View>
            {errors.prompt && <Text style={s.errorText}>{errors.prompt}</Text>}
          </View>

          {/* Tone Selector */}
          <View>
            <Text style={s.sectionLabel}>TONE</Text>
            <View style={s.toneRow}>
              {TONE_OPTIONS.map((t) => {
                const isActive = tone === t.value;
                const IconComponent = t.Icon;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => { hapticLight(); setTone(t.value); }}
                    style={[s.toneChip, isActive && s.toneChipActive]}
                  >
                    <IconComponent
                      size={14}
                      color={isActive ? colors.text.onVelvet : colors.text.secondary}
                      strokeWidth={1.5}
                    />
                    <Text style={[s.toneChipText, isActive && s.toneChipTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Action Buttons — stacked vertically */}
          <View style={s.buttonsStack}>
            <Pressable
              onPress={handlePreviewDraft}
              disabled={loading}
              testID="preview-draft-btn"
              accessibilityLabel="Preview Draft"
              style={({ pressed }) => [
                s.primaryButton,
                loading && s.buttonDisabled,
                pressed && s.primaryButtonPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text.onVelvet} />
              ) : (
                <View style={s.primaryButtonInner}>
                  <Sparkles size={16} color={colors.text.onVelvet} strokeWidth={1.5} />
                  <Text style={s.primaryButtonText}>Preview Draft</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={handleSendNow}
              disabled={loading}
              testID="send-directly-btn"
              accessibilityLabel="Send Directly"
              style={({ pressed }) => [
                s.secondaryButton,
                pressed && s.secondaryButtonPressed,
                loading && s.buttonDisabled,
              ]}
            >
              <Text style={s.secondaryButtonText}>
                {loading ? 'Sending...' : 'Send Directly'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    paddingBottom: space[10],
    gap: space[6],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  cancelText: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.secondary,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },

  // AI Hero Banner
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.bg.lavVeil,
    borderWidth: 1,
    borderColor: colors.velvet.wash,
    borderRadius: radius.lg,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  aiBannerText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex: 1,
  },

  // Card — shared wrapper for To/Subject and Prompt
  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    ...shadows.card,
  },
  cardInput: {
    ...typography.bodyMd,
    color: colors.text.primary,
    paddingVertical: space[2],
    paddingHorizontal: 0,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginVertical: space[3],
  },

  // Section labels (caption pattern)
  sectionLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: space[1],
  },

  // Prompt input
  promptInput: {
    ...typography.bodyMd,
    color: colors.text.primary,
    minHeight: 120,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  // Error text
  errorText: {
    ...typography.bodySm,
    color: colors.coral.DEFAULT,
    marginTop: space[1],
  },

  // Tone chips — matches pre-call-sheet toggle pattern
  toneRow: {
    flexDirection: 'row',
    gap: space[2],
  },
  toneChip: {
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
  toneChipActive: {
    backgroundColor: colors.velvet.DEFAULT,
  },
  toneChipText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  toneChipTextActive: {
    color: colors.text.onVelvet,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },

  // Buttons — stacked vertically
  buttonsStack: {
    gap: space[3],
  },
  primaryButton: {
    backgroundColor: colors.velvet.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: space[3],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  primaryButtonPressed: {
    backgroundColor: colors.velvet.pressed,
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  primaryButtonText: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    color: colors.text.onVelvet,
  },
  secondaryButton: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: space[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: colors.bg.hover,
  },
  secondaryButtonText: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.body,
  },
  ghostButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[3],
  },
  ghostButtonText: {
    ...typography.bodyMd,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.text.secondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Preview phase
  previewMeta: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  previewCard: {
    backgroundColor: colors.plum.light,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: space[4],
    ...shadows.card,
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: space[3],
  },
  aiLabelText: {
    ...typography.caption,
    color: colors.plum.DEFAULT,
  },
  previewSubject: {
    ...typography.headingMd,
    color: colors.text.primary,
  },
  editableInput: {
    ...typography.headingMd,
    color: colors.text.primary,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.md,
    padding: space[3],
  },
  previewBody: {
    ...typography.bodyMd,
    color: colors.text.body,
    lineHeight: 22,
  },
  editableBody: {
    ...typography.bodyMd,
    color: colors.text.body,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.md,
    padding: space[3],
    minHeight: 160,
    lineHeight: 22,
  },
  editToggle: {
    alignSelf: 'flex-end',
    marginTop: space[3],
    paddingVertical: space[1],
    paddingHorizontal: space[3],
  },
  editToggleText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
    color: colors.plum.DEFAULT,
  },
});
