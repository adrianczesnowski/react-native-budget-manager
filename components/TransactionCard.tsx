import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Transaction } from "../context/TransactionContext";
import Colors from "../constants/Colors";

type TransactionCardProps = {
  transaction: Transaction;
  onPress: () => void;
};

export default function TransactionCard({
  transaction,
  onPress,
}: TransactionCardProps) {
  const { type, amount, category, date, synced } = transaction;

  const getCategoryIcon = () => {
    switch (category) {
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

  const getCategoryName = () => {
    switch (category) {
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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: type === "income" ? Colors.green : Colors.red },
        ]}
      >
        <Ionicons name={getCategoryIcon()} size={24} color="white" />
      </View>

      <View style={styles.details}>
        <Text style={styles.category}>{getCategoryName()}</Text>
        <Text style={styles.date}>{new Date(date).toLocaleDateString()}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            { color: type === "income" ? Colors.green : Colors.red },
          ]}
        >
          {type === "income" ? "+" : "-"} {amount.toFixed(2)} zł
        </Text>

        {!synced && (
          <Ionicons
            name="cloud-upload-outline"
            size={16}
            color={Colors.gray}
            style={styles.syncIcon}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#888",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  syncIcon: {
    marginLeft: 6,
  },
});
