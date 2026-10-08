import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Navy } from '@/constants/theme';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  subLabel?: string;
  color?: string;
  bgColor?: string;
  onPress?: () => void;
}

export default function StatCard({
  icon,
  value,
  label,
  subLabel,
  color = Navy.primary,
  bgColor = '#F8FAFC',
  onPress,
}: StatCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: bgColor },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <ThemedText style={[styles.value, { color }]}>{value}</ThemedText>
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {subLabel && <ThemedText style={styles.subLabel}>{subLabel}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 120,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  subLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
