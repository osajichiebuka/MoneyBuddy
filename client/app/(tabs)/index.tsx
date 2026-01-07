import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import axios from 'axios';

// NOTE: Use your machine's LAN IP (e.g., 192.168.1.5) instead of localhost 
// Use the machine's LAN IP for physical device testing
const API_URL = 'http://172.20.10.5:5000';

interface ServerStatus {
  service?: string;
  timestamp?: string;
  error?: string;
  details?: string;
}

export default function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(API_URL);
        setServerStatus(res.data);
      } catch (error) {
        setServerStatus({ error: 'Offline', details: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Money Buddy</Text>
      <Text style={styles.subtitle}>Mobile Client</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" />
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Backend Status:</Text>
          <Text style={styles.value}>
            {serverStatus?.service ? '🟢 Live' : '🔴 Error'}
          </Text>
          {serverStatus?.timestamp && (
            <Text style={styles.timestamp}>Last Ping: {serverStatus.timestamp}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981', // Emerald 500
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8', // Slate 400
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b', // Slate 800
    padding: 20,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    color: '#cbd5e1',
    marginBottom: 8,
  },
  value: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  timestamp: {
    color: '#64748b',
    fontSize: 12,
  }
});