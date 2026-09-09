import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import { Check, AlertCircle, AlertTriangle, Info, Undo2 } from 'lucide-react-native';
import { colors, shadows } from '@/src/lib/design-tokens';
import { hapticSuccess, hapticError, hapticLight } from '@/src/lib/haptics';

const ICON_SIZE = 20;

const iconMap = {
  success: { Icon: Check, color: colors.sage.DEFAULT },
  error: { Icon: AlertCircle, color: colors.coral.DEFAULT },
  warning: { Icon: AlertTriangle, color: colors.velvet.DEFAULT },
  info: { Icon: Info, color: colors.sky.DEFAULT },
};

interface VersaToastProps extends BaseToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  text1?: string;
  text2?: string;
  props?: {
    actionLabel?: string;
    onAction?: () => void;
  };
}

function VersaToast({ type, text1, text2, props }: VersaToastProps) {
  const { Icon, color } = iconMap[type] || iconMap.info;
  const actionLabel = props?.actionLabel;
  const onAction = props?.onAction;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon size={ICON_SIZE} color={color} strokeWidth={1.5} />
      </View>
      <View style={styles.textContainer}>
        {text1 ? <Text style={styles.title} numberOfLines={1}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle} numberOfLines={1}>{text2}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            onAction();
            Toast.hide();
          }}
          style={styles.actionButton}
          hitSlop={8}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const toastConfig = {
  success: (props: BaseToastProps) => <VersaToast {...props} type="success" />,
  error: (props: BaseToastProps) => <VersaToast {...props} type="error" />,
  warning: (props: BaseToastProps) => <VersaToast {...props} type="warning" />,
  info: (props: BaseToastProps) => <VersaToast {...props} type="info" />,
};

export function showToast(
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  subtitle?: string,
) {
  switch (type) {
    case 'success':
      hapticSuccess();
      break;
    case 'error':
      hapticError();
      break;
    case 'warning':
    case 'info':
      hapticLight();
      break;
  }

  Toast.show({
    type,
    text1: title,
    text2: subtitle,
    position: 'bottom',
    bottomOffset: 100,
    visibilityTime: 3000,
  });
}

export function showUndoToast(title: string, onUndo: () => void) {
  Toast.show({
    type: 'success',
    text1: title,
    position: 'bottom',
    bottomOffset: 100,
    visibilityTime: 4000,
    props: {
      actionLabel: 'Undo',
      onAction: onUndo,
    },
  });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    ...shadows.modal,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.text.onVelvet,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  actionButton: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    color: colors.velvet.DEFAULT,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
  },
});
