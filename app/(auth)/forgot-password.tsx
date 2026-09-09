import { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { authService } from '@/src/services/auth.service';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSuccess(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 items-center justify-center bg-versa-bg px-8">
        <Text className="text-center text-2xl font-display text-ink">
          Check your email
        </Text>
        <Text className="mt-3 text-center text-base text-ink-secondary">
          Check your email for reset instructions
        </Text>
        <View className="mt-8">
          <Link href="/(auth)/sign-in" asChild>
            <Button
              title="Back to Sign In"
              onPress={() => {}}
              variant="primary"
              size="lg"
            />
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-versa-bg"
    >
      <View className="flex-1 justify-center px-8">
        <View className="mb-10">
          <Text className="text-3xl font-display tracking-tight text-ink">
            Reset password
          </Text>
          <Text className="mt-2 font-body text-base text-ink-secondary">
            Enter your email and we&apos;ll send you reset instructions
          </Text>
        </View>

        <View className="gap-4">
          <Input
            label="Email"
            placeholder="you@company.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View className="mt-2">
            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={loading}
              size="lg"
            />
          </View>
        </View>

        <View className="mt-8 flex-row items-center justify-center">
          <Text className="font-body text-sm text-ink-secondary">
            Remember your password?{' '}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Text className="font-body-semibold text-sm text-velvet">
              Sign In
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
