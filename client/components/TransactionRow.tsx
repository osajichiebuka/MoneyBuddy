import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

// Helper to format money
const formatMoney = (amount) => {
    return amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
};

interface TransactionRowProps {
    item: any;
    onDelete: (id: string) => void;
    onSplit: (item: any) => void;
    onRecategorize: (item: any) => void;
}

export default function TransactionRow({ item, onDelete, onSplit, onRecategorize }: TransactionRowProps) {

    // Logic: Is this uncategorized?
    // We check if category is null OR if the name is 'Uncategorized'
    const isUncategorized = !item.category || item.category.name === 'Uncategorized';

    // Logic: Is this a "High Value" item worthy of an AI Nudge? (e.g. > 100k Expense)
    const isHighValue = item.amount > 100000 && item.direction === 'EXPENSE';

    // 1. LEFT ACTION (Red/Orange): Split Only (Deleted HIDDEN from swipe)
    const renderLeftActions = (progress, dragX) => {
        const scale = dragX.interpolate({
            inputRange: [0, 100],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.leftActionContainer}>
                {/* Split Bill Action */}
                <TouchableOpacity style={styles.actionBtnOrange} onPress={() => onSplit(item)}>
                    <Animated.Text style={[styles.actionText, { transform: [{ scale }] }]}>✂️ Split</Animated.Text>
                </TouchableOpacity>
            </View>
        );
    };

    // 2. RIGHT ACTION (Green): Recategorize
    const renderRightActions = (progress, dragX) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.rightActionContainer}>
                <TouchableOpacity style={styles.actionBtnGreen} onPress={() => onRecategorize(item)}>
                    <Animated.Text style={[styles.actionText, { transform: [{ scale }] }]}>🏷️ Recategorize</Animated.Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View>
            <Swipeable
                renderLeftActions={renderLeftActions}
                renderRightActions={renderRightActions}
                overshootLeft={false}
                overshootRight={false}
            >
                <View style={[styles.row, isUncategorized && styles.rowHighlighted]}>

                    {/* LEFT: Vendor Logo / Icon */}
                    <View style={[styles.iconBox, isUncategorized ? styles.bgYellow : styles.bgSlate]}>
                        <Text style={{ fontSize: 24 }}>
                            {isUncategorized ? '❓' : (item.category?.icon || '💰')}
                        </Text>
                    </View>

                    {/* MIDDLE: Name + Category */}
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <Text style={styles.vendorName} numberOfLines={1}>
                            {item.vendor_name || item.description}
                        </Text>
                        <Text style={styles.categoryName}>
                            {isUncategorized ? 'Uncategorized • Swipe to fix' : item.category?.name}
                        </Text>
                    </View>

                    {/* RIGHT: Amount + Delete Icon */}
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.amount, item.direction === 'INCOME' ? styles.textGreen : styles.textRed]}>
                            {item.direction === 'INCOME' ? '+' : '-'}
                            {formatMoney(item.amount)}
                        </Text>

                        {/* The little Delete Icon the user asked for */}
                        <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={10}>
                            <Text style={{ fontSize: 16 }}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Swipeable>

            {/* 3. THE AI NUDGE (Inserted Row Logic) */}
            {/* Only show this if it's High Value */}
            {isHighValue && (
                <View style={styles.nudgeContainer}>
                    <View style={styles.nudgeBubble}>
                        <Text style={styles.nudgeText}>
                            😳 You spent {formatMoney(item.amount)} at {item.vendor_name || 'this spot'}?
                            <Text style={{ fontWeight: 'bold' }}> Swipe right ➡ to split this bill.</Text>
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginBottom: 1, height: 80 },
    rowHighlighted: { backgroundColor: '#fffbeb', borderLeftWidth: 4, borderLeftColor: '#F59E0B' }, // Yellow tint for uncategorized

    iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    bgSlate: { backgroundColor: '#f1f5f9' },
    bgYellow: { backgroundColor: '#fef3c7' }, // Light yellow for ?

    vendorName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    categoryName: { fontSize: 13, color: '#64748b', fontWeight: '500' },

    amount: { fontSize: 16, fontWeight: '700' },
    textGreen: { color: '#10B981' },
    textRed: { color: '#ef4444' },

    // Swipe Actions
    leftActionContainer: { width: 150, flexDirection: 'row' },
    rightActionContainer: { width: 100 },

    actionBtnOrange: { backgroundColor: '#F59E0B', flex: 1, justifyContent: 'center', alignItems: 'center' },
    actionBtnRed: { backgroundColor: '#EF4444', flex: 1, justifyContent: 'center', alignItems: 'center' },
    actionBtnGreen: { backgroundColor: '#10B981', flex: 1, justifyContent: 'center', alignItems: 'center' },

    actionText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

    // AI Nudge Styles
    nudgeContainer: { backgroundColor: '#f8fafc', paddingVertical: 8, paddingHorizontal: 20, paddingBottom: 15 },
    nudgeBubble: {
        backgroundColor: '#e0f2fe', // Light Blue
        padding: 12,
        borderRadius: 12,
        borderTopLeftRadius: 0, // Speech bubble effect
        flexDirection: 'row',
    },
    nudgeText: { color: '#0369a1', fontSize: 13 }
});