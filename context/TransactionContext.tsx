import { createContext, useContext, useState, useEffect, useRef } from "react";
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
  const isSyncing = useRef(false);
  const lastFetchTimestamp = useRef<number | null>(null);

  const { user } = useAuth();
  const { isConnected, addConnectivityListener } = useNetwork();

  useEffect(() => {
    if (user) {
      getTransactions();
      countPendingSync();
    }
  }, [user]);

  useEffect(() => {
    if (isConnected && pendingSyncCount > 0 && !isSyncing.current) {
      syncTransactions();
    }
  }, [isConnected, pendingSyncCount]);

  useEffect(() => {
    if (user) {
      const removeListener = addConnectivityListener(() => {
        console.log("Network connection restored - triggering sync");
        syncTransactions();
      });
      
      return () => removeListener();
    }
  }, [user, addConnectivityListener]);

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

  const saveLocalTransactions = async (transactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem("transactions", JSON.stringify(transactions));
    } catch (error) {
      console.error("Error saving local transactions:", error);
    }
  };

  const getTransactions = async () => {
    if (!user) return;

    const now = Date.now();
    if (lastFetchTimestamp.current && now - lastFetchTimestamp.current < 1000) {
      console.log("Skipping fetch - too soon after last fetch");
      return;
    }

    lastFetchTimestamp.current = now;
    setLoading(true);

    try {
      console.log("Fetching transactions from Firebase and local storage");

      let cloudTransactions: Transaction[] = [];
      if (isConnected) {
        try {
          const q = query(
            collection(firestore, "users", user.uid, "transactions"),
            orderBy("createdAt", "desc")
          );

          const snapshot = await getDocs(q);
          console.log(`Firestore transactions count: ${snapshot.docs.length}`);

          cloudTransactions = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
                synced: true,
              }) as Transaction
          );
        } catch (error) {
          console.error("Error fetching from Firestore:", error);
        }
      }

      const localStorageTransactions = await getLocalTransactions();

      const keys = await AsyncStorage.getAllKeys();
      const pendingKeys = keys.filter((key) =>
        key.startsWith("pending_transaction_")
      );

      const pendingTransactions: Transaction[] = [];
      for (const key of pendingKeys) {
        try {
          const txData = await AsyncStorage.getItem(key);
          if (txData) {
            pendingTransactions.push(JSON.parse(txData));
          }
        } catch (error) {
          console.error(`Error reading ${key}:`, error);
        }
      }

      console.log(
        `Local transactions: ${localStorageTransactions.length}, Pending: ${pendingTransactions.length}`
      );

      const allTransactions = [...cloudTransactions];

      const cloudIds = new Set(cloudTransactions.map((t) => t.id));
      const cloudSignatures = new Set(
        cloudTransactions.map(
          (t) => `${t.createdAt}_${t.amount}_${t.type}_${t.category}`
        )
      );

      localStorageTransactions
        .filter((t) => t.synced && !cloudIds.has(t.id))
        .forEach((t) => allTransactions.push(t));

      const addedLocalIds = new Set<string>();

      pendingTransactions.forEach((t) => {
        const signature = `${t.createdAt}_${t.amount}_${t.type}_${t.category}`;
        if (!cloudSignatures.has(signature) && !addedLocalIds.has(t.id)) {
          allTransactions.push(t);
          cloudSignatures.add(signature); 
          addedLocalIds.add(t.id);
        }
      });

      const sortedTransactions = allTransactions.sort(
        (a, b) => b.createdAt - a.createdAt
      );

      console.log(`Final transactions count: ${sortedTransactions.length}`);

      await saveLocalTransactions(sortedTransactions);
      setTransactions(sortedTransactions);
    } catch (error: any) {
      console.error("Error getting transactions:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionById = async (
    id: string
  ): Promise<Transaction | null> => {
    try {
      const inMemoryTransaction = transactions.find((t) => t.id === id);
      if (inMemoryTransaction) {
        return inMemoryTransaction;
      }

      const localTransactions = await getLocalTransactions();
      const localTransaction = localTransactions.find((t) => t.id === id);
      if (localTransaction) {
        return localTransaction;
      }

      const pendingTxJson = await AsyncStorage.getItem(
        `pending_transaction_${id}`
      );
      if (pendingTxJson) {
        return JSON.parse(pendingTxJson);
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
  ): Promise<void> => {
    if (!user) return;

    try {
      const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newTransaction: Transaction = {
        ...transaction,
        id: localId,
        synced: false,
        createdAt: Date.now(),
      };

      console.log(
        `Adding new ${transaction.type} transaction: ${transaction.amount} zł`
      );

      if (transaction.type === "income") {
        console.log("Checking for duplicate income transaction before adding");
        const similarTransactions = transactions.filter(
          (t) =>
            t.type === transaction.type &&
            t.amount === transaction.amount &&
            t.category === transaction.category &&
            Math.abs(Date.now() - t.createdAt) < 5000
        );

        if (similarTransactions.length > 0) {
          console.log("Prevented duplicate income transaction");
          return;
        }
      }

      await AsyncStorage.setItem(
        `pending_transaction_${localId}`,
        JSON.stringify(newTransaction)
      );

      setPendingSyncCount((prev) => prev + 1);

      const localTransactions = await getLocalTransactions();
      await saveLocalTransactions([newTransaction, ...localTransactions]);

      setTransactions((current) => [newTransaction, ...current]);

      if (isConnected) {
        setTimeout(() => {
          syncTransaction(newTransaction);
        }, 500);
      }
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      setError(error.message);
    }
  };

  const syncTransaction = async (transaction: Transaction) => {
    if (!user || !isConnected || transaction.synced) return;

    try {
      console.log(
        `Syncing transaction: ${transaction.id}, type: ${transaction.type}`
      );

      const timeWindow = 5000;

      const q = query(
        collection(firestore, "users", user.uid, "transactions"),
        where("type", "==", transaction.type),
        where("amount", "==", transaction.amount),
        where("category", "==", transaction.category)
      );

      const querySnap = await getDocs(q);
      let isDuplicate = false;
      let firebaseId: string | null = null;

      for (const doc of querySnap.docs) {
        const data = doc.data();
        if (Math.abs(data.createdAt - transaction.createdAt) < timeWindow) {
          isDuplicate = true;
          firebaseId = doc.id;
          break;
        }
      }

      if (isDuplicate && firebaseId) {
        console.log(
          `Found duplicate transaction in Firestore with ID: ${firebaseId}`
        );

        const updatedTransaction = {
          ...transaction,
          id: firebaseId,
          synced: true,
        };

        setTransactions((current) =>
          current.map((t) => (t.id === transaction.id ? updatedTransaction : t))
        );

        const localTransactions = await getLocalTransactions();
        await saveLocalTransactions(
          localTransactions.map((t) =>
            t.id === transaction.id ? updatedTransaction : t
          )
        );

        await AsyncStorage.removeItem(`pending_transaction_${transaction.id}`);
        setPendingSyncCount((prev) => prev - 1);

        return;
      }

      if (transaction.type === "income") {
        console.log("Running additional income duplicate check");

        const recentQ = query(
          collection(firestore, "users", user.uid, "transactions"),
          where("type", "==", "income")
        );

        const recentSnap = await getDocs(recentQ);

        for (const doc of recentSnap.docs) {
          const data = doc.data();
          if (
            data.amount === transaction.amount &&
            data.category === transaction.category &&
            Math.abs(data.createdAt - transaction.createdAt) < 60000
          ) {
            console.log("Found similar recent income - preventing duplicate");

            const updatedTransaction = {
              ...transaction,
              id: doc.id, 
              synced: true,
            };

            setTransactions((current) =>
              current.map((t) =>
                t.id === transaction.id ? updatedTransaction : t
              )
            );

            const localTransactions = await getLocalTransactions();
            await saveLocalTransactions(
              localTransactions.map((t) =>
                t.id === transaction.id ? updatedTransaction : t
              )
            );

            await AsyncStorage.removeItem(
              `pending_transaction_${transaction.id}`
            );
            setPendingSyncCount((prev) => prev - 1);

            return;
          }
        }
      }

      console.log("No duplicates found, adding to Firestore");
      const docRef = await addDoc(
        collection(firestore, "users", user.uid, "transactions"),
        {
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          createdAt: transaction.createdAt,
        }
      );

      console.log(`Transaction synced with Firebase ID: ${docRef.id}`);

      const syncedTransaction = {
        ...transaction,
        id: docRef.id,
        synced: true,
      };

      setTransactions((current) =>
        current.map((t) => (t.id === transaction.id ? syncedTransaction : t))
      );

      const localTransactions = await getLocalTransactions();
      await saveLocalTransactions(
        localTransactions.map((t) =>
          t.id === transaction.id ? syncedTransaction : t
        )
      );

      await AsyncStorage.removeItem(`pending_transaction_${transaction.id}`);
      setPendingSyncCount((prev) => prev - 1);
    } catch (error) {
      console.error(`Error syncing transaction ${transaction.id}:`, error);
    }
  };
  const syncTransactions = async () => {
    if (!user || !isConnected || isSyncing.current) return;

    isSyncing.current = true;
    console.log("Starting batch transaction sync");

    try {
      const keys = await AsyncStorage.getAllKeys();
      const pendingKeys = keys.filter((key) =>
        key.startsWith("pending_transaction_")
      );

      for (const key of pendingKeys) {
        try {
          const txJson = await AsyncStorage.getItem(key);
          if (txJson) {
            const transaction = JSON.parse(txJson);
            await syncTransaction(transaction);
          }
        } catch (error) {
          console.error(`Error syncing from ${key}:`, error);
        }
      }

      await getTransactions();
    } catch (error) {
      console.error("Error during batch sync:", error);
    } finally {
      isSyncing.current = false;
    }
  };

  const filterTransactions = (type?: "income" | "expense"): Transaction[] => {
    if (!type) return transactions;
    const filtered = transactions.filter((t) => t.type === type);
    console.log(
      `Filtering for ${type}: found ${filtered.length} of ${transactions.length} total`
    );
    return filtered;
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
