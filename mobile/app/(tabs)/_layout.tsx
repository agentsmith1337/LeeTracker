import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Revisions",
          headerTitle: "LeeTrack",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "checklist",
                android: "checklist",
                web: "checklist",
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="lectures"
        options={{
          title: "Lectures",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "play.rectangle",
                android: "play_arrow",
                web: "play_arrow",
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}