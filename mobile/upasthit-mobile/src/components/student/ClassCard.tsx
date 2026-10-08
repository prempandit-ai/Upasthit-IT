import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Navy } from '@/constants/theme';
import { TodayClass } from '@/services/studentService';

import StatusBadge from './StatusBadge';

/**
 * ClassCard — renders a single class entry.
 *
 * Accepts either a `cls` object (TodayClass) OR individual spread props.
 */
interface ClassCardSpreadProps {
  cls?: never;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  type?: 'Lecture' | 'Lab' | 'Tutorial';
  status?: 'Upcoming' | 'Ongoing' | 'Completed';
}

interface ClassCardObjectProps {
  cls: TodayClass;
  time?: never;
  subject?: never;
  faculty?: never;
  room?: never;
  type?: never;
  status?: never;
}

type ClassCardProps = ClassCardSpreadProps | ClassCardObjectProps;

export default function ClassCard(props: ClassCardProps) {
  const time     = props.cls ? props.cls.time     : props.time;
  const subject  = props.cls ? props.cls.subject  : props.subject;
  const faculty  = props.cls ? props.cls.faculty  : props.faculty;
  const room     = props.cls ? props.cls.room     : props.room;
  const type     = (props.cls ? props.cls.type    : props.type) ?? 'Lecture';
  const status   = (props.cls ? props.cls.status  : props.status) ?? 'Upcoming';

  const isLab     = type === 'Lab';
  const isOngoing = status === 'Ongoing';
  const barColor  = isOngoing ? '#10B981' : isLab ? '#8B5CF6' : '#3B82F6';

  return (
    <View style={[styles.card, isOngoing && styles.ongoingCard]}>
      {/* Colour indicator bar */}
      <View style={[styles.leftBar, { backgroundColor: barColor }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <ThemedText style={styles.timeText}>{time}</ThemedText>
          </View>
          <View style={styles.rightBadges}>
            <View style={styles.typeBadge}>
              <ThemedText
                style={[
                  styles.typeText,
                  { color: isLab ? '#7C3AED' : '#2563EB' },
                ]}>
                {type}
              </ThemedText>
            </View>
            {status && (
              <StatusBadge
                status={
                  status === 'Ongoing'   ? 'present'
                  : status === 'Completed' ? 'late'
                  : 'pending'
                }
                label={status}
                size="sm"
              />
            )}
          </View>
        </View>

        {/* Subject */}
        <ThemedText style={styles.subjectText}>{subject}</ThemedText>

        {/* Faculty & Room */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={13} color="#64748B" />
            <ThemedText style={styles.detailText}>{faculty}</ThemedText>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={13} color="#64748B" />
            <ThemedText style={styles.detailText}>{room}</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  ongoingCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  leftBar: { width: 5 },
  content: { flex: 1, padding: 14 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  rightBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  subjectText: {
    fontSize: 15,
    fontWeight: '700',
    color: Navy.primary,
    marginBottom: 8,
  },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
});
