import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { useTransactions } from "../context/TransactionContext";

type SyncIndicatorProps = {
  count: number;
  isOnline: boolean;
};

export default function SyncIndicator({ count, isOnline }: SyncIndicatorProps) {
  const { syncTransactions } = useTransactions();

  const handleSync = () => {
    if (isOnline) {
      syncTransactions();
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons
        name={isOnline ? "cloud-upload-outline" : "cloud-offline-outline"}
        size={18}
        color="white"
      />
      <Text style={styles.text}>
        {isOnline
          ? `${count} ${count === 1 ? "transakcja czeka" : "transakcje czekają"} na synchronizację`
          : "Tryb offline"}
      </Text>

      {isOnline && (
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Text style={styles.syncText}>Synchronizuj</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  text: {
    color: "white",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  syncButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  syncText: {
    color: "white",
    fontSize: 14,
  },
});
