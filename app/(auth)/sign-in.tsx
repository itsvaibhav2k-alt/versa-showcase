import { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Zap } from 'lucide-react-native';
import { authService } from '@/src/services/auth.service';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const result = await authService.signIn(email.trim(), password);

      // Load user profile and org immediately so dashboard has data
      if (result.user) {
        const { useAuthStore } = require('@/src/stores/auth-store');
        const store = useAuthStore.getState();

        const user = await authService.fetchUserProfile(result.user.id);
        if (user) {
          store.setUser(user);
          if (user.organization_id) {
            const org = await authService.fetchOrganization(user.organization_id);
            store.setOrganization(org);
          }
          router.replace('/(tabs)');
        } else {
          setErrorMsg('Could not load your profile. Please try again.');
        }
      }
    } catch (error: any) {
      const msg = error.message || 'Something went wrong';
      setErrorMsg(msg);
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-versa-bg"
    >
      <View className="flex-1 justify-center px-8">
        <View className="mb-10 items-center">
          <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-velvet">
            <Zap size={28} color="#fff" strokeWidth={1.5} />
          </View>
          <Text className="text-3xl font-display tracking-tight text-ink">
            Welcome back
          </Text>
          <Text className="mt-2 font-body text-base text-ink-secondary">
            Sign in to your command center
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

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View className="items-end">
            <Link href="/(auth)/forgot-password" asChild>
              <Text className="font-body-semibold text-sm text-velvet">
                Forgot Password?
              </Text>
            </Link>
          </View>

          {errorMsg ? (
            <View className="rounded-lg bg-coral-light px-4 py-3">
              <Text className="text-sm text-coral">{errorMsg}</Text>
            </View>
          ) : null}

          <View className="mt-2">
            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              size="lg"
            />
          </View>

        </View>

        <View className="mt-8 flex-row items-center justify-center">
          <Text className="font-body text-sm text-ink-secondary">
            Don&apos;t have an account?{' '}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Text className="font-body-semibold text-sm text-velvet">
              Sign Up
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
