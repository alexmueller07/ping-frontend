import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Animated, Easing, Pressable, Modal, Dimensions } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Global message store to persist messages across component unmounts
const globalMessageStore: { [userId: string]: Message[] } = {};

// Helper function to get messages for a user
const getMessagesForUser = (userId: string): Message[] => {
  return globalMessageStore[userId] || [];
};

// Helper function to add message for a user
const addMessageForUser = (userId: string, message: Message) => {
  if (!globalMessageStore[userId]) {
    globalMessageStore[userId] = [];
  }
  globalMessageStore[userId].push(message);
};

// Function to add incoming ping from another user
export const addIncomingPing = (userId: string, audioUri: string) => {
  const newMsg = {
    id: `outgoing_${Date.now()}`,
    sender: 'me', // Changed from 'friend' to 'me' so it appears as if you sent it
    audioUri: audioUri,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
    reactions: []
  };
  addMessageForUser(userId, newMsg);
};

// USER stays for message sender, but FRIEND is replaced by user prop
const USER = {
  id: 'me',
  name: 'You',
  avatar: 'https://randomuser.me/api/portraits/men/99.jpg',
};
type Message = {
  id: string;
  sender: string;
  time: string;
  read: boolean;
  reactions: string[];
  audioUri: string;
};

const MESSAGES: Message[] = [];

function OnlineDot({ online }: { online: boolean }) {
  return (
    <View style={{
      position: 'absolute',
      bottom: 6,
      right: 6,
      width: 16,
      height: 16,
      borderRadius: 8,
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

function TypingIndicator() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ scale }], marginLeft: 4 }]} />
      <Animated.View style={[styles.dot, { transform: [{ scale }], marginLeft: 4 }]} />
    </View>
  );
}

function ReactionBar({ onReact }: { onReact: (emoji: string) => void }) {
  const emojis = ['❤️', '😂', '🔥', '👍', '😮'];
  return (
    <View style={styles.reactionBar}>
      {emojis.map(e => (
        <Pressable key={e} onPress={() => onReact(e)} style={{ marginHorizontal: 4 }}>
          <Text style={{ fontSize: 22 }}>{e}</Text>
        </Pressable>
      ))}
    </View>
  );
}

type ChatDetailScreenProps = {
  user: any,
  onClose: () => void,
  onRecordingChange?: (isRecording: boolean) => void
};

export default function ChatDetailScreen({ user, onClose, onRecordingChange = () => {} }: ChatDetailScreenProps) {
  const [recording, setRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [showTyping, setShowTyping] = useState(true);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => getMessagesForUser(user.id));
  const flatListRef = useRef<FlatList>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [profileModal, setProfileModal] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  // Animate chat bubbles in
  const animatedValues = useRef(messages.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(120, animatedValues.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      })
    )).start();
  }, []);

  // Placeholder: Simulate recording and sending a ping
  const handleMicPressIn = async () => {
    setRecording(true);
    onRecordingChange(true);
    setRecordedUri(null);
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (e) {
      setRecording(false);
    }
  };
  const handleMicPressOut = async () => {
    setRecording(false);
    onRecordingChange(false);
    try {
      const recording = recordingRef.current;
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      if (uri) {
        const newMsg = { 
          id: `m${Date.now()}`, 
          sender: 'me', 
          audioUri: uri, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
          read: false, 
          reactions: [] 
        };
        
        // Save to global store
        addMessageForUser(user.id, newMsg);
        
        // Update local state
        setMessages(prev => {
          const updatedMessages = [...prev, newMsg];
          animatedValues.push(new Animated.Value(0));
          Animated.timing(animatedValues[animatedValues.length - 1], {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }).start();
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          return updatedMessages;
        });
      }
      recordingRef.current = null;
    } catch (e) {
      // ignore
    }
  };
  const handlePlay = async (msg: Message) => {
    setAudioError(null);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (!msg.audioUri) return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
        shouldDuckAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: msg.audioUri },
        { shouldPlay: true },
        (status) => {
          if ('isLoaded' in status && status.isLoaded && status.didJustFinish) {
            setPlayingMsgId(null);
          }
        }
      );
      await sound.setVolumeAsync(1.0);
      soundRef.current = sound;
      setPlayingMsgId(msg.id);
    } catch (e) {
      setAudioError('Could not play audio.');
    }
  };
  const handlePause = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
    }
    setPlayingMsgId(null);
  };
  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const handleReact = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: [...(m.reactions || []), emoji] } : m));
    setShowReactions(null);
  };

  // Swipe-to-dismiss logic
  const handleGestureEvent = Animated.event([{ nativeEvent: { translationX: new Animated.Value(0) } }], { useNativeDriver: false });
  const handlePan = Animated.event([{ nativeEvent: { translationX: new Animated.Value(0) } }], { useNativeDriver: false });
  const onPanGestureEvent = (event: any) => {
    setSwipeOffset(event.nativeEvent.translationX);
  };
  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === 5 && event.nativeEvent.translationX > 80) {
      onClose();
      setSwipeOffset(0);
    } else if (event.nativeEvent.state === 5) {
      setSwipeOffset(0);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanHandlerStateChange}
        enabled={!recording}
      >
        <Animated.View style={[styles.container, { transform: [{ translateX: swipeOffset }] }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setProfileModal(true)} style={{ position: 'relative' }}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <OnlineDot online={user.online} />
          <StreakBadge streak={user.streak} />
        </TouchableOpacity>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.status}>{user.online ? 'Active now' : 'Offline'}</Text>
        </View>
        <TouchableOpacity style={{ marginHorizontal: 8 }} onPress={() => {/* Call action */}}>
          <Ionicons name="call-outline" size={28} color="#4f8cff" />
        </TouchableOpacity>
      </View>
      {/* Profile Modal */}
      <Modal visible={profileModal} animationType="slide" transparent onRequestClose={() => setProfileModal(false)}>
        <View style={styles.profileModalBg}>
          <View style={styles.profileModalContent}>
            <Image source={{ uri: user.avatar }} style={styles.profileModalAvatar} />
            <Text style={styles.profileModalName}>{user.name}</Text>
            <Text style={styles.profileModalStatus}>{user.online ? 'Active now' : 'Offline'}</Text>
            <TouchableOpacity style={styles.profileModalClose} onPress={() => setProfileModal(false)}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Chat Bubbles */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 0 }}
        renderItem={({ item, index }) => {
          const isMe = item.sender === 'me';
          return (
            <Animated.View
              style={{
                opacity: animatedValues[index],
                transform: [{ translateY: animatedValues[index].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                marginVertical: 6,
                marginHorizontal: 12,
              }}
            >
              <View style={[styles.snapRow, isMe ? styles.snapRowMe : styles.snapRowFriend]}>
                {!isMe && (
                  <TouchableOpacity
                    onPress={playingMsgId === item.id ? handlePause : () => handlePlay(item)}
                    style={[styles.snapPlayBtn, styles.snapPlayBtnFriend]}
                  >
                    <MaterialCommunityIcons name={playingMsgId === item.id ? 'pause-circle' : 'play-circle'} size={38} color="#4f8cff" />
                  </TouchableOpacity>
                )}
                <View style={[styles.snapMeta, isMe && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.snapName, isMe ? styles.snapNameMe : styles.snapNameFriend]}>{isMe ? 'You' : user.name}</Text>
                  <Text style={[styles.snapTime, isMe && { textAlign: 'right' }]}>{item.time}</Text>
                </View>
                {isMe && (
                  <TouchableOpacity
                    onPress={playingMsgId === item.id ? handlePause : () => handlePlay(item)}
                    style={[styles.snapPlayBtn, styles.snapPlayBtnMe]}
                  >
                    <MaterialCommunityIcons name={playingMsgId === item.id ? 'pause-circle' : 'play-circle'} size={38} color="#fff" />
                  </TouchableOpacity>
                )}
                {audioError && <Text style={{ color: 'red', marginLeft: 8 }}>{audioError}</Text>}
              </View>
            </Animated.View>
          );
        }}
      />
      {/* Typing Indicator */}
      {showTyping && <TypingIndicator />}
      {/* Big Centered Mic Button */}
      <View style={styles.snapMicWrapper} onTouchStart={handleMicPressIn} onTouchEnd={handleMicPressOut}>
        <View style={[styles.snapMicBtn, recording && styles.snapMicBtnActive]}>
          <MaterialCommunityIcons name="microphone" size={54} color={recording ? '#4f8cff' : '#fff'} />
        </View>
        {recording && <Text style={{ color: '#4f8cff', fontWeight: 'bold', marginTop: 12 }}>Recording...</Text>}
      </View>
      {/* Overlay to block all interaction while recording */}
      {recording && (
        <View
          pointerEvents="auto"
          style={{ ...StyleSheet.absoluteFillObject, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.01)' }}
        >
          {/* Optionally, center a message: */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', opacity: 0.7 }}>Recording...</Text>
          </View>
        </View>
      )}
    </Animated.View>
    </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A1B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(30,30,34,0.98)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    zIndex: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#444',
    marginBottom: 0,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  status: {
    color: '#4f8cff',
    fontSize: 14,
    marginTop: 2,
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
  messagesList: {
    flex: 1,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 6,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleMe: {
    backgroundColor: '#4f8cff',
    alignSelf: 'flex-end',
  },
  bubbleFriend: {
    backgroundColor: '#23242a',
    alignSelf: 'flex-start',
  },
  bubbleText: {
    color: '#fff',
    fontSize: 16,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bubbleTime: {
    color: '#eee',
    fontSize: 12,
    marginRight: 6,
  },
  readReceipt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  reactionsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reaction: {
    fontSize: 18,
    marginRight: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 24,
    marginBottom: 8,
    height: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4f8cff',
    marginHorizontal: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(30,30,34,0.98)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  input: {
    flex: 1,
    backgroundColor: '#23242a',
    color: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: '#4f8cff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  reactionBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,30,34,0.98)',
    borderRadius: 16,
    padding: 8,
    marginTop: 2,
    marginBottom: 8,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: 'rgba(30,30,34,0.98)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  micButton: {
    backgroundColor: '#4f8cff',
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  snapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  snapRowMe: {
    justifyContent: 'flex-end',
    backgroundColor: '#4f8cff',
  },
  snapRowFriend: {
    justifyContent: 'flex-start',
    backgroundColor: '#23242a',
  },
  snapPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 8,
  },
  snapPlayBtnMe: {
    backgroundColor: 'transparent',
  },
  snapPlayBtnFriend: {
    backgroundColor: 'transparent',
  },
  snapMeta: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  snapName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  snapNameMe: {
    color: '#fff',
    textAlign: 'right',
  },
  snapNameFriend: {
    color: '#4f8cff',
    textAlign: 'left',
  },
  snapTime: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'left',
  },
  snapMicWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 36,
    alignItems: 'center',
    zIndex: 100,
  },
  snapMicBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#4f8cff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f8cff',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  snapMicBtnActive: {
    backgroundColor: '#fff',
  },
  profileModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileModalContent: {
    backgroundColor: '#232629',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
    minWidth: 280,
  },
  profileModalAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#4f8cff',
    marginBottom: 18,
  },
  profileModalName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 26,
    marginBottom: 6,
  },
  profileModalStatus: {
    color: '#4f8cff',
    fontSize: 16,
    marginBottom: 18,
  },
  profileModalClose: {
    position: 'absolute',
    top: 18,
    right: 18,
    backgroundColor: '#232629',
    borderRadius: 20,
    padding: 8,
  },
});

// Add missing style keys for TypeScript
type ExtraStyles = {
  profileModalAvatar: any;
  profileModalName: any;
  profileModalStatus: any;
  profileModalClose: any;
};
const _styles = styles as typeof styles & ExtraStyles; 