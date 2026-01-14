import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../context/AuthContext';

const screenWidth = Dimensions.get('window').width;

export default function Insights() {
  const { session } = useAuth();
  
  // 3.1 Time Control State [cite: 74]
  const [timeRange, setTimeRange] = useState('Month'); // 'Week' | 'Month' | 'Year'

  // --- MOCK DATA (Until we connect Bank API) ---
  const donutData = [
    { name: 'Food', population: 45000, color: '#F59E0B', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Transport', population: 25000, color: '#10B981', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Vibes', population: 15000, color: '#EF4444', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Bills', population: 10000, color: '#3B82F6', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  ];

  const velocityData = {
    labels: ["Wk1", "Wk2", "Wk3", "Wk4"],
    datasets: [
      { data: [20000, 45000, 28000, 80000], color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, strokeWidth: 2 }, // Current Month
      { data: [30000, 40000, 40000, 50000], color: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`, strokeWidth: 2, withDots: false } // Last Month (Dotted/Grey)
    ]
  };

  return (
    <View style={styles.container}>
      {/* 3.1 Header (Time Control) [cite: 74] */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analysis</Text>
        <View style={styles.segmentControl}>
          {['Week', 'Month', 'Year'].map((t) => (
            <TouchableOpacity 
              key={t} 
              style={[styles.segmentBtn, timeRange === t && styles.segmentActive]}
              onPress={() => setTimeRange(t)}
            >
              <Text style={[styles.segmentText, timeRange === t && styles.textActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* 3.2 Section 1: The Breakdown (Donut) [cite: 79] */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Where'd my money go?</Text>
          
          <PieChart
            data={donutData}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute // Shows absolute numbers, set false for percentage
          />

          {/* 3.3 The "Buddy" Insight [cite: 83] */}
          <View style={styles.buddyBox}>
            <Text style={styles.buddyIcon}>🤖</Text>
            <Text style={styles.buddyText}>
              "You spent 40% on Food. Chef Chi would be proud, but your wallet is crying."
            </Text>
          </View>
        </View>

        {/* 3.4 Section 2: Spending Velocity [cite: 101] */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>The Burn Rate 🔥</Text>
          <Text style={styles.subTitle}>This Month vs Last Month</Text>
          
          <LineChart
            data={velocityData}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0, 
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "4", strokeWidth: "2", stroke: "#10B981" }
            }}
            bezier // Makes line curvy
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
          
          <Text style={styles.velocityText}>
            You are burning cash <Text style={{color: '#EF4444', fontWeight: 'bold'}}>faster</Text> than last month. Slow down!
          </Text>
        </View>

        {/* 3.6 Section 4: Money Making Moves [cite: 114] */}
        <View style={styles.horizontalSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingLeft: 20}}>
            <View style={styles.adviceCard}>
               <Text style={styles.adviceTitle}>💡 Advice</Text>
               <Text style={styles.adviceText}>You have ₦50k 'Safe to Spend'. Move 20k to Piggyvest?</Text>
            </View>
            <View style={[styles.adviceCard, {backgroundColor: '#1e293b'}]}>
               <Text style={styles.adviceTitle}>📈 Crypto</Text>
               <Text style={[styles.adviceText, {color: '#94a3b8'}]}>Bitcoin is down 5%. Good time to buy?</Text>
            </View>
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 50 },
  
  // Header
  header: { paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },
  segmentControl: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  segmentText: { color: '#64748b', fontWeight: '600' },
  textActive: { color: '#0f172a' },

  // Card Styles
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 20, borderRadius: 20, padding: 20, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  subTitle: { fontSize: 12, color: '#94a3b8', marginBottom: 10 },

  // Buddy Box
  buddyBox: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, marginTop: 15, alignItems: 'center' },
  buddyIcon: { fontSize: 24, marginRight: 10 },
  buddyText: { flex: 1, fontSize: 13, color: '#334155', fontStyle: 'italic' },

  // Velocity
  velocityText: { marginTop: 10, fontSize: 14, color: '#334155', textAlign: 'center' },

  // Horizontal Scroll
  horizontalSection: { marginBottom: 20 },
  adviceCard: { width: 250, backgroundColor: '#fff', padding: 20, borderRadius: 16, marginRight: 15, elevation: 2 },
  adviceTitle: { fontWeight: 'bold', marginBottom: 5, fontSize: 16 },
  adviceText: { color: '#64748b', fontSize: 14 }
});