import { Tabs } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '@/store/useAppStore';



export default function TabsLayout() {

  const themeColors = useAppStore((s) => s.colors);



  return (

    <Tabs

      screenOptions={{

        headerStyle: { backgroundColor: themeColors.background },

        headerTintColor: themeColors.text,

        tabBarStyle: {

          backgroundColor: themeColors.card,

          borderTopColor: themeColors.cardBorder,

        },

        tabBarActiveTintColor: themeColors.accent,

        tabBarInactiveTintColor: themeColors.textMuted,

      }}

    >

      <Tabs.Screen

        name="index"

        options={{

          title: 'Home',

          tabBarIcon: ({ color, size }) => (

            <Ionicons name="home-outline" size={size} color={color} />

          ),

        }}

      />

      <Tabs.Screen

        name="spots"

        options={{

          title: 'Spots',

          tabBarIcon: ({ color, size }) => (

            <Ionicons name="pulse-outline" size={size} color={color} />

          ),

        }}

      />

      <Tabs.Screen

        name="futures"

        options={{

          title: 'Futures',

          tabBarIcon: ({ color, size }) => (

            <Ionicons name="trending-up-outline" size={size} color={color} />

          ),

        }}

      />

      <Tabs.Screen

        name="more"

        options={{

          title: 'More',

          tabBarIcon: ({ color, size }) => (

            <Ionicons name="menu-outline" size={size} color={color} />

          ),

        }}

      />

    </Tabs>

  );

}


