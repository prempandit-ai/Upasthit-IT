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

import EmptyState from '@/components/student/EmptyState';
import StatusBadge from '@/components/student/StatusBadge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Navy, Spacing } from '@/constants/theme';
import {
  getStudentNotifications,
  StudentNotification,
} from '@/services/studentService';

type NotifFilter = 'ALL' | 'Academic' | 'Attendance' | 'Assignment' | 'Events';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotifFilter>('ALL');

  const fetchData = async () => {
    try {
      const res = await getStudentNotifications();
      setNotifications(res.data?.notifications ?? []);
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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Screen Header ── */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Navy.primary} />
          </Pressable>

          <View style={styles.headerTitles}>
            <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} unread notices` : 'All caught up'}
            </ThemedText>
          </View>

          {unreadCount > 0 && (
            <Pressable
              style={({ pressed }) => [styles.markReadBtn, pressed && styles.pressed]}
              onPress={markAllAsRead}>
              <ThemedText style={styles.markReadText}>Mark all read</ThemedText>
            </Pressable>
          )}
        </View>

        {/* ── Filter Chips ── */}
        <View style={styles.chipScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}>
            {(['ALL', 'Academic', 'Attendance', 'Assignment', 'Events'] as NotifFilter[]).map(
              (cat) => {
                const isSelected = filter === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setFilter(cat)}>
                    <ThemedText
                      style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {cat}
                    </ThemedText>
                  </Pressable>
                );
              }
            )}
          </ScrollView>
        </View>

        {/* ── Notifications List ── */}
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
            {filteredNotifs.length === 0 ? (
              <EmptyState
                icon="notifications-off-outline"
                title="No Notifications"
                message={`No notices found in ${filter.toLowerCase()} category.`}
              />
            ) : (
              filteredNotifs.map((n) => (
                <Pressable
                  key={n.id}
                  style={({ pressed }) => [
                    styles.notifCard,
                    !n.read && styles.notifCardUnread,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => markSingleAsRead(n.id)}>
                  <View style={styles.notifTopRow}>
                    <View style={styles.badgeWrap}>
                      <StatusBadge
                        status={
                          n.type === 'Attendance'
                            ? 'WARNING'
                            : n.type === 'Academic'
                            ? 'ACTIVE'
                            : 'PENDING'
                        }
                        label={n.type}
                        size="sm"
                      />
                      {!n.read && <View style={styles.unreadDot} />}
                    </View>
                    <ThemedText style={styles.timestamp}>{n.timestamp}</ThemedText>
                  </View>

                  <ThemedText style={[styles.notifTitle, !n.read && styles.notifTitleUnread]}>
                    {n.title}
                  </ThemedText>

                  <ThemedText style={styles.notifDesc}>{n.description}</ThemedText>
                </Pressable>
              ))
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
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Navy.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  markReadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  chipScrollWrap: {
    paddingVertical: 8,
  },
  chipScroll: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: Navy.primary,
    borderColor: Navy.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  notifCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BFDBFE',
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2563EB',
  },
  timestamp: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  notifTitleUnread: {
    color: Navy.primary,
    fontWeight: '800',
  },
  notifDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.8,
  },
});
