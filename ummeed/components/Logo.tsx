import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

interface Props {
  size?: number;
  ring?: string;
  sun?: string;
}

/**
 * Ummeed = "Hope". The logo is a rising sun over a calm horizon, framed in
 * a teal ring. Designed to be high-contrast and recognisable at small sizes.
 */
export function Logo({ size = 96, ring = '#0F3D3E', sun = '#E07A2C' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="48" fill="#FFF8F0" stroke={ring} strokeWidth="4" />
      {/* horizon */}
      <Path d="M10 62 H90" stroke={ring} strokeWidth="3" strokeLinecap="round" />
      {/* sun */}
      <Circle cx="50" cy="62" r="18" fill={sun} />
      {/* rays */}
      <G stroke={sun} strokeWidth="4" strokeLinecap="round">
        <Path d="M50 28 V18" />
        <Path d="M28 40 L21 33" />
        <Path d="M72 40 L79 33" />
        <Path d="M18 56 H10" />
        <Path d="M82 56 H90" />
      </G>
    </Svg>
  );
}
