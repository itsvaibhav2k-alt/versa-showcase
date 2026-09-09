import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Zap } from 'lucide-react-native';
import { colors } from '@/src/lib/design-tokens';

interface TranscriptMessage {
  id: string;
  speaker: 'caller' | 'agent';
  speakerName: string;
  text: string;
  timestamp: string;
}

interface TranscriptViewerProps {
  messages: TranscriptMessage[];
}

function MessageBubble({ item }: { item: TranscriptMessage }) {
  const isCaller = item.speaker === 'caller';
  const initial = item.speakerName.charAt(0).toUpperCase();

  return (
    <View className={`mb-3 max-w-[85%] ${isCaller ? 'self-start' : 'self-end'}`}>
      <Text className={`mb-1 text-xs font-medium ${isCaller ? 'text-ink-secondary' : 'text-right text-velvet'}`}>
        {item.speakerName}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: isCaller ? 'flex-end' : 'flex-end' }}>
        {/* Caller avatar on left */}
        {isCaller && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.velvet.wash,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.velvet.DEFAULT }}>
              {initial}
            </Text>
          </View>
        )}

        <View
          className={`flex-1 rounded-2xl px-4 py-3 ${isCaller ? 'rounded-bl-none bg-versa-muted' : 'rounded-br-none bg-velvet-wash'}`}
        >
          <Text className="text-base leading-relaxed text-ink">
            {item.text}
          </Text>
        </View>

        {/* Agent avatar on right */}
        {!isCaller && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.plum.light,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}
          >
            <Zap size={14} color={colors.plum.DEFAULT} />
          </View>
        )}
      </View>
      <Text className={`mt-1 text-xs font-mono text-ink-muted ${isCaller ? '' : 'text-right'}`}>
        {item.timestamp}
      </Text>
    </View>
  );
}

export function TranscriptViewer({ messages }: TranscriptViewerProps) {
  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MessageBubble item={item} />}
      scrollEnabled={false}
      contentContainerClassName="py-2"
    />
  );
}
