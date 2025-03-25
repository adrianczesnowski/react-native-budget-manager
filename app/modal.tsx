import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTransactions } from "../context/TransactionContext";
import Colors from "../constants/Colors";

const categories = [
  { id: "groceries", name: "Zakupy spożywcze", icon: "cart", isExpense: true },
  { id: "dining", name: "Restauracje", icon: "restaurant", isExpense: true },
  { id: "transport", name: "Transport", icon: "car", isExpense: true },
  { id: "utilities", name: "Rachunki", icon: "flash", isExpense: true },
  { id: "entertainment", name: "Rozrywka", icon: "film", isExpense: true },
  { id: "health", name: "Zdrowie", icon: "medical", isExpense: true },
  { id: "shopping", name: "Zakupy", icon: "bag", isExpense: true },
  {
    id: "other_expense",
    name: "Inne",
    icon: "ellipsis-horizontal",
    isExpense: true,
  },
  { id: "salary", name: "Wynagrodzenie", icon: "cash", isExpense: false },
  { id: "gift", name: "Prezent", icon: "gift", isExpense: false },
  {
    id: "investment",
    name: "Inwestycje",
    icon: "trending-up",
    isExpense: false,
  },
  {
    id: "other_income",
    name: "Inne",
    icon: "ellipsis-horizontal",
    isExpense: false,
  },
];

export default function TransactionModal() {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const { addTransaction, getTransactions } = useTransactions();

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Podaj prawidłową kwotę";
    }

    if (!category) {
      newErrors.category = "Wybierz kategorię";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true); 
    
    try {
      await addTransaction({
        type,
        amount: Number(amount),
        category,
        description,
        date: new Date().toISOString(),
      });

      await getTransactions();
      
      router.back();
    } catch (error) {
      console.error("Error adding transaction:", error);
      Alert.alert("Błąd", "Nie udało się dodać transakcji. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const filteredCategories = categories.filter((cat) =>
    type === "expense" ? cat.isExpense : !cat.isExpense
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Dodaj transakcję</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "expense" && styles.activeTypeButton,
            ]}
            onPress={() => setType("expense")}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === "expense" && styles.activeTypeButtonText,
              ]}
            >
              Wydatek
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "income" && styles.activeTypeButton,
            ]}
            onPress={() => setType("income")}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === "income" && styles.activeTypeButtonText,
              ]}
            >
              Przychód
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Kwota</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0,00"
          />
          {errors.amount && (
            <Text style={styles.errorText}>{errors.amount}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Kategoria</Text>
          <View style={styles.categoriesContainer}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  category === cat.id && styles.selectedCategory,
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={category === cat.id ? "white" : "#555"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.id && styles.selectedCategoryText,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Opis (opcjonalnie)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Wprowadź opis"
            multiline
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Zapisz transakcję</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  typeSelector: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTypeButton: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    color: "#333",
  },
  activeTypeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: Colors.red,
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    margin: 4,
  },
  selectedCategory: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#555",
  },
  selectedCategoryText: {
    color: "white",
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
