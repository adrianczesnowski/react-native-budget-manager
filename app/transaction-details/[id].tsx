import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTransactions, Transaction } from "../../context/TransactionContext";
import Colors from "../../constants/Colors";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTransactionById } = useTransactions();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransaction = async () => {
      if (id) {
        setLoading(true);
        const data = await getTransactionById(id);
        setTransaction(data);
        setLoading(false);
      }
    };

    loadTransaction();
  }, [id]);

  const getCategoryName = (categoryId: string) => {
    switch (categoryId) {
      case "groceries":
        return "Zakupy spożywcze";
      case "dining":
        return "Restauracje";
      case "transport":
        return "Transport";
      case "utilities":
        return "Rachunki";
      case "entertainment":
        return "Rozrywka";
      case "health":
        return "Zdrowie";
      case "shopping":
        return "Zakupy";
      case "salary":
        return "Wynagrodzenie";
      case "investment":
        return "Inwestycje";
      case "gift":
        return "Prezent";
      case "other_expense":
        return "Inne wydatki";
      case "other_income":
        return "Inne przychody";
      default:
        return "Inne";
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case "groceries":
        return "cart";
      case "dining":
        return "restaurant";
      case "transport":
        return "car";
      case "utilities":
        return "flash";
      case "entertainment":
        return "film";
      case "health":
        return "medical";
      case "shopping":
        return "bag";
      case "salary":
        return "cash";
      case "investment":
        return "trending-up";
      case "gift":
        return "gift";
      default:
        return "ellipsis-horizontal";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.red} />
        <Text style={styles.errorText}>Nie znaleziono transakcji</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Wróć</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate = new Date(transaction.date).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.row}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    transaction.type === "income" ? Colors.green : Colors.red,
                },
              ]}
            >
              <Ionicons
                name={getCategoryIcon(transaction.category)}
                size={24}
                color="white"
              />
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.type}>
                {transaction.type === "income" ? "Przychód" : "Wydatek"}
              </Text>
              <Text style={styles.category}>
                {getCategoryName(transaction.category)}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.amount,
              {
                color:
                  transaction.type === "income" ? Colors.green : Colors.red,
              },
            ]}
          >
            {transaction.type === "income" ? "+" : "-"}{" "}
            {transaction.amount.toFixed(2)} zł
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Data</Text>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>

          {transaction.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Opis</Text>
              <Text style={styles.detailValue}>{transaction.description}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusContainer}>
              {transaction.synced ? (
                <>
                  <Ionicons
                    name="cloud-done-outline"
                    size={16}
                    color={Colors.green}
                  />
                  <Text style={[styles.detailValue, { color: Colors.green }]}>
                    Synchronizowano
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={16}
                    color={Colors.gray}
                  />
                  <Text style={[styles.detailValue, { color: Colors.gray }]}>
                    Oczekuje na synchronizację
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Wróć</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContainer: {
    justifyContent: "center",
  },
  type: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  category: {
    fontSize: 18,
    fontWeight: "bold",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 40,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
