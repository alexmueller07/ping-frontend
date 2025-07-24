import React, { useEffect, useState, useContext, useRef } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator, Text, Image, Alert, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import { useNavigation } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { Audio } from 'expo-av';
import { PanResponder } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';

const APPLE_MAPS_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#545454' }] }, // land
  { elementType: 'labels.text.stroke', stylers: [{ color: '#545454' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#545454' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#012f63' }] }, // deep blue/gray
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#e0e0e0' }] },//# 1a2636
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#545454' }] }, // dark gray
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#545454' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#545454' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#b0b8c1' }] },
  { featureType: 'administrative', elementType: 'labels.text.stroke', stylers: [{ color: '#232629' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#232629' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#232629' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#b0b8c1' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#44474a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#e0e0e3' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#35383b' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#e0e0e3' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#35383b' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#e0e0e3' }] },
];

const DEFAULT_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

type LocationCoords = {
  latitude: number;
  longitude: number;
};

type MapPing = {
  id: string;
  latitude: number;
  longitude: number;
  intensity: number;
  audioUri?: string;
  poster?: { name: string; avatar: string; isMe?: boolean };
  timestamp?: number;
};

const AVATAR_URL = 'https://randomuser.me/api/portraits/men/1.jpg';

// Add placeholder friends and map pings
const FRIENDS = [
  {
    id: 'f1',
    name: 'Alex',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    latitude: 37.7885,
    longitude: -122.4322,
  },
  {
    id: 'f2',
    name: 'Jamie',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    latitude: 37.7880,
    longitude: -122.4330,
  },
];
const MAP_PINGS: MapPing[] = [];

// Haversine formula to calculate distance in meters between two lat/lng points
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type ProfileType = {
  id: string;
  name: string;
  avatar: string;
  isMe: boolean;
  latitude: number;
  longitude: number;
};

// Utility for time ago
function timeAgo(timestamp: number) {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MapScreen({ setRegionName }: { setRegionName?: (name: string) => void }) {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooFarModal, setTooFarModal] = useState(false);
  const [selectedPing, setSelectedPing] = useState(null);
  const theme = useColorScheme();
  const cardBg = Colors.dark.tabIconDefault;
  const textColor = Colors.dark.text;
  const accent = Colors.dark.tint;
  const mapRef = React.useRef<MapView | null>(null);
  const { avatar: userAvatar, name: userName } = useContext(UserContext);
  const navigation = useNavigation();
  const [profileModal, setProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileType | null>(null);
  const [showPingModal, setShowPingModal] = useState(false);
  const [mapPings, setMapPings] = useState<MapPing[]>(MAP_PINGS);
  const [recording, setRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [volume, setVolume] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);
  const [micPressed, setMicPressed] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const volumeInterval = useRef<NodeJS.Timeout | null>(null);
  const [playbackModal, setPlaybackModal] = useState(false);
  const [selectedPingAudio, setSelectedPingAudio] = useState<string | null>(null);
  const [selectedPingMeta, setSelectedPingMeta] = useState<any>(null);
  const [areaName, setAreaName] = useState('');
  const [liveRegion, setLiveRegion] = useState<Region | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [userRegion, setUserRegion] = useState<Region | null>(null);

  // While panning, update header to Loading... or coordinates
  const handleRegionChange = (region: Region) => {
    setLiveRegion(region);
    setIsPanning(true);
    // Do not update header while panning; keep showing last known area name
  };

  // Fetch area name for a given region
  const fetchAreaName = async (region: Region) => {
    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    // Set a new timeout to debounce the API call
    debounceTimeout.current = setTimeout(async () => {
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: region.latitude,
          longitude: region.longitude,
        });
        if (results && results.length > 0) {
          const place = results[0];
          const name =
            place.city ||
            place.district ||
            place.subregion ||
            place.region ||
            place.country ||
            'Earth';
          setAreaName(name);
          setIsPanning(false);
          if (setRegionName) setRegionName(name);
        } else {
          setAreaName('Earth');
          setIsPanning(false);
          if (setRegionName) setRegionName('Earth');
        }
      } catch (e) {
        setAreaName('Earth');
        setIsPanning(false);
        if (setRegionName) setRegionName('Earth');
      }
    }, 200) as any; // Wait 200ms after user stops moving
  };

  // Update area name on initial load and when region changes
  useEffect(() => {
    if (region) {
      fetchAreaName(region);
    }
  }, [region]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Move startRecording and stopRecording above PanResponder
  const startRecording = async () => {
    setRecording(true);
    setRecordedUri(null);
    setShowWaveform(true);
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: false,
    });
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    (global as any).currentRecording = newRecording;
    timerRef.current = setTimeout(() => {
      stopRecording();
    }, 120 * 1000) as any;
    volumeInterval.current = setInterval(() => {
      setVolume(Math.random());
    }, 100) as any;
  };
  const stopRecording = async () => {
    setRecording(false);
    setShowWaveform(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (volumeInterval.current) clearInterval(volumeInterval.current);
    setVolume(0);
    const recording = (global as any).currentRecording;
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      (global as any).currentRecording = null;
    }
  };
  // Use onTouchStart/onTouchEnd for hold-to-record
  const handleMicPressIn = async () => {
    if (!recording && !isSending && !recordedUri) {
      await startRecording();
    }
  };
  const handleMicPressOut = async () => {
    if (recording) {
      await stopRecording();
    }
  };

  // Playback logic for after recording
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const playSound = async (uriOverride?: string | null, loop = true) => {
    const uri = uriOverride ?? recordedUri;
    if (!uri) return;
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setSound(null);
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: false,
    });
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0, isLooping: loop },
      (status) => {
        if (status.isLoaded) {
          setDuration(status.durationMillis || 0);
          setPosition(status.positionMillis || 0);
          if (status.didJustFinish && !status.isLooping) setIsPlaying(false);
        }
      }
    );
    await newSound.setVolumeAsync(1.0);
    soundRef.current = newSound;
    setSound(newSound);
    setIsPlaying(true);
    setShowWaveform(true);
  };
  useEffect(() => {
    if (recordedUri && !recording) {
      playSound(recordedUri, true);
    }
    // Cleanup on modal close
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordedUri, showPingModal]);
  const pauseSound = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      setShowWaveform(false);
    }
  };
  const resumeSound = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
      setShowWaveform(true);
    }
  };
  const trashRecording = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setRecordedUri(null);
    setIsPlaying(false);
    setShowWaveform(false);
    setDuration(0);
    setPosition(0);
  };

  // Update location effect to store user region
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable location in your device settings.');
        setLoading(false);
        return;
      }
      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        const regionObj = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(regionObj);
        setUserRegion(regionObj);
      } catch (e) {
        setError('Could not fetch location. Showing default location.');
      }
      setLoading(false);
    })();
  }, []);

  // Recenter button handler
  const handleRecenter = () => {
    if (userRegion && mapRef.current) {
      mapRef.current.animateToRegion(userRegion, 600);
      Haptics.selectionAsync();
    }
  };

  // Helper to animate map to a region (used for marker tap)
  function animateToRegion(lat: number, lon: number) {
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.004,
      longitudeDelta: 0.004,
    }, 600);
    Haptics.selectionAsync();
  }

  // Mini Ping UI logic for modal
  const sendMapPing = async () => {
    setIsSending(true);
    setTimeout(() => {
      if (location && recordedUri) {
        setMapPings(pings => [
          ...pings,
          {
            id: 'userping-' + Date.now(),
            latitude: location.latitude,
            longitude: location.longitude,
            intensity: 0.7,
            audioUri: recordedUri,
            poster: { name: userName, avatar: userAvatar, isMe: true },
            timestamp: Date.now(),
          } as MapPing,
        ]);
      }
      setIsSending(false);
      setShowPingModal(false);
      setRecordedUri(null);
    }, 1200);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Area pill removed */}
      {error && <Text style={styles.error}>{error}</Text>}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={APPLE_MAPS_DARK_STYLE}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        scrollEnabled={true}
        zoomEnabled={true}
        onRegionChange={fetchAreaName}
      >
        {/* Map pings as hotspots (heat) */}
        {mapPings.map(ping => (
          <Marker
            key={ping.id + '-heat'}
            coordinate={{ latitude: ping.latitude, longitude: ping.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={1}
            onPress={() => {
              if (!location) return;
              Haptics.selectionAsync();
              const dist = getDistanceMeters(location.latitude, location.longitude, ping.latitude, ping.longitude);
              if (dist > 160) {
                setTooFarModal(true);
              } else if (ping.audioUri) {
                setSelectedPingAudio(ping.audioUri);
                setPlaybackModal(true);
                setSelectedPingMeta(ping);
                animateToRegion(ping.latitude, ping.longitude);
              } else {
                Alert.alert('Ping', 'No audio for this ping.');
              }
            }}
          >
            <Svg height={48} width={48}>
              <Defs>
                <RadialGradient id={`grad-${ping.id}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#fffbe7" stopOpacity="1" />
                  <Stop offset="20%" stopColor="#ffe066" stopOpacity="0.95" />
                  <Stop offset="40%" stopColor="#ffb300" stopOpacity="0.8" />
                  <Stop offset="60%" stopColor="#ff3b00" stopOpacity={0.5 + 0.5 * ping.intensity} />
                  <Stop offset="80%" stopColor="#ff3b00" stopOpacity={0.2 + 0.5 * ping.intensity} />
                  <Stop offset="92%" stopColor="#00e676" stopOpacity="0.18" />
                  <Stop offset="100%" stopColor="#1976d2" stopOpacity="0.12" />
                </RadialGradient>
              </Defs>
              <SvgCircle
                cx={24}
                cy={24}
                r={22}
                fill={`url(#grad-${ping.id})`}
                opacity={0.9}
              />
            </Svg>
          </Marker>
        ))}
        {/* User marker */}
        {location && (
          <Marker coordinate={location} onPress={() => {
            animateToRegion(location.latitude, location.longitude);
            setSelectedProfile({
              id: 'me',
              name: userName,
              avatar: userAvatar,
              isMe: true,
              latitude: location.latitude,
              longitude: location.longitude,
            });
            setProfileModal(true);
          }} zIndex={2}>
            <View style={styles.avatarMarkerWrapper}>
              <Image source={{ uri: userAvatar }} style={styles.avatarMarker} />
            </View>
          </Marker>
        )}
        {/* Friend markers */}
        {FRIENDS.map(friend => (
          <Marker key={friend.id} coordinate={{ latitude: friend.latitude, longitude: friend.longitude }} onPress={() => {
            animateToRegion(friend.latitude, friend.longitude);
            setSelectedProfile({ ...friend, isMe: false });
            setProfileModal(true);
          }} zIndex={2}>
            <View style={styles.avatarMarkerWrapper}>
              <Image source={{ uri: friend.avatar }} style={styles.avatarMarker} />
            </View>
          </Marker>
        ))}
      </MapView>
      {/* Floating recenter button */}
      <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter} activeOpacity={0.85}>
        <MaterialIcons name="my-location" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Floating + button OUTSIDE the MapView */}
      <View style={[styles.fabWrapper]} pointerEvents="box-none">
        <View style={styles.fabShadow} />
        <TouchableOpacity style={[styles.fabButton, { borderWidth: 3, borderColor: '#fff' }]} onPress={() => { setShowPingModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
          <Text style={styles.fabPlus}>+</Text>
        </TouchableOpacity>
      </View>
      {/* Too far modal */}
      <Modal
        visible={tooFarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setTooFarModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setTooFarModal(false)}>
          <View style={{ backgroundColor: '#232629', borderRadius: 18, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>Too far away!</Text>
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 12, textAlign: 'center' }}>Get closer to this ping to listen.</Text>
            <Text style={{ color: '#4f8cff', fontSize: 15, marginTop: 8 }}>Within 0.1 miles only</Text>
          </View>
        </Pressable>
      </Modal>
      {/* Profile mini modal/bottom sheet */}
      <Modal
        visible={profileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setProfileModal(false)}>
          <View style={[styles.overlayScreen, { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#232629', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 12 }]}>
            <Image source={{ uri: selectedProfile?.avatar }} style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#4f8cff', marginBottom: 12 }} />
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>
              {selectedProfile?.isMe ? 'This is you' : selectedProfile?.name}
            </Text>
            {!selectedProfile?.isMe && (
              <Text style={{ color: '#aaa', fontSize: 15, marginBottom: 8 }}>@{selectedProfile?.name?.toLowerCase() || ''}</Text>
            )}
            <TouchableOpacity
              style={{ marginTop: 18, backgroundColor: '#4f8cff', borderRadius: 18, paddingHorizontal: 32, paddingVertical: 12 }}
              onPress={() => {
                setProfileModal(false);
                (navigation as any).navigate('Profile');
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Go to Full Profile</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      {/* Ping Modal */}
      <Modal
        visible={showPingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPingModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} pointerEvents="box-none">
          <View style={[styles.overlayScreen, { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#232629', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 12 }]}>
            <TouchableOpacity onPress={() => setShowPingModal(false)} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: '#232629', borderRadius: 16, padding: 6 }}>
              <MaterialCommunityIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Post a Ping to the Map</Text>
            {/* Mic button and waveform */}
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <View
                style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: recording ? '#fff' : '#222', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#4f8cff', marginBottom: 12 }}
                onTouchStart={handleMicPressIn}
                onTouchEnd={handleMicPressOut}
                onTouchCancel={handleMicPressOut}
              >
                <MaterialCommunityIcons name="microphone" size={56} color={recording ? '#888' : '#4f8cff'} />
              </View>
              {showWaveform && <View style={{ marginTop: 8 }}><Text style={{ color: '#4f8cff' }}>Recording...</Text></View>}
            </View>
            {/* Playback UI after recording */}
            {recordedUri && !recording && (
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Preview your Ping</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <TouchableOpacity onPress={isPlaying ? pauseSound : resumeSound} style={{ marginRight: 16 }}>
                    <MaterialCommunityIcons name={isPlaying ? 'pause-circle' : 'play-circle'} size={48} color="#4f8cff" />
                  </TouchableOpacity>
                  <Text style={{ color: '#fff', fontSize: 15 }}>
                    {Math.floor((position || 0) / 1000)}s / {Math.floor((duration || 0) / 1000)}s
                  </Text>
                </View>
                <TouchableOpacity onPress={trashRecording} style={{ marginBottom: 12 }}>
                  <MaterialCommunityIcons name="trash-can" size={32} color="#ff3b00" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginTop: 8, backgroundColor: '#4f8cff', borderRadius: 18, paddingHorizontal: 32, paddingVertical: 12 }}
                  onPress={sendMapPing}
                  disabled={isSending}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{isSending ? 'Sending...' : 'Send to Map'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
      {/* Playback Modal for map ping audio */}
      <Modal
        visible={playbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPlaybackModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} pointerEvents="box-none">
          <View style={[styles.overlayScreen, { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#232629', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 12 }]}>
            <TouchableOpacity onPress={() => setPlaybackModal(false)} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: '#232629', borderRadius: 16, padding: 6 }}>
              <MaterialCommunityIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Listen to Ping</Text>
            {selectedPingMeta && (
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Image source={{ uri: selectedPingMeta.poster?.avatar }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#4f8cff', marginBottom: 6 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{selectedPingMeta.poster?.isMe ? 'You' : selectedPingMeta.poster?.name || 'Unknown'}</Text>
                <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 2 }}>{selectedPingMeta.timestamp ? timeAgo(selectedPingMeta.timestamp) : ''}</Text>
                {selectedPingMeta.poster?.isMe && (
                  <TouchableOpacity onPress={() => {
                    setMapPings(pings => pings.filter(p => p.id !== selectedPingMeta.id));
                    setPlaybackModal(false);
                  }} style={{ marginTop: 6, backgroundColor: '#ff3b00', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 6 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete Ping</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {selectedPingAudio ? (
              <MapPingPlayback audioUri={selectedPingAudio} />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16 }}>No audio available.</Text>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A1B',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181A1B',
  },
  error: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
    fontSize: 16,
  },
  avatarMarkerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    borderRadius: 24,
    padding: 2,
    borderWidth: 2,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#444',
  },
  fabWrapper: {
    position: 'absolute',
    top: 550,
    left: 300,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  fabShadow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000',
    opacity: 0.18,
    top: 0,
    left: 0,
    zIndex: 1,
  },
  fabButton: {
    position: 'absolute',
    top: 4,
    left: 4,
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
    zIndex: 2,
  },
  fabPlus: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: -2,
  },
  areaPillWrapper: {
    position: 'absolute',
    top: 36, // closer to nav header
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  areaPill: {
    backgroundColor: 'rgba(32,32,40,0.92)',
    borderRadius: 22,
    width: 220,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  areaPillScroll: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 18,
  },
  areaPillText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
    textAlign: 'center',
    width: '100%',
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
  recenterBtn: {
    position: 'absolute',
    bottom: 120,
    right: 28 + 64, // offset from the + button
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#232526',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
});

function MapPingPlayback({ audioUri }: { audioUri: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  useEffect(() => {
    let isMounted = true;
    const play = async () => {
      if (!audioUri) return;
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, isLooping: true },
        (status) => {
          if (!isMounted) return;
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            setPosition(status.positionMillis || 0);
            setIsPlaying(status.isPlaying);
          }
        }
      );
      soundRef.current = sound;
    };
    play();
    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [audioUri]);
  const pause = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  };
  const resume = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };
  return (
    <View style={{ alignItems: 'center', marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={isPlaying ? pause : resume} style={{ marginRight: 16 }}>
          <MaterialCommunityIcons name={isPlaying ? 'pause-circle' : 'play-circle'} size={48} color="#4f8cff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 15 }}>
          {Math.floor((position || 0) / 1000)}s / {Math.floor((duration || 0) / 1000)}s
        </Text>
      </View>
    </View>
  );
} 