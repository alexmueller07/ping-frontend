import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text, Dimensions, PanResponder } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap } from 'react-native-tab-view';
import ChatScreen from '../screens/ChatScreen';
import StoriesScreen from '../screens/StoriesScreen';
import MapScreen from '../screens/MapScreen';
import PingScreen from '../screens/PingScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Colors } from '../../constants/Colors';
import { UserContext } from '../context/UserContext';

const ACTIVE = '#4f8cff'; // Blue for active tab
const INACTIVE = '#fff'; // White for inactive tab

const TAB_ICONS = {
  Map: <Ionicons name="map" size={28} color={INACTIVE} />,
  Chat: <MaterialCommunityIcons name="message-text" size={28} color={INACTIVE} />,
  Ping: <MaterialCommunityIcons name="microphone" size={28} color={INACTIVE} />,
  Stories: <FontAwesome name="circle-o" size={28} color={INACTIVE} />,
  Discover: <Ionicons name="compass" size={28} color={INACTIVE} />,
};

const TAB_LABELS = {
  Map: 'Map',
  Chat: 'Chat',
  Ping: 'Ping',
  Stories: 'Stories',
  Discover: 'Discover',
};

const routes = [
  { key: 'Map', title: 'Map' },
  { key: 'Chat', title: 'Chat' },
  { key: 'Ping', title: 'Ping' },
  { key: 'Stories', title: 'Stories' },
  { key: 'Discover', title: 'Discover' },
];

const DARK_BG = Colors.dark.background;
const DARK_SURFACE = Colors.dark.background;

function TopBar({ tabName, onProfile, onSettings, isReplay, onTrash, mapRegionName }: { tabName: keyof typeof TAB_LABELS, onProfile: () => void, onSettings: () => void, isReplay?: boolean, onTrash?: () => void, mapRegionName?: string }) {
  const { avatar, userStoryPing } = useContext(UserContext);
  return (
    <View style={styles.topBarContainer}>
      {isReplay ? (
        <TouchableOpacity onPress={onTrash}>
          <Ionicons name="close" size={36} color="#fff" />
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity onPress={onProfile}>
            <View
              style={{
                borderWidth: userStoryPing ? 3 : 0,
                borderColor: userStoryPing ? '#4f8cff' : 'transparent',
                borderRadius: 20,
                padding: 2,
              }}
            >
              <Image
                source={{ uri: avatar }}
                style={{ width: 36, height: 36, borderRadius: 18 }}
              />
            </View>
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1} ellipsizeMode="tail">
            {tabName === 'Map' && mapRegionName ? mapRegionName : TAB_LABELS[tabName]}
          </Text>
          <TouchableOpacity onPress={onSettings}>
            <Ionicons name="settings-sharp" size={28} color="#fff" style={styles.settingsIcon} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

export default function TabLayout() {
  const [index, setIndex] = useState(2); // Start on Ping
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pingMicPressed, setPingMicPressed] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true); // NEW
  const [isReplay, setIsReplay] = useState(false); // NEW
  const pingScreenRef = useRef<any>(null);
  // Add state to hold the current region name
  const [mapRegionName, setMapRegionName] = useState('');
  const [chatIsRecording, setChatIsRecording] = useState(false);

  // PanResponder for right-edge swipe on Map tab
  const edgeSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only start if touch is within rightmost 32px
        return evt.nativeEvent.locationX > Dimensions.get('window').width - 32;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only trigger if swipe is leftward and significant
        if (gestureState.dx < -40) {
          setIndex(1); // Chat tab
        }
      },
      onPanResponderTerminationRequest: () => true, // Allow termination
      onShouldBlockNativeResponder: () => false, // Don't block native gestures
      onMoveShouldSetPanResponder: () => false, // Don't take over during movement
      onStartShouldSetPanResponderCapture: () => false, // Don't capture other gestures
    })
  ).current;

  // Always stop playback when leaving Ping tab
  const prevIndexRef = useRef(index);
  useEffect(() => {
    if (routes[prevIndexRef.current].key === 'Ping' && routes[index].key !== 'Ping') {
      pingScreenRef.current?.pausePlayback?.();
      pingScreenRef.current?.forceCleanup?.(); // NEW: force full cleanup
    }
    prevIndexRef.current = index;
  }, [index]);

  // Always resume playback when entering Ping tab (swipe or click)
  useEffect(() => {
    if (routes[index].key === 'Ping') {
      pingScreenRef.current?.resumePlayback?.();
    }
  }, [index]);

  const handleProfile = () => setShowProfile(true);
  const handleSettings = () => setShowSettings(true);

  // Custom renderScene to inject setMicPressed and setShowTopBar into PingScreen
  const renderScene = useCallback(({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'Map':
        return (
          <View style={{ flex: 1, backgroundColor: DARK_BG }}>
            <TopBar
              tabName="Map"
              onProfile={handleProfile}
              onSettings={handleSettings}
              isReplay={false}
              mapRegionName={mapRegionName}
            />
            <MapScreen setRegionName={setMapRegionName} />
            {/* Small edge zone for swipe to Chat */}
            <View
              style={styles.rightEdgeSwipeZone}
              {...edgeSwipeResponder.panHandlers}
            />
          </View>
        );
      case 'Chat':
        return <View style={{ flex: 1, backgroundColor: DARK_BG }}><ChatScreen setIsRecording={setChatIsRecording} /> </View>;
      case 'Ping':
        return (
          <View style={{ flex: 1, backgroundColor: DARK_BG }}>
            <TopBar
              tabName="Ping"
              onProfile={handleProfile}
              onSettings={handleSettings}
              isReplay={!!isReplay}
              onTrash={pingScreenRef.current?.trashPing}
            />
            <PingScreen ref={pingScreenRef} setMicPressed={setPingMicPressed} setShowTopBar={setShowTopBar} onReplayStateChange={setIsReplay} />
          </View>
        );
      case 'Stories':
        return (
          <View style={{ flex: 1, backgroundColor: DARK_BG }}>
            <TopBar
              tabName="Stories"
              onProfile={handleProfile}
              onSettings={handleSettings}
              isReplay={false}
            />
            <StoriesScreen />
          </View>
        );
      case 'Discover':
        return (
          <View style={{ flex: 1, backgroundColor: DARK_BG }}>
            <TopBar
              tabName="Discover"
              onProfile={handleProfile}
              onSettings={handleSettings}
              isReplay={false}
            />
            <DiscoverScreen />
          </View>
        );
      default:
        return null;
    }
  }, [pingMicPressed, edgeSwipeResponder]);

  const handleIndexChange = (newIndex: number) => {
    // Resume playback if entering Ping tab
    if (routes[newIndex].key === 'Ping' && pingScreenRef.current && pingScreenRef.current.resumePlayback) {
      pingScreenRef.current.resumePlayback();
    }
    setIndex(newIndex);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK_BG }} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={({ route }) => {
            switch (route.key) {
              case 'Map':
                return (
                  <View style={{ flex: 1, backgroundColor: DARK_BG }}>
                    <TopBar
                      tabName="Map"
                      onProfile={handleProfile}
                      onSettings={handleSettings}
                      isReplay={false}
                      mapRegionName={mapRegionName}
                    />
                    <MapScreen setRegionName={setMapRegionName} />
                    <View
                      style={styles.rightEdgeSwipeZone}
                      {...edgeSwipeResponder.panHandlers}
                    />
                  </View>
                );
              case 'Chat':
                return <View style={{ flex: 1, backgroundColor: DARK_BG }}><ChatScreen setIsRecording={setChatIsRecording} /> </View>;
              case 'Ping':
                return (
                  <View style={{ flex: 1, backgroundColor: DARK_BG }}>
                    <TopBar
                      tabName="Ping"
                      onProfile={handleProfile}
                      onSettings={handleSettings}
                      isReplay={!!isReplay}
                      onTrash={pingScreenRef.current?.trashPing}
                    />
                    <PingScreen ref={pingScreenRef} setMicPressed={setPingMicPressed} setShowTopBar={setShowTopBar} onReplayStateChange={setIsReplay} />
                  </View>
                );
              case 'Stories':
                return (
                  <View style={{ flex: 1, backgroundColor: DARK_BG }}>
                    <TopBar
                      tabName="Stories"
                      onProfile={handleProfile}
                      onSettings={handleSettings}
                      isReplay={false}
                    />
                    <StoriesScreen />
                  </View>
                );
              case 'Discover':
                return (
                  <View style={{ flex: 1, backgroundColor: DARK_BG }}>
                    <TopBar
                      tabName="Discover"
                      onProfile={handleProfile}
                      onSettings={handleSettings}
                      isReplay={false}
                    />
                    <DiscoverScreen />
                  </View>
                );
              default:
                return null;
            }
          }}
          onIndexChange={handleIndexChange}
          initialLayout={{ width: Dimensions.get('window').width }}
          swipeEnabled={!chatIsRecording && !pingMicPressed}
          renderTabBar={props => (
            <View style={[styles.tabBarContainer, styles.tabBarAbsolute]}>
              {props.navigationState.routes.map((route, i) => {
                const isFocused = index === i;
                const icon = TAB_ICONS[route.key as keyof typeof TAB_ICONS];
                return (
                  <TouchableOpacity
                    key={route.key}
                    accessibilityRole="button"
                    accessibilityState={isFocused ? { selected: true } : {}}
                    onPress={() => setIndex(i)}
                    style={[styles.tabButton, isFocused && styles.tabButtonActive]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.iconWrapper}>
                      {React.cloneElement(icon, { color: isFocused ? ACTIVE : INACTIVE })}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      </View>
      {/* Profile and Settings modals/screens */}
      {showProfile && (
        <View style={styles.overlayScreen}>
          <ProfileScreen />
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowProfile(false)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      {showSettings && (
        <View style={styles.overlayScreen}>
          <SettingsScreen />
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowSettings(false)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: DARK_SURFACE,
    paddingBottom: 16,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  settingsIcon: {
    backgroundColor: 'transparent',
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DARK_SURFACE,
    height: 92,
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingHorizontal: 8,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  tabButtonActive: {},
  overlayScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DARK_BG,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    backgroundColor: DARK_SURFACE,
    borderRadius: 20,
    padding: 8,
  },
  rightEdgeSwipeZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: '100%',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
});
