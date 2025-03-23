import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import { Pressable } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={20} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="bar-chart" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Dokumenty",
          tabBarIcon: ({ color }) => <TabBarIcon name="file" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
