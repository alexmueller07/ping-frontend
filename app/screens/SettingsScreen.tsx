import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Animated, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../_layout';

export default function SettingsScreen() {
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [logOutScale] = useState(new Animated.Value(1));

  const handleLogout = () => {
    Animated.sequence([
      Animated.spring(logOutScale, { toValue: 1.12, useNativeDriver: true }),
      Animated.spring(logOutScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      Alert.alert('Logged Out', 'You have been logged out (mock).');
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', paddingBottom: 48 }}>
      <View style={styles.card}>
        <Text style={styles.header}>Settings</Text>
        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <Ionicons name="lock-closed" size={22} color="#4f8cff" style={{ marginRight: 8 }} />
            <Text style={styles.text}>Private Account</Text>
            <Switch
              value={privacyEnabled}
              onValueChange={setPrivacyEnabled}
              thumbColor={privacyEnabled ? '#fff' : '#222'}
              trackColor={{ false: '#bbb', true: '#4f8cff' }}
            />
          </TouchableOpacity>
        </View>
        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.rowNoBorder} activeOpacity={0.7}>
            <Ionicons name="information-circle" size={22} color="#4f8cff" style={{ marginRight: 8 }} />
            <Text style={styles.text}>Version 1.0.0</Text>
          </TouchableOpacity>
        </View>
        {/* Log Out */}
        <Animated.View style={{ transform: [{ scale: logOutScale }], marginTop: 24 }}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A1B',
  },
  card: {
    alignItems: 'center',
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
    width: 340,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
    backgroundColor: '#23242a',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    letterSpacing: 1,
    color: '#fff',
  },
  section: {
    width: '100%',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 10,
  },
  sectionTitle: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    paddingHorizontal: 8,
    minHeight: 44,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  rowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 8,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  text: {
    fontSize: 18,
    color: '#fff',
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff5e3a',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
    shadowColor: '#ff5e3a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
}); 