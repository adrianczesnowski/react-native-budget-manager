import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>

      <View style={styles.comingSoonContainer}>
        <Ionicons name="document-text-outline" size={80} color={Colors.gray} />
        <Text style={styles.comingSoonText}>Wkrótce</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoonText: {
    marginTop: 16,
    fontSize: 20,
    color: Colors.gray,
    fontWeight: "bold",
  },
});
