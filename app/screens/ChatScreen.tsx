import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, TouchableOpacity, Animated, Easing, Modal, TextInput } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import ChatDetailScreen from './ChatDetailScreen';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import SettingsScreen from './SettingsScreen';
import ProfileScreen from './ProfileScreen';

const CHATS = [
  { 
    id: '1', 
    name: 'Alice', 
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg', 
    online: true, 
    streak: 7, 
    unread: 3,
    lastPingTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    lastPingListened: false
  },
  { 
    id: '2', 
    name: 'Bob', 
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg', 
    online: false, 
    streak: 3, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    lastPingListened: true
  },
  { 
    id: '3', 
    name: 'Charlie', 
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg', 
    online: true, 
    streak: 0, 
    unread: 1,
    lastPingTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    lastPingListened: false
  },
  { 
    id: '4', 
    name: 'Diana', 
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg', 
    online: true, 
    streak: 12, 
    unread: 5,
    lastPingTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    lastPingListened: false
  },
  { 
    id: '5', 
    name: 'Ethan', 
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg', 
    online: false, 
    streak: 1, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    lastPingListened: true
  },
  { 
    id: '6', 
    name: 'Fiona', 
    avatar: 'https://randomuser.me/api/portraits/women/6.jpg', 
    online: true, 
    streak: 0, 
    unread: 2,
    lastPingTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    lastPingListened: false
  },
  { 
    id: '7', 
    name: 'George', 
    avatar: 'https://randomuser.me/api/portraits/men/7.jpg', 
    online: false, 
    streak: 8, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    lastPingListened: true
  },
  { 
    id: '8', 
    name: 'Hannah', 
    avatar: 'https://randomuser.me/api/portraits/women/8.jpg', 
    online: true, 
    streak: 4, 
    unread: 1,
    lastPingTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    lastPingListened: false
  },
  { 
    id: '9', 
    name: 'Ian', 
    avatar: 'https://randomuser.me/api/portraits/men/9.jpg', 
    online: false, 
    streak: 0, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    lastPingListened: true
  },
  { 
    id: '10', 
    name: 'Julia', 
    avatar: 'https://randomuser.me/api/portraits/women/10.jpg', 
    online: true, 
    streak: 15, 
    unread: 4,
    lastPingTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    lastPingListened: false
  },
  { 
    id: '11', 
    name: 'Kevin', 
    avatar: 'https://randomuser.me/api/portraits/men/11.jpg', 
    online: false, 
    streak: 2, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    lastPingListened: true
  },
  { 
    id: '12', 
    name: 'Lily', 
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg', 
    online: true, 
    streak: 6, 
    unread: 1,
    lastPingTime: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
    lastPingListened: false
  },
  { 
    id: '13', 
    name: 'Marcus', 
    avatar: 'https://randomuser.me/api/portraits/men/13.jpg', 
    online: false, 
    streak: 0, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    lastPingListened: true
  },
  { 
    id: '14', 
    name: 'Nina', 
    avatar: 'https://randomuser.me/api/portraits/women/14.jpg', 
    online: true, 
    streak: 9, 
    unread: 3,
    lastPingTime: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
    lastPingListened: false
  },
  { 
    id: '15', 
    name: 'Oscar', 
    avatar: 'https://randomuser.me/api/portraits/men/15.jpg', 
    online: false, 
    streak: 1, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    lastPingListened: true
  },
  { 
    id: '16', 
    name: 'Penny', 
    avatar: 'https://randomuser.me/api/portraits/women/16.jpg', 
    online: true, 
    streak: 0, 
    unread: 2,
    lastPingTime: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    lastPingListened: false
  },
  { 
    id: '17', 
    name: 'Quinn', 
    avatar: 'https://randomuser.me/api/portraits/men/17.jpg', 
    online: false, 
    streak: 5, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    lastPingListened: true
  },
  { 
    id: '18', 
    name: 'Rachel', 
    avatar: 'https://randomuser.me/api/portraits/women/18.jpg', 
    online: true, 
    streak: 11, 
    unread: 1,
    lastPingTime: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    lastPingListened: false
  },
  { 
    id: '19', 
    name: 'Sam', 
    avatar: 'https://randomuser.me/api/portraits/men/19.jpg', 
    online: false, 
    streak: 0, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    lastPingListened: true
  },
  { 
    id: '20', 
    name: 'Tara', 
    avatar: 'https://randomuser.me/api/portraits/women/20.jpg', 
    online: true, 
    streak: 3, 
    unread: 4,
    lastPingTime: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
    lastPingListened: false
  },
  { 
    id: '21', 
    name: 'Uma', 
    avatar: 'https://randomuser.me/api/portraits/women/21.jpg', 
    online: false, 
    streak: 7, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    lastPingListened: true
  },
  { 
    id: '22', 
    name: 'Victor', 
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg', 
    online: true, 
    streak: 0, 
    unread: 1,
    lastPingTime: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    lastPingListened: false
  },
  { 
    id: '23', 
    name: 'Wendy', 
    avatar: 'https://randomuser.me/api/portraits/women/23.jpg', 
    online: false, 
    streak: 2, 
    unread: 0,
    lastPingTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
    lastPingListened: true
  }
];

// Function to generate dynamic last message text
function getLastMessageText(chat: typeof CHATS[0]) {
  if (chat.unread > 0) {
    if (chat.unread === 1) {
      return '1 New Ping';
    } else {
      return `${chat.unread} New Pings`;
    }
  }
  
  if (!chat.lastPingTime) {
    return 'No pings yet';
  }
  
  const now = new Date();
  const diffInMs = now.getTime() - chat.lastPingTime.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'Last Ping: Just now';
  } else if (diffInMinutes < 60) {
    return `Last Ping: ${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `Last Ping: ${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return 'Last Ping: Yesterday';
  } else {
    return `Last Ping: ${diffInDays} days ago`;
  }
}

function OnlineDot({ online }: { online: boolean }) {
  return (
    <View style={{
      position: 'absolute',
      bottom: 4,
      right: 4,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: online ? '#4f8cff' : '#bbb',
      borderWidth: 2,
      borderColor: '#fff',
      zIndex: 2,
    }} />
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (!streak) return null;
  return (
    <View style={styles.streakBadge}>
      <Text style={{ color: '#ff5e3a', fontWeight: 'bold', fontSize: 13 }}>🔥 {streak}</Text>
    </View>
  );
}

function UnreadBadge({ unread }: { unread: number }) {
  if (!unread) return null;
  return (
    <View style={styles.unreadBadge}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{unread}</Text>
    </View>
  );
}

function TopBar({ onProfile, onSettings, userStoryPing }: { onProfile: () => void, onSettings: () => void, userStoryPing?: string | null }) {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      backgroundColor: Colors.dark.background,
      paddingBottom: 16,
      paddingTop: 0,
    }}>
      <TouchableOpacity onPress={onProfile} style={{ alignItems: 'center', justifyContent: 'center' }}>
        {userStoryPing ? (
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 4,
            borderColor: '#4f8cff',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#4f8cff',
            shadowOpacity: 0.18,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
              style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#fff' }}
            />
          </View>
        ) : (
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
          style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#fff' }}
        />
        )}
      </TouchableOpacity>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', flex: 1 }}>Chat</Text>
      <TouchableOpacity onPress={onSettings}>
        <Ionicons name="settings-sharp" size={28} color="#fff" style={{ backgroundColor: 'transparent' }} />
      </TouchableOpacity>
    </View>
  );
}

type ChatScreenProps = {
  setIsRecording?: (isRecording: boolean) => void;
};

export default function ChatScreen({ setIsRecording }: ChatScreenProps) {
  const theme = useColorScheme();
  const cardBg = Colors.dark.tabIconDefault;
  const textColor = Colors.dark.text;
  const accent = Colors.dark.tint;
  const [selectedChat, setSelectedChat] = React.useState<typeof CHATS[0] | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const flatListRef = React.useRef<FlatList<any>>(null);
  const [showProfile, setShowProfile] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [profileUser, setProfileUser] = React.useState<typeof CHATS[0] | null>(null);
  const [showAddUser, setShowAddUser] = React.useState(false);
  const [isRecordingState, setIsRecordingState] = React.useState(false);
  const { userStoryPing } = useContext(UserContext);

  // Notify parent when isRecording changes
  React.useEffect(() => {
    if (setIsRecording) setIsRecording(isRecordingState);
  }, [isRecordingState, setIsRecording]);

  // Reset all overlays/modals when ChatScreen loses focus or unmounts
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setShowProfile(false);
        setShowSettings(false);
        setProfileUser(null);
        setShowAddUser(false);
        setModalVisible(false);
        setSelectedChat(null);
      };
    }, [])
  );

  // Animation for chat cards
  const animatedValues = React.useRef(CHATS.map(() => new Animated.Value(0))).current;
  React.useEffect(() => {
    Animated.stagger(80, animatedValues.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      })
    )).start();
  }, []);

  return (
    <>
      <View style={styles.container}>
        <TopBar onProfile={() => setShowProfile(true)} onSettings={() => setShowSettings(true)} userStoryPing={userStoryPing} />
        <FlatList
          ref={flatListRef}
          data={CHATS}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <Animated.View
              style={{
                opacity: animatedValues[index] ? animatedValues[index] : 1,
                transform: [{ translateY: animatedValues[index] ? animatedValues[index].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) : 0 }],
              }}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.chatRow,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  setSelectedChat(item);
                  setModalVisible(true);
                }}
              >
                <TouchableOpacity
                  style={{ position: 'relative' }}
                  onPress={e => {
                    e.stopPropagation();
                    setProfileUser(item);
                  }}
                >
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  <OnlineDot online={item.online} />
                  <StreakBadge streak={item.streak} />
                </TouchableOpacity>
                <View style={styles.textContainer}>
                  <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
                  <Text style={[styles.lastMessage, { color: accent }]} numberOfLines={1}>{getLastMessageText(item)}</Text>
                </View>
                <UnreadBadge unread={item.unread} />
              </Pressable>
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setShowAddUser(true)}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>+</Text>
        </TouchableOpacity>
        {/* Add User Modal */}
        {showAddUser && (
          <View key="addUser-modal" style={styles.overlayScreen}>
            <View style={{ backgroundColor: '#23242a', borderRadius: 18, padding: 24, width: 320, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Add User</Text>
              <TextInput
                placeholder="Search users..."
                placeholderTextColor="#888"
                style={{ width: '100%', backgroundColor: '#181A1B', color: '#fff', borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 16 }}
                editable={true}
              />
              <TouchableOpacity style={[styles.closeButton, { position: 'relative', top: 0, right: 0, alignSelf: 'flex-end' }]} onPress={() => setShowAddUser(false)}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Profile and Settings modals */}
        {showProfile && (
          <View key="profile-modal" style={styles.overlayScreen}>
            <ProfileScreen />
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowProfile(false)}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        {showSettings && (
          <View key="settings-modal" style={styles.overlayScreen}>
            <SettingsScreen />
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowSettings(false)}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        {/* Profile modal for chat avatar */}
        {profileUser && (
          <View key={`profileUser-modal-${profileUser.id}`} style={styles.overlayScreen}>
            <Image source={{ uri: profileUser.avatar }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 16 }} />
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>{profileUser.name}</Text>
            <Text style={{ color: '#4f8cff', fontSize: 16, marginBottom: 16 }}>{profileUser.online ? 'Active now' : 'Offline'}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setProfileUser(null)}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Full-screen Chat Detail Modal */}
      <Modal
        key={modalVisible ? `chat-modal-${selectedChat?.id || ''}` : 'chat-modal'}
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: false }), 100);
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#181A1B' }}>
          {selectedChat && (
            <ChatDetailScreen
              user={selectedChat}
              onClose={() => {
                setModalVisible(false);
                setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: false }), 100);
              }}
              onRecordingChange={setIsRecordingState}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A1B',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    width: '100%',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#444',
    marginTop: 8, // Add gap below header
  },
  textContainer: {
    flex: 1,
    borderBottomWidth: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 15,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginLeft: 84, // aligns with start of text (avatar width + padding)
  },
  streakBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#ff5e3a',
    shadowColor: '#ff5e3a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadBadge: {
    backgroundColor: '#4f8cff',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
    zIndex: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 120, // Move up so it's above the nav bar
    right: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f8cff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  overlayScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(24,26,27,0.98)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
}); 