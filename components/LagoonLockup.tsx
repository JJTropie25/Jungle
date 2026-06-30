// LagoonLockup.tsx
// Logo orizzontale: forma Lagoon + scritta "lagoon".
// Di default la forma è SENZA riquadro arancione (tile={false}).
//
// Uso:
//   import { LagoonLockup } from './LagoonLockup';
//   <LagoonLockup size={56} />                       // forma + scritta, niente riquadro
//   <LagoonLockup size={56} onDark />                // su sfondo scuro (scritta crema)
//   <LagoonLockup size={56} tile />                  // con il riquadro arancione

import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { LagoonLogo } from './LagoonLogo';

type Props = {
  /** dimensione della forma in px (la scritta si scala di conseguenza) */
  size?: number;
  /** mostra il riquadro arancione arrotondato sotto la forma */
  tile?: boolean;
  /** versione per sfondo scuro: scritta color crema */
  onDark?: boolean;
  /** colore scritta personalizzato */
  textColor?: string;
  /** nome del font caricato (default Baloo2_700Bold). Passa undefined per il font di sistema. */
  fontFamily?: string | undefined;
  /** colore piatto per la sagoma (es. per nasconderla su sfondo dello stesso colore) */
  flatColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function LagoonLockup({
  size = 56,
  tile = false,
  onDark = false,
  textColor,
  fontFamily = 'Baloo2_700Bold',
  flatColor,
  style,
}: Props) {
  const color = textColor ?? (onDark ? '#f2ede4' : '#2c8278');
  const gap = size * 0.28;

  const textStyle: TextStyle = {
    color,
    fontSize: size * 0.62,
    lineHeight: size * 0.7,
    letterSpacing: -0.5,
    includeFontPadding: false,
    ...(fontFamily ? { fontFamily } : { fontWeight: '700' }),
  };

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
      <LagoonLogo size={size} tile={tile} variant={onDark ? 'dark' : 'light'} flatColor={flatColor} />
      <Text style={textStyle}>Lagoon</Text>
    </View>
  );
}

export default LagoonLockup;
