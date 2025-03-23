import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";

export default function DocumentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dokumenty</Text>
      <Text style={styles.subtitle}>
        Ta funkcjonalność pozwoli na skanowanie i przechowywanie dokumentów.
      </Text>

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
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
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
