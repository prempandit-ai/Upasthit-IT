import { Ionicons } from '@expo/vector-icons';
import { AxiosError } from 'axios';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Navy, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { classifyApiError } from '@/services/api';
import { getStudentProfile, StudentProfile } from '@/services/studentService';
import { ROLE_LABELS } from '@/utils/roles';
import { AuthUser } from '@/utils/storage';

type ProfileTab = 'PROFILE' | 'DOCUMENTS' | 'FEES' | 'LIBRARY';

const YEAR_LABELS: Record<string, string> = {
  FY: 'FY (First Year)',
  SY: 'SY (Second Year)',
  TY: 'TY (Third Year)',
  BE: 'BE (Final Year)',
};

function getInitials(name?: string | null) {
  if (!name?.trim()) return 'NA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatStatus(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).replace(/_/g, ' ').toLowerCase();
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatYearSemester(year?: string | null, semester?: number | string | null) {
  const yearLabel = year ? YEAR_LABELS[year] || year : null;
  const semesterLabel =
    semester === 0 || semester ? `Semester ${semester}` : null;
  if (yearLabel && semesterLabel) return `${yearLabel} • ${semesterLabel}`;
  return yearLabel || semesterLabel;
}

function formatDisplayDate(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function departmentDisplay(profile?: StudentProfile | null) {
  if (!profile) return null;
  if (profile.departmentName && profile.departmentCode) {
    return `${profile.departmentName} (${profile.departmentCode})`;
  }
  return profile.departmentName || profile.departmentCode || null;
}

function isUnauthorized(error: unknown) {
  return (error as AxiosError)?.response?.status === 401;
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | number | null;
  last?: boolean;
}) {
  const missing = value === undefined || value === null || value === '';
  return (
    <>
      <View style={infoStyles.row}>
        <View style={infoStyles.iconWrap}>
          <Ionicons name={icon} size={15} color={Navy.secondary} />
        </View>
        <View style={infoStyles.texts}>
          <ThemedText style={infoStyles.label}>{label}</ThemedText>
          <ThemedText style={[infoStyles.value, missing && infoStyles.missing]}>
            {missing ? 'Not available' : String(value)}
          </ThemedText>
        </View>
      </View>
      {!last && <View style={infoStyles.divider} />}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={secStyles.wrap}>
      <ThemedText style={secStyles.title}>{title}</ThemedText>
      <View style={secStyles.card}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('PROFILE');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expireSession = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout]);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const { data } = await getStudentProfile();
        setProfile(data);
      } catch (err) {
        if (isUnauthorized(err)) {
          await expireSession();
          return;
        }
        setProfile(null);
        setError(classifyApiError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [expireSession]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    fetchData(true);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const displayName = profile?.name || user?.name || 'Student';
  const displayEmail = profile?.email || user?.email || 'Not available';
  const initials = getInitials(displayName);
  const roleKey = (profile?.role || user?.role || 'STUDENT') as AuthUser['role'];
  const roleLabel = ROLE_LABELS[roleKey] || roleKey;
  const programLabel = profile?.program || 'Not available';
  const departmentLabel = departmentDisplay(profile) || 'Not available';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Screen Header ── */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerSubtitle}>Student Dossier</ThemedText>
            <ThemedText style={styles.headerTitle}>Account & Services</ThemedText>
          </View>
          <Pressable
            style={({ pressed }) => [styles.logoutIconBtn, pressed && styles.pressed]}
            onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          </Pressable>
        </View>

        {/* ── Sub Navigation Tabs ── */}
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}>
            {[
              { id: 'PROFILE', label: 'Profile Info', icon: 'person-outline' },
              { id: 'DOCUMENTS', label: 'Documents', icon: 'shield-checkmark-outline' },
              { id: 'FEES', label: 'Fee Summary', icon: 'wallet-outline' },
              { id: 'LIBRARY', label: 'Library Books', icon: 'book-outline' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.id as ProfileTab)}>
                  <Ionicons
                    name={tab.icon as any}
                    size={15}
                    color={isActive ? '#FFFFFF' : '#64748B'}
                  />
                  <ThemedText style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                    {tab.label}
                  </ThemedText>
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Navy.primary}
                colors={[Navy.primary]}
              />
            }>
            {/* ── Avatar Hero (Always visible at top of profile) ── */}
            <View style={styles.hero}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <ThemedText style={styles.avatarText}>{initials}</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.name}>{displayName}</ThemedText>
              <ThemedText style={styles.email}>{displayEmail}</ThemedText>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <ThemedText style={styles.roleText}>{roleLabel}</ThemedText>
                </View>
                <View style={styles.programBadge}>
                  <ThemedText style={styles.programText}>
                    {programLabel} • {departmentLabel}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* ══════════════════════════════════════════════════════
                TAB 1: PROFILE & CONTACT (Phase 8)
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'PROFILE' && (
              <>
                {error ? (
                  <View style={styles.sectionWrap}>
                    <EmptyState
                      icon="alert-circle-outline"
                      title="Unable to load profile"
                      message={error}
                      actionLabel="Retry"
                      onAction={() => fetchData()}
                    />
                  </View>
                ) : (
                  <>
                    <Section title="Academic Information">
                      <InfoRow icon="id-card-outline" label="Student ID / GR No" value={profile?.studentId} />
                      <InfoRow icon="document-text-outline" label="Enrollment No" value={profile?.enrollmentNo} />
                      <InfoRow icon="card-outline" label="Roll No" value={profile?.rollNo} />
                      <InfoRow icon="school-outline" label="Program" value={profile?.program} />
                      <InfoRow
                        icon="business-outline"
                        label="Department"
                        value={departmentDisplay(profile)}
                      />
                      <InfoRow icon="calendar-outline" label="Academic Year" value={profile?.academicYear} />
                      <InfoRow
                        icon="layers-outline"
                        label="Year & Semester"
                        value={formatYearSemester(profile?.year, profile?.semester)}
                      />
                      <InfoRow icon="people-outline" label="Division" value={profile?.division} />
                      <InfoRow icon="trophy-outline" label="CGPA" value={profile?.cgpa} />
                      <InfoRow
                        icon="checkmark-circle-outline"
                        label="Enrollment Status"
                        value={formatStatus(profile?.enrollmentStatus)}
                      />
                      <InfoRow
                        icon="shield-checkmark-outline"
                        label="Approval Status"
                        value={formatStatus(profile?.approvalStatus)}
                        last
                      />
                    </Section>

                    <Section title="Personal Information">
                      <InfoRow icon="calendar-number-outline" label="Date of Birth" value={formatDisplayDate(profile?.dob)} />
                      <InfoRow icon="person-outline" label="Gender" value={profile?.gender} />
                      <InfoRow icon="water-outline" label="Blood Group" value={profile?.bloodGroup} />
                      <InfoRow icon="flag-outline" label="Nationality" value={profile?.nationality} />
                      <InfoRow icon="people-circle-outline" label="Father's Name" value={profile?.fatherName} />
                      <InfoRow icon="people-circle-outline" label="Mother's Name" value={profile?.motherName} />
                      <InfoRow icon="call-outline" label="Phone" value={profile?.phone || profile?.mobileNumber} />
                      <InfoRow icon="home-outline" label="Address" value={profile?.address} last />
                    </Section>

                    <Section title="Emergency Contact">
                      <InfoRow icon="person-outline" label="Name" value={profile?.emergencyContact?.name} />
                      <InfoRow icon="heart-outline" label="Relationship" value={profile?.emergencyContact?.relationship} />
                      <InfoRow icon="call-outline" label="Phone" value={profile?.emergencyContact?.phone} last />
                    </Section>
                  </>
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB 2: VERIFIED DOCUMENTS (Phase 8)
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'DOCUMENTS' && (
              <View style={styles.sectionWrap}>
                <EmptyState
                  icon="shield-checkmark-outline"
                  title="Documents unavailable"
                  message="Verified student documents are not stored in the database yet, so this locker cannot show real records."
                />
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB 3: FEES SUMMARY (Phase 9)
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'FEES' && (
              <View style={styles.sectionWrap}>
                <EmptyState
                  icon="wallet-outline"
                  title="Fee summary unavailable"
                  message="Fee amounts and payment history are not stored in the student database yet, so this tab cannot show real records."
                />
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB 4: LIBRARY SUMMARY (Phase 9)
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'LIBRARY' && (
              <View style={styles.sectionWrap}>
                <EmptyState
                  icon="book-outline"
                  title="Library records unavailable"
                  message="Issued books and fines are not stored in the student database yet, so this tab cannot show real records."
                />
              </View>
            )}

            {/* ── Sign out button ── */}
            <Pressable
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
              onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#B91C1C" />
              <ThemedText style={styles.logoutText}>Sign Out of Upasthit</ThemedText>
            </Pressable>

            <View style={{ height: BottomTabInset + Spacing.four }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1 },
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
  logoutIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  tabContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabScroll: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: Navy.primary,
    borderColor: Navy.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { gap: Spacing.three, paddingBottom: Spacing.five },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
    gap: 4,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: Navy.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Navy.primary },
  name: { fontSize: 20, fontWeight: '800', color: Navy.primary, letterSpacing: -0.3 },
  email: { fontSize: 13, color: '#64748B' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: Navy.primary },
  programBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  programText: { fontSize: 11, fontWeight: '600', color: Navy.success },
  sectionWrap: {
    paddingHorizontal: Spacing.four,
    gap: 10,
  },
  docsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 4,
  },
  docsBannerTextWrap: {
    flex: 1,
  },
  docsBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  docsBannerSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docDetails: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
    color: Navy.primary,
    marginBottom: 2,
  },
  docIssuer: {
    fontSize: 11,
    color: '#64748B',
  },
  docVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  docVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  feeSummaryCard: {
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
  },
  feeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  feeHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Navy.primary,
  },
  feeHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  feeAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  feeAmountBlock: {
    alignItems: 'center',
  },
  feeAmountLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  feeAmountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Navy.primary,
  },
  feeDueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
  },
  feeDueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Navy.primary,
    marginTop: 6,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txReceipt: {
    fontSize: 13,
    fontWeight: '700',
    color: Navy.primary,
  },
  txDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  txSuccess: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  libStatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  libStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  libStatVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Navy.primary,
  },
  libStatLbl: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bookIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookDetails: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Navy.primary,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  bookMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookDueText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  bookDaysLeft: {
    fontSize: 11,
    color: '#94A3B8',
  },
  renewBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginLeft: 8,
  },
  renewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.two,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: Spacing.three,
  },
  logoutBtnPressed: { backgroundColor: '#FEE2E2' },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#B91C1C' },
});

const secStyles = StyleSheet.create({
  wrap: { gap: Spacing.one, paddingHorizontal: Spacing.four },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  label: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  value: { fontSize: 14, color: Navy.primary, fontWeight: '600', marginTop: 1 },
  missing: { color: '#94A3B8', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: Spacing.three },
});
