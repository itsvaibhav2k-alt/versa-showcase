import React from 'react';
import { Platform, View } from 'react-native';
import { Home, Users, MessageSquare, Mic, Settings, type LucideIcon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';

import { hapticSelection } from '@/src/lib/haptics';
import { colors } from '@/src/lib/design-tokens';

function TabBarIcon(props: {
  icon: LucideIcon;
  color: string;
  focused: boolean;
}) {
  const IconComponent = props.icon;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', opacity: props.focused ? 1 : 0.5 }}>
      <IconComponent size={22} color={props.color} strokeWidth={props.focused ? 2 : 1.5} />
    </View>
  );
}

function CommandTabIcon({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: focused ? colors.velvet.DEFAULT : colors.velvet.dim,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        shadowColor: '#69306D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: focused ? 0.3 : 0.15,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <Mic size={24} color={focused ? '#FFFFFF' : colors.velvet.DEFAULT} strokeWidth={2} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenListeners={{
        tabPress: () => hapticSelection(),
      }}
      screenOptions={{
        tabBarActiveTintColor: colors.text.primary,
        tabBarInactiveTintColor: colors.text.muted,
        headerShown: false,
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: Platform.OS === 'ios'
                ? 'rgba(245, 244, 248, 0.85)'
                : 'rgba(245, 244, 248, 0.95)',
              borderTopWidth: 0.5,
              borderTopColor: 'rgba(226, 216, 220, 0.5)',
            }}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'DMSans_600SemiBold',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          tabBarAccessibilityLabel: 'Team tab',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Users} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="command"
        options={{
          title: 'Command',
          tabBarAccessibilityLabel: 'Open command input',
          tabBarIcon: ({ focused }) => (
            <CommandTabIcon focused={focused} />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="comms"
        options={{
          title: 'Comms',
          tabBarAccessibilityLabel: 'Comms tab',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={MessageSquare} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings tab',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Settings} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
