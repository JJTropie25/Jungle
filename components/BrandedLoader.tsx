import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { LAGOON_PATH } from './LagoonLogo';
import { useTheme } from '../lib/theme-context';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const PERIMETER = 520;
// Sweeping highlight: ~28% of perimeter
const HIGHLIGHT = Math.round(PERIMETER * 0.28);
const HIGHLIGHT_GAP = PERIMETER - HIGHLIGHT;

type Props = {
  size?: number;
  /** Flat color override for buttons/inline use (e.g. "#fff"). */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function BrandedLoader({ size = 72, color, style }: Props) {
  useTheme();
  const dashOffset = useRef(new Animated.Value(0)).current;
  const gradId = React.useId().replace(/[^a-zA-Z0-9]/g, 'x');

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(dashOffset, {
        toValue: -PERIMETER,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [dashOffset]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient
            id={gradId}
            x1="0" y1="0" x2="200" y2="200"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#e0763c" />
            <Stop offset="0.5" stopColor="#2c8278" />
            <Stop offset="1" stopColor="#48c6a1" />
          </LinearGradient>
        </Defs>

        {/* Full outline — always fully colored with brand gradient or flat color */}
        <Path
          d={LAGOON_PATH}
          fill="none"
          stroke={color ?? `url(#${gradId})`}
          strokeWidth={10}
        />

        {/* Sweeping brightness arc scrolling around the outline */}
        <AnimatedPath
          d={LAGOON_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${HIGHLIGHT},${HIGHLIGHT_GAP}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
    </View>
  );
}
