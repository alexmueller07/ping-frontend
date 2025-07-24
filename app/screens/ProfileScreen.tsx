import React, { useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, Animated, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

const BADGES = [
  { id: 'b1', icon: 'star', color: '#FFD700', label: 'OG' },
  { id: 'b2', icon: 'fire', color: '#FF5E3A', label: '7-Day Streak' },
  { id: 'b3', icon: 'trophy', color: '#4f8cff', label: 'Top Friend' },
];
const HIGHLIGHTS = [
  { id: 'h1', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', title: 'Beach Day' },
  { id: 'h2', image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308', title: 'Hiking' },
  { id: 'h3', image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca', title: 'Brunch' },
];

export default function ProfileScreen() {
  const { avatar, setAvatar, name, setName } = useContext(UserContext);
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  // Mock data for demonstration
  const username = 'yourusername'; // Replace with real username if available
  const pingScore = 123; // Replace with real ping score (sent + received)
  const friends = 23;
  const storyPings = 8; // Replace with real story pings
  const scale = useRef(new Animated.Value(1)).current;

  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setAvatar(result.assets[0].uri);
    }
  };

  const saveProfile = () => {
    setName(tempName.trim() || 'Your Name');
    setEditing(false);
  };

  const handleEditPress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.12, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    setEditing(true);
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        {/* Profile Image */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Change Avatar', 'Choose an option', [
              { text: 'Take Photo', onPress: takePhoto },
              { text: 'Choose from Gallery', onPress: pickAvatar },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
          style={styles.avatarWrapper}
        >
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.avatarEditCircle}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
        {/* Display Name */}
        {editing ? (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <TextInput
              style={styles.nameInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Your Name"
              placeholderTextColor="#aaa"
              maxLength={32}
              autoFocus
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleEditPress} activeOpacity={0.8}>
            <Animated.Text style={[styles.name, { transform: [{ scale }] }]}>{name}</Animated.Text>
          </TouchableOpacity>
        )}
        {/* Username */}
        <Text style={styles.username}>@{username}</Text>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{pingScore}</Text>
            <Text style={styles.statLabel}>Ping Score</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{friends}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{storyPings}</Text>
            <Text style={styles.statLabel}>Story Pings</Text>
          </View>
        </View>
        {/* Badges */}
        <View style={styles.badgeRow}>
          {BADGES.map(b => (
            <View key={b.id} style={[styles.badge, { backgroundColor: b.color + '22' }]}> 
              <MaterialCommunityIcons name={b.icon as any} size={20} color={b.color} />
              <Text style={{ color: b.color, fontWeight: 'bold', fontSize: 12, marginLeft: 4 }}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>
      {/* No highlights section */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A1B',
    alignItems: 'center',
    paddingTop: 36,
  },
  headerCard: {
    alignItems: 'center',
    borderRadius: 28,
    padding: 28,
    marginTop: 8,
    width: 340,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
    backgroundColor: '#23242a',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#4f8cff',
    marginBottom: 4,
  },
  avatarEditCircle: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#4f8cff',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#4f8cff',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
    textAlign: 'center',
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    width: 200,
    textAlign: 'center',
    backgroundColor: '#23242a',
    color: '#fff',
  },
  saveButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#4f8cff',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    marginBottom: 8,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    color: '#4f8cff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23242a',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightsHeader: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 32,
    marginBottom: 8,
    marginLeft: 12,
    alignSelf: 'flex-start',
  },
  highlightCard: {
    backgroundColor: '#23242a',
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightImage: {
    width: 100,
    height: 70,
    borderRadius: 12,
    marginBottom: 6,
  },
  highlightTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  username: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
}); 