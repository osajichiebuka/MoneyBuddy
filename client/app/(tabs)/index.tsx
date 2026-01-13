import { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  SafeAreaView
} from 'react-native';
import axios from 'axios';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../constants/Api';

export default function Dashboard() {
  const router = useRouter();
  const { session, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    balance: 0,
    income: 0,
    expense: 0,
    recentTransactions: []
  });

  const API_URL = API_BASE_URL || 'http://localhost:5000';

  // Function to Fetch Data
  const fetchDashboardData = async () => {
    if (!session?.user) return;

    try {
      // We pass user_id as a query param
      const res = await axios.get(`${API_URL}/api/transactions/dashboard?user_id=${session.user.id}`);
      setDashboardData(res.data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [session])
  );

  // Manual Refresh (Pull to Refresh)
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatMoney = (amount) => {
    return amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.txnItem}>
      <View style={styles.txnLeft}>
        <View style={[styles.iconBox, item.direction === 'INCOME' ? styles.bgGreen : styles.bgRed]}>
          <Text style={styles.iconText}>{item.direction === 'INCOME' ? '↓' : '↑'}</Text>
        </View>
        <View>
          <Text style={styles.txnTitle}>{item.vendor_name || item.description}</Text>
          <Text style={styles.txnDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={[styles.txnAmount, item.direction === 'INCOME' ? styles.textGreen : styles.textRed]}>
        {item.direction === 'INCOME' ? '+' : '-'}{formatMoney(item.amount)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{session?.user?.user_metadata?.full_name || 'Chief'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* BALANCE CARD */}
      <View style={styles.card}>
        <Text style={styles.label}>Total Balance</Text>
        <Text style={styles.balance}>{formatMoney(dashboardData.balance)}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <View style={[styles.dot, styles.bgGreen]} />
            <View>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statValue}>{formatMoney(dashboardData.income)}</Text>
            </View>
          </View>
          <View style={styles.stat}>
            <View style={[styles.dot, styles.bgRed]} />
            <View>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={styles.statValue}>{formatMoney(dashboardData.expense)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* RECENT ACTIVITY */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={dashboardData.recentTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet. Start spending!</Text>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* FAB (Add Button) */}
      <TouchableOpacity
        onPress={() => router.push('/addTransaction')} // Make sure this matches your file name!
        style={styles.fab}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  greeting: { color: '#64748b', fontSize: 14 },
  username: { color: '#0f172a', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#ffe4e6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  logoutText: { color: '#e11d48', fontSize: 12, fontWeight: '600' },

  card: { backgroundColor: '#1e293b', padding: 25, borderRadius: 24, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  label: { color: '#94a3b8', fontSize: 14, marginBottom: 5 },
  balance: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statLabel: { color: '#94a3b8', fontSize: 12 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20 },

  txnItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10 },
  txnLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 18, fontWeight: 'bold' },
  txnTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  txnDate: { fontSize: 12, color: '#94a3b8' },
  txnAmount: { fontSize: 16, fontWeight: 'bold' },

  bgGreen: { backgroundColor: '#dcfce7' },
  bgRed: { backgroundColor: '#fee2e2' },
  textGreen: { color: '#16a34a' },
  textRed: { color: '#dc2626' },

  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontSize: 30, marginTop: -2, fontWeight: 'bold' }
});