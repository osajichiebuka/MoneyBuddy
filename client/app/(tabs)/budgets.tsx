import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../constants/Api';
import CategoryModal from '../../components/CategoryModal';

export default function BudgetsTab() {
  const { session } = useAuth();
  const API_URL = API_BASE_URL || 'http://localhost:5000';

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailySafeLimit, setDailySafeLimit] = useState(0); // For Sapa Meter
  const [sapaLevel, setSapaLevel] = useState('Green'); // "Green" or "Red" zone

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [newLimit, setNewLimit] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [allCategories, setAllCategories] = useState([]);

  // Fetch Data & Calculate Sapa Meter
  const loadData = async () => {
    try {
      const [budgetRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/api/budgets/list?user_id=${session?.user?.id}`),
        axios.get(`${API_URL}/api/categories/list?user_id=${session?.user?.id}`)
      ]);

      const budgetList = budgetRes.data;
      setBudgets(budgetList);
      setAllCategories(catRes.data);

      // --- 🧮 SAPA METER LOGIC ---
      // 1. Calculate Total Remaining Budget
      const totalLimit = budgetList.reduce((sum, b) => sum + b.limit_amount, 0);
      const totalSpent = budgetList.reduce((sum, b) => sum + b.spent_amount, 0);
      const remainingCash = totalLimit - totalSpent;

      // 2. Calculate Days Remaining in Month
      const date = new Date();
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const daysLeft = Math.max(lastDay.getDate() - date.getDate(), 1); // Avoid divide by zero

      // 3. Result: Safe Daily Spend
      const safeSpend = Math.max(remainingCash / daysLeft, 0);
      setDailySafeLimit(safeSpend);

      // Determine Zone (Arbitrary threshold: < 2000 is Sapa)
      setSapaLevel(safeSpend < 2000 ? 'Red' : 'Green');

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleSaveBudget = async () => {
    if (!selectedCategory || !newLimit) return;
    try {
      await axios.post(`${API_URL}/api/budgets/set`, {
        user_id: session?.user?.id,
        category_id: selectedCategory.id,
        limit_amount: parseFloat(newLimit)
      });
      setShowModal(false);
      setNewLimit('');
      setSelectedCategory(null);
      loadData();
      Alert.alert("Success", "Budget updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to save budget");
    }
  };

  // 4.2 Section 1: Realist Categories [cite: 131]
  const renderBudgetCard = ({ item }) => {
    let color = '#10B981'; // Green
    if (item.percentage > 85) color = '#EF4444'; // Red [cite: 134]
    else if (item.percentage > 50) color = '#F59E0B'; // Yellow

    const width = Math.min(item.percentage, 100);

    return (
      <TouchableOpacity style={styles.card} onPress={() => {
        setSelectedCategory(item.category);
        setNewLimit(item.limit_amount.toString());
        setShowModal(true);
      }}>
        <View style={styles.cardHeader}>
          <View style={styles.iconRow}>
            <Text style={{ fontSize: 22 }}>{item.category.icon}</Text>
            <Text style={styles.categoryName}>{item.category.name}</Text>
          </View>
          {/* The "Pencil" Edit Trigger  */}
          <View style={styles.editBadge}>
            <Text style={styles.limitText}>₦{item.limit_amount.toLocaleString()}</Text>
            <Text style={{ fontSize: 12 }}>✏️</Text>
          </View>
        </View>

        {/* Linear Progress Bar [cite: 133] */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${width}%`, backgroundColor: color }]} />
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.spentText}>Spent: ₦{item.spent_amount.toLocaleString()}</Text>
          <Text style={[styles.percentText, { color: color }]}>{item.percentage.toFixed(0)}%</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      {/* 4.1 THE SAPA METER (Hero Section) [cite: 121] */}
      <View style={[styles.sapaMeter, sapaLevel === 'Red' ? styles.bgRed : styles.bgGreen]}>
        <Text style={styles.meterLabel}>Safe Daily Limit </Text>
        <Text style={styles.meterValue}>
          {dailySafeLimit.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} / day
        </Text>
        <Text style={styles.meterSub}>
          {sapaLevel === 'Green'
            ? "We are cruising. AC is on full blast. ❄️" // [cite: 129]
            : "Turn off the AC. We are driving on reserve. 🥵" // [cite: 130]
          }
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Realist Categories [cite: 131]</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(item: any) => item.id}
          renderItem={renderBudgetCard}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📉</Text>
              <Text style={styles.emptyText}>No budgets set yet.</Text>
              <Text style={styles.emptySub}>Tap the + button to create a "Realist Category" limit!</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footerQuote}>
              <Text style={styles.quoteText}>"Money comes and goes, but Sapa is a choice."</Text>
            </View>
          }
        />
      )}

      {/* Floating Add Button for new Budgets */}
      <TouchableOpacity onPress={() => { setSelectedCategory(null); setNewLimit(''); setShowModal(true); }} style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* CREATE/EDIT MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adjust Budget</Text>

            <TouchableOpacity style={styles.selector} onPress={() => setShowCategoryPicker(true)}>
              <Text style={styles.selectorText}>
                {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : "Select Category"}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Limit Amount (e.g. 50000)"
              keyboardType="numeric"
              value={newLimit}
              onChangeText={setNewLimit}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBudget}>
              <Text style={styles.saveBtnText}>Save Budget</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CategoryModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={(cat) => { setSelectedCategory(cat); setShowCategoryPicker(false); }}
        categories={allCategories}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 50, paddingHorizontal: 20 },

  // Sapa Meter Styles
  sapaMeter: { padding: 25, borderRadius: 20, marginBottom: 25, alignItems: 'center', shadowColor: '#000', elevation: 5 },
  bgGreen: { backgroundColor: '#10B981' },
  bgRed: { backgroundColor: '#EF4444' },
  meterLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  meterValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 5 },
  meterSub: { color: '#fff', fontSize: 14, fontStyle: 'italic' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },

  // Card Styles
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 12, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryName: { fontWeight: '600', fontSize: 16, color: '#334155' },

  editBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 5 },
  limitText: { color: '#334155', fontSize: 14, fontWeight: 'bold' },

  progressTrack: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: '100%', borderRadius: 5 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  spentText: { fontSize: 13, color: '#64748b' },
  percentText: { fontSize: 13, fontWeight: 'bold' },

  // Footer Quote
  footerQuote: { padding: 20, alignItems: 'center', opacity: 0.6 },
  quoteText: { fontStyle: 'italic', color: '#64748b' },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  emptySub: { color: '#94a3b8', marginTop: 5 },

  // FAB
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { color: '#fff', fontSize: 30, marginTop: -3 },

  // Modal (Same as before)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 25, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  selector: { padding: 15, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  selectorText: { fontSize: 16 },
  input: { padding: 15, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
  saveBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 10 },
  cancelBtnText: { color: '#64748b' }
});