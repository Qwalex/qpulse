import { MarketType } from '@qpulse/shared';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { create } from 'zustand';

import {
  getNotificationsEnabled,
  setNotificationsEnabledPreference,
} from '@/lib/notificationPreferences';
import { syncPushRegistration } from '@/lib/pushRegistration';
import { darkColors, lightColors, type ThemeColors } from '@/constants/theme';



const DARK_MODE_KEY = 'qpulse_dark_mode';

interface AppState {
  expandedSignalIds: Set<string>;
  resultsMarket: MarketType;
  isDarkMode: boolean;
  colors: ThemeColors;
  hydrated: boolean;
  notificationsEnabled: boolean;
  notificationsHydrated: boolean;
  toggleExpanded: (id: string) => void;
  setResultsMarket: (market: MarketType) => void;
  toggleDarkMode: () => Promise<void>;
  hydrateTheme: () => Promise<void>;
  hydrateNotifications: () => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
}



export const useAppStore = create<AppState>((set, get) => ({

  expandedSignalIds: new Set<string>(),

  resultsMarket: MarketType.FUTURES,

  isDarkMode: true,

  colors: darkColors,

  hydrated: false,
  notificationsEnabled: true,
  notificationsHydrated: false,

  toggleExpanded: (id) =>

    set((state) => {

      const next = new Set(state.expandedSignalIds);

      if (next.has(id)) {

        next.delete(id);

      } else {

        next.add(id);

      }

      return { expandedSignalIds: next };

    }),

  setResultsMarket: (market) => set({ resultsMarket: market }),

  toggleDarkMode: async () => {

    const next = !get().isDarkMode;

    await AsyncStorage.setItem(DARK_MODE_KEY, next ? '1' : '0');

    set({

      isDarkMode: next,

      colors: next ? darkColors : lightColors,

    });

  },

  hydrateTheme: async () => {
    const stored = await AsyncStorage.getItem(DARK_MODE_KEY);
    const isDarkMode = stored === null ? true : stored === '1';
    set({
      isDarkMode,
      colors: isDarkMode ? darkColors : lightColors,
      hydrated: true,
    });
  },

  hydrateNotifications: async () => {
    const enabled = await getNotificationsEnabled();
    set({ notificationsEnabled: enabled, notificationsHydrated: true });
  },

  setNotificationsEnabled: async (enabled) => {
    await setNotificationsEnabledPreference(enabled);
    set({ notificationsEnabled: enabled });
    return syncPushRegistration();
  },
}));

