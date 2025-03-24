import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert("Wylogowanie", "Czy na pewno chcesz się wylogować?", [
      {
        text: "Anuluj",
        style: "cancel",
      },
      {
        text: "Wyloguj",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/login");
          } catch (error) {
            console.error("Błąd wylogowania:", error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={64} color="white" />
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.optionsSection}>
        <TouchableOpacity style={styles.option}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color="#555"
            style={styles.optionIcon}
          />
          <Text style={styles.optionText}>Powiadomienia</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Ionicons
            name="settings-outline"
            size={24}
            color="#555"
            style={styles.optionIcon}
          />
          <Text style={styles.optionText}>Ustawienia</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Ionicons
            name="help-circle-outline"
            size={24}
            color="#555"
            style={styles.optionIcon}
          />
          <Text style={styles.optionText}>Pomoc</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons
          name="log-out-outline"
          size={24}
          color="white"
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutText}>Wyloguj</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  profileSection: {
    alignItems: "center",
    marginVertical: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  email: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  optionsSection: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionIcon: {
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  logoutButton: {
    backgroundColor: Colors.red,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
