import { Ionicons } from '@expo/vector-icons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Navy } from '@/constants/theme';

/**
 * AppTabs — bottom tab navigation for the authenticated app.
 *
 * NativeTabs.Trigger.Icon accepts a `src` image prop for static PNG icons.
 * Since we don't have PNG tab icons, we skip the Icon sub-component and rely
 * on NativeTabs default styling — the active/inactive label colour is enough.
 *
 * NOTE: If NativeTabs.Trigger.Icon later supports React children, pass
 * an <Ionicons> element here directly.
 */

const TABS = [
  { name: 'index',     label: 'Home'      },
  { name: 'academics', label: 'Academics' },
  { name: 'schedule',  label: 'Schedule'  },
  { name: 'events',    label: 'Events'    },
  { name: 'profile',   label: 'Profile'   },
] as const;

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor="#FFFFFF"
      indicatorColor={Navy.primary}
      labelStyle={{ selected: { color: Navy.primary } }}>

      {TABS.map(({ name, label }) => (
        <NativeTabs.Trigger key={name} name={name}>
          <NativeTabs.Trigger.Label>{label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
