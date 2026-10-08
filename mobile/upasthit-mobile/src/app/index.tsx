import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navy } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function IndexScreen() {
  const { isAuthenticated, loading } = useAuth();

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
});
