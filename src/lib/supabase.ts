import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Invoke an edge function with a timeout to prevent hanging requests.
 * Falls back to a timeout error if the function doesn't respond in time.
 */
export async function invokeWithTimeout<T = any>(
  functionName: string,
  options: { body: Record<string, unknown> },
  timeoutMs = 30000,
): Promise<{ data: T | null; error: Error | null }> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${functionName} timed out after ${timeoutMs / 1000}s`)),
      timeoutMs,
    );
  });
  try {
    const result = await Promise.race([
      supabase.functions.invoke(functionName, options),
      timeoutPromise,
    ]);
    clearTimeout(timer!);
    return result as { data: T | null; error: Error | null };
  } catch (err: unknown) {
    clearTimeout(timer!);
    const error = err instanceof Error ? err : new Error('Unknown error');
    return { data: null, error };
  }
}
