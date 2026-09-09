import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { DEEPGRAM_API_KEY } from '@/src/lib/constants';

interface UseVoiceInputReturn {
  isAvailable: boolean;
  isRecording: boolean;
  transcript: string;
  meteringLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetTranscript: () => void;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const isAvailable = DEEPGRAM_API_KEY.length > 0;
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [meteringLevel, setMeteringLevel] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const startRecording = useCallback(async () => {
    try {
      if (!DEEPGRAM_API_KEY) {
        console.warn('Voice input unavailable: DEEPGRAM_API_KEY is not configured');
        return;
      }

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&language=en`,
        ['token', DEEPGRAM_API_KEY],
      );

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const text = data?.channel?.alternatives?.[0]?.transcript;
          if (text) {
            setTranscript((prev) => (prev ? `${prev} ${text}` : text));
          }
        } catch {
          // Ignore malformed messages
        }
      };

      wsRef.current = ws;

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 256000,
        },
      });

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          // Normalize metering from dB (typically -160 to 0) to 0-1 range
          const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
          setMeteringLevel(normalized);
        }
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Send recorded audio to Deepgram if websocket is still open
      if (uri && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const response = await fetch(uri);
        const blob = await response.blob();
        wsRef.current.send(blob);
        wsRef.current.close();
      }

      wsRef.current = null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isAvailable,
    isRecording,
    transcript,
    meteringLevel,
    startRecording,
    stopRecording,
    resetTranscript,
  };
}
