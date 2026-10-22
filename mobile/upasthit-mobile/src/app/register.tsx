import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navy, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { classifyApiError } from '@/services/api';
import { getRegistrationOptions, registerRequest, RegistrationOptions } from '@/services/authService';

const STEPS = ['Account', 'Academic', 'Personal', 'Emergency'] as const;
type Step = (typeof STEPS)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  departmentId: string;
  program: string;
  rollNo: string;
  academicYear: string;
  year: string;
  semester: string;
  division: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  nationality: string;
  fatherName: string;
  motherName: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  departmentId: '',
  program: '',
  rollNo: '',
  academicYear: '',
  year: '',
  semester: '',
  division: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  nationality: '',
  fatherName: '',
  motherName: '',
  phone: '',
  address: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
};

function FieldLabel({
  children,
  required = false,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <ThemedText type="smallBold" style={styles.label}>
      {children}
      {required ? <ThemedText style={styles.required}> *</ThemedText> : null}
    </ThemedText>
  );
}

function SelectField({
  label,
  required,
  value,
  placeholder,
  options,
  onSelect,
  disabled,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View>
      <FieldLabel required={required}>{label}</FieldLabel>
      <Pressable
        style={[styles.input, styles.select, disabled && styles.inputDisabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}>
        <ThemedText style={selected ? styles.selectValue : styles.selectPlaceholder}>
          {selected?.label || placeholder}
        </ThemedText>
        <Ionicons name="chevron-down" size={16} color="#94A3B8" />
      </Pressable>
      {error ? <ThemedText style={styles.fieldError}>{error}</ThemedText> : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <ThemedView style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>{label}</ThemedText>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}>
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      option.value === value && styles.modalOptionActive,
                    ]}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function RegisterScreen() {
  const theme = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const [step, setStep] = useState<Step>('Account');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [options, setOptions] = useState<RegistrationOptions | null>(null);
  const [optionsError, setOptionsError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRegistrationOptions()
      .then(({ data }) => {
        if (!cancelled) {
          setOptions(data);
          setOptionsError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setOptionsError(classifyApiError(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const semesterOptions = useMemo(() => {
    const allowed = form.year ? options?.semestersByYear?.[form.year] || [] : [];
    return allowed.map((semester) => ({
      label: `Semester ${semester}`,
      value: String(semester),
    }));
  }, [form.year, options]);

  if (!loading && isAuthenticated) {
    return <Redirect href="/(main)" />;
  }

  const update = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const inputStyle = (field: string) => [
    styles.input,
    { borderColor: focusedField === field ? Navy.focusBorder : theme.backgroundSelected },
    fieldErrors[field as keyof FormState] ? styles.inputInvalid : null,
    { color: theme.text },
  ];

  const validateStep = (current: Step) => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (current === 'Account') {
      if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name';
      if (!EMAIL_RE.test(form.email.trim())) nextErrors.email = 'Enter a valid college email';
      if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters';
      if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm your password';
      else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (current === 'Academic') {
      if (!form.departmentId) nextErrors.departmentId = 'Select a department';
      if (!form.program) nextErrors.program = 'Select an academic program';
      if (!form.rollNo || Number(form.rollNo) < 1) nextErrors.rollNo = 'Enter a valid roll number';
      if (!form.academicYear) nextErrors.academicYear = 'Select an academic year';
      if (!form.year) nextErrors.year = 'Select year of study';
      if (!form.semester) nextErrors.semester = 'Select a semester';
      if (!form.division) nextErrors.division = 'Select a division';
    }

    if (current === 'Personal' && form.dateOfBirth) {
      const parsed = new Date(form.dateOfBirth);
      if (Number.isNaN(parsed.getTime())) nextErrors.dateOfBirth = 'Use YYYY-MM-DD';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    setError('');
    if (!validateStep(step)) return;
    const index = STEPS.indexOf(step);
    if (index < STEPS.length - 1) setStep(STEPS[index + 1]);
  };

  const goBack = () => {
    setError('');
    const index = STEPS.indexOf(step);
    if (index > 0) setStep(STEPS[index - 1]);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setError('');
    setSuccess('');
    const accountOk = validateStep('Account');
    if (!accountOk) {
      setStep('Account');
      setError('Please complete the required account details.');
      return;
    }
    const academicOk = validateStep('Academic');
    if (!academicOk) {
      setStep('Academic');
      setError('Please complete the required academic details.');
      return;
    }
    if (!validateStep('Personal')) {
      setStep('Personal');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await registerRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        departmentId: Number(form.departmentId),
        program: form.program,
        rollNo: Number(form.rollNo),
        academicYear: form.academicYear,
        year: form.year,
        semester: Number(form.semester),
        division: form.division,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        nationality: form.nationality.trim() || undefined,
        fatherName: form.fatherName.trim() || undefined,
        motherName: form.motherName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactRelationship: form.emergencyContactRelationship || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
      });

      const approvalMessage =
        data.message ??
        'Registration submitted. Your account is pending approval. You will be notified once approved.';
      setSuccess(approvalMessage);
      setTimeout(() => {
        router.replace('/login');
      }, 2500);
    } catch (err: unknown) {
      setError(classifyApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderTextField = (
    field: keyof FormState,
    label: string,
    extra: {
      required?: boolean;
      placeholder?: string;
      keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
      autoCapitalize?: 'none' | 'words' | 'sentences';
      multiline?: boolean;
      secure?: boolean;
      showToggle?: boolean;
      shown?: boolean;
      onToggle?: () => void;
    } = {}
  ) => (
    <View>
      <FieldLabel required={extra.required}>{label}</FieldLabel>
      <View>
        <TextInput
          value={form[field]}
          onChangeText={(value) => update({ [field]: value } as Partial<FormState>)}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          placeholder={extra.placeholder}
          placeholderTextColor="#94A3B8"
          autoCapitalize={extra.autoCapitalize ?? 'sentences'}
          keyboardType={extra.keyboardType ?? 'default'}
          secureTextEntry={extra.secure && !extra.shown}
          multiline={extra.multiline}
          style={[inputStyle(field), extra.multiline && styles.multiline, extra.showToggle && styles.passwordInput]}
        />
        {extra.showToggle ? (
          <Pressable style={styles.eyeBtn} onPress={extra.onToggle}>
            <Ionicons name={extra.shown ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
          </Pressable>
        ) : null}
      </View>
      {fieldErrors[field] ? <ThemedText style={styles.fieldError}>{fieldErrors[field]}</ThemedText> : null}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ThemedText type="smallBold" style={styles.brand}>
              UPASTHIT
            </ThemedText>
            <ThemedText type="subtitle" style={styles.title}>
              Create Account
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Public signup creates a student account. Faculty, HOD, and coordinator accounts are
              created by admin or HOD.
            </ThemedText>

            <View style={styles.stepRow}>
              {STEPS.map((item) => {
                const active = item === step;
                return (
                  <View key={item} style={[styles.stepChip, active && styles.stepChipActive]}>
                    <ThemedText style={[styles.stepChipText, active && styles.stepChipTextActive]}>
                      {item}
                    </ThemedText>
                  </View>
                );
              })}
            </View>

            <ThemedView style={styles.formCard}>
              {step === 'Account' && (
                <>
                  {renderTextField('name', 'Full Name', { required: true, placeholder: 'Your full name', autoCapitalize: 'words' })}
                  {renderTextField('email', 'College Email', {
                    required: true,
                    placeholder: 'you@university.edu',
                    keyboardType: 'email-address',
                    autoCapitalize: 'none',
                  })}
                  {renderTextField('password', 'Password', {
                    required: true,
                    placeholder: 'Minimum 8 characters',
                    autoCapitalize: 'none',
                    secure: true,
                    showToggle: true,
                    shown: showPassword,
                    onToggle: () => setShowPassword((value) => !value),
                  })}
                  {renderTextField('confirmPassword', 'Confirm Password', {
                    required: true,
                    placeholder: 'Re-enter password',
                    autoCapitalize: 'none',
                    secure: true,
                    showToggle: true,
                    shown: showConfirm,
                    onToggle: () => setShowConfirm((value) => !value),
                  })}
                </>
              )}

              {step === 'Academic' && (
                <>
                  {optionsError ? <ThemedText style={styles.error}>{optionsError}</ThemedText> : null}
                  <SelectField
                    label="Department"
                    required
                    value={form.departmentId}
                    placeholder="Select department"
                    options={(options?.departments || []).map((dept) => ({
                      value: String(dept.id),
                      label: `${dept.name} (${dept.code})`,
                    }))}
                    onSelect={(departmentId) => update({ departmentId })}
                    error={fieldErrors.departmentId}
                  />
                  <SelectField
                    label="Academic Program"
                    required
                    value={form.program}
                    placeholder="Select program"
                    options={(options?.programs || []).map((program) => ({ value: program, label: program }))}
                    onSelect={(program) => update({ program })}
                    error={fieldErrors.program}
                  />
                  {renderTextField('rollNo', 'Roll Number', {
                    required: true,
                    placeholder: 'e.g. 24',
                    keyboardType: 'numeric',
                  })}
                  <SelectField
                    label="Academic Year"
                    required
                    value={form.academicYear}
                    placeholder="Select academic year"
                    options={(options?.academicYears || []).map((year) => ({ value: year, label: year }))}
                    onSelect={(academicYear) => update({ academicYear })}
                    error={fieldErrors.academicYear}
                  />
                  <SelectField
                    label="Year of Study"
                    required
                    value={form.year}
                    placeholder="Select year"
                    options={(options?.years || []).map((year) => ({ value: year, label: year }))}
                    onSelect={(year) =>
                      update({
                        year,
                        semester: (options?.semestersByYear?.[year] || []).includes(Number(form.semester))
                          ? form.semester
                          : '',
                      })
                    }
                    error={fieldErrors.year}
                  />
                  <SelectField
                    label="Semester"
                    required
                    value={form.semester}
                    placeholder={form.year ? 'Select semester' : 'Select year of study first'}
                    options={semesterOptions}
                    onSelect={(semester) => update({ semester })}
                    disabled={!form.year}
                    error={fieldErrors.semester}
                  />
                  <SelectField
                    label="Division"
                    required
                    value={form.division}
                    placeholder="Select division"
                    options={(options?.divisions || []).map((division) => ({ value: division, label: division }))}
                    onSelect={(division) => update({ division })}
                    error={fieldErrors.division}
                  />
                </>
              )}

              {step === 'Personal' && (
                <>
                  {Platform.OS === 'web' ? (
                    <View>
                      <FieldLabel>Date of Birth</FieldLabel>
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(event) => update({ dateOfBirth: event.target.value })}
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1.5,
                          borderColor: '#E2E8F0',
                          borderRadius: 12,
                          padding: 12,
                          fontSize: 15,
                          marginBottom: 8,
                        }}
                      />
                    </View>
                  ) : (
                    renderTextField('dateOfBirth', 'Date of Birth', {
                      placeholder: 'YYYY-MM-DD',
                    })
                  )}
                  <SelectField
                    label="Gender"
                    value={form.gender}
                    placeholder="Select gender"
                    options={(options?.genders || []).map((gender) => ({ value: gender, label: gender }))}
                    onSelect={(gender) => update({ gender })}
                  />
                  <SelectField
                    label="Blood Group"
                    value={form.bloodGroup}
                    placeholder="Select blood group"
                    options={(options?.bloodGroups || []).map((group) => ({ value: group, label: group }))}
                    onSelect={(bloodGroup) => update({ bloodGroup })}
                  />
                  {renderTextField('nationality', 'Nationality', { placeholder: 'e.g. Indian' })}
                  {renderTextField('fatherName', "Father's Name", { placeholder: "Father's full name", autoCapitalize: 'words' })}
                  {renderTextField('motherName', "Mother's Name", { placeholder: "Mother's full name", autoCapitalize: 'words' })}
                  {renderTextField('phone', 'Phone Number', {
                    placeholder: 'Mobile number',
                    keyboardType: 'phone-pad',
                  })}
                  {renderTextField('address', 'Residential Address', {
                    placeholder: 'Street, city, pin code',
                    multiline: true,
                  })}
                </>
              )}

              {step === 'Emergency' && (
                <>
                  {renderTextField('emergencyContactName', 'Emergency Contact Name', {
                    placeholder: 'Contact full name',
                    autoCapitalize: 'words',
                  })}
                  <SelectField
                    label="Relationship"
                    value={form.emergencyContactRelationship}
                    placeholder="Select relationship"
                    options={(options?.relationships || []).map((relationship) => ({
                      value: relationship,
                      label: relationship,
                    }))}
                    onSelect={(emergencyContactRelationship) => update({ emergencyContactRelationship })}
                  />
                  {renderTextField('emergencyContactPhone', 'Emergency Contact Phone', {
                    placeholder: 'Contact phone number',
                    keyboardType: 'phone-pad',
                  })}
                </>
              )}

              {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
              {success ? <ThemedText style={styles.successMessage}>{success}</ThemedText> : null}

              <View style={styles.navRow}>
                {step !== 'Account' ? (
                  <Pressable
                    style={({ pressed }) => [styles.secondaryBtn, pressed && styles.buttonPressed]}
                    onPress={goBack}
                    disabled={submitting}>
                    <ThemedText style={styles.secondaryBtnText}>Back</ThemedText>
                  </Pressable>
                ) : (
                  <View style={{ flex: 1 }} />
                )}

                {step !== 'Emergency' ? (
                  <Pressable
                    style={({ pressed }) => [styles.button, styles.navPrimary, pressed && styles.buttonPressed]}
                    onPress={goNext}>
                    <ThemedText style={styles.buttonText}>Continue</ThemedText>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.button,
                      styles.navPrimary,
                      pressed && styles.buttonPressed,
                      submitting && styles.buttonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting}>
                    {submitting ? (
                      <ActivityIndicator color={Navy.white} />
                    ) : (
                      <ThemedText style={styles.buttonText}>Create Account</ThemedText>
                    )}
                  </Pressable>
                )}
              </View>
            </ThemedView>

            <ThemedText style={styles.footer}>
              Already registered?{' '}
              <Link href="/login">
                <ThemedText type="linkPrimary">Sign in</ThemedText>
              </Link>
            </ThemedText>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  brand: {
    color: Navy.primary,
    letterSpacing: 3,
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    color: Navy.primary,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.two,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  stepChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepChipActive: {
    backgroundColor: Navy.primary,
    borderColor: Navy.primary,
  },
  stepChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  stepChipTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.four,
    gap: Spacing.one,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    color: '#0F172A',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  required: {
    color: Navy.error,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
    marginBottom: Spacing.one,
  },
  passwordInput: {
    paddingRight: 44,
  },
  inputInvalid: {
    borderColor: '#FECACA',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    color: '#0F172A',
    fontSize: 15,
  },
  selectPlaceholder: {
    color: '#94A3B8',
    fontSize: 15,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  fieldError: {
    color: Navy.error,
    fontSize: 12,
    marginBottom: 4,
  },
  error: {
    color: Navy.error,
    fontSize: 13,
    marginTop: Spacing.one,
  },
  successMessage: {
    color: Navy.success,
    fontWeight: '600',
    fontSize: 13,
    marginTop: Spacing.one,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.two,
  },
  navPrimary: {
    flex: 1,
    marginTop: 0,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: {
    color: Navy.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  button: {
    backgroundColor: Navy.primary,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Navy.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    marginTop: Spacing.two,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Navy.primary,
    marginBottom: 8,
  },
  modalList: {
    maxHeight: 360,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#334155',
  },
  modalOptionActive: {
    color: Navy.primary,
    fontWeight: '700',
  },
});
