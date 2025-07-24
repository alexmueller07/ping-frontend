import React, { useState, useRef, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Modal, Dimensions, TouchableOpacity, Animated, Easing, ScrollView, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { UserContext } from '../context/UserContext';
import Svg, { Circle } from 'react-native-svg';
import Waveform from '../../components/Waveform';

const STORIES = [
  {
    id: '1',
    name: 'Alice',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    stories: [
      { id: 's1', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', duration: 5 },
      { id: 's2', image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca', duration: 5 },
    ],
  },
  {
    id: '2',
    name: 'Bob',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    stories: [
      { id: 's1', image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308', duration: 5 },
    ],
  },
  {
    id: '3',
    name: 'Charlie',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    stories: [
      { id: 's1', image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9', duration: 5 },
    ],
  },
];

// Mock data for trending and popular stories (all pings, no images)
const TRENDING_STORIES = [
  { id: 't1', name: 'Taylor Swift', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', pingUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 't2', name: 'Elon Musk', avatar: 'https://randomuser.me/api/portraits/men/65.jpg', pingUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 't3', name: 'Zendaya', avatar: 'https://randomuser.me/api/portraits/women/55.jpg', pingUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 't4', name: 'MrBeast', avatar: 'https://randomuser.me/api/portraits/men/77.jpg', pingUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 't5', name: 'Billie Eilish', avatar: 'https://randomuser.me/api/portraits/women/66.jpg', pingUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

const POPULAR_STORIES_ALL = Array.from({ length: 100 }).map((_, i) => ({
  id: `p${i+1}`,
  name: `Popular User ${i+1}`,
  avatar: `https://randomuser.me/api/portraits/men/${(i%99)+1}.jpg`,
  pingUri: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(i%10)+1}.mp3`,
}));

const { width, height } = Dimensions.get('window');

function StoryRing({ avatar, seen, onPress, pulse }: { avatar: string; seen: boolean; onPress: () => void; pulse?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (pulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.12, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    }
  }, [pulse]);
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', marginHorizontal: 8 }}>
      <Animated.View style={{
        width: 72, // 64 avatar + 2*4px ring
        height: 72,
        borderRadius: 36,
        borderWidth: 3,
        borderColor: seen ? '#bbb' : '#4f8cff',
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f8cff',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
        transform: [{ scale }],
        backgroundColor: seen ? '#23242a' : undefined,
      }}>
        <Image source={{ uri: avatar }} style={{ width: 64, height: 64, borderRadius: 32 }} />
      </Animated.View>
    </Pressable>
  );
}

function AddStoryButton({ onPress, hasStory }: { onPress: () => void, hasStory?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ alignItems: 'center', marginHorizontal: 8 }}
      onPressIn={() => Animated.spring(scale, { toValue: 1.15, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={{
        borderWidth: hasStory ? 4 : 2,
        borderColor: hasStory ? '#ff9500' : '#4f8cff',
        borderRadius: 40,
        padding: 2,
        backgroundColor: '#23242a',
        transform: [{ scale }],
        shadowColor: hasStory ? '#ff9500' : '#4f8cff',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#23242a', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="add" size={36} color="#4f8cff" />
        </View>
      </Animated.View>
      <Text style={{ color: '#4f8cff', fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>Add Story</Text>
    </TouchableOpacity>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

// Helper to chunk an array into rows of 4
function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

// Utility for time ago
function timeAgo(timestamp: number) {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function StoriesScreen() {
  const userContext = useContext(UserContext);
  const userStoryPing = userContext.userStoryPing;
  const setUserStoryPing = userContext.setUserStoryPing;
  const [seenStories, setSeenStories] = useState<string[]>([]);
  const [seenTrending, setSeenTrending] = useState<string[]>([]);
  const [popularStories, setPopularStories] = useState(POPULAR_STORIES_ALL.slice(0, 10));
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState<{ id: string; type: 'friend' | 'trending'; } | null>(null);
  const [popularRows, setPopularRows] = useState(7); // 7 rows at a time
  const usersPerRow = 4;
  const usersPerPage = usersPerRow * popularRows;
  // Move these inside the component so they update on state change
  const visiblePopularStories = POPULAR_STORIES_ALL.slice(0, usersPerPage);
  const popularRowsChunks = chunkArray(visiblePopularStories, usersPerRow);
  const [addStoryModal, setAddStoryModal] = useState(false);
  const [pendingStoryPing, setPendingStoryPing] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingObj, setRecordingObj] = useState<Audio.Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const MAX_RECORD_SECONDS = 120;
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isHolding = useRef(false);
  const [volume, setVolume] = useState(0);
  const volumeInterval = useRef<NodeJS.Timeout | null>(null);

  // Add state for playback in modal
  const [storyPlaybackIdx, setStoryPlaybackIdx] = useState(0);
  const [storyPlaybackList, setStoryPlaybackList] = useState<any[]>([]);
  const [storyPlaybackProgress, setStoryPlaybackProgress] = useState(0);
  const [storyPlaybackSound, setStoryPlaybackSound] = useState<Audio.Sound | null>(null);
  const [storyPlaybackLoading, setStoryPlaybackLoading] = useState(false);

  // PanResponder for modal-wide gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isRecording,
      onMoveShouldSetPanResponder: () => isRecording,
      onPanResponderRelease: () => {
        if (isRecording) stopRecording();
      },
      onPanResponderTerminate: () => {
        if (isRecording) stopRecording();
      },
    })
  ).current;

  // Update timer while recording
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(t => {
          if (t + 1 >= MAX_RECORD_SECONDS) {
            stopRecording();
            return 0;
          }
          return t + 1;
        });
      }, 1000) as any;
      volumeInterval.current = setInterval(() => {
        setVolume(Math.random());
      }, 100) as any;
    } else {
      setRecordingTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
      if (volumeInterval.current) clearInterval(volumeInterval.current);
      setVolume(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (volumeInterval.current) clearInterval(volumeInterval.current);
    };
  }, [isRecording]);

  // Add Story button handler
  const handleAddStory = () => setAddStoryModal(true);

  // Hold-to-record logic
  const startRecording = async () => {
    setIsRecording(true);
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecordingObj(recording);
    } catch (e) {
      setIsRecording(false);
    }
  };
  const stopRecording = async () => {
    setIsRecording(false);
    if (!recordingObj) return;
    try {
      await recordingObj.stopAndUnloadAsync();
      const uri = recordingObj.getURI();
      if (uri) setPendingStoryPing(uri);
      setRecordingObj(null);
    } catch (e) {
      setRecordingObj(null);
    }
  };

  // Playback logic for pending story
  const playPendingPing = async () => {
    if (!pendingStoryPing) return;
    if (soundObj) { try { await soundObj.unloadAsync(); } catch {} }
    // Set audio mode for max loudness, match Ping tab
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      { uri: pendingStoryPing },
      { shouldPlay: true, isLooping: true },
      status => {
        if (status.isLoaded && !status.isPlaying) setIsPlaying(false);
      }
    );
    await sound.setVolumeAsync(1.0); // Set max volume
    setSoundObj(sound);
    setIsPlaying(true);
  };
  const stopPendingPing = async () => {
    if (soundObj) { try { await soundObj.unloadAsync(); } catch {} }
    setIsPlaying(false);
  };

  const handleSendStory = async () => {
    await stopPendingPing();
    setUserStoryPing(pendingStoryPing);
    setPendingStoryPing(null);
    setIsPlaying(false);
    setAddStoryModal(false);
  };
  const handleDeleteStory = async () => {
    await stopPendingPing();
    setPendingStoryPing(null);
    setIsPlaying(false);
  };

  // Handler for lazy loading more popular stories (7 more rows)
  const handlePopularScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 100 && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setPopularRows(prev => prev + 7);
        setLoadingMore(false);
      }, 600);
    }
  };

  // Remove a story after viewing
  const handleOpenStory = (id: string, type: 'friend' | 'trending') => {
    setCurrentStory({ id, type });
    setModalVisible(true);
    if (type === 'friend') setSeenStories(prev => [...prev, id]);
    if (type === 'trending') setSeenTrending(prev => [...prev, id]);
  };
  const handleCloseStory = () => {
    setModalVisible(false);
    setCurrentStory(null);
  };

  // Handler for lazy loading more popular stories
  const loadMorePopularStories = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPopularStories(prev => {
        const next = POPULAR_STORIES_ALL.slice(prev.length, prev.length + 10);
        return [...prev, ...next];
      });
      setLoadingMore(false);
    }, 600);
  };

  // Helper to start playback for a story
  const startStoryPlayback = async (list: any[], idx: number) => {
    setStoryPlaybackList(list);
    setStoryPlaybackIdx(idx);
    setStoryPlaybackProgress(0);
    setStoryPlaybackLoading(true);
    if (storyPlaybackSound) { try { await storyPlaybackSound.unloadAsync(); } catch {} }
    const uri = list[idx].pingUri;
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        status => {
          if (status.isLoaded) {
            setStoryPlaybackProgress((status.positionMillis || 0) / (status.durationMillis || 1));
            if (status.didJustFinish) {
              // Auto-advance
              if (idx + 1 < list.length) {
                startStoryPlayback(list, idx + 1);
              } else {
                setModalVisible(false);
                setStoryPlaybackIdx(0);
                setStoryPlaybackList([]);
                setStoryPlaybackProgress(0);
              }
            }
          }
        }
      );
      setStoryPlaybackSound(sound);
      setStoryPlaybackLoading(false);
    } catch {
      setStoryPlaybackLoading(false);
    }
  };
  // Clean up sound on modal close
  useEffect(() => {
    if (!modalVisible && storyPlaybackSound) {
      storyPlaybackSound.unloadAsync();
      setStoryPlaybackSound(null);
    }
  }, [modalVisible]);

  // Tap left/right to go prev/next
  const handleStoryModalTap = (e: any) => {
    if (!storyPlaybackList.length) return;
    const x = e.nativeEvent.locationX;
    if (x < width / 2 && storyPlaybackIdx > 0) {
      startStoryPlayback(storyPlaybackList, storyPlaybackIdx - 1);
    } else if (x >= width / 2 && storyPlaybackIdx < storyPlaybackList.length - 1) {
      startStoryPlayback(storyPlaybackList, storyPlaybackIdx + 1);
    }
  };

  // Friends stories (filtered out seen)
  const friendsStories = STORIES.filter(s => !seenStories.includes(s.id));
  // Trending stories (filtered out seen)
  const trendingStories = TRENDING_STORIES.filter(s => !seenTrending.includes(s.id));

  useEffect(() => {
    if (pendingStoryPing && addStoryModal && !isPlaying) {
      playPendingPing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStoryPing, addStoryModal]);

  // Show empty state if no stories
  const noFriendsStories = friendsStories.length === 0;
  const noTrendingStories = trendingStories.length === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#181A1B', paddingTop: 0 }}
      contentContainerStyle={{ paddingBottom: 32 }}
      onScroll={handlePopularScroll}
      scrollEventThrottle={16}
    >
      {/* Friends Stories */}
      <Text style={styles.header}>Friends</Text>
      {noFriendsStories ? (
        <Text style={{ color: '#aaa', textAlign: 'center', marginBottom: 12 }}>No stories from friends yet.</Text>
      ) : null}
      <FlatList
        data={[{ id: 'add', name: 'You', avatar: '', stories: [] }, ...friendsStories]}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8 }}
        renderItem={({ item }) =>
          item.id === 'add' ? (
            <AddStoryButton onPress={handleAddStory} hasStory={!!userStoryPing} />
          ) : (
            <View style={{ alignItems: 'center', marginHorizontal: 8 }}>
              <Image source={{ uri: item.avatar }} style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 4 }} />
              <TouchableOpacity style={styles.playBtn} onPress={() => handleOpenStory(item.id, 'friend')}>
                <Ionicons name="play" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginTop: 2 }}>{item.name}</Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
      />
      {/* Trending Stories */}
      <Text style={styles.header}>Trending</Text>
      {noTrendingStories ? (
        <Text style={{ color: '#aaa', textAlign: 'center', marginBottom: 12 }}>No trending stories right now.</Text>
      ) : null}
      <FlatList
        data={trendingStories}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8 }}
        renderItem={({ item, index }) => (
          <View style={{ alignItems: 'center', marginHorizontal: 8 }}>
            <Image source={{ uri: item.avatar }} style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 4 }} />
            <TouchableOpacity style={styles.playBtn} onPress={() => startStoryPlayback(trendingStories, index)}>
              <Ionicons name="play" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginTop: 2 }}>{item.name}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
      />
      {/* Popular Accounts */}
      <Text style={styles.header}>Popular Accounts</Text>
      <View>
        {popularRowsChunks.map((row, rowIdx) => (
          <View key={rowIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
            {row.map((item, idx) => (
              <View key={item.id} style={styles.popularTileGrid}>
                <Image source={{ uri: item.avatar }} style={styles.popularAvatarGrid} />
                <TouchableOpacity style={styles.playBtnGrid} onPress={() => startStoryPlayback(popularRowsChunks.flat(), rowIdx * usersPerRow + idx)}>
                  <Ionicons name="play" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.popularNameGrid}>{item.name}</Text>
              </View>
            ))}
            {/* Fill empty spots if row has less than 4 users */}
            {Array.from({ length: usersPerRow - row.length }).map((_, i) => (
              <View key={`empty-${i}`} style={[styles.popularTileGrid, { backgroundColor: 'transparent' }]} />
            ))}
          </View>
        ))}
      </View>
      {loadingMore && <Text style={{ color: '#aaa', textAlign: 'center', margin: 12 }}>Loading...</Text>}
      {/* Story Modal for playing ping */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <Pressable style={styles.overlayScreen} onPress={handleStoryModalTap}>
          <View style={styles.storyModalContent}>
            {storyPlaybackLoading ? (
              <Text style={{ color: '#aaa', fontSize: 18 }}>Loading...</Text>
            ) : storyPlaybackList.length ? (
              <>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
                  {storyPlaybackList[storyPlaybackIdx]?.name}
                </Text>
                <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 8 }}>
                  {storyPlaybackList[storyPlaybackIdx]?.timestamp ? timeAgo(storyPlaybackList[storyPlaybackIdx].timestamp) : ''}
                </Text>
                {/* Progress bar */}
                <View style={{ width: '80%', height: 6, backgroundColor: '#333', borderRadius: 3, marginBottom: 16 }}>
                  <View style={{ width: `${Math.round(storyPlaybackProgress * 100)}%`, height: 6, backgroundColor: '#4f8cff', borderRadius: 3 }} />
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={handleCloseStory}>
                  <Ionicons name="close" size={32} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 24 }}>Playing Ping Story</Text>
            )}
          </View>
        </Pressable>
      </Modal>
      {/* Add Story Modal */}
      <Modal visible={addStoryModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#23242a', borderRadius: 24, padding: 32, alignItems: 'center', width: 320, minHeight: 420, justifyContent: 'flex-start' }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>Add a Ping to Your Story</Text>
            {!pendingStoryPing ? (
              <>
                <View style={{ width: 128, height: 128, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 16 }}>
                  {/* Animated progress arc around mic button */}
                  {isRecording && (
                    <Svg width={128} height={128} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, transform: [{ rotate: '-90deg' }] }}>
                      <Circle
                        cx={64}
                        cy={64}
                        r={60}
                        stroke="#ff3333"
                        strokeWidth={8}
                        fill="none"
                        strokeDasharray={2 * Math.PI * 60}
                        strokeDashoffset={2 * Math.PI * 60 * (1 - recordingTime / MAX_RECORD_SECONDS)}
                        strokeLinecap="round"
                      />
                    </Svg>
                  )}
                  {/* Center the button inside the ring */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isRecording ? '#fff' : '#222',
                      borderWidth: 4,
                      borderColor: '#fff',
                      shadowColor: '#7cf',
                      shadowOpacity: 0.4,
                      shadowRadius: isRecording ? 32 : 16,
                      elevation: 6,
                    }}
                    {...(isRecording ? panResponder.panHandlers : {})}
                    onTouchStart={async () => {
                      if (!isRecording && !pendingStoryPing) {
                        isHolding.current = true;
                        await startRecording();
                      }
                    }}
                    onTouchEnd={async () => {
                      if (isRecording && isHolding.current) {
                        isHolding.current = false;
                        await stopRecording();
                      }
                    }}
                    onTouchCancel={async () => {
                      if (isRecording && isHolding.current) {
                        isHolding.current = false;
                        await stopRecording();
                      }
                    }}
                  >
                    <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={72} color={isRecording ? '#888' : '#fff'} style={{ zIndex: 2 }} />
                  </View>
                </View>
                {/* Waveform visual below the mic button */}
                <View style={{ width: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <Waveform volume={isRecording ? volume : 0} visible={isRecording} size={80} />
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={{ backgroundColor: '#4f8cff', borderRadius: 48, width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
                  onPress={stopPendingPing}
                >
                  <Ionicons name={'pause'} size={48} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Replaying</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity style={{ marginRight: 32 }} onPress={handleDeleteStory}>
                    <Ionicons name="close-circle" size={40} color="#ff5e3a" />
                    <Text style={{ color: '#ff5e3a', fontWeight: 'bold', marginTop: 2, textAlign: 'center' }}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSendStory}>
                    <Ionicons name="send" size={40} color="#4f8cff" />
                    <Text style={{ color: '#4f8cff', fontWeight: 'bold', marginTop: 2, textAlign: 'center' }}>Send</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <TouchableOpacity style={{ marginTop: 12 }} onPress={async () => {
              await stopPendingPing();
              setAddStoryModal(false);
              setIsRecording(false);
              setPendingStoryPing(null);
              setIsPlaying(false);
            }}>
              <Text style={{ color: '#aaa', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
    </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A1B',
    paddingTop: 32,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 16,
    color: '#fff',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#4f8cff',
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#23242a',
    borderRadius: 2,
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#4f8cff',
    borderRadius: 2,
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
  storyModalContent: {
    width: width * 0.82,
    height: height * 0.8,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#23242a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '80%',
    borderRadius: 24,
  },
  progressRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    zIndex: 10,
  },
  storyUserName: {
    position: 'absolute',
    top: 24,
    left: 24,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    zIndex: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: 20,
    padding: 2,
  },
  popularTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  popularAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  popularName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  playBtn: {
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: 20,
    padding: 8,
  },
  popularTileGrid: {
    width: '25%', // 4 tiles per row
    alignItems: 'center',
    marginBottom: 16,
  },
  popularAvatarGrid: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  playBtnGrid: {
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: 20,
    padding: 6,
    marginBottom: 8,
  },
  popularNameGrid: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
});

// Add a playPing function using Expo Audio or a placeholder
function playPing(uri: string) {
  // You can use Expo Audio or a simple alert for now
  alert(`Playing ping: ${uri}`);
} 