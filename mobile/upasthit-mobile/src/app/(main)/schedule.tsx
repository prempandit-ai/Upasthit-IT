import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ClassCard from '@/components/student/ClassCard';
import EmptyState from '@/components/student/EmptyState';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Navy, Spacing } from '@/constants/theme';
import { getStudentTimetable, TodayClass } from '@/services/studentService';

// ── Days definition ───────────────────────────────────────────────────────────

interface DayItem {
  id: string;
  name: string;
  short: string;
  dateNum: number;
  isToday: boolean;
}

export default function ScheduleScreen() {
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0 is Sunday, 1 is Monday ...

  // Generate real dates for the current week (Monday to Saturday)
  const monday = new Date(today);
  const diffToMonday = (today.getDay() + 6) % 7;
  monday.setDate(today.getDate() - diffToMonday);

  const weekDays: DayItem[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
    (name, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      return {
        id: name,
        name,
        short: name.slice(0, 3),
        dateNum: d.getDate(),
        isToday,
      };
    }
  );

  const defaultSelectedDay =
    weekDays.find((d) => d.isToday)?.name || weekDays[0].name;

  const [selectedDay, setSelectedDay] = useState<string>(defaultSelectedDay);
  const [timetable, setTimetable] = useState<Record<string, TodayClass[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getStudentTimetable();
      const resData = res.data as any;
      const data = resData?.days ?? resData?.timetable ?? resData ?? {};
      setTimetable(data);
    } catch (_) {
      // safe fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Get classes for selected day
  const dayClasses: TodayClass[] =
    timetable[selectedDay] ||
    (selectedDay === 'Saturday'
      ? []
      : timetable['Monday'] || []);

  const lectureCount = dayClasses.filter((c) => c.type !== 'Lab').length;
  const labCount = dayClasses.filter((c) => c.type === 'Lab').length;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Screen Header ── */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerSubtitle}>Timetable & Schedule</ThemedText>
            <ThemedText style={styles.headerTitle}>Academic Calendar</ThemedText>
          </View>
          <View style={styles.badgeContainer}>
            <Ionicons name="calendar-outline" size={14} color="#2563EB" />
            <ThemedText style={styles.badgeText}>
              {today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </ThemedText>
          </View>
        </View>

        {/* ── Week Day-Picker View ── */}
        <View style={styles.weekPickerContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekPickerScroll}>
            {weekDays.map((d) => {
              const isSelected = selectedDay === d.name;
              return (
                <Pressable
                  key={d.id}
                  style={[
                    styles.dayTile,
                    isSelected && styles.dayTileSelected,
                    d.isToday && !isSelected && styles.dayTileToday,
                  ]}
                  onPress={() => setSelectedDay(d.name)}>
                  <ThemedText
                    style={[
                      styles.dayShortName,
                      isSelected && styles.dayTextSelected,
                      d.isToday && !isSelected && styles.dayTextToday,
                    ]}>
                    {d.short}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.dayDateNumber,
                      isSelected && styles.dayTextSelected,
                      d.isToday && !isSelected && styles.dayTextToday,
                    ]}>
                    {d.dateNum}
                  </ThemedText>
                  {d.isToday && (
                    <View
                      style={[
                        styles.todayDot,
                        isSelected ? styles.todayDotWhite : styles.todayDotBlue,
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Navy.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Navy.primary}
                colors={[Navy.primary]}
              />
            }>
            {/* ── Schedule Summary Metric Bar ── */}
            <View style={styles.summaryBar}>
              <View style={styles.summaryLeft}>
                <ThemedText style={styles.summaryDayName}>{selectedDay}'s Schedule</ThemedText>
                <ThemedText style={styles.summaryStats}>
                  {lectureCount} Lecture{lectureCount !== 1 ? 's' : ''}
                  {labCount > 0 ? ` • ${labCount} Lab Session` : ''} • ~
                  {lectureCount + labCount * 1.5} Hours
                </ThemedText>
              </View>
              <View style={styles.summaryRight}>
                <View style={styles.locationPill}>
                  <Ionicons name="business-outline" size={13} color="#2563EB" />
                  <ThemedText style={styles.locationPillText}>Campus LH-3</ThemedText>
                </View>
              </View>
            </View>

            {/* ── Classes Timeline & Lunch Break ── */}
            {dayClasses.length === 0 ? (
              <EmptyState
                icon="cafe-outline"
                title={`No Classes on ${selectedDay}`}
                message="No academic sessions scheduled. Use this time for project work, reading, or rest!"
              />
            ) : (
              <View style={styles.timelineList}>
                {dayClasses.slice(0, 3).map((cls) => (
                  <ClassCard key={cls.id} cls={cls} />
                ))}

                {/* ── Lunch Break Slot Card ── */}
                <View style={styles.lunchCard}>
                  <View style={styles.lunchLeftBar} />
                  <View style={styles.lunchContent}>
                    <View style={styles.lunchHeaderRow}>
                      <View style={styles.lunchTimeRow}>
                        <Ionicons name="time-outline" size={14} color="#D97706" />
                        <ThemedText style={styles.lunchTimeText}>
                          01:00 PM - 02:00 PM
                        </ThemedText>
                      </View>
                      <View style={styles.lunchBadge}>
                        <ThemedText style={styles.lunchBadgeText}>RECESS</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.lunchTitle}>
                      Lunch & Campus Break
                    </ThemedText>
                    <View style={styles.lunchMetaRow}>
                      <Ionicons name="restaurant-outline" size={13} color="#92400E" />
                      <ThemedText style={styles.lunchMetaText}>
                        Central Cafeteria / Student Lounge
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Afternoon lectures */}
                {dayClasses.slice(3).map((cls) => (
                  <ClassCard key={cls.id} cls={cls} />
                ))}
              </View>
            )}

            <View style={{ height: BottomTabInset + Spacing.four }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Navy.primary,
    letterSpacing: -0.3,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  weekPickerContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  weekPickerScroll: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  dayTile: {
    width: 52,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 2,
  },
  dayTileSelected: {
    backgroundColor: Navy.primary,
    borderColor: Navy.primary,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  dayTileToday: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  dayShortName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dayDateNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayTextToday: {
    color: '#1D4ED8',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 5,
  },
  todayDotWhite: {
    backgroundColor: '#FFFFFF',
  },
  todayDotBlue: {
    backgroundColor: '#3B82F6',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 4,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryDayName: {
    fontSize: 15,
    fontWeight: '800',
    color: Navy.primary,
    marginBottom: 2,
  },
  summaryStats: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryRight: {
    marginLeft: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  timelineList: {
    gap: 10,
    marginTop: 4,
  },
  lunchCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginVertical: 2,
  },
  lunchLeftBar: {
    width: 5,
    backgroundColor: '#F59E0B',
  },
  lunchContent: {
    flex: 1,
    padding: 14,
  },
  lunchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lunchTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lunchTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  lunchBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lunchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  lunchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 6,
  },
  lunchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lunchMetaText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
});
