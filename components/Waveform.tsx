import React, { useRef, useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

type WaveformProps = { volume: number; visible: boolean; size?: number; listening?: boolean };
export default function Waveform({ volume, visible, size = 180, listening = false }: WaveformProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);
  const [barVolumes, setBarVolumes] = useState(Array(12).fill(0));
  useEffect(() => {
    if (!visible && !listening) return;
    const interval = setInterval(() => {
      setBarVolumes(Array(12).fill(0).map(() => listening ? Math.random() * 0.7 + 0.15 : Math.random()));
    }, 80) as any;
    return () => clearInterval(interval);
  }, [visible, listening]);
  const barWidth = size / 18;
  return (
    <Animated.View style={[{
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      width: size,
      height: size * 0.6,
      opacity,
      marginVertical: 12,
    }] }>
      {barVolumes.map((v, i) => {
        const minHeight = size * 0.18;
        const maxHeight = size * 0.6;
        const barHeight = minHeight + v * (maxHeight - minHeight);
        const barColor = `hsl(${180 + i * 12}, 90%, 60%)`;
        return (
          <View
            key={i}
            style={{
              height: barHeight,
              width: barWidth,
              marginHorizontal: 3,
              borderRadius: barWidth,
              backgroundColor: barColor,
              shadowColor: barColor,
              shadowOpacity: 0.7,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
              elevation: 6,
            }}
          />
        );
      })}
    </Animated.View>
  );
} 