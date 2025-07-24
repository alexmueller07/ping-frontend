import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Pressable, Platform, Modal, Image, FlatList, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';
import { UserContext } from '../context/UserContext';
import { Animated as RNAnimated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { SvgProps, CircleProps } from 'react-native-svg';
import { PanResponder } from 'react-native';
import LottieView from 'lottie-react-native';
import { addIncomingPing } from './ChatDetailScreen';
import Waveform from '../../components/Waveform';

// Expo Audio does not provide real-time input volume. This is a smooth animated placeholder.
// Now with color and glow for more visual interest.
// Update Waveform props
type WaveformProps = { volume: number; visible: boolean; size?: number; listening?: boolean };

type PingScreenProps = { setMicPressed?: Dispatch<SetStateAction<boolean>>; setShowTopBar?: Dispatch<SetStateAction<boolean>>; onReplayStateChange?: (isReplay: boolean) => void };
const PingScreen = forwardRef(function PingScreen({ setMicPressed, setShowTopBar, onReplayStateChange }: PingScreenProps, ref) {
  const [recording, setRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Set both the timeout and the ring to 2 minutes (120 seconds)
  const MAX_RECORD_SECONDS = 120; // 2 minutes
  const maxDuration = MAX_RECORD_SECONDS * 1000; // 2 minutes in ms
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const volumeInterval = useRef<NodeJS.Timeout | null>(null);
  const isHolding = useRef(false);
  // Add state to track if the user is pressing the mic
  const [micPressed, setMicPressedState] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const insets = useSafeAreaInsets();
  const TOP_BAR_HEIGHT = 48;
  const ICON_HEIGHT = 36;
  const verticalOffset = insets.top + (TOP_BAR_HEIGHT - ICON_HEIGHT) / 2;
  const userContext = useContext(UserContext) as { avatar: string } | undefined;
  const avatar = userContext?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg';
  const [recordingTime, setRecordingTime] = useState(0);
  const [recentPings, setRecentPings] = useState<string[]>([]);
  const glowAnim = useRef(new RNAnimated.Value(0)).current;
  // Contact selection modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  
  // Voice effects and people modals state
  const [showVoiceEffectsModal, setShowVoiceEffectsModal] = useState(false);
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  
  // Friends data (using the same users from ChatScreen for consistency)
  const FRIENDS = [
    { id: '1', name: 'Alice', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', online: true },
    { id: '2', name: 'Bob', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', online: false },
    { id: '3', name: 'Charlie', avatar: 'https://randomuser.me/api/portraits/men/3.jpg', online: true },
    { id: '4', name: 'Diana', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', online: true },
    { id: '5', name: 'Ethan', avatar: 'https://randomuser.me/api/portraits/men/5.jpg', online: false },
    { id: '6', name: 'Fiona', avatar: 'https://randomuser.me/api/portraits/women/6.jpg', online: true },
    { id: '7', name: 'George', avatar: 'https://randomuser.me/api/portraits/men/7.jpg', online: false },
    { id: '8', name: 'Hannah', avatar: 'https://randomuser.me/api/portraits/women/8.jpg', online: true },
    { id: '9', name: 'Ian', avatar: 'https://randomuser.me/api/portraits/men/9.jpg', online: false },
    { id: '10', name: 'Julia', avatar: 'https://randomuser.me/api/portraits/women/10.jpg', online: true },
    { id: '11', name: 'Kevin', avatar: 'https://randomuser.me/api/portraits/men/11.jpg', online: false },
    { id: '12', name: 'Lily', avatar: 'https://randomuser.me/api/portraits/women/12.jpg', online: true },
    { id: '13', name: 'Marcus', avatar: 'https://randomuser.me/api/portraits/men/13.jpg', online: false },
    { id: '14', name: 'Nina', avatar: 'https://randomuser.me/api/portraits/women/14.jpg', online: true },
    { id: '15', name: 'Oscar', avatar: 'https://randomuser.me/api/portraits/men/15.jpg', online: false },
    { id: '16', name: 'Penny', avatar: 'https://randomuser.me/api/portraits/women/16.jpg', online: true },
    { id: '17', name: 'Quinn', avatar: 'https://randomuser.me/api/portraits/men/17.jpg', online: false },
    { id: '18', name: 'Rachel', avatar: 'https://randomuser.me/api/portraits/women/18.jpg', online: true },
    { id: '19', name: 'Sam', avatar: 'https://randomuser.me/api/portraits/men/19.jpg', online: false },
    { id: '20', name: 'Tara', avatar: 'https://randomuser.me/api/portraits/women/20.jpg', online: true },
    { id: '21', name: 'Uma', avatar: 'https://randomuser.me/api/portraits/women/21.jpg', online: false },
    { id: '22', name: 'Victor', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', online: true },
    { id: '23', name: 'Wendy', avatar: 'https://randomuser.me/api/portraits/women/23.jpg', online: false },
  ];
  // 1. Remove the info modal and all references to setShowInfo, showInfo, and the info icon.
  // 2. Move the idle/listening waveform outside and below the mic circle when not recording.
  // In the render, replace:
  // <View style={{ position: 'absolute', top: 24, right: 24, zIndex: 20 }}>
  //   <Image ... />
  // </View>
  // with a more subtle avatar overlay (or remove entirely for minimalism).
  // 3. Make the idle waveform respond to actual microphone input volume if possible.
  // Add a useEffect to request mic permissions and sample input volume when idle (simulate if not possible in Expo):
  const [idleVolume, setIdleVolume] = useState(0.1);
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let t = 0;
    let isMounted = true;
    if (!recording && !recordedUri) {
      interval = setInterval(() => {
        if (!isMounted) return;
        t += 0.09;
        // Sine wave for smoothness, with a little noise
        setIdleVolume(0.08 + 0.12 * (0.5 + 0.5 * Math.sin(t)) + Math.random() * 0.04);
      }, 60) as any;
    }
    return () => { isMounted = false; if (interval) clearInterval(interval); };
  }, [recording, recordedUri]);

  // Robust cleanup: stop playback, unload sound, clear intervals on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        try { soundRef.current.stopAsync(); } catch {}
        try { soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
        setSound(null);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      if (volumeInterval.current) clearInterval(volumeInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount/unmount

  // Expose stopPlayback to parent
  const stopPlayback = async () => {
    setIsDeleted(true);
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
      setSound(null);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (volumeInterval.current) clearInterval(volumeInterval.current);
    setIsPlaying(false);
    setShowWaveform(false);
  };

  // NEW: Force cleanup (stop recording, playback, clear state)
  const forceCleanup = async () => {
    // Stop playback and intervals
    await stopPlayback();
    // Stop recording if in progress
    if (recording || (global as any).currentRecording) {
      try {
        const rec = (global as any).currentRecording;
        if (rec) {
          await rec.stopAndUnloadAsync();
        }
      } catch {}
      (global as any).currentRecording = null;
    }
    setRecording(false);
    setMicPressedState(false);
    setMicPressed?.(false);
    setRecordedUri(null);
    setDuration(0);
    setPosition(0);
    setShowWaveform(false);
    setIsSending(false);
    setIsDeleted(false);
    setVolume(0);
  };

  const pausePlayback = async () => {
    if (soundRef.current) {
      try { await soundRef.current.pauseAsync(); } catch {}
      setIsPlaying(false);
      setShowWaveform(false);
    }
  };

  useImperativeHandle(ref, () => ({
    stopPlayback,
    pausePlayback,
    resumePlayback: async () => {
      if (recordedUri && !isPlaying) {
        await playSound(true, recordedUri, true);
      }
    },
    isReplay: recordedUri && !recording,
    trashPing,
    forceCleanup, // Expose to parent
  }), [sound, recordedUri, isPlaying, recording]);

  // Notify parent when replay state changes
  useEffect(() => {
    if (onReplayStateChange) {
      onReplayStateChange(!!(recordedUri && !recording));
    }
  }, [recordedUri, recording, onReplayStateChange]);

  // 8. Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (recording) {
      setRecordingTime(0);
      interval = setInterval(() => setRecordingTime(t => {
        if (t + 1 >= MAX_RECORD_SECONDS) {
          stopRecording();
          return 0;
        }
        return t + 1;
      }), 1000) as any;
    } else if (!recording && recordingTime !== 0) {
      setRecordingTime(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [recording]);

  // 7. Animated glowing mic button
  useEffect(() => {
    if (recording) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(glowAnim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          RNAnimated.timing(glowAnim, { toValue: 0, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [recording]);

  const startRecording = async () => {
    setIsDeleted(false);
    if (recording || isSending || !!recordedUri) return;
    isHolding.current = true;
    setRecording(true);
    setRecordedUri(null);
    Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true }).start();
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    }, maxDuration) as any; // Now 2 minutes
    // Simulate volume changes for waveform (since real-time volume is not available in Expo Audio)
    volumeInterval.current = setInterval(() => {
      setVolume(Math.random());
    }, 100) as any;
  };

  const stopRecording = async () => {
    setIsLocked(false);
    setShowLock(false);
    if (!isHolding.current) return;
    isHolding.current = false;
    setRecording(false);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (volumeInterval.current) clearInterval(volumeInterval.current);
    setVolume(0);
    const recording = (global as any).currentRecording;
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      (global as any).currentRecording = null;
      setTimeout(() => {
        playSound(true, uri, true); // pass uri directly for auto-replay, loop
      }, 300);
      setIsPlaying(true); // reflect playback in UI
      setShowWaveform(true);
    }
  };

  // Modify playSound to accept a 'loud' param, an optional uri, and a loop flag
  const playSound = async (loud = false, uriOverride?: string | null, loop = false) => {
    if (isDeleted) return;
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
      onPlaybackStatusUpdate
    );
    await newSound.setVolumeAsync(1.0);
    soundRef.current = newSound;
    setSound(newSound);
    setIsPlaying(true);
    setShowWaveform(true);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (isDeleted) return;
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      if (status.didJustFinish) {
        // If looping, keep playing, else stop
        if (!status.isLooping) setIsPlaying(false);
      }
    }
  };

  const pauseSound = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      setShowWaveform(false);
    }
  };

  // 10. On sendPing, add to recentPings (filter nulls)
  const sendPing = async () => {
    setShowContactModal(true);
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSendToContacts = async () => {
    if (selectedContacts.length === 0) return;
    
    setIsSending(true);
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (volumeInterval.current) clearInterval(volumeInterval.current);
    
    // Add ping to each selected friend's chat
    if (recordedUri) {
      selectedContacts.forEach(friendId => {
        addIncomingPing(friendId, recordedUri);
      });
    }
    
    // Simulate sending to selected contacts
    setTimeout(() => {
      setIsSending(false);
      setRecordedUri(null);
      setIsPlaying(false);
      setDuration(0);
      setPosition(0);
      setShowWaveform(false);
      setSelectedContacts([]);
      setShowContactModal(false);
      setRecentPings(pings => [recordedUri, ...pings].filter((x): x is string => !!x).slice(0, 5));
    }, 1200);
  };

  const cancelContactSelection = () => {
    setSelectedContacts([]);
    setShowContactModal(false);
  };

  const trashPing = async () => {
    // Prevent multiple calls
    if (!recordedUri) return;
    await stopPlayback();
    setRecordedUri(null);
    setDuration(0);
    setPosition(0);
    setShowWaveform(false);
  };

  // No playback card, just waveform and controls after recording

  // Refactor handlers
  const handleMicPressIn = async () => {
    if (recording || isSending || !!recordedUri) {
      if (isLocked) {
        setIsLocked(false);
        await stopRecording();
      }
      return;
    }
    setMicPressed?.(true);
    setMicPressedState(true);
    await startRecording();
  };

  const handleMicPressOut = async () => {
    if (!micPressed) return;
    setMicPressed?.(false);
    setMicPressedState(false);
    await stopRecording();
  };

  const [isLocked, setIsLocked] = useState(false);
  const [showLock, setShowLock] = useState(false);
  const lockThreshold = 80; // px to the left
  const pan = useRef(new RNAnimated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => recording && !isLocked,
      onMoveShouldSetPanResponder: () => recording && !isLocked,
      onPanResponderMove: (e, gesture) => {
        if (!recording || isLocked) return;
        if (gesture.dx < -lockThreshold) {
          setShowLock(true);
        } else {
          setShowLock(false);
        }
      },
      onPanResponderRelease: (e, gesture) => {
        if (!recording || isLocked) return;
        if (gesture.dx < -lockThreshold) {
          setIsLocked(true);
          setShowLock(false);
        } else {
          setShowLock(false);
          handleMicPressOut();
        }
      },
      onPanResponderTerminate: () => {
        setShowLock(false);
      },
    })
  ).current;

  // --- Gamification Data ---
  const STREAK = 8;
  const BADGES = [
    { id: 'b1', name: 'First Ping!', icon: 'star', color: '#FFD700' },
    { id: 'b2', name: '7-Day Streak', icon: 'fire', color: '#FF5E3A' },
  ];

  function StreakBar({ streak }: { streak: number }) {
    return (
      <View style={styles.streakBar}>
        <Text style={styles.streakText}>🔥 {streak}-day streak</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(streak, 14) / 14 * 100}%` }]} />
        </View>
      </View>
    );
  }

  function BadgeRow({ badges }: { badges: any[] }) {
    return (
      <View style={styles.badgeRow}>
        {badges.map(b => (
          <View key={b.id} style={[styles.badge, { backgroundColor: b.color + '22' }]}>
            <MaterialCommunityIcons name={b.icon} size={22} color={b.color} />
            <Text style={{ color: b.color, fontWeight: 'bold', fontSize: 13, marginLeft: 4 }}>{b.name}</Text>
          </View>
        ))}
      </View>
    );
  }

  // Function to apply a voice effect
  const applyVoiceEffect = async (effect: string) => {
    if (!recordedUri) return;
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setSound(null);
    }

    let newUri: string | null = null;
    let newDuration: number | null = null;

    switch (effect) {
      case 'robot':
        newUri = await applyRobotEffect(recordedUri);
        break;
      case 'echo':
        newUri = await applyEchoEffect(recordedUri);
        break;
      case 'deep':
        newUri = await applyDeepEffect(recordedUri);
        break;
      case 'chipmunk':
        newUri = await applyChipmunkEffect(recordedUri);
        break;
      default:
        return; // No effect applied
    }

    if (newUri) {
      setRecordedUri(newUri);
      setIsPlaying(true);
      setShowWaveform(true);
      setDuration(newDuration || 0);
      setPosition(0);
    }
  };

  // Placeholder functions for voice effects
  const applyRobotEffect = async (uri: string) => {
    console.log('Applying Robot Effect to:', uri);
    try {
      // Create a new audio context for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create a new buffer for the processed audio
      const processedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Apply robot effect (modulation)
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = processedBuffer.getChannelData(channel);
        
        for (let i = 0; i < inputData.length; i++) {
          // Robot effect: modulate the amplitude with a sine wave
          const modulation = Math.sin(i * 0.01) * 0.3 + 0.7;
          outputData[i] = inputData[i] * modulation;
        }
      }
      
      // Convert back to blob and create new URI
      const processedArrayBuffer = await audioBufferToArrayBuffer(processedBuffer);
      const blob = new Blob([processedArrayBuffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error applying robot effect:', error);
      return uri; // Fallback to original
    }
  };

  const applyEchoEffect = async (uri: string) => {
    console.log('Applying Echo Effect to:', uri);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const processedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length + 8000, // Add space for echo
        audioBuffer.sampleRate
      );
      
      // Apply echo effect
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = processedBuffer.getChannelData(channel);
        
        for (let i = 0; i < inputData.length; i++) {
          outputData[i] = inputData[i];
          // Add echo after 2000 samples (about 0.045 seconds)
          if (i + 2000 < outputData.length) {
            outputData[i + 2000] += inputData[i] * 0.5;
          }
        }
      }
      
      const processedArrayBuffer = await audioBufferToArrayBuffer(processedBuffer);
      const blob = new Blob([processedArrayBuffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error applying echo effect:', error);
      return uri;
    }
  };

  const applyDeepEffect = async (uri: string) => {
    console.log('Applying Deep Effect to:', uri);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const processedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Apply deep voice effect (pitch shift down)
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = processedBuffer.getChannelData(channel);
        
        for (let i = 0; i < inputData.length; i++) {
          // Simple pitch shift: sample every other sample to lower pitch
          const sourceIndex = Math.floor(i * 0.7);
          if (sourceIndex < inputData.length) {
            outputData[i] = inputData[sourceIndex] * 1.2; // Amplify slightly
          }
        }
      }
      
      const processedArrayBuffer = await audioBufferToArrayBuffer(processedBuffer);
      const blob = new Blob([processedArrayBuffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error applying deep effect:', error);
      return uri;
    }
  };

  const applyChipmunkEffect = async (uri: string) => {
    console.log('Applying Chipmunk Effect to:', uri);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const processedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Apply chipmunk effect (pitch shift up)
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = processedBuffer.getChannelData(channel);
        
        for (let i = 0; i < inputData.length; i++) {
          // Simple pitch shift: interpolate between samples to raise pitch
          const sourceIndex = i * 1.3;
          const index1 = Math.floor(sourceIndex);
          const index2 = index1 + 1;
          const fraction = sourceIndex - index1;
          
          if (index1 < inputData.length && index2 < inputData.length) {
            outputData[i] = inputData[index1] * (1 - fraction) + inputData[index2] * fraction;
          } else if (index1 < inputData.length) {
            outputData[i] = inputData[index1];
          }
        }
      }
      
      const processedArrayBuffer = await audioBufferToArrayBuffer(processedBuffer);
      const blob = new Blob([processedArrayBuffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error applying chipmunk effect:', error);
      return uri;
    }
  };

  // Helper function to convert AudioBuffer to ArrayBuffer
  const audioBufferToArrayBuffer = async (audioBuffer: AudioBuffer): Promise<ArrayBuffer> => {
    const length = audioBuffer.length * audioBuffer.numberOfChannels * 2; // 16-bit samples
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    
    let offset = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic message at the top (where streak bar was) */}
      <View style={styles.topTextWrapper}>
        <Text style={styles.dynamicText}>
          {recording ? 'Listening... Release to Send' : recordedUri ? 'Listen or Send your Ping!' : 'Hold to Ping!'}
        </Text>
      </View>
      {/* Mic button at 50% (center) */}
      <View style={styles.absoluteMicButtonWrapper}>
        {(!recordedUri || recording) && (
          <View style={styles.pillBar}>
            <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', overflow: 'visible', position: 'relative' }}>
              {/* Animated progress arc around mic button */}
              {recording && (
                <Svg width={160} height={160} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, transform: [{ rotate: '-85deg' }] }}>
                  <Circle
                    cx={80}
                    cy={80}
                    r={75}
                    stroke="#ff3333"
                    strokeWidth={10}
                    fill="none"
                    strokeDasharray={2 * Math.PI * 75}
                    strokeDashoffset={2 * Math.PI * 75 * (1 - recordingTime / MAX_RECORD_SECONDS)}
                    strokeLinecap="round"
                  />
                </Svg>
              )}
              {/* Mic button - remove absolute positioning, center naturally */}
              <RNAnimated.View
                style={[
                  styles.circle,
                  recording && styles.circleActive,
                  {
                    shadowColor: '#7cf',
                    shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] }),
                    shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 32] }),
                    borderColor: recording ? '#fff' : '#fff',
                    backgroundColor: recording ? '#fff' : '#222',
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
                onTouchStart={handleMicPressIn}
                onTouchEnd={handleMicPressOut}
                onTouchCancel={handleMicPressOut}
              >
                <View
                  style={{ position: 'relative', justifyContent: 'center', alignItems: 'center', width: 120, height: 120 }}
                  {...(recording && !isLocked ? panResponder.panHandlers : {})}
                >
                  {/* Lock UI and mic icon remain unchanged */}
                  {recording && !isLocked && (
                    <View style={{ position: 'absolute', left: -110, top: 32, zIndex: 10, alignItems: 'center', flexDirection: 'row' }}>
                      <Ionicons
                        name="lock-closed"
                        size={44}
                        color={showLock ? '#00ff99' : '#00e6ff'}
                        style={{ backgroundColor: '#232526', borderRadius: 22, padding: 6, shadowColor: '#00e6ff', shadowOpacity: 0.4, shadowRadius: 10, borderWidth: showLock ? 3 : 0, borderColor: showLock ? '#00ff99' : 'transparent' }}
                      />
                      {/* Chevrons/arrows */}
                      <Ionicons name="chevron-forward" size={32} color="#00e6ff" style={{ marginHorizontal: -8, opacity: 0.7 }} />
                      <Ionicons name="chevron-forward" size={32} color="#00e6ff" style={{ marginHorizontal: -8, opacity: 0.5 }} />
                      <Ionicons name="chevron-forward" size={32} color="#00e6ff" style={{ marginHorizontal: -8, opacity: 0.3 }} />
                    </View>
                  )}
                  {recording && isLocked && (
                    <View style={{ position: 'absolute', left: -110, top: 32, zIndex: 10, alignItems: 'center', flexDirection: 'row' }}>
                      <Ionicons
                        name="lock-closed"
                        size={44}
                        color="#00ff99"
                        style={{ backgroundColor: '#232526', borderRadius: 22, padding: 6, shadowColor: '#00ff99', shadowOpacity: 0.5, shadowRadius: 10, borderWidth: 3, borderColor: '#00ff99' }}
                      />
                      <Ionicons name="chevron-forward" size={32} color="#00ff99" style={{ marginHorizontal: -8, opacity: 0.7 }} />
                      <Ionicons name="chevron-forward" size={32} color="#00ff99" style={{ marginHorizontal: -8, opacity: 0.5 }} />
                      <Ionicons name="chevron-forward" size={32} color="#00ff99" style={{ marginHorizontal: -8, opacity: 0.3 }} />
                    </View>
                  )}
                  {/* Mic icon: white when idle, grey when recording */}
                  <MaterialCommunityIcons name="microphone" size={72} color={recording ? '#888' : '#fff'} style={{ zIndex: 2 }} />
                </View>
              </RNAnimated.View>
            </View>
          </View>
        )}
        {/* Playback UI after recording */}
        {(recordedUri && !recording) && (
          <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {showWaveform && <Waveform volume={1} visible={true} size={220} />}
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              {isPlaying ? (
                <View style={{ alignItems: 'center' }}>
                  <MaterialCommunityIcons name="waveform" size={38} color="#7cf" style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: 22, color: '#7cf', textShadowColor: '#222', textShadowRadius: 8, fontWeight: '600' }}>Playing...</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 22, color: '#fff', opacity: 0.7, fontWeight: '600' }}>Paused</Text>
              )}
              <Text style={{ color: '#fff', fontSize: 14, minWidth: 60, marginTop: 4 }}>
                {Math.floor((position || 0) / 1000)}s / {Math.floor((duration || 0) / 1000)}s
              </Text>
            </View>
            {/* Animated send button */}
            <TouchableOpacity style={{ marginTop: 32, backgroundColor: '#232526', borderRadius: 32, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, elevation: 8, borderWidth: 2, borderColor: '#7cf' }} onPress={sendPing} disabled={isSending}>
              <MaterialCommunityIcons name="send-circle" size={64} color={isSending ? '#888' : '#7cf'} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Waveform at 75% of the screen (where text was) */}
      {(!recordedUri) && (
        <RNAnimated.View style={[styles.absoluteWaveform, { top: '75%' }]}> 
          <Waveform volume={recording ? volume : idleVolume} visible={true} size={120} />
        </RNAnimated.View>
      )}
      {/* FAB at the bottom */}
      {/* Voice Effects Button (bottom left) */}
      <TouchableOpacity style={styles.voiceEffectsFab} activeOpacity={0.85} onPress={() => setShowVoiceEffectsModal(true)}>
        <MaterialCommunityIcons name="music-note" size={28} color="#fff" />
      </TouchableOpacity>
      
      {/* People Button (bottom right) */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setShowPeopleModal(true)}>
        <Ionicons name="people" size={28} color="#fff" />
      </TouchableOpacity>
      
      {/* Contact Selection Modal */}
      {showContactModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.contactModal}>
            <View style={styles.contactModalHeader}>
              <Text style={styles.contactModalTitle}>Send Ping To</Text>
              <TouchableOpacity onPress={cancelContactSelection} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <Text style={{ color: '#fff', marginBottom: 10 }}>Friends: {FRIENDS.length}</Text>
            
            <FlatList
              data={FRIENDS}
              keyExtractor={item => item.id}
              style={styles.contactList}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => handleContactToggle(item.id)}
                >
                  <View style={styles.contactAvatarContainer}>
                    <Image source={{ uri: item.avatar }} style={styles.contactAvatar} />
                    <View style={[styles.onlineDot, { backgroundColor: item.online ? '#4f8cff' : '#bbb' }]} />
                  </View>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <View style={[styles.checkbox, selectedContacts.includes(item.id) && styles.checkboxSelected]}>
                    {selectedContacts.includes(item.id) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
            
            <View style={styles.contactModalFooter}>
              <TouchableOpacity 
                style={[styles.sendButton, selectedContacts.length === 0 && styles.sendButtonDisabled]}
                onPress={handleSendToContacts}
                disabled={selectedContacts.length === 0 || isSending}
              >
                <Text style={styles.sendButtonText}>
                  {isSending ? 'Sending...' : `Send to ${selectedContacts.length} friend${selectedContacts.length !== 1 ? 's' : ''}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* People Modal */}
      {showPeopleModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.peopleModal}>
            <View style={styles.peopleModalHeader}>
              <Text style={styles.peopleModalTitle}>Add Friends</Text>
              <TouchableOpacity onPress={() => setShowPeopleModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              placeholder="Search users..."
              placeholderTextColor="#888"
              style={styles.searchInput}
              editable={true}
            />
            
            <View style={styles.peopleModalFooter}>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  // TODO: Implement add friend functionality
                  setShowPeopleModal(false);
                }}
              >
                <Text style={styles.addButtonText}>Add Friend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* Voice Effects Modal */}
      {showVoiceEffectsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.voiceEffectsModal}>
            <View style={styles.voiceEffectsModalHeader}>
              <Text style={styles.voiceEffectsModalTitle}>Voice Effects</Text>
              <TouchableOpacity onPress={() => setShowVoiceEffectsModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.effectsGrid}>
              <TouchableOpacity 
                style={[styles.effectButton, selectedEffect === 'robot' && styles.effectButtonSelected]}
                onPress={() => setSelectedEffect('robot')}
              >
                <MaterialCommunityIcons name="robot" size={32} color={selectedEffect === 'robot' ? '#fff' : '#4f8cff'} />
                <Text style={[styles.effectText, selectedEffect === 'robot' && styles.effectTextSelected]}>Robot</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.effectButton, selectedEffect === 'echo' && styles.effectButtonSelected]}
                onPress={() => setSelectedEffect('echo')}
              >
                <MaterialCommunityIcons name="music" size={32} color={selectedEffect === 'echo' ? '#fff' : '#4f8cff'} />
                <Text style={[styles.effectText, selectedEffect === 'echo' && styles.effectTextSelected]}>Echo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.effectButton, selectedEffect === 'deep' && styles.effectButtonSelected]}
                onPress={() => setSelectedEffect('deep')}
              >
                <MaterialCommunityIcons name="volume-high" size={32} color={selectedEffect === 'deep' ? '#fff' : '#4f8cff'} />
                <Text style={[styles.effectText, selectedEffect === 'deep' && styles.effectTextSelected]}>Deep</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.effectButton, selectedEffect === 'chipmunk' && styles.effectButtonSelected]}
                onPress={() => setSelectedEffect('chipmunk')}
              >
                <MaterialCommunityIcons name="microphone-variant" size={32} color={selectedEffect === 'chipmunk' ? '#fff' : '#4f8cff'} />
                <Text style={[styles.effectText, selectedEffect === 'chipmunk' && styles.effectTextSelected]}>Chipmunk</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.voiceEffectsModalFooter}>
              <TouchableOpacity 
                style={[styles.applyButton, !selectedEffect && styles.applyButtonDisabled]}
                onPress={() => {
                  if (selectedEffect) {
                    // Apply the selected effect
                    applyVoiceEffect(selectedEffect);
                    setShowVoiceEffectsModal(false);
                  }
                }}
                disabled={!selectedEffect}
              >
                <Text style={styles.applyButtonText}>
                  {selectedEffect ? `Apply ${selectedEffect.charAt(0).toUpperCase() + selectedEffect.slice(1)} Effect` : 'Select an Effect'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* ANIMATED PROGRESS RING: Always visible, shows progress based on recordingTime */}
      <Svg width={400} height={400} style={{ position: 'absolute', top: 650, left: 50, zIndex: 150 }}>
        {/* Background ring */}
        <Circle
          cx={200}
          cy={200}
          r={180}
          stroke="#333"
          strokeWidth={48}
          opacity={0.18}
          fill="none"
        />
        {/* Animated progress ring */}
        <Circle
          cx={200}
          cy={200}
          r={180}
          stroke="#ff3333"
          strokeWidth={48}
          fill="none"
          strokeDasharray={2 * Math.PI * 180}
          strokeDashoffset={2 * Math.PI * 180 * (1 - recordingTime / MAX_RECORD_SECONDS)}
          strokeLinecap="round"
        />
      </Svg>
    </SafeAreaView>
  );
});
export default PingScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181A1B',
  },
  container: {
    flex: 1,
    backgroundColor: '#181A1B',
    position: 'relative',
  },
  pillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 340,
    height: 120,
    justifyContent: 'center',
    marginBottom: 16,
  },
  pillFiller: {
    flex: 1,
    height: 40,
    backgroundColor: '#222',
    borderRadius: 20,
    marginHorizontal: 2,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#444',
    position: 'relative',
    overflow: 'hidden',
  },
  circleActive: {
    borderColor: '#fff',
    shadowOpacity: 0.7,
    shadowRadius: 24,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  waveformContainer: {
    position: 'absolute',
    bottom: 12,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 40,
    width: 100,
    zIndex: 10,
  },
  waveBar: {
    width: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 1,
  },
  playbackCard: {
    backgroundColor: '#222',
    borderRadius: 18,
    padding: 18,
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    width: 320,
    alignSelf: 'center',
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  playPauseButton: {
    marginRight: 16,
    backgroundColor: '#444',
    borderRadius: 20,
    padding: 8,
  },
  progressBarBg: {
    width: 180, // Use the larger width for gamification
    height: 8,
    backgroundColor: '#23242a', // Use the gamified color
    borderRadius: 6, // Use the gamified radius
    overflow: 'hidden',
    marginRight: 12, // Keep marginRight for playback bar
  },
  progressBar: {
    height: 8,
    backgroundColor: '#888',
    borderRadius: 4,
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    minWidth: 60,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  sendButton: {
    backgroundColor: '#444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 16,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  trashButton: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 25,
  },
  playbackMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    marginTop: 0,
  },
  fabSend: {
    position: 'absolute',
    bottom: 104, // was 32, now above the 92px tab bar
    right: 24,
    zIndex: 10,
    backgroundColor: 'transparent',
    borderRadius: 32,
    elevation: 8,
  },
  // Add styles for the top bar and its buttons
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    zIndex: 100,
    backgroundColor: 'rgba(24,26,27,0.95)',
  },
  topBarButtonLeft: {
    padding: 8,
  },
  topBarButtonRight: {
    padding: 8,
  },
  // --- New styles for gamification and UI polish ---
  streakBar: {
    marginTop: 18,
    alignItems: 'center',
    marginBottom: 6,
  },
  streakText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#4f8cff',
    borderRadius: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
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
  pingButtonContainer: {
    alignItems: 'center',
    marginVertical: 18,
  },
  pingButton: {
    borderRadius: 48,
    overflow: 'hidden',
  },
  pingButtonGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    zIndex: 10,
    pointerEvents: 'none',
  },
  pingHistory: {
    marginTop: 12,
    alignItems: 'center',
    marginBottom: 80, // Add space above FAB
  },
  pingHistoryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  pingAvatarWrapper: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  pingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#4f8cff',
    marginBottom: 2,
  },
  pingStreak: {
    color: '#ff5e3a',
    fontSize: 13,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Move up so it's above the nav bar
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
  headerContainer: {
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 0,
  },
  dynamicText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 0,
    minHeight: 28,
  },
  micButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 0,
    marginBottom: 0,
  },
  absoluteWaveform: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  absoluteMicButtonWrapper: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -80 }], // half of mic button height
    zIndex: 3,
  },
  absoluteTextWrapper: {
    position: 'absolute',
    top: '75%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  topTextWrapper: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  contactModal: {
    backgroundColor: '#232526',
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  contactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  contactModalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  contactList: {
    width: '100%',
    maxHeight: 300,
    marginVertical: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#2a2c2e',
  },
  contactAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4f8cff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  contactName: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4f8cff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#4f8cff',
    borderColor: '#4f8cff',
  },
  contactModalFooter: {
    width: '100%',
    marginTop: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  voiceEffectsFab: {
    position: 'absolute',
    bottom: 100, // Move up so it's above the nav bar
    left: 28,
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
  peopleModal: {
    backgroundColor: '#232526',
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  peopleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  peopleModalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  peopleModalFooter: {
    width: '100%',
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#4f8cff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  voiceEffectsModal: {
    backgroundColor: '#232526',
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  voiceEffectsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  voiceEffectsModalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  effectButton: {
    width: '45%', // Adjust as needed for grid layout
    alignItems: 'center',
    marginVertical: 10,
  },
  effectButtonSelected: {
    backgroundColor: '#4f8cff',
    borderColor: '#fff',
    borderWidth: 2,
  },
  effectText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  effectTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  voiceEffectsModalFooter: {
    width: '100%',
    marginTop: 20,
  },
  applyButton: {
    backgroundColor: '#4f8cff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 