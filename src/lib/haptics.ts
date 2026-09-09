import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const hapticLight = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const hapticSuccess = () => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const hapticError = () => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

export const hapticSelection = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};
