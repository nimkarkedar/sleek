import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Portal } from '@rn-primitives/portal';
import { X } from 'lucide-react-native';
import * as React from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';

/**
 * Right-side slide-in panel (shadcn's "Sheet") — the ChatGPT/Notion-style overlay pattern this
 * app already used once for Compliance updates. Extracted here so a second feature needing the
 * same interaction (the Work Queue filters panel) reuses it instead of re-implementing the same
 * Portal + Animated plumbing a second time.
 */
export function useSheet(width: number) {
  const [mounted, setMounted] = React.useState(false);
  const translateX = React.useRef(new Animated.Value(width)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  const open = React.useCallback(() => setMounted(true), []);

  // Slide in from the right + fade the overlay in once the portal has actually mounted —
  // animating from the very first render would jump instead of sliding.
  React.useEffect(() => {
    if (!mounted) return;
    translateX.setValue(width);
    overlayOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [mounted, width, translateX, overlayOpacity]);

  // Animate back out first, then unmount — otherwise closing would just cut the panel away
  // instantly instead of sliding it back offscreen.
  const close = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: width,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => setMounted(false));
  }, [width, translateX, overlayOpacity]);

  return { mounted, open, close, translateX, overlayOpacity };
}

export function Sheet({
  mounted,
  translateX,
  overlayOpacity,
  onClose,
  width,
  name,
  children,
}: {
  mounted: boolean;
  translateX: Animated.Value;
  overlayOpacity: Animated.Value;
  onClose: () => void;
  width: number;
  /** Distinguishes this sheet's Portal host from others that may be open at once. */
  name: string;
  children: React.ReactNode;
}) {
  if (!mounted) return null;
  return (
    <Portal name={name}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 70,
          backgroundColor: 'rgba(0,0,0,0.3)',
          opacity: overlayOpacity,
        }}>
        <Pressable onPress={onClose} accessibilityLabel="Close panel" style={{ flex: 1 }} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width,
          maxWidth: '100%',
          zIndex: 71,
          transform: [{ translateX }],
          // Inline, not `className="flex-col bg-white shadow-lg"` — this project's NativeWind
          // setup only reliably styles plain View/Text, not Animated.View.
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        }}>
        {children}
      </Animated.View>
    </Portal>
  );
}

/** Shared header row for a Sheet's content — "<eyebrow>" caption + close X on the app's gray
 * canvas color, same treatment the compliance panel established; `children` renders below it
 * (still inside the gray block) for whatever identity content a given sheet needs. */
export function SheetHeader({
  eyebrow,
  onClose,
  children,
}: {
  eyebrow: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ backgroundColor: '#F4F5FA' }} className="gap-3 px-8 pb-6 pt-8">
      <View className="flex-row items-start justify-between">
        <Text className="text-sm text-[#656565]">{eyebrow}</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          className="web:cursor-pointer">
          <Icon as={X} size={20} className="text-[#656565]" />
        </Pressable>
      </View>
      {children}
    </View>
  );
}
