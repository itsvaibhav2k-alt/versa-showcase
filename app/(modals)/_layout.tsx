import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: true,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="task-create" options={{ title: 'New Task' }} />

      <Stack.Screen name="all-tasks" options={{ title: 'All Tasks' }} />
      <Stack.Screen name="reminder-create" options={{ title: 'New Reminder' }} />
<Stack.Screen name="delegate" options={{ headerShown: false }} />
      <Stack.Screen name="email-compose" options={{ headerShown: false }} />
      <Stack.Screen name="member-detail" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="calendar" options={{ headerShown: false }} />
    </Stack>
  );
}
