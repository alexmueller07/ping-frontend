import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_HEIGHT = 80;
const MAX_HEIGHT = SCREEN_HEIGHT * 0.5;

export default function BottomSheet({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const lastOffset = useRef(SCREEN_HEIGHT - MIN_HEIGHT);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(lastOffset.current);
        translateY.setValue(0);
      },
      onPanResponderMove: Animated.event([
        null,
        { dy: translateY },
      ], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        let toValue = 0;
        if (gestureState.dy > 100) {
          toValue = SCREEN_HEIGHT - MIN_HEIGHT;
        } else if (gestureState.dy < -100) {
          toValue = SCREEN_HEIGHT - MAX_HEIGHT;
        } else {
          toValue = lastOffset.current;
        }
        lastOffset.current = toValue;
        Animated.spring(translateY, {
          toValue: toValue,
          useNativeDriver: true,
          bounciness: 8,
        }).start();
      },
    })
  ).current;

  React.useEffect(() => {
    Animated.spring(translateY, {
      toValue: SCREEN_HEIGHT - MIN_HEIGHT,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
    lastOffset.current = SCREEN_HEIGHT - MIN_HEIGHT;
  }, []);

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          transform: [{ translateY: translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.handle} />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: MAX_HEIGHT,
    backgroundColor: 'rgba(30,30,34,0.92)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    paddingTop: 12,
    paddingHorizontal: 20,
    zIndex: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)', // for web, ignored on native
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 12,
  },
}); 