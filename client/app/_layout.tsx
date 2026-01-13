import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Get the navigation state
  const rootNavigationState = useRootNavigationState();

  // 1. THE MAGIC FIX: 
  // If the navigation system isn't ready yet, return NULL immediately.
  // This prevents the useEffect below from running too early.
  // 1. THE MAGIC FIX:
  // Don't return null! We MUST render the Stack even if navigation isn't ready yet.
  // Instead, we just block the *redirection* logic below.

  useEffect(() => {
    // 2. Check if navigation is ready
    if (!rootNavigationState?.key) return;

    // 3. Check loading state
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to Login
      // Use setTimeout to avoid "navigate before mount" race condition
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
    } else if (session && inAuthGroup) {
      // Redirect to Home
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
    }
  }, [session, loading, segments, rootNavigationState?.key]);

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="addTransaction"
          options={{
            presentation: 'modal',
            headerShown: false,
            ...Platform.select({
              ios: { presentation: 'formSheet' },
            }),
          }}
        />
      </Stack>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});