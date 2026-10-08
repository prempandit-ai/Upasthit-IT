import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Navy, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

interface StudentHeaderProps {
  unreadCount?: number;
  onNotificationPress?: () => void;
}

export default function StudentHeader({
  unreadCount = 2,
  onNotificationPress,
}: StudentHeaderProps) {
  const { user } = useAuth();

  const handleNotification = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/(main)/notifications' as any);
    }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'S';

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <ThemedText style={styles.brand}>UPASTHIT</ThemedText>
        <ThemedText style={styles.greeting}>Welcome back,</ThemedText>
        <ThemedText style={styles.name}>{user?.name || 'Student'}</ThemedText>
        <View style={styles.metaRow}>
          <ThemedText style={styles.metaBadge}>
            {user?.profile?.departmentName || user?.profile?.departmentCode || 'B.Tech IT'}
          </ThemedText>
          <ThemedText style={styles.metaText}>
            {user?.profile?.year ? `${user.profile.year} ` : ''}Semester {user?.profile?.semester ?? 6}{user?.profile?.division ? ` • Div ${user.profile.division}` : ''}
          </ThemedText>
        </View>
      </View>

      <View style={styles.right}>
        {/* Notification Bell */}
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={handleNotification}>
          <Ionicons name="notifications-outline" size={22} color={Navy.primary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </ThemedText>
            </View>
          )}
        </Pressable>

        {/* Avatar */}
        <Pressable
          style={styles.avatarRing}
          onPress={() => router.push('/(main)/profile' as any)}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{initial}</ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  left: {
    flex: 1,
  },
  brand: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Navy.primary,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Navy.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
