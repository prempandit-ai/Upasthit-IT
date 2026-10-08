import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Navy } from '@/constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

/**
 * EmptyState — reusable empty feedback component for lists, cards, and tab views.
 */
export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color="#94A3B8" />
      </View>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {message && <ThemedText style={styles.message}>{message}</ThemedText>}
      {actionLabel && onAction && (
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
          onPress={onAction}>
          <ThemedText style={styles.actionText}>{actionLabel}</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Navy.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: Navy.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
