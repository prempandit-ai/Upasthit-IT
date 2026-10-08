import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '@/components/student/EmptyState';
import StatusBadge from '@/components/student/StatusBadge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Navy, Spacing } from '@/constants/theme';
import {
  getStudentRequests,
  StudentRequest,
  submitStudentRequest,
} from '@/services/studentService';

type RequestFilter = 'ALL' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export default function RequestsScreen() {
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<RequestFilter>('ALL');

  // Modal State for New Request
  const [modalVisible, setModalVisible] = useState(false);
  const [reqType, setReqType] = useState('Medical Leave Application');
  const [reqReason, setReqReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getStudentRequests();
      const list = (res.data?.requests ?? []) as StudentRequest[];
      setRequests(list);
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

  const handleCreateRequest = async () => {
    if (!reqReason.trim()) {
      Alert.alert('Missing Reason', 'Please provide a brief justification for your request.');
      return;
    }

    setSubmitting(true);
    try {
      const newReqPayload: StudentRequest = {
        id: `req_${Date.now()}`,
        type: reqType,
        appliedDate: 'Just now',
        reason: reqReason.trim(),
        status: 'Pending',
      };

      await submitStudentRequest(newReqPayload);

      setRequests((prev) => [newReqPayload, ...prev]);
      setModalVisible(false);
      setReqReason('');
      Alert.alert('Request Submitted! 📋', 'Your application has been forwarded to the faculty advisor / Dean office for review.');
    } catch (_) {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

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
            <ThemedText style={styles.headerTitle}>Student Requests</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Leaves & Official Document Applications
            </ThemedText>
          </View>

          <Pressable
            style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
            onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <ThemedText style={styles.newBtnText}>Apply</ThemedText>
          </Pressable>
        </View>

        {/* ── Filter Chips ── */}
        <View style={styles.chipScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}>
            {(['ALL', 'Pending', 'Under Review', 'Approved', 'Rejected'] as RequestFilter[]).map(
              (f) => {
                const isSelected = filter === f;
                const count =
                  f === 'ALL'
                    ? requests.length
                    : requests.filter((r) => r.status === f).length;

                return (
                  <Pressable
                    key={f}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setFilter(f)}>
                    <ThemedText
                      style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {f} ({count})
                    </ThemedText>
                  </Pressable>
                );
              }
            )}
          </ScrollView>
        </View>

        {/* ── Requests List ── */}
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
            {filteredRequests.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="No Requests Found"
                message={
                  filter === 'ALL'
                    ? 'You have not submitted any leave or document requests yet.'
                    : `No applications with "${filter}" status.`
                }
                actionLabel="Submit New Request"
                onAction={() => setModalVisible(true)}
              />
            ) : (
              filteredRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.requestTopRow}>
                    <View style={styles.requestIconBadge}>
                      <Ionicons
                        name={
                          req.type.toLowerCase().includes('leave')
                            ? 'medkit-outline'
                            : 'document-text-outline'
                        }
                        size={18}
                        color="#2563EB"
                      />
                    </View>
                    <View style={styles.requestMainInfo}>
                      <ThemedText style={styles.requestType}>{req.type}</ThemedText>
                      <ThemedText style={styles.requestDate}>
                        Applied: {req.appliedDate}
                      </ThemedText>
                    </View>
                    <StatusBadge
                      status={
                        req.status === 'Approved'
                          ? 'APPROVED'
                          : req.status === 'Rejected'
                          ? 'REJECTED'
                          : req.status === 'Under Review'
                          ? 'ACTIVE'
                          : 'PENDING'
                      }
                      label={req.status}
                      size="sm"
                    />
                  </View>

                  <View style={styles.reasonBox}>
                    <ThemedText style={styles.reasonLabel}>Reason / Remarks:</ThemedText>
                    <ThemedText style={styles.reasonText}>{req.reason}</ThemedText>
                  </View>

                  <View style={styles.timelineHintRow}>
                    <Ionicons name="git-commit-outline" size={13} color="#94A3B8" />
                    <ThemedText style={styles.timelineHintText}>
                      {req.status === 'Approved'
                        ? 'Approved by Faculty Advisor & Dean'
                        : req.status === 'Under Review'
                        ? 'Under verification at HOD desk'
                        : 'Awaiting initial review'}
                    </ThemedText>
                  </View>
                </View>
              ))
            )}

            <View style={{ height: BottomTabInset + Spacing.four }} />
          </ScrollView>
        )}

        {/* ── New Request Modal Form ── */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>New Student Request</ThemedText>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Request Type Selector */}
                <ThemedText style={styles.inputLabel}>Request Category</ThemedText>
                <View style={styles.typeOptionsWrap}>
                  {[
                    'Medical Leave Application',
                    'On-Duty (OD) Leave',
                    'Bonafide Certificate',
                    'Transcript Request',
                    'Hostel Outpass Request',
                  ].map((t) => {
                    const isSelected = reqType === t;
                    return (
                      <Pressable
                        key={t}
                        style={[styles.typeOption, isSelected && styles.typeOptionSelected]}
                        onPress={() => setReqType(t)}>
                        <Ionicons
                          name={
                            isSelected ? 'radio-button-on' : 'radio-button-off'
                          }
                          size={16}
                          color={isSelected ? '#2563EB' : '#94A3B8'}
                        />
                        <ThemedText
                          style={[
                            styles.typeOptionText,
                            isSelected && styles.typeOptionTextSelected,
                          ]}>
                          {t}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Reason / Remarks */}
                <ThemedText style={styles.inputLabel}>Detailed Justification / Reason *</ThemedText>
                <TextInput
                  style={styles.textArea}
                  placeholder="Explain dates, purpose, doctor prescription details, etc."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  value={reqReason}
                  onChangeText={setReqReason}
                />

                {/* Submit Action */}
                <Pressable
                  style={({ pressed }) => [
                    styles.submitModalBtn,
                    submitting && styles.submitModalBtnDisabled,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleCreateRequest}
                  disabled={submitting}>
                  <ThemedText style={styles.submitModalBtnText}>
                    {submitting ? 'Submitting Application...' : 'Submit to Dean Office'}
                  </ThemedText>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    marginRight: 10,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Navy.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Navy.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  newBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  requestCard: {
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
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  requestMainInfo: {
    flex: 1,
  },
  requestType: {
    fontSize: 14,
    fontWeight: '800',
    color: Navy.primary,
  },
  requestDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  timelineHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineHintText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Navy.primary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Navy.primary,
    marginBottom: 8,
    marginTop: 10,
  },
  typeOptionsWrap: {
    gap: 6,
    marginBottom: 10,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  typeOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  typeOptionTextSelected: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  submitModalBtn: {
    backgroundColor: Navy.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  submitModalBtnDisabled: {
    opacity: 0.6,
  },
  submitModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
