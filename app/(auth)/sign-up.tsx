import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { authService } from '@/src/services/auth.service';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';

export default function SignUpScreen() {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    setError(null);
    if (!fullName || !orgName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authService.signUp(email, password, fullName, orgName);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
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
          We sent a confirmation link to {email}. Click it to activate your account.
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
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-8 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10">
          <Text className="text-4xl font-display text-ink">
            Get started
          </Text>
          <Text className="mt-2 text-lg text-ink-secondary">
            Create your account and organization
          </Text>
        </View>

        {error && (
          <View className="mb-4 rounded-xl bg-coral-light px-4 py-3">
            <Text className="text-sm text-coral">{error}</Text>
          </View>
        )}

        <View className="gap-4">
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            autoComplete="name"
          />

          <Input
            label="Organization Name"
            value={orgName}
            onChangeText={setOrgName}
            placeholder="Your company name"
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />

          <View className="mt-2">
            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              variant="primary"
              size="lg"
            />
          </View>
        </View>

        <View className="mt-8 flex-row items-center justify-center gap-1">
          <Text className="text-sm text-ink-secondary">
            Already have an account?
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Text className="text-sm font-body-semibold text-velvet">Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
