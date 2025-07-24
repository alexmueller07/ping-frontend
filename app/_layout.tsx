import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext({
  theme: 'dark',
  setTheme: (_: 'light' | 'dark') => {},
  toggleTheme: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

export default function RootLayout() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  useEffect(() => {
    AsyncStorage.getItem('theme').then((stored) => {
      if (stored === 'light' || stored === 'dark') setTheme(stored);
    });
  }, []);
  const updateTheme = (t: 'light' | 'dark') => {
    setTheme(t);
    AsyncStorage.setItem('theme', t);
  };
  const toggleTheme = () => updateTheme(theme === 'dark' ? 'light' : 'dark');

  if (!loaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme, toggleTheme }}>
      <NavThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </NavThemeProvider>
    </ThemeContext.Provider>
  );
}
