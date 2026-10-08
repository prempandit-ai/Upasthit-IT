import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navy, Spacing } from '@/constants/theme';
import { classifyApiError } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { login, isAuthenticated, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  if (!loading && isAuthenticated) {
    return <Redirect href="/(main)" />;
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      await login(form);
      router.replace('/(main)');
    } catch (err: unknown) {
      setError(classifyApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field: 'email' | 'password') => [
    styles.input,
    { borderColor: focusedField === field ? Navy.focusBorder : theme.backgroundSelected },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}>

          {/* Branding */}
          <ThemedText type="smallBold" style={styles.brand}>
            UPASTHIT
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            Sign In
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Academic portal for students, faculty, HOD, and coordinators.
          </ThemedText>

          {/* Form card */}
          <ThemedView style={styles.formCard}>
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
              style={[styles.input, inputStyle('email'), { color: theme.text }]}
            />

            <ThemedText type="smallBold" style={styles.label}>Password</ThemedText>
            <TextInput
              value={form.password}
              onChangeText={(password) => setForm((c) => ({ ...c, password }))}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
              placeholder="Enter password"
              placeholderTextColor="#94A3B8"
              style={[styles.input, inputStyle('password'), { color: theme.text }]}
            />

            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={Navy.white} />
              ) : (
                <ThemedText style={styles.buttonText}>Sign In</ThemedText>
              )}
            </Pressable>
          </ThemedView>

          <ThemedText style={styles.footer}>
            Student account?{' '}
            <Link href="/register">
              <ThemedText type="linkPrimary">Register here</ThemedText>
            </Link>
          </ThemedText>
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
  content: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
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
