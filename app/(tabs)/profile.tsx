import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { firestore, auth } from "@/utils/firebase";
import { deleteUser } from "firebase/auth";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Usuń konto",
      "Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna i spowoduje usunięcie wszystkich danych.",
      [
        {
          text: "Anuluj",
          style: "cancel",
        },
        {
          text: "Usuń konto",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);

              Alert.alert(
                "Potwierdź usunięcie",
                "Ta operacja spowoduje trwałe usunięcie wszystkich Twoich danych. Czy na pewno chcesz kontynuować?",
                [
                  {
                    text: "Anuluj",
                    style: "cancel",
                    onPress: () => setIsDeleting(false),
                  },
                  {
                    text: "Tak, usuń konto",
                    style: "destructive",
                    onPress: async () => {
                      await deleteAccountData();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("Błąd usuwania konta:", error);
              Alert.alert(
                "Błąd",
                "Nie udało się usunąć konta. Spróbuj ponownie później."
              );
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const deleteAccountData = async () => {
    try {
      if (!user) return;

      await deleteUserTransactions(user.uid);

      await deleteDoc(doc(firestore, "users", user.uid));

      await clearLocalStorage();

      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteUser(currentUser);
      }

      router.replace("/login");

      Alert.alert("Sukces", "Twoje konto zostało usunięte.");
    } catch (error) {
      console.error("Błąd podczas usuwania konta:", error);
      Alert.alert(
        "Błąd",
        "Wystąpił problem podczas usuwania konta. Spróbuj ponownie później."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteUserTransactions = async (userId: string) => {
    const transactionsRef = collection(
      firestore,
      "users",
      userId,
      "transactions"
    );
    const transactionsSnapshot = await getDocs(transactionsRef);

    const batch = writeBatch(firestore);

    transactionsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  };

  const clearLocalStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();

      const appKeys = keys.filter(
        (key) =>
          key.startsWith("transactions") ||
          key.startsWith("pending_transaction_") ||
          key === "user"
      );

      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error("Error clearing AsyncStorage:", error);
      throw error;
    }
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
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
        disabled={isDeleting}
      >
        <Ionicons
          name="trash-outline"
          size={24}
          color="white"
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutText}>
          {isDeleting ? "Usuwanie..." : "Usuń konto"}
        </Text>
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
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: "#CC0000",
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
