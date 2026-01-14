import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import axios from 'axios';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../constants/Api';

// Components
import TransactionRow from '../../components/TransactionRow';
import CategoryModal from '../../components/CategoryModal';

export default function Dashboard() {
  const router = useRouter();
  const { session, logout } = useAuth();
  const API_URL = API_BASE_URL || 'http://localhost:5000';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>({
    balance: 0,
    recentTransactions: []
  });

  // Recategorization State
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null); // The txn we are fixing
  const [allCategories, setAllCategories] = useState([]);

  // Fetch Data
  const fetchDashboardData = async () => {
    if (!session?.user) return;
    try {
      const res = await axios.get(`${API_URL}/api/transactions/dashboard?user_id=${session.user.id}`);
      setDashboardData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Categories (Pre-load for the picker)
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/categories/list?user_id=${session?.user?.id}`);
      setAllCategories(res.data);
    } catch (e) { }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      fetchCategories();
    }, [])
  );

  // --- ACTIONS ---

  // 1. Handle Hide/Delete
  const handleDelete = async (id) => {
    // Optimistic Update
    const oldData = dashboardData;
    setDashboardData({
      ...dashboardData,
      recentTransactions: dashboardData.recentTransactions.filter((t: any) => t.id !== id)
    });

    try {
      await axios.delete(`${API_URL}/api/transactions/delete/${id}?user_id=${session?.user?.id}`);
    } catch (error) {
      setDashboardData(oldData); // Revert
      Alert.alert("Error", "Could not delete");
    }
  };

  // 2. Handle Split Bill
  const handleSplit = (item) => {
    Alert.alert("Split Bill", `Splitting ₦${item.amount} feature coming soon!`);
  };

  // 3. Handle Recategorize Swipe
  const handleRecategorizeSwipe = (item) => {
    setSelectedTxn(item); // Remember which transaction we are fixing
    setShowCategoryPicker(true); // Open the picker
  };

  // 4. Handle Actual Category Selection
  const handleCategorySelect = async (newCategory) => {
    if (!selectedTxn) return;

    // Optimistic Update
    const updatedTxns = dashboardData.recentTransactions.map((t: any) => {
      if (t.id === selectedTxn.id) {
        return { ...t, category: newCategory, category_id: newCategory.id };
      }
      return t;
    });
    setDashboardData({ ...dashboardData, recentTransactions: updatedTxns });

    try {
      // We need a backend endpoint to update just the category.
      // For now, let's assume we use a generic 'update' or just 'add' route with an ID?
      // Actually, let's create a quick 'update' endpoint logic in our heads or just standard POST.
      // Quick Fix: We need an update endpoint.
      await axios.put(`${API_URL}/api/transactions/update/${selectedTxn.id}`, {
        category_id: newCategory.id,
        user_id: session?.user?.id
      });
    } catch (error) {
      console.error("Failed to update category");
      fetchDashboardData(); // Revert by refetching
    }
  };

  return (
    <View style={styles.container}>
      {/* Header & Balance Card (Same as before) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{session?.user?.user_metadata?.full_name || 'Chief'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Total Balance</Text>
        <Text style={styles.balance}>
          {dashboardData.balance.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
        </Text>
      </View>



      {/* THE NEW LIST */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push('/history')}>
          <Text style={{ color: '#10B981' }}>See All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" />
      ) : (
        <FlatList
          data={dashboardData.recentTransactions}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <TransactionRow
              item={item}
              onDelete={handleDelete}
              onSplit={handleSplit}
              onRecategorize={handleRecategorizeSwipe}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity onPress={() => router.push('/addTransaction')} style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* The Category Picker (Hidden until Recategorize is swiped) */}
      <CategoryModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={handleCategorySelect}
        categories={allCategories}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: '#64748b', fontSize: 14 },
  username: { color: '#0f172a', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#ffe4e6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  logoutText: { color: '#e11d48', fontSize: 12, fontWeight: '600' },

  card: { backgroundColor: '#1e293b', padding: 25, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  label: { color: '#94a3b8', fontSize: 14, marginBottom: 5 },
  balance: { color: '#fff', fontSize: 36, fontWeight: 'bold' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },

  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontSize: 30, marginTop: -2, fontWeight: 'bold' }
});