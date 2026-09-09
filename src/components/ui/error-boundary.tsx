import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { colors } from '@/src/lib/design-tokens';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-versa-bg px-6">
          <View className="w-full max-w-sm rounded-2xl border border-warm-border bg-white p-6 shadow-card">
            <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-coral-light">
              <AlertTriangle size={24} color={colors.coral.DEFAULT} strokeWidth={1.5} />
            </View>
            <Text className="mb-2 text-lg font-semibold text-ink">
              Something went wrong
            </Text>
            <Text className="mb-6 text-sm leading-5 text-ink-secondary">
              An unexpected error occurred. Please try again.
            </Text>
            <Pressable
              onPress={this.handleReset}
              className="items-center rounded-xl bg-coral-light py-3 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-coral">
                Try Again
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
