import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { CampusEvent, getStudentEvents, registerForEvent } from '@/services/studentService';

type EventCategory = 'ALL' | 'Technical' | 'Cultural' | 'Workshop' | 'Academic';
type ViewMode = 'EXPLORE' | 'MY_REGISTRATIONS';

export default function EventsScreen() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('EXPLORE');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await getStudentEvents();
      const list = res.data?.events ?? [];
      setEvents(list);
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

  const handleRegister = (eventId: string, eventName: string) => {
    Alert.alert(
      'Confirm Registration',
      `Would you like to register for "${eventName}"? Your student ID and contact info will be submitted to the organizing committee.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register Now',
          style: 'default',
          onPress: async () => {
            try {
              await registerForEvent(eventId);
              // Optimistic update
              setEvents((prev) =>
                prev.map((ev) =>
                  ev.id === eventId
                    ? { ...ev, isRegistered: true, participants: ev.participants + 1 }
                    : ev
                )
              );
              Alert.alert('Registration Successful! 🎉', 'Your digital entry pass has been generated. See you at the event!');
            } catch (_) {
              Alert.alert('Error', 'Unable to complete registration. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Filter events based on viewMode and selectedCategory
  const displayedEvents = events.filter((ev) => {
    if (viewMode === 'MY_REGISTRATIONS' && !ev.isRegistered) return false;
    if (selectedCategory === 'ALL') return true;
    return ev.category === selectedCategory;
  });

  const registeredCount = events.filter((e) => e.isRegistered).length;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Screen Header ── */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerSubtitle}>Campus Life</ThemedText>
            <ThemedText style={styles.headerTitle}>Events & Activities</ThemedText>
          </View>
          <View style={styles.badgePill}>
            <Ionicons name="sparkles" size={13} color="#D97706" />
            <ThemedText style={styles.badgePillText}>{events.length} Upcoming</ThemedText>
          </View>
        </View>

        {/* ── View Mode Switcher (Explore vs My Registrations) ── */}
        <View style={styles.viewModeContainer}>
          <Pressable
            style={[styles.modeTab, viewMode === 'EXPLORE' && styles.modeTabActive]}
            onPress={() => setViewMode('EXPLORE')}>
            <Ionicons
              name="compass-outline"
              size={15}
              color={viewMode === 'EXPLORE' ? Navy.primary : '#64748B'}
            />
            <ThemedText
              style={[styles.modeTabText, viewMode === 'EXPLORE' && styles.modeTabTextActive]}>
              Explore Events
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.modeTab, viewMode === 'MY_REGISTRATIONS' && styles.modeTabActive]}
            onPress={() => setViewMode('MY_REGISTRATIONS')}>
            <Ionicons
              name="ticket-outline"
              size={15}
              color={viewMode === 'MY_REGISTRATIONS' ? Navy.primary : '#64748B'}
            />
            <ThemedText
              style={[
                styles.modeTabText,
                viewMode === 'MY_REGISTRATIONS' && styles.modeTabTextActive,
              ]}>
              My Registrations ({registeredCount})
            </ThemedText>
          </Pressable>
        </View>

        {/* ── Category Filter Chips ── */}
        <View style={styles.categoryScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}>
            {(['ALL', 'Technical', 'Workshop', 'Academic', 'Cultural'] as EventCategory[]).map(
              (cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[styles.catChip, isSelected && styles.catChipActive]}
                    onPress={() => setSelectedCategory(cat)}>
                    <ThemedText
                      style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                      {cat}
                    </ThemedText>
                  </Pressable>
                );
              }
            )}
          </ScrollView>
        </View>

        {/* ── Events List ── */}
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
            {displayedEvents.length === 0 ? (
              <EmptyState
                icon="ticket-outline"
                title={
                  viewMode === 'MY_REGISTRATIONS'
                    ? 'No Registered Events'
                    : 'No Events in this Category'
                }
                message={
                  viewMode === 'MY_REGISTRATIONS'
                    ? 'Explore upcoming hackathons, workshops, and fests to register.'
                    : 'Check back soon for new announcements from student clubs.'
                }
                actionLabel={viewMode === 'MY_REGISTRATIONS' ? 'Explore Events' : undefined}
                onAction={viewMode === 'MY_REGISTRATIONS' ? () => setViewMode('EXPLORE') : undefined}
              />
            ) : (
              displayedEvents.map((ev) => {
                const isExpanded = expandedEventId === ev.id;
                const isCompleted = ev.status === 'Completed';

                return (
                  <View key={ev.id} style={styles.eventCard}>
                    {/* Header Badges */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.categoryBadge}>
                        <ThemedText style={styles.categoryBadgeText}>
                          {ev.category || 'Event'}
                        </ThemedText>
                      </View>
                      <View style={styles.rightBadges}>
                        {ev.isRegistered && (
                          <StatusBadge status="APPROVED" label="Pass Active" size="sm" />
                        )}
                        <StatusBadge
                          status={ev.status === 'Ongoing' ? 'ACTIVE' : 'UPCOMING'}
                          label={ev.status}
                          size="sm"
                        />
                      </View>
                    </View>

                    {/* Title & Committee */}
                    <ThemedText style={styles.eventTitle}>{ev.name}</ThemedText>
                    <ThemedText style={styles.eventCommittee}>Organized by {ev.committee}</ThemedText>

                    {/* Description preview */}
                    <ThemedText
                      style={styles.eventDescription}
                      numberOfLines={isExpanded ? undefined : 2}>
                      {ev.description}
                    </ThemedText>

                    {/* Meta Info Row */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color="#64748B" />
                        <ThemedText style={styles.metaText}>{ev.date}</ThemedText>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color="#64748B" />
                        <ThemedText style={styles.metaText}>{ev.time}</ThemedText>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={13} color="#64748B" />
                        <ThemedText style={styles.metaText} numberOfLines={1}>
                          {ev.venue}
                        </ThemedText>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={13} color="#64748B" />
                        <ThemedText style={styles.metaText}>
                          {ev.participants} Attendees
                        </ThemedText>
                      </View>
                    </View>

                    {/* Details Toggle & Register Button Row */}
                    <View style={styles.actionFooterRow}>
                      <Pressable
                        style={styles.detailsToggleBtn}
                        onPress={() => setExpandedEventId(isExpanded ? null : ev.id)}>
                        <ThemedText style={styles.detailsToggleText}>
                          {isExpanded ? 'Less info' : 'View full details'}
                        </ThemedText>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color="#3B82F6"
                        />
                      </Pressable>

                      {!isCompleted && (
                        <Pressable
                          style={({ pressed }) => [
                            styles.regBtn,
                            ev.isRegistered && styles.regBtnRegistered,
                            pressed && styles.pressed,
                          ]}
                          onPress={() => !ev.isRegistered && handleRegister(ev.id, ev.name)}
                          disabled={ev.isRegistered}>
                          <Ionicons
                            name={ev.isRegistered ? 'checkmark-circle' : 'ticket-outline'}
                            size={14}
                            color={ev.isRegistered ? '#059669' : '#FFFFFF'}
                          />
                          <ThemedText
                            style={[
                              styles.regBtnText,
                              ev.isRegistered && styles.regBtnTextRegistered,
                            ]}>
                            {ev.isRegistered ? 'Registered' : 'Register'}
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })
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
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeTabActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: Navy.primary,
    fontWeight: '800',
  },
  categoryScrollWrap: {
    paddingVertical: 8,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: Navy.primary,
    borderColor: Navy.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
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
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Navy.primary,
    marginBottom: 3,
  },
  eventCommittee: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  regBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Navy.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  regBtnRegistered: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  regBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  regBtnTextRegistered: {
    color: '#059669',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
