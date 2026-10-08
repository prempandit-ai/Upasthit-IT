import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type StatusType =
  | 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE'
  | 'UPCOMING' | 'COMPLETED' | 'SUBMITTED' | 'EVALUATED'
  | 'OVERDUE' | 'GOOD' | 'WARNING' | 'CRITICAL'
  // Convenience lowercase aliases
  | 'present' | 'absent' | 'late' | 'excused'
  | 'pending' | 'approved' | 'rejected'
  | 'upcoming' | 'completed' | 'submitted' | 'overdue'
  | string;

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  PRESENT:   { bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  ABSENT:    { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
  LATE:      { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  EXCUSED:   { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  APPROVED:  { bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  PENDING:   { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  REJECTED:  { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
  ACTIVE:    { bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  UPCOMING:  { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  COMPLETED: { bg: '#F1F5F9', text: '#475569', dot: '#64748B' },
  SUBMITTED: { bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  EVALUATED: { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' },
  OVERDUE:   { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
  GOOD:      { bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  WARNING:   { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  CRITICAL:  { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
};

interface StatusBadgeProps {
  /** Status key — drives colours. Can be upper or lower case. */
  status: StatusType;
  /** Override display label. If omitted the status key is shown. */
  label?: string;
  /** 'sm' renders a slightly smaller badge */
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const norm = String(status || '').toUpperCase();
  const config = STATUS_CONFIG[norm] ?? { bg: '#F1F5F9', text: '#475569', dot: '#64748B' };
  const displayLabel = label ?? status;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSm,
      ]}>
      <View style={[styles.dot, { backgroundColor: config.dot }, isSmall && styles.dotSm]} />
      <ThemedText style={[styles.text, { color: config.text }, isSmall && styles.textSm]}>
        {displayLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSm: { width: 5, height: 5, borderRadius: 2.5 },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: { fontSize: 10, letterSpacing: 0.2 },
});
