import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navy } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

// ── Tab icon map ──────────────────────────────────────────────────────────────

type IoniconsName = keyof typeof Ionicons.glyphMap;

const TAB_ICON: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  index:     { active: 'home',          inactive: 'home-outline'          },
  academics: { active: 'book',          inactive: 'book-outline'          },
  schedule:  { active: 'calendar',      inactive: 'calendar-outline'      },
  events:    { active: 'star',          inactive: 'star-outline'          },
  profile:   { active: 'person-circle', inactive: 'person-circle-outline' },
};

// ── Layout ────────────────────────────────────────────────────────────────────

export default function MainLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={Navy.primary} />
          <ThemedText type="small" themeColor="textSecondary">
            Restoring session…
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Navy.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICON[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={size ?? 22}
              color={color}
            />
          );
        },
      })}>
      <Tabs.Screen name="index"         options={{ title: 'Home'      }} />
      <Tabs.Screen name="academics"     options={{ title: 'Academics' }} />
      <Tabs.Screen name="schedule"      options={{ title: 'Schedule'  }} />
      <Tabs.Screen name="events"        options={{ title: 'Events'    }} />
      <Tabs.Screen name="profile"       options={{ title: 'Profile'   }} />
      <Tabs.Screen name="notifications" options={{ href: null         }} />
      <Tabs.Screen name="requests"      options={{ href: null         }} />
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
    // iOS shadow
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
