// LagoonLogo.tsx
// Logo Lagoon — stessa forma e stesso gradiente glossy del logo statico.
// Dipendenza: react-native-svg  ->  npx expo install react-native-svg
//
// Uso base:
//   import { LagoonLogo } from './LagoonLogo';
//   <LagoonLogo size={96} />                 // icona dentro tile arancio
//   <LagoonLogo size={96} variant="dark" />  // versione per fondo scuro
//   <LagoonLogo size={96} tile={false} />    // solo la sagoma, senza sfondo

import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, {
  Defs,
  ClipPath,
  Path,
  Rect,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

// Silhouette originale, ricalcata dai pixel dell'icona.
export const LAGOON_PATH =
  'M115 166.8 C106.7 168.1 102.6 167.0 97 165.6 C91.4 164.2 89.0 166.4 81.2 158.4 ' +
  'C73.4 150.4 58.4 129.8 50.3 117.5 C42.2 105.2 36.5 93.3 32.4 84.5 C28.3 75.7 26.8 70.7 25.5 64.5 ' +
  'C24.3 58.3 23.6 52.4 24.9 47.5 C26.2 42.6 30.0 37.9 33.2 35.4 C36.4 32.9 37.9 32.2 44 32.6 ' +
  'C50.1 33.0 59.0 30.1 70 37.6 C81.0 45.1 95.5 68.8 110 77.6 C124.5 86.4 146.9 86.5 157 90.7 ' +
  'C167.1 94.9 167.3 97.0 170.3 102.5 C173.3 108.0 175.7 116.5 174.9 123.5 C174.1 130.5 170.3 138.5 165.7 144.3 ' +
  'C161.0 150.1 155.4 154.3 147 158.1 C138.6 161.8 123.3 165.6 115 166.8 Z';

export const LAGOON_COLORS = {
  orange: '#e0763c',
  cream: '#f2ede4',
  night: '#21302f',
  ink: '#2d2a26',
};

type Variant = 'light' | 'dark' | 'cream' | 'night' | 'mono';

type Props = {
  size?: number;
  /** disegna lo sfondo arancio arrotondato (tile app-icon). false = solo sagoma trasparente */
  tile?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

export function LagoonLogo({ size = 96, tile = true, variant = 'light', style }: Props) {
  const id = React.useId().replace(/[:]/g, '');
  const blob = size * 0.8;

  const water =
    variant === 'dark'
      ? ['#235e6f', '#349084', '#56d2ad']
      : variant === 'night'
      ? ['#235e6f', '#41a89c', '#e0763c']
      : ['#1b4d5b', '#2c8278', '#48c6a1'];

  const tileBg =
    !tile
      ? 'transparent'
      : variant === 'cream'
      ? LAGOON_COLORS.cream
      : variant === 'night'
      ? LAGOON_COLORS.night
      : LAGOON_COLORS.orange;

  const svg = (
    <Svg width={blob} height={blob} viewBox="0 0 200 200">
      <Defs>
        <ClipPath id={`clip${id}`}>
          <Path d={LAGOON_PATH} />
        </ClipPath>
        <LinearGradient id={`water${id}`} x1="78" y1="26" x2="132" y2="178" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={water[0]} />
          <Stop offset="0.52" stopColor={water[1]} />
          <Stop offset="1" stopColor={water[2]} />
        </LinearGradient>
      </Defs>

      {variant === 'mono' ? (
        <Path d={LAGOON_PATH} fill={LAGOON_COLORS.ink} />
      ) : (
        <G clipPath={`url(#clip${id})`}>
          <Rect x="0" y="0" width="200" height="200" fill={`url(#water${id})`} />
        </G>
      )}
    </Svg>
  );

  if (!tile) return <View style={style}>{svg}</View>;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.225,
          backgroundColor: tileBg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {svg}
    </View>
  );
}

export default LagoonLogo;
