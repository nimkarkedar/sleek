import * as React from 'react';
import { Platform } from 'react-native';
import Animated from 'react-native-reanimated';

/** Reanimated entering/exiting only on native — web gets tailwindcss-animate classes instead. */
function NativeOnlyAnimatedView(
  props: React.ComponentProps<typeof Animated.View> & React.RefAttributes<Animated.View>
) {
  if (Platform.OS === 'web') return <>{props.children as React.ReactNode}</>;
  return <Animated.View {...props} />;
}

export { NativeOnlyAnimatedView };
