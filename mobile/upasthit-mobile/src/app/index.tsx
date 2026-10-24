import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navy } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function IndexScreen() {
  const { isAuthenticated, loading, bootstrapError, retryBootstrap } = useAuth();

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={Navy.primary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            Loading UPASTHIT...
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (bootstrapError) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ThemedText type="subtitle">Unable to validate your session</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
            {bootstrapError}
          </ThemedText>
          <Pressable onPress={retryBootstrap} style={styles.retryButton} accessibilityRole="button">
            <ThemedText type="smallBold" style={styles.retryLabel}>Retry</ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(main)" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: {
    marginTop: 8,
  },
  message: {
    marginHorizontal: 28,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    minWidth: 132,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: Navy.primary,
  },
  retryLabel: {
    color: '#FFFFFF',
  },
});
