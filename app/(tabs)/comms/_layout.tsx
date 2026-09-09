import { Stack } from 'expo-router';

export default function CommsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="email/[id]" />
      <Stack.Screen name="sent-email/[id]" />
    </Stack>
  );
}
