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
  TextInput,
  Linking,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '@/components/student/EmptyState';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Navy, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { classifyApiError } from '@/services/api';
import {
  FeeSummary,
  getStudentDocuments,
  getStudentFees,
  getStudentLibrary,
  getStudentProfile,
  LibrarySummary,
  StudentDocumentRecord,
  StudentProfile,
  updateStudentProfile,
} from '@/services/studentService';
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

function ProfileEditorField({
  label,
  value,
  onSave,
  saving,
  multiline = false,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
  saving: boolean;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <View style={styles.profileEditRow}>
      <ThemedText style={styles.profileEditLabel}>{label}</ThemedText>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        multiline={multiline}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#94A3B8"
        style={[styles.profileEditInput, multiline && styles.profileEditMultiline]}
      />
      <Pressable disabled={saving || draft === value} onPress={() => onSave(draft.trim())} style={[styles.profileSaveButton, (saving || draft === value) && styles.profileSaveButtonDisabled]}>
        <ThemedText style={styles.profileSaveText}>Save</ThemedText>
      </Pressable>
    </View>
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
  const [documents, setDocuments] = useState<StudentDocumentRecord[]>([]);
  const [documentsError, setDocumentsError] = useState('');
  const [fees, setFees] = useState<FeeSummary | null>(null);
  const [feesError, setFeesError] = useState('');
  const [library, setLibrary] = useState<LibrarySummary | null>(null);
  const [libraryError, setLibraryError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [bookSearch, setBookSearch] = useState('');

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

      const [profileResult, documentsResult, feesResult, libraryResult] = await Promise.allSettled([
        getStudentProfile(), getStudentDocuments(), getStudentFees(), getStudentLibrary(),
      ]);
      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value.data);
        setError(null);
      } else {
        const err = profileResult.reason;
        if (isUnauthorized(err)) {
          await expireSession();
          return;
        }
        setProfile(null);
        setError(classifyApiError(err));
      }
      if (documentsResult.status === 'fulfilled') { setDocuments(documentsResult.value.data.documents); setDocumentsError(''); }
      else { setDocuments([]); setDocumentsError('Student documents could not be loaded.'); }
      if (feesResult.status === 'fulfilled') { setFees(feesResult.value.data); setFeesError(''); }
      else { setFees(null); setFeesError('Fee records could not be loaded.'); }
      if (libraryResult.status === 'fulfilled') { setLibrary(libraryResult.value.data); setLibraryError(''); }
      else { setLibrary(null); setLibraryError('Library records could not be loaded.'); }
      setLoading(false);
      setRefreshing(false);
    },
    [expireSession]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    fetchData(true);
  };

  const saveProfile = async (payload: Partial<StudentProfile>) => {
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      const response = await updateStudentProfile(payload);
      if (response.data?.success !== true || !response.data?.profile) throw new Error('The server did not confirm the profile update.');
      await fetchData(true);
      setProfileSaved(true);
      Alert.alert('Profile saved', 'The server confirmed your profile changes.');
    } catch (err: any) {
      Alert.alert('Profile not saved', err?.response?.data?.message || err?.message || 'Unable to save profile changes.');
    } finally { setSavingProfile(false); }
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
                      <ProfileEditorField label="Name" value={profile?.name || ''} onSave={(name) => saveProfile({ name })} saving={savingProfile} />
                      <ProfileEditorField label="Phone" value={profile?.phone || profile?.mobileNumber || ''} onSave={(mobileNumber) => saveProfile({ mobileNumber })} saving={savingProfile} />
                      <ProfileEditorField label="Gender" value={profile?.gender || ''} onSave={(gender) => saveProfile({ gender })} saving={savingProfile} />
                      <ProfileEditorField label="Blood Group" value={profile?.bloodGroup || ''} onSave={(bloodGroup) => saveProfile({ bloodGroup })} saving={savingProfile} />
                      <ProfileEditorField label="Nationality" value={profile?.nationality || ''} onSave={(nationality) => saveProfile({ nationality })} saving={savingProfile} />
                      <ProfileEditorField label="Father's Name" value={profile?.fatherName || ''} onSave={(fatherName) => saveProfile({ fatherName })} saving={savingProfile} />
                      <ProfileEditorField label="Mother's Name" value={profile?.motherName || ''} onSave={(motherName) => saveProfile({ motherName })} saving={savingProfile} />
                      <ProfileEditorField label="Address" value={profile?.address || ''} onSave={(address) => saveProfile({ address })} saving={savingProfile} multiline />
                      <ProfileEditorField label="Date of Birth (YYYY-MM-DD)" value={profile?.dob ? new Date(profile.dob).toISOString().slice(0, 10) : ''} onSave={(dateOfBirth) => saveProfile({ dateOfBirth })} saving={savingProfile} />
                    </Section>

                    <Section title="Emergency Contact">
                      <ProfileEditorField label="Name" value={profile?.emergencyContact?.name || ''} onSave={(emergencyContactName) => saveProfile({ emergencyContactName } as any)} saving={savingProfile} />
                      <ProfileEditorField label="Relationship" value={profile?.emergencyContact?.relationship || ''} onSave={(emergencyContactRelationship) => saveProfile({ emergencyContactRelationship } as any)} saving={savingProfile} />
                      <ProfileEditorField label="Phone" value={profile?.emergencyContact?.phone || ''} onSave={(emergencyContactPhone) => saveProfile({ emergencyContactPhone } as any)} saving={savingProfile} />
                      {profileSaved ? <ThemedText style={styles.savedLabel}>Changes saved</ThemedText> : null}
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
                {documentsError ? <EmptyState icon="alert-circle-outline" title="Documents unavailable" message={documentsError} /> : documents.length === 0 ? (
                  <EmptyState icon="shield-checkmark-outline" title="No documents" message="No student document records are available. File uploads are unavailable until persistent storage is configured." />
                ) : documents.map((document) => (
                  <Pressable key={document.id} style={styles.docCard} onPress={() => Linking.openURL(document.fileUrl)}>
                    <View style={styles.docDetails}><ThemedText style={styles.docName}>{document.title}</ThemedText><ThemedText style={styles.docIssuer}>{document.fileName} · {document.status}</ThemedText>{document.reviewerRemarks ? <ThemedText style={styles.docIssuer}>{document.reviewerRemarks}</ThemedText> : null}</View>
                    <Ionicons name="open-outline" size={18} color={Navy.primary} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB 3: FEES SUMMARY (Phase 9)
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'FEES' && (
              <View style={styles.sectionWrap}>
                {feesError ? <EmptyState icon="alert-circle-outline" title="Fee summary unavailable" message={feesError} /> : !fees || fees.status === 'UNAVAILABLE' ? <EmptyState icon="wallet-outline" title="No fee records" message="There are no recorded fee charges or payments for this student." /> : <>
                  <View style={styles.feeSummaryCard}><ThemedText style={styles.feeHeaderTitle}>Recorded fee ledger</ThemedText><View style={styles.feeAmountRow}><ThemedText style={styles.feeAmountLabel}>Payable</ThemedText><ThemedText style={styles.feeAmountValue}>₹{fees.totalFee.toFixed(2)}</ThemedText></View><View style={styles.feeAmountRow}><ThemedText style={styles.feeAmountLabel}>Recorded payments</ThemedText><ThemedText style={styles.feeAmountValue}>₹{fees.paidAmount.toFixed(2)}</ThemedText></View><View style={styles.feeAmountRow}><ThemedText style={styles.feeAmountLabel}>Outstanding</ThemedText><ThemedText style={styles.feeAmountValue}>₹{fees.pendingAmount.toFixed(2)}</ThemedText></View><ThemedText style={styles.docIssuer}>Online payment is not available.</ThemedText></View>
                  <ThemedText style={styles.subSectionTitle}>Payment history</ThemedText>{fees.transactions.length === 0 ? <ThemedText style={styles.docIssuer}>No recorded payments.</ThemedText> : fees.transactions.map((payment) => <View key={payment.id} style={styles.txCard}><View style={styles.txInfo}><ThemedText style={styles.txReceipt}>{payment.receiptNo}</ThemedText><ThemedText style={styles.txDate}>{formatDisplayDate(payment.date)} · {payment.mode || 'Method unavailable'}</ThemedText></View><ThemedText style={styles.txAmount}>₹{payment.amount.toFixed(2)}</ThemedText></View>)}
                </>}
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB 4: LIBRARY SUMMARY (Phase 9)
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'LIBRARY' && (
              <View style={styles.sectionWrap}>
                {libraryError ? <EmptyState icon="alert-circle-outline" title="Library unavailable" message={libraryError} /> : !library ? <EmptyState icon="book-outline" title="Library unavailable" message="Library records could not be loaded." /> : <>
                  <TextInput value={bookSearch} onChangeText={setBookSearch} placeholder="Search books" placeholderTextColor="#94A3B8" style={styles.profileEditInput} />
                  <ThemedText style={styles.subSectionTitle}>Books in catalogue</ThemedText>
                  {library.books.filter((book) => `${book.title} ${book.author || ''} ${book.accessionCode || ''}`.toLowerCase().includes(bookSearch.toLowerCase())).map((book) => <View key={book.id} style={styles.bookCard}><View style={styles.bookDetails}><ThemedText style={styles.bookTitle}>{book.title}</ThemedText><ThemedText style={styles.bookAuthor}>{book.author || 'Author unavailable'}</ThemedText><ThemedText style={styles.docIssuer}>{book.accessionCode || 'Accession unavailable'} · {book.availableCopies} of {book.totalCopies} available</ThemedText></View></View>)}
                  <ThemedText style={styles.subSectionTitle}>My loans</ThemedText>{library.loans?.length ? library.loans.map((loan) => <View key={loan.id} style={styles.bookCard}><View style={styles.bookDetails}><ThemedText style={styles.bookTitle}>{loan.title}</ThemedText><ThemedText style={styles.bookAuthor}>Due {formatDisplayDate(loan.dueDate)} · {loan.status}</ThemedText><ThemedText style={styles.docIssuer}>{loan.fineAmount == null ? 'Fine policy not configured' : `Fine: ₹${loan.fineAmount.toFixed(2)}`}</ThemedText></View></View>) : <ThemedText style={styles.docIssuer}>No books are currently issued to you.</ThemedText>}
                </>}
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
  profileEditRow: { paddingHorizontal: Spacing.three, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  profileEditLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 5 },
  profileEditInput: { minHeight: 38, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#FFFFFF', color: Navy.primary, fontSize: 13 },
  profileEditMultiline: { minHeight: 72, textAlignVertical: 'top' },
  profileSaveButton: { alignSelf: 'flex-end', marginTop: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Navy.primary },
  profileSaveButtonDisabled: { opacity: 0.4 },
  profileSaveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  savedLabel: { color: '#059669', fontSize: 12, paddingHorizontal: Spacing.three, paddingBottom: 8 },
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
