import { WARNING_HEX } from '@/lib/tone';
import { hexToRgba } from '@/lib/utils';
import * as React from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const DASH = 6;
const GAP = 4;
const RADIUS = 8;

/** Wraps a control in an amber dashed outline whose dashes slowly march around it — "start
 * here". Stays dashed but still when the user has reduced motion turned on. */
export function AttentionRing({ children }: { children: React.ReactNode }) {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const reduceMotion = useReduceMotion();
  const offset = React.useRef(new Animated.Value(0)).current;
  // Driven through state, not an Animated SVG component — on web those pass RN-only props
  // (`collapsable`) straight onto the <rect>.
  const [dashOffset, setDashOffset] = React.useState(0);

  React.useEffect(() => {
    const id = offset.addListener(({ value }) => setDashOffset(value));
    return () => offset.removeListener(id);
  }, [offset]);

  React.useEffect(() => {
    if (reduceMotion) {
      offset.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(offset, {
        toValue: -(DASH + GAP) * 2,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, offset]);

  return (
    <View
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      style={{ borderRadius: RADIUS, backgroundColor: hexToRgba(WARNING_HEX, 0.06) }}>
      {children}
      {size.width > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0 }}>
          <Rect
            x={1}
            y={1}
            width={size.width - 2}
            height={size.height - 2}
            rx={RADIUS}
            fill="none"
            stroke={WARNING_HEX}
            strokeWidth={1.5}
            strokeDasharray={`${DASH} ${GAP}`}
            strokeDashoffset={dashOffset}
          />
        </Svg>
      )}
    </View>
  );
}

function useReduceMotion(): boolean {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => mounted && setReduce(value))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);
  return reduce;
}
