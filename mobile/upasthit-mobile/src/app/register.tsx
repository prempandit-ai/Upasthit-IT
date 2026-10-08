import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navy, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { classifyApiError } from '@/services/api';
import { registerRequest } from '@/services/authService';

export default function RegisterScreen() {
  const theme = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);

  if (!loading && isAuthenticated) {
    return <Redirect href="/(main)" />;
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await registerRequest(form);

      if (__DEV__) {
        console.log('[Register] Response keys:', Object.keys(data));
      }

      // Registration creates a PENDING account — no JWT is issued.
      // The backend returns: { success, message, user } (no token).
      // Show the server's approval message then redirect to login.
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

  const inputStyle = (field: 'name' | 'email' | 'password') => [
    styles.input,
    { borderColor: focusedField === field ? Navy.focusBorder : theme.backgroundSelected },
  ];

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

            {/* Branding */}
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

            {/* Form card */}
            <ThemedView style={styles.formCard}>
              <ThemedText type="smallBold" style={styles.label}>Full Name</ThemedText>
              <TextInput
                value={form.name}
                onChangeText={(name) => setForm((c) => ({ ...c, name }))}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Your full name"
                placeholderTextColor="#94A3B8"
                style={[inputStyle('name'), { color: theme.text }]}
              />

              <ThemedText type="smallBold" style={styles.label}>Email</ThemedText>
              <TextInput
                value={form.email}
                onChangeText={(email) => setForm((c) => ({ ...c, email }))}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@university.edu"
                placeholderTextColor="#94A3B8"
                style={[inputStyle('email'), { color: theme.text }]}
              />

              <ThemedText type="smallBold" style={styles.label}>Password</ThemedText>
              <TextInput
                value={form.password}
                onChangeText={(password) => setForm((c) => ({ ...c, password }))}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry
                placeholder="Minimum 8 characters"
                placeholderTextColor="#94A3B8"
                style={[inputStyle('password'), { color: theme.text }]}
              />

              {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
              {success ? <ThemedText style={styles.successMessage}>{success}</ThemedText> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.button,
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
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.four,
    gap: Spacing.one,
    // Shadow for iOS
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 3,
  },
  label: {
    color: '#0F172A',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
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
  button: {
    backgroundColor: Navy.primary,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  buttonPressed: {
    backgroundColor: Navy.secondary,
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
});
