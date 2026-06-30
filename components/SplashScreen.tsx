import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { LAGOON_PATH } from './LagoonLogo';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const ORANGE = '#e0763c';
const DARK   = '#0B3F3F';
const TEAL   = '#2c8278';

const SIZE      = 72;
const BLOB      = Math.round(SIZE * 0.8);   // 58
const FONT_SIZE = Math.round(SIZE * 0.62);  // 45
const LINE_H    = Math.round(SIZE * 0.7);   // 50
const GAP       = Math.round(SIZE * 0.28);  // 20

type Props = { onDone?: () => void };

export default function SplashScreen({ onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');

  const panelAnim = useRef(new Animated.Value(0)).current; // native driver
  const fillAnim  = useRef(new Animated.Value(0)).current; // JS driver (SVG + text color)
  const slideAnim = useRef(new Animated.Value(0)).current; // native driver

  useEffect(() => {
    const seq = Animated.sequence([
      // 1. Dark panels slide in behind the logo
      Animated.timing(panelAnim, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // 2. Teal gradient fills blob + text colour shifts orange → teal
      Animated.timing(fillAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
      // 3. Hold
      Animated.delay(750),
      // 4. Slide off to the right
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    seq.start(({ finished }) => { if (finished) onDone?.(); });
    return () => seq.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topY = useMemo(
    () => panelAnim.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.6, 0] }),
    [panelAnim, height],
  );
  const bottomY = useMemo(
    () => panelAnim.interpolate({ inputRange: [0, 1], outputRange: [height * 0.6, 0] }),
    [panelAnim, height],
  );
  const slideX = useMemo(
    () => slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width] }),
    [slideAnim, width],
  );

  // Teal gradient fades in after the tide closes
  const fillOpacity = useMemo(
    () => fillAnim.interpolate({ inputRange: [0.2, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    [fillAnim],
  );
  // Text colour: stays orange while gradient fills (so blob and text change together),
  // then shifts to teal in the last third of fillAnim
  const textColor = useMemo(
    () => fillAnim.interpolate({
      inputRange:  [0,      0.6,    1    ],
      outputRange: [ORANGE, ORANGE, TEAL ],
    }),
    [fillAnim],
  );

  return (
    <Animated.View style={[styles.root, { transform: [{ translateX: slideX }] }]}>

      {/* Dark tide panels — rendered FIRST so they sit BEHIND the logo */}
      <Animated.View style={[styles.panelTop,    { transform: [{ translateY: topY }]    }]} />
      <Animated.View style={[styles.panelBottom, { transform: [{ translateY: bottomY }] }]} />

      {/* Logo — rendered AFTER panels so it is always in front.
          Initially orange on orange bg → invisible.
          As dark panels slide behind it the orange logo emerges naturally.
          fillAnim then transitions everything to the teal palette. */}
      <View style={styles.center} pointerEvents="none">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP }}>

          {/* Blob: orange base, teal gradient fades in on top */}
          <Svg width={BLOB} height={BLOB} viewBox="0 0 200 200">
            <Defs>
              <ClipPath id={`clip${id}`}>
                <Path d={LAGOON_PATH} />
              </ClipPath>
              <LinearGradient
                id={`grad${id}`}
                x1="78" y1="26" x2="132" y2="178"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0"    stopColor="#1b4d5b" />
                <Stop offset="0.52" stopColor="#2c8278" />
                <Stop offset="1"    stopColor="#48c6a1" />
              </LinearGradient>
            </Defs>
            {/* Orange base always visible — same colour as root bg initially */}
            <Path d={LAGOON_PATH} fill={ORANGE} />
            {/* Teal gradient overlay fades in */}
            <G clipPath={`url(#clip${id})`}>
              <AnimatedRect
                x="0" y="0" width="200" height="200"
                fill={`url(#grad${id})`}
                fillOpacity={fillOpacity}
              />
            </G>
          </Svg>

          {/* Text: no backgroundColor — colour interpolates orange → teal */}
          <Animated.Text
            style={{
              color: textColor,
              fontSize: FONT_SIZE,
              lineHeight: LINE_H,
              letterSpacing: -0.5,
              fontFamily: 'Baloo2_700Bold',
              includeFontPadding: false,
            }}
          >
            Lagoon
          </Animated.Text>

        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ORANGE,
    zIndex: 999,
  },
  panelTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '55%',
    backgroundColor: DARK,
  },
  panelBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '55%',
    backgroundColor: DARK,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
