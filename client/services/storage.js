import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'money_buddy_session';

export const saveSession = async (session) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(KEY, JSON.stringify(session));
  } else {
    await SecureStore.setItemAsync(KEY, JSON.stringify(session));
  }
};

export const getSession = async () => {
  if (Platform.OS === 'web') {
    const session = localStorage.getItem(KEY);
    return session ? JSON.parse(session) : null;
  } else {
    const session = await SecureStore.getItemAsync(KEY);
    return session ? JSON.parse(session) : null;
  }
};

export const deleteSession = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(KEY);
  } else {
    await SecureStore.deleteItemAsync(KEY);
  }
};