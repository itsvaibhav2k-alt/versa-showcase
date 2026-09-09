import React from 'react';
import { View, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { colors } from '@/src/lib/design-tokens';
import { useNetwork } from '@/src/hooks/use-network';

export function OfflineBanner() {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <View
      style={{
        backgroundColor: colors.velvet.wash,
        borderBottomWidth: 1,
        borderBottomColor: colors.velvet.light,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
      }}
    >
      <WifiOff size={16} color={colors.velvet.DEFAULT} strokeWidth={1.5} />
      <Text
        style={{
          marginLeft: 8,
          fontSize: 13,
          fontFamily: 'DMSans_500Medium',
          color: colors.velvet.DEFAULT,
        }}
      >
        You&apos;re offline — some features may be limited
      </Text>
    </View>
  );
}
