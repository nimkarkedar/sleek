import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Login page's right-hand visual. Pass `heroImage` to swap the placeholder for real artwork —
 * it fills the panel edge to edge (cover-cropped). The gradient is drawn with SVG rather than a
 * CSS class because NativeWind has no gradient utilities on native. */
export function LoginHero({ heroImage }: { heroImage?: ImageSourcePropType }) {
  return (
    <View className="flex-1 overflow-hidden rounded-2xl">
      {heroImage ? (
        // Explicit width/height override the intrinsic pixel size RN-web stamps on a `require()`d
        // asset (e.g. 1800×2400) — without them the image renders at that size and the panel
        // crops it to its top-left corner instead of cover-fitting it.
        <Image
          source={heroImage}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        />
      ) : (
        <>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="login-hero" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#EEF4FF" />
                <Stop offset="1" stopColor="#C7DBFF" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#login-hero)" />
          </Svg>
          <View className="flex-1 items-center justify-center">
            <Text className="font-plex-medium text-brand text-sm">Visual goes here</Text>
          </View>
        </>
      )}
    </View>
  );
}
