import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Platform,
    Alert,
    ScrollView,
    LayoutAnimation
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/Api';

export default function AddTransaction() {
    const router = useRouter();
    const { session } = useAuth();
    const API_URL = API_BASE_URL || 'http://localhost:5000';

    // Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('expense');
    const [loading, setLoading] = useState(false);

    // Category State
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);

    // "Other" / Custom Category Logic
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customCategoryName, setCustomCategoryName] = useState('');
    const [isPredicting, setIsPredicting] = useState(false);
    const [isManualCategory, setIsManualCategory] = useState(false); // <--- Re-introduced

    // 1. Fetch Categories
    useEffect(() => {
        if (session?.user) {
            axios.get(`${API_URL}/api/categories/list?user_id=${session.user.id}`)
                .then(res => setCategories(res.data))
                .catch(err => console.error("Failed to load categories", err));
        }
    }, [session]);

    // 2. Auto-Predict Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            // Only predict if we are NOT in custom mode and user hasn't locked in a manual choice
            // Note: We check isManualCategory to see if we should override
            if (description.length > 2 && !isManualCategory && !isCustomMode) {
                setIsPredicting(true);
                try {
                    const res = await axios.post(`${API_URL}/api/categories/predict`, { text: description });
                    if (res.data.category_id) {
                        const match = categories.find((c: any) => c.id === res.data.category_id);
                        if (match) {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSelectedCategory(match);
                        }
                    } else {
                        // NEW: NO MATCH FOUND? Clear the selection!
                        // This fixes the "Toilet Paper stuck on Housing" bug
                        setSelectedCategory(null);
                    }
                } catch (error) {
                    // Quiet fail
                } finally {
                    setIsPredicting(false);
                }
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [description, categories, isManualCategory, isCustomMode]);

    // Handle Text Change (Resets manual lock)
    const handleDescriptionChange = (text: string) => {
        setDescription(text);
        // If user types, we unlock manual mode to allow AI to suggest again
        setIsManualCategory(false);
    };

    // Handle Amount Change with Commas
    const handleAmountChange = (text: string) => {
        // 1. Remove existing commas to get raw value
        const clean = text.replace(/,/g, '');

        // 2. Validate: Allow only numbers and one decimal point
        if (/^\d*\.?\d*$/.test(clean)) {
            const parts = clean.split('.');
            // 3. Add commas to integer part
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            setAmount(parts.join('.'));
        }
    };

    // Handle creating a NEW category (from the "Other" input)
    const handleCreateCustom = async () => {
        if (!customCategoryName) return null;
        try {
            const payload = {
                name: customCategoryName,
                type: 'expense',
                user_id: session?.user?.id,
                icon: '✨'
            };
            const res = await axios.post(`${API_URL}/api/categories/create`, payload);
            if (res.status === 201) {
                const newCat = res.data.data;
                setCategories([...categories, newCat]); // Add to grid
                return newCat.id; // Return ID to save transaction
            }
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const handleSubmit = async () => {
        if (!amount || !description) {
            alert('Please fill in amount and description');
            return;
        }

        setLoading(true);
        try {
            let finalCategoryId = selectedCategory?.id;

            // If they used the "Other" box, create it first
            if (isCustomMode && customCategoryName) {
                finalCategoryId = await handleCreateCustom();
            }

            const payload = {
                user_id: session?.user?.id,
                amount: parseFloat(amount.replace(/,/g, '')), // Strip commas before sending
                type,
                description,
                category_id: finalCategoryId || null, // If null, it goes to "Uncategorized" bucket
                date: new Date().toISOString()
            };

            await axios.post(`${API_URL}/api/transactions/add`, payload);

            if (Platform.OS === 'web') {
                router.back();
            } else {
                Alert.alert("Success", "Transaction Saved", [{ text: "OK", onPress: () => router.back() }]);
            }
        } catch (error: any) {
            alert(`Failed: ${error.response?.data?.error || "Network Error"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>New Transaction</Text>

            {/* Type Toggle */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleBtn, type === 'income' && styles.incomeActive]}
                    onPress={() => setType('income')}
                >
                    <Text style={[styles.toggleText, type === 'income' && styles.activeText]}>Income</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, type === 'expense' && styles.expenseActive]}
                    onPress={() => setType('expense')}
                >
                    <Text style={[styles.toggleText, type === 'expense' && styles.activeText]}>Expense</Text>
                </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount (₦)</Text>
                <TextInput
                    style={styles.inputLarge}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={handleAmountChange}
                />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Rice at Chicken Republic"
                    value={description}
                    onChangeText={handleDescriptionChange} // <--- UPDATED
                />
                {isPredicting && <ActivityIndicator style={{ position: 'absolute', right: 15, top: 45 }} />}
            </View>

            {/* CATEGORY GRID (CHIPS) */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>

                <View style={styles.gridContainer}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.chip,
                                selectedCategory?.id === cat.id && styles.chipActive
                            ]}
                            onPress={() => {
                                setIsCustomMode(false);
                                if (selectedCategory?.id === cat.id) {
                                    setSelectedCategory(null);
                                    setIsManualCategory(false); // Unlocking if deselected
                                } else {
                                    setSelectedCategory(cat);
                                    setIsManualCategory(true); // <--- User manually picked it
                                }
                            }}
                        >
                            <Text style={styles.chipIcon}>{cat.icon}</Text>
                            <Text style={[
                                styles.chipText,
                                selectedCategory?.id === cat.id && styles.chipTextActive
                            ]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}

                    {/* The "Other" Button */}
                    <TouchableOpacity
                        style={[styles.chip, isCustomMode && styles.chipActive]}
                        onPress={() => {
                            setSelectedCategory(null);
                            setIsCustomMode(true);
                        }}
                    >
                        <Text style={styles.chipIcon}>➕</Text>
                        <Text style={[styles.chipText, isCustomMode && styles.chipTextActive]}>Other</Text>
                    </TouchableOpacity>
                </View>

                {/* If "Other" is selected, show input */}
                {isCustomMode && (
                    <TextInput
                        style={[styles.input, { marginTop: 10, borderColor: '#10B981' }]}
                        placeholder="Type new category name..."
                        value={customCategoryName}
                        onChangeText={setCustomCategoryName}
                        autoFocus
                    />
                )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                style={[styles.submitBtn, type === 'expense' ? styles.btnRed : styles.btnGreen]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Transaction</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8fafc', paddingTop: 40 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#0f172a' },

    toggleContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 25 },
    toggleBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
    incomeActive: { backgroundColor: '#10B981' },
    expenseActive: { backgroundColor: '#EF4444' },
    toggleText: { fontWeight: '600', color: '#64748b' },
    activeText: { color: '#fff' },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, color: '#64748b', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    inputLarge: { backgroundColor: '#fff', padding: 15, borderRadius: 12, fontSize: 32, fontWeight: 'bold', borderWidth: 1, borderColor: '#e2e8f0', textAlign: 'center', color: '#0f172a' },

    // Grid / Chip Styles
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    chipActive: {
        backgroundColor: '#dcfce7', // Light Green bg
        borderColor: '#10B981',    // Green border
    },
    chipIcon: { marginRight: 6, fontSize: 16 },
    chipText: { fontSize: 14, color: '#334155', fontWeight: '500' },
    chipTextActive: { color: '#065f46', fontWeight: 'bold' },

    submitBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
    btnGreen: { backgroundColor: '#10B981' },
    btnRed: { backgroundColor: '#EF4444' },
    btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    cancelBtn: { padding: 15, alignItems: 'center', marginTop: 5 },
    cancelText: { color: '#64748b', fontSize: 16 }
});