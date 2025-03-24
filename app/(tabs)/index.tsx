import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SyncIndicator from "@/components/SyncIndicator";
import TransactionCard from "@/components/TransactionCard";
import { useNetwork } from "@/context/NetworkContext";
import { useTransactions, Transaction } from "@/context/TransactionContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "react-native/Libraries/NewAppScreen";

export default function TabOneScreen() {
  const { user } = useAuth();
  const { transactions, loading, pendingSyncCount, getTransactions } = useTransactions();
  const { isConnected } = useNetwork();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    
    getTransactions();
  }, [user]);

  useEffect(() => {
    if (transactions.length > 0) {
      let income = 0;
      let expense = 0;
      
      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          income += transaction.amount;
        } else {
          expense += transaction.amount;
        }
      });
      
      setTotalIncome(income);
      setTotalExpense(expense);
      
      setRecentTransactions(transactions.slice(0, 5));
    }
  }, [transactions]);

  const handleAddTransaction = () => {
    router.push('/modal');
  };

  const handleViewTransaction = (id: string) => {
    router.push(`/transaction-details/${id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pendingSyncCount > 0 && (
        <SyncIndicator count={pendingSyncCount} isOnline={isConnected} />
      )}
      
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Bilans środków</Text>
        <Text style={styles.balanceAmount}>{(totalIncome - totalExpense).toFixed(2)} zł</Text>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Przychody</Text>
          <Text style={[styles.statAmount, { color: Colors.green }]}>+{totalIncome.toFixed(2)} zł</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Wydatki</Text>
          <Text style={[styles.statAmount, { color: Colors.red }]}>-{totalExpense.toFixed(2)} zł</Text>
        </View>
      </View>
      
      <View style={styles.recentContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ostatnie transakcje</Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => router.push('/(tabs)/income')}
            >
              <Text style={styles.filterButtonText}>Przychody</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => router.push('/(tabs)/expenses')}
            >
              <Text style={styles.filterButtonText}>Wydatki</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {recentTransactions.length > 0 ? (
          <FlatList
            data={recentTransactions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TransactionCard 
                transaction={item} 
                onPress={() => handleViewTransaction(item.id)} 
              />
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Brak transakcji</Text>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddTransaction}
            >
              <Text style={styles.addButtonText}>Dodaj pierwszą transakcję</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddTransaction}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  recentContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rowButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    marginLeft: 8,
  },
  filterButtonText: {
    color: Colors.primary,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
