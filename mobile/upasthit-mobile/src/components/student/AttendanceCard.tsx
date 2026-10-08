import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Navy } from '@/constants/theme';

export interface AttendanceSubjectItem {
  id?: string;
  name: string;
  code?: string;
  faculty?: string;
  present: number;
  conducted: number;
  percentage?: number;
  status?: 'Good' | 'Warning' | 'Critical';
}

interface AttendanceCardProps {
  item: AttendanceSubjectItem;
  minRequired?: number;
  onPress?: () => void;
}

/**
 * AttendanceCard — renders subject attendance with progress bar,
 * 75% threshold marker, status badges, and safe miss / catch up calculations.
 */
export default function AttendanceCard({
  item,
  minRequired = 75,
  onPress,
}: AttendanceCardProps) {
  const conducted = item.conducted || 0;
  const present = item.present || 0;
  const pct =
    item.percentage !== undefined
      ? item.percentage
      : conducted > 0
      ? Math.round((present / conducted) * 100)
      : 0;

  const isLow = pct < minRequired;
  const isCritical = pct < 60;

  const barColor = isCritical
    ? '#EF4444'
    : isLow
    ? '#F59E0B'
    : '#10B981';

  // Smart Attendance Insight calculation
  let insightText = '';
  let isDangerInsight = false;

  if (conducted > 0) {
    if (pct < minRequired) {
      // Classes to attend consecutively to reach 75%
      // (present + x) / (conducted + x) >= 0.75 => x >= (0.75*conducted - present)/0.25
      const needed = Math.ceil((minRequired / 100 * conducted - present) / (1 - minRequired / 100));
      insightText = needed > 0 ? `Attend next ${needed} classes to reach ${minRequired}%` : 'On track';
      isDangerInsight = true;
    } else {
      // Classes student can afford to miss without dropping below 75%
      // present / (conducted + y) >= 0.75 => conducted + y <= present / 0.75 => y <= present/0.75 - conducted
      const canMiss = Math.floor(present / (minRequired / 100) - conducted);
      if (canMiss > 0) {
        insightText = `Can miss ${canMiss} class${canMiss > 1 ? 'es' : ''} safely`;
      } else {
        insightText = 'Do not miss next class';
      }
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isLow && styles.lowBorder,
        pressed && onPress && styles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}>
      {/* Header */}
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <ThemedText style={styles.subjectName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <View style={styles.metaRow}>
            {item.code && <ThemedText style={styles.subjectCode}>{item.code}</ThemedText>}
            {item.code && item.faculty && <ThemedText style={styles.dot}>•</ThemedText>}
            {item.faculty && (
              <ThemedText style={styles.facultyText} numberOfLines={1}>
                {item.faculty}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.percentageBadge}>
          <ThemedText style={[styles.percentageText, { color: barColor }]}>
            {pct}%
          </ThemedText>
        </View>
      </View>

      {/* Progress Bar with 75% marker */}
      <View style={styles.progressContainer}>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: barColor },
            ]}
          />
          {/* 75% Benchmark tick mark */}
          <View style={[styles.thresholdMarker, { left: `${minRequired}%` }]} />
        </View>
      </View>

      {/* Attendance Ratio & Threshold Info */}
      <View style={styles.statsRow}>
        <ThemedText style={styles.ratioText}>
          <ThemedText style={styles.ratioHighlight}>{present}</ThemedText>
          /{conducted} attended
        </ThemedText>

        {insightText ? (
          <View
            style={[
              styles.insightBadge,
              isDangerInsight ? styles.dangerInsight : styles.safeInsight,
            ]}>
            <Ionicons
              name={isDangerInsight ? 'alert-circle' : 'checkmark-circle'}
              size={12}
              color={isDangerInsight ? '#DC2626' : '#059669'}
            />
            <ThemedText
              style={[
                styles.insightText,
                { color: isDangerInsight ? '#DC2626' : '#059669' },
              ]}>
              {insightText}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  lowBorder: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFA',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftInfo: {
    flex: 1,
    marginRight: 12,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: Navy.primary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  dot: {
    fontSize: 11,
    color: '#94A3B8',
  },
  facultyText: {
    fontSize: 12,
    color: '#64748B',
    flexShrink: 1,
  },
  percentageBadge: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  progressContainer: {
    marginVertical: 6,
  },
  track: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#64748B',
    opacity: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  ratioText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  ratioHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dangerInsight: {
    backgroundColor: '#FEF2F2',
  },
  safeInsight: {
    backgroundColor: '#ECFDF5',
  },
  insightText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
