import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { Zap } from 'lucide-react-native';
import { Button } from '@/src/components/ui/button';
import { DecorativeOrbs } from '@/src/components/ui/decorative-orbs';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-versa-bg">
      <DecorativeOrbs variant="dashboard" />

      <View className="flex-1 justify-center px-8">
        <View className="items-center">
          <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-velvet">
            <Zap size={28} color="#fff" strokeWidth={1.5} />
          </View>

          <Text className="text-[28px] font-display tracking-tight text-ink">
            Versa
          </Text>

          <Text className="mt-2 font-body text-sm text-ink-secondary">
            Your AI-Powered Executive Assistant
          </Text>
        </View>

        <View className="mt-12 gap-3">
          <Link href="/(auth)/sign-in" asChild>
            <Button
              title="Sign In"
              onPress={() => {}}
              variant="primary"
              size="lg"
            />
          </Link>

          <Link href="/(auth)/sign-up" asChild>
            <Button
              title="Create Account"
              onPress={() => {}}
              variant="neutral"
              size="lg"
            />
          </Link>
        </View>
      </View>
    </View>
  );
}
