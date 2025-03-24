import { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { firestore } from "../utils/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { useNetwork } from "./NetworkContext";

export type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  synced: boolean;
  createdAt: number;
};

type TransactionContextType = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  pendingSyncCount: number;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "synced" | "createdAt">
  ) => Promise<void>;
  getTransactionById: (id: string) => Promise<Transaction | null>;
  getTransactions: () => Promise<void>;
  syncTransactions: () => Promise<void>;
  filterTransactions: (type?: "income" | "expense") => Transaction[];
};

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined
);

export function TransactionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const { user } = useAuth();
  const { isConnected } = useNetwork();

  useEffect(() => {
    if (user) {
      getTransactions();
      countPendingSync();
    }
  }, [user]);

  useEffect(() => {
    if (isConnected && pendingSyncCount > 0) {
      syncTransactions();
    }
  }, [isConnected, pendingSyncCount]);

  const countPendingSync = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pendingKeys = keys.filter((key) =>
        key.startsWith("pending_transaction_")
      );
      setPendingSyncCount(pendingKeys.length);
    } catch (error) {
      console.error("Error counting pending syncs:", error);
    }
  };

  const getTransactions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const localTransactions = await getLocalTransactions();

      if (isConnected) {
        const q = query(
          collection(firestore, "users", user.uid, "transactions"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const cloudTransactions = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              synced: true,
            }) as Transaction
        );

        const pendingIds = localTransactions
          .filter((t) => !t.synced)
          .map((t) => t.id);

        const mergedTransactions = [
          ...localTransactions.filter((t) => !t.synced),
          ...cloudTransactions.filter((t) => !pendingIds.includes(t.id)),
        ];

        setTransactions(mergedTransactions);

        await AsyncStorage.setItem(
          "transactions",
          JSON.stringify(mergedTransactions)
        );
      } else {
        setTransactions(localTransactions);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getLocalTransactions = async (): Promise<Transaction[]> => {
    try {
      const transactionsJson = await AsyncStorage.getItem("transactions");
      if (transactionsJson) {
        return JSON.parse(transactionsJson);
      }
      return [];
    } catch (error) {
      console.error("Error getting local transactions:", error);
      return [];
    }
  };

  const getTransactionById = async (
    id: string
  ): Promise<Transaction | null> => {
    try {
      const localTransactions = await getLocalTransactions();
      const localTransaction = localTransactions.find((t) => t.id === id);

      if (localTransaction) {
        return localTransaction;
      }

      if (user && isConnected) {
        const docRef = doc(firestore, "users", user.uid, "transactions", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data(),
            synced: true,
          } as Transaction;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting transaction by ID:", error);
      return null;
    }
  };

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "synced" | "createdAt">
  ) => {
    if (!user) return;

    try {
      const newTransaction: Transaction = {
        ...transaction,
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        synced: false,
        createdAt: Date.now(),
      };

      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      await AsyncStorage.setItem(
        "transactions",
        JSON.stringify(updatedTransactions)
      );

      await AsyncStorage.setItem(
        `pending_transaction_${newTransaction.id}`,
        JSON.stringify(newTransaction)
      );

      setPendingSyncCount((prev) => prev + 1);

      if (isConnected) {
        await syncTransaction(newTransaction);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const syncTransaction = async (transaction: Transaction) => {
    if (!user || !isConnected) return;

    try {
      await addDoc(collection(firestore, "users", user.uid, "transactions"), {
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        createdAt: transaction.createdAt,
        synced: true,
      });

      const updatedTransactions = transactions.map((t) =>
        t.id === transaction.id ? { ...t, synced: true } : t
      );

      setTransactions(updatedTransactions);
      await AsyncStorage.setItem(
        "transactions",
        JSON.stringify(updatedTransactions)
      );

      await AsyncStorage.removeItem(`pending_transaction_${transaction.id}`);
      setPendingSyncCount((prev) => prev - 1);
    } catch (error) {
      console.error("Error syncing transaction:", error);
    }
  };

  const syncTransactions = async () => {
    if (!user || !isConnected) return;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const pendingKeys = keys.filter((key) =>
        key.startsWith("pending_transaction_")
      );

      for (const key of pendingKeys) {
        const transactionJson = await AsyncStorage.getItem(key);
        if (transactionJson) {
          const transaction = JSON.parse(transactionJson) as Transaction;
          await syncTransaction(transaction);
        }
      }

      await getTransactions();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const filterTransactions = (type?: "income" | "expense"): Transaction[] => {
    if (!type) return transactions;
    return transactions.filter((t) => t.type === type);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        error,
        pendingSyncCount,
        addTransaction,
        getTransactionById,
        getTransactions,
        syncTransactions,
        filterTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error(
      "useTransactions must be used within a TransactionProvider"
    );
  }
  return context;
}
