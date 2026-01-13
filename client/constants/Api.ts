import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBackendUrl = () => {
    // If running on Web, use localhost (since the browser is on the same machine)
    if (Platform.OS === 'web') return 'http://localhost:5000';

    // In Expo Go, hostUri contains the LAN IP of the bundler machine
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];

    if (!localhost) {
        // Fallback for standalone builds or if hostUri is missing (e.g. production)
        // You might want to replace this with your production server URL later
        return 'http://localhost:5000';
    }

    return `http://${localhost}:5000`;
};

export const API_BASE_URL = getBackendUrl();
export const AUTH_API_URL = `${API_BASE_URL}/api/auth`;
