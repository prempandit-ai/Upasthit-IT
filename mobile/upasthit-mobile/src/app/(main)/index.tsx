import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import StatCard from '@/components/student/StatCard';
import StatusBadge from '@/components/student/StatusBadge';
import StudentHeader from '@/components/student/StudentHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Navy, Spacing } from '@/constants/theme';
import {
  CampusEvent,
  getStudentDashboard,
  getStudentEvents,
  getStudentNotifications,
  getTodayClasses,
  StudentNotification,
  TodayClass,
} from '@/services/studentService';

// ── Quick Access 6-Grid Configuration ─────────────────────────────────────────

interface QuickAccessItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}

export default function StudentHomeScreen() {
  const [stats, setStats] = useState<{
    attendancePercentage: number;
    attendanceStatus: string;
    pendingAssignments: number;
    cgpa: string | number;
    upcomingTests: number;
  } | null>(null);

  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<StudentNotification[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<CampusEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [dashRes, classRes, notifRes, eventRes] = await Promise.allSettled([
        getStudentDashboard(),
        getTodayClasses(),
        getStudentNotifications(),
        getStudentEvents(),
      ]);

      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value.data;
        setStats({
          attendancePercentage: d?.attendancePercentage ?? 82,
          attendanceStatus: d?.attendanceStatus ?? 'Good Standing',
          pendingAssignments: d?.pendingAssignments ?? 2,
          cgpa: d?.cgpa ?? 8.64,
          upcomingTests: d?.upcomingTests ?? 2,
        });
      }

      if (classRes.status === 'fulfilled') {
        setTodayClasses(classRes.value.data?.classes ?? []);
      }

      if (notifRes.status === 'fulfilled') {
        const list = notifRes.value.data?.notifications ?? [];
        setRecentNotifs(list.slice(0, 2));
      }

      if (eventRes.status === 'fulfilled') {
        const evs = eventRes.value.data?.events ?? [];
        if (evs.length > 0) {
          setFeaturedEvent(evs[0]);
        }
      }
    } catch (_) {
      // safe fallback in service layer prevents crashes
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

  const quickAccessItems: QuickAccessItem[] = [
    {
      id: 'attendance',
      icon: 'stats-chart',
      label: 'My Attendance',
      color: '#0284C7',
      bg: '#F0F9FF',
      onPress: () => router.push('/(main)/academics' as any),
    },
    {
      id: 'assignments',
      icon: 'clipboard',
      label: 'Assignments',
      color: '#7C3AED',
      bg: '#F5F3FF',
      onPress: () => router.push('/(main)/academics' as any),
    },
    {
      id: 'requests',
      icon: 'document-text',
      label: 'Request Status',
      color: '#059669',
      bg: '#ECFDF5',
      onPress: () => router.push('/(main)/requests' as any),
    },
    {
      id: 'events',
      icon: 'trophy',
      label: 'Campus Events',
      color: '#E11D48',
      bg: '#FFF1F2',
      onPress: () => router.push('/(main)/events' as any),
    },
    {
      id: 'timetable',
      icon: 'calendar',
      label: 'Timetable',
      color: '#D97706',
      bg: '#FFFBEB',
      onPress: () => router.push('/(main)/schedule' as any),
    },
    {
      id: 'notices',
      icon: 'notifications',
      label: 'Notices & News',
      color: '#4F46E5',
      bg: '#EEF2FF',
      onPress: () => router.push('/(main)/notifications' as any),
    },
  ];

  const attPct = stats?.attendancePercentage ?? 82;
  const attColor = attPct >= 75 ? Navy.success : attPct >= 65 ? '#F59E0B' : Navy.error;
  const attBg = attPct >= 75 ? '#F0FDF4' : attPct >= 65 ? '#FFFBEB' : '#FEF2F2';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
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
          {/* ── Student Greeting & Header ── */}
          <StudentHeader unreadCount={2} />

          {/* ── Summary Metrics ── */}
          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="small" color={Navy.primary} />
            </View>
          ) : (
            <View style={styles.metricsGrid}>
              <StatCard
                icon="checkmark-circle"
                value={`${attPct}%`}
                label="Attendance"
                subLabel={stats?.attendanceStatus ?? 'Good Standing'}
                color={attColor}
                bgColor={attBg}
                onPress={() => router.push('/(main)/academics' as any)}
              />
              <StatCard
                icon="document-text"
                value={stats?.pendingAssignments ?? 2}
                label="Pending"
                subLabel="Assignments"
                color="#7C3AED"
                bgColor="#F5F3FF"
                onPress={() => router.push('/(main)/academics' as any)}
              />
              <StatCard
                icon="school"
                value={stats?.cgpa ?? '8.64'}
                label="CGPA"
                subLabel="Cumulative"
                color="#0284C7"
                bgColor="#F0F9FF"
                onPress={() => router.push('/(main)/profile' as any)}
              />
            </View>
          )}

          {/* ── Quick Access 6-Grid ── */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Quick Access</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>Campus Services</ThemedText>
          </View>

          <View style={styles.sixGrid}>
            {quickAccessItems.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.gridTile,
                  { backgroundColor: item.bg },
                  pressed && styles.pressed,
                ]}
                onPress={item.onPress}>
                <View style={[styles.tileIconCircle, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <ThemedText style={[styles.tileLabel, { color: item.color }]}>
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {/* ── Today's Classes Timeline ── */}
          <View style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionTitle}>Today's Schedule</ThemedText>
              <ThemedText style={styles.sectionSubtitle}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </ThemedText>
            </View>
            <Pressable
              style={styles.seeAllBtn}
              onPress={() => router.push('/(main)/schedule' as any)}>
              <ThemedText style={styles.seeAllText}>Full Week</ThemedText>
              <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
            </Pressable>
          </View>

          {todayClasses.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No Classes Today"
              message="No lecture slots scheduled for today. Enjoy your self-study time!"
            />
          ) : (
            <View style={styles.classesTimeline}>
              {todayClasses.map((cls) => (
                <ClassCard key={cls.id} cls={cls} />
              ))}
            </View>
          )}

          {/* ── Recent Notifications Preview ── */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Notice & Alerts</ThemedText>
            <Pressable
              style={styles.seeAllBtn}
              onPress={() => router.push('/(main)/notifications' as any)}>
              <ThemedText style={styles.seeAllText}>View All</ThemedText>
              <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
            </Pressable>
          </View>

          {recentNotifs.length === 0 ? (
            <EmptyState
              icon="notifications-off-outline"
              title="No New Notices"
              message="You are all caught up with official notices."
            />
          ) : (
            recentNotifs.map((notif) => (
              <View key={notif.id} style={styles.notifCard}>
                <View style={styles.notifHeader}>
                  <StatusBadge
                    status={
                      notif.type === 'Attendance'
                        ? 'WARNING'
                        : notif.type === 'Academic'
                        ? 'ACTIVE'
                        : 'PENDING'
                    }
                    label={notif.type}
                    size="sm"
                  />
                  <ThemedText style={styles.notifTime}>{notif.timestamp}</ThemedText>
                </View>
                <ThemedText style={styles.notifTitle}>{notif.title}</ThemedText>
                <ThemedText style={styles.notifDesc} numberOfLines={2}>
                  {notif.description}
                </ThemedText>
              </View>
            ))
          )}

          {/* ── Featured Upcoming Event Preview ── */}
          {featuredEvent && (
            <>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Upcoming Event</ThemedText>
                <Pressable
                  style={styles.seeAllBtn}
                  onPress={() => router.push('/(main)/events' as any)}>
                  <ThemedText style={styles.seeAllText}>All Events</ThemedText>
                  <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [styles.eventCard, pressed && styles.pressed]}
                onPress={() => router.push('/(main)/events' as any)}>
                <View style={styles.eventBadgeRow}>
                  <View style={styles.eventCategoryBadge}>
                    <ThemedText style={styles.eventCategoryText}>
                      {featuredEvent.category || 'Featured'}
                    </ThemedText>
                  </View>
                  {featuredEvent.isRegistered && (
                    <StatusBadge status="APPROVED" label="Registered" size="sm" />
                  )}
                </View>
                <ThemedText style={styles.eventTitle}>{featuredEvent.name}</ThemedText>
                <View style={styles.eventDetailsRow}>
                  <View style={styles.eventDetailItem}>
                    <Ionicons name="calendar-outline" size={13} color="#64748B" />
                    <ThemedText style={styles.eventDetailText}>{featuredEvent.date}</ThemedText>
                  </View>
                  <View style={styles.eventDetailItem}>
                    <Ionicons name="location-outline" size={13} color="#64748B" />
                    <ThemedText style={styles.eventDetailText} numberOfLines={1}>
                      {featuredEvent.venue}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            </>
          )}

          {/* Bottom spacing for bottom tab bar */}
          <View style={{ height: BottomTabInset + Spacing.four }} />
        </ScrollView>
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
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  loaderBox: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Navy.primary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  sixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  gridTile: {
    width: '31%',
    flexGrow: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 90,
  },
  tileIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  classesTimeline: {
    gap: 10,
  },
  notifCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Navy.primary,
    marginBottom: 4,
  },
  notifDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
  },
  eventBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCategoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eventCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Navy.primary,
    marginBottom: 8,
  },
  eventDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  eventDetailText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
