import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import your Waveform component (assumed to exist)
import Waveform from '../../components/Waveform';

const HEADER_HEIGHT = 56; // Adjust if your top bar is a different height
const TAB_BAR_HEIGHT = 60; // Adjust if your bottom bar is a different height
const { width } = Dimensions.get('window');

// Types
interface User {
  name: string;
  avatar: string;
  isFollowed: boolean;
}
interface Ping {
  id: string;
  user: User;
  audio: any;
  likes: number;
  comments: number;
  liked: boolean;
}
// Minimal WaveformProps for placeholder
const waveformProps = { volume: 1, visible: true };

function generateMockPings(start: number, count: number): Ping[] {
  return Array.from({ length: count }).map((_, i) => {
    const idx = start + i;
    return {
      id: String(idx),
      user: {
        name: `User${idx}`,
        avatar: `https://randomuser.me/api/portraits/men/${(idx % 90) + 1}.jpg`,
        isFollowed: false,
      },
      audio: null, // placeholder for audio
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      liked: false,
    };
  });
}

const INITIAL_PINGS_COUNT = 30;
const LOAD_MORE_COUNT = 20;
const MOCK_PINGS: Ping[] = generateMockPings(1, INITIAL_PINGS_COUNT);

function PingPost({ ping, onLike, onFollow, onComment, height, width }: {
  ping: Ping;
  onLike: () => void;
  onFollow: () => void;
  onComment: () => void;
  height: number;
  width: number;
}) {
  const [likeAnim] = useState(new Animated.Value(1));
  const handleLike = () => {
    Animated.sequence([
      Animated.spring(likeAnim, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(likeAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onLike();
  };
  return (
    <View style={[styles.pingContainer, { height, width }]}>
      {/* Removed Top Bar Spacer completely */}
      {/* Wavelength Animation */}
      <View style={[styles.waveformContainer, { top: height / 2 - 250 }]}>
        <Waveform {...waveformProps} />
      </View>
      {/* Right Side Action Bar */}
      <View style={[styles.rightBar, { top: height / 2 - 75 }]}>
        {/* Profile + Follow */}
        <TouchableOpacity style={styles.profileFollow} onPress={onFollow} activeOpacity={0.8}>
          <Image source={{ uri: ping.user.avatar }} style={styles.profileAvatar} />
          {!ping.user.isFollowed && (
            <View style={styles.plusCircle}>
              <Ionicons name="add" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        {/* Like */}
        <TouchableOpacity style={styles.iconButton} onPress={handleLike} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
            <Ionicons name={ping.liked ? 'heart' : 'heart-outline'} size={32} color={ping.liked ? '#ff5e3a' : '#fff'} />
          </Animated.View>
          <Text style={styles.iconLabel}>{ping.likes}</Text>
        </TouchableOpacity>
        {/* Comment */}
        <TouchableOpacity style={styles.iconButton} onPress={onComment} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={30} color="#fff" />
          <Text style={styles.iconLabel}>{ping.comments}</Text>
        </TouchableOpacity>
      </View>
      {/* Username at Bottom */}
      <View style={styles.bottomOverlay}>
        <Text style={styles.username}>@{ping.user.name}</Text>
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const { height: windowHeight } = Dimensions.get('window');
  const height = windowHeight - HEADER_HEIGHT - TAB_BAR_HEIGHT;
  const [pings, setPings] = useState<Ping[]>(MOCK_PINGS);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentModal, setCommentModal] = useState(false);
  const [modalPing, setModalPing] = useState<Ping | null>(null);

  const handleLike = (index: number) => {
    setPings((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        liked: !updated[index].liked,
        likes: updated[index].liked ? updated[index].likes - 1 : updated[index].likes + 1,
      };
      return updated;
    });
  };
  const handleFollow = (index: number) => {
    setPings((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        user: {
          ...updated[index].user,
          isFollowed: !updated[index].user.isFollowed,
        },
      };
      return updated;
    });
  };
  const handleComment = (index: number) => {
    setModalPing(pings[index]);
    setCommentModal(true);
  };

  const handleLoadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPings((prev) => [
        ...prev,
        ...generateMockPings(prev.length + 1, LOAD_MORE_COUNT),
      ]);
      setLoadingMore(false);
    }, 500); // Simulate network delay
  };

  return (
    <View style={{ height, width, backgroundColor: '#181A1B' }}>
      <FlatList
        data={pings}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <PingPost
            ping={item}
            onLike={() => handleLike(index)}
            onFollow={() => handleFollow(index)}
            onComment={() => handleComment(index)}
            height={height}
            width={width}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate={0.98}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / height);
          setCurrentIndex(idx);
        }}
        getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
        style={{ height, width }}
        contentContainerStyle={{ height: height * pings.length }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? (
          <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#aaa', fontSize: 16 }}>Loading more...</Text>
          </View>
        ) : null}
      />
      {/* Comment Modal (placeholder) */}
      <Modal visible={commentModal} transparent animationType="slide" onRequestClose={() => setCommentModal(false)}>
        <View style={styles.overlayScreen}>
          <View style={styles.modalContent}>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 12 }}>Comments for {modalPing?.user.name}</Text>
            <Text style={{ color: '#aaa' }}>(Comments UI coming soon)</Text>
            <TouchableOpacity onPress={() => setCommentModal(false)} style={{ marginTop: 24 }}>
              <Text style={{ color: '#4f8cff', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pingContainer: {
    // height and width moved to inline style
    backgroundColor: '#181A1B',
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    width: '100%',
    height: 0, // no extra space
    // No content
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  waveformContainer: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    // Move waveform down so its base is at the middle of the screen
    position: 'absolute',
    // top moved to inline style
  },
  rightBar: {
    position: 'absolute',
    right: 18,
    // top moved to inline style
    alignItems: 'center',
  },
  profileFollow: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#fff',
  },
  plusCircle: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    backgroundColor: '#4f8cff',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#181A1B',
  },
  iconButton: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconLabel: {
    color: '#fff',
    fontSize: 15,
    marginTop: 2,
    fontWeight: '600',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 100, // moved further up for maximum visibility
    left: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#23242a',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    width: width * 0.8,
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
}); 