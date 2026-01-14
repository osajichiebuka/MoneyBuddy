import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/Api';
import TransactionRow from '../components/TransactionRow';
import CategoryModal from '../components/CategoryModal';

export default function History() {
    const router = useRouter();
    const { session } = useAuth();
    const API_URL = API_BASE_URL || 'http://localhost:5000';

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Recategorization State
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState<any>(null);
    const [allCategories, setAllCategories] = useState([]);

    // Fetch Data & Categories
    const fetchData = async () => {
        try {
            const [txnRes, catRes] = await Promise.all([
                axios.get(`${API_URL}/api/transactions/dashboard?user_id=${session?.user?.id}`),
                axios.get(`${API_URL}/api/categories/list?user_id=${session?.user?.id}`)
            ]);
            setTransactions(txnRes.data.recentTransactions);
            setAllCategories(catRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    // 1. Handle Delete
    const handleDelete = async (id) => {
        const previousData = [...transactions];
        setTransactions(transactions.filter((t: any) => t.id !== id));
        try {
            await axios.delete(`${API_URL}/api/transactions/delete/${id}?user_id=${session?.user?.id}`);
        } catch (error) {
            Alert.alert("Error", "Could not delete transaction");
            setTransactions(previousData);
        }
    };

    // 2. Handle Split
    const handleSplit = (item) => {
        Alert.alert("Split Bill", "Feature coming soon! 🚧");
    };

    // 3. Recategorize Flow
    const handleRecategorizeSwipe = (item) => {
        setSelectedTxn(item);
        setShowCategoryPicker(true);
    };

    const handleCategorySelect = async (newCategory) => {
        if (!selectedTxn) return;

        // Optimistic Update
        const updatedTxns = transactions.map((t: any) => {
            if (t.id === selectedTxn.id) {
                return { ...t, category: newCategory, category_id: newCategory.id };
            }
            return t;
        });
        setTransactions(updatedTxns as any);

        try {
            await axios.put(`${API_URL}/api/transactions/update/${selectedTxn.id}`, {
                category_id: newCategory.id,
                user_id: session?.user?.id
            });
        } catch (error) {
            console.error("Failed to update category");
            fetchData();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Transactions</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item: any) => item.id}
                    renderItem={({ item }) => (
                        <TransactionRow
                            item={item}
                            onDelete={handleDelete}
                            onSplit={handleSplit}
                            onRecategorize={handleRecategorizeSwipe}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 50 }}
                    ListEmptyComponent={<Text style={styles.empty}>No transactions found.</Text>}
                />
            )}

            {/* Recategorize Modal */}
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
    container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 50, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { padding: 10, marginRight: 10 },
    backText: { fontSize: 16, color: '#64748b' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
    empty: { textAlign: 'center', color: '#94a3b8', marginTop: 50 }
});