import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useTransactions } from "../../context/TransactionContext";
import TransactionCard from "../../components/TransactionCard";
import Colors from "../../constants/Colors";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export default function IncomeScreen() {
  const { user } = useAuth();
  const { loading, filterTransactions, getTransactions } = useTransactions();
  const initialLoadDone = useRef(false);

  const incomes = filterTransactions("income");

  useFocusEffect(
    useCallback(() => {
      if (user && !initialLoadDone.current) {
        console.log("IncomeScreen - initial load");
        getTransactions();
        initialLoadDone.current = true;
      }
    }, [])
  );

  const handleViewTransaction = (id: string) => {
    router.push(`/transaction-details/${id}`);
  };

  const handleAddIncome = () => {
    router.push("/modal");
  };

  if (loading && incomes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Przychody</Text>

      {incomes.length > 0 ? (
        <FlatList
          data={incomes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={() => handleViewTransaction(item.id)}
            />
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak przychodów</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddIncome}>
            <Text style={styles.addButtonText}>Dodaj przychód</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleAddIncome}>
        <Ionicons name="add" size={24} color="white" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
