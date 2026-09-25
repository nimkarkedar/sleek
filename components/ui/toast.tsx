import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Portal } from '@rn-primitives/portal';
import { X, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';

/**
 * Floating toast (shadcn's Sonner-style notification) — one at a time, bottom-right on desktop
 * and full-width along the bottom on mobile, auto-dismissing. Same Portal + RN Animated plumbing
 * as `Sheet`, so it floats above everything without a new dependency.
 *
 * Wrap the app in `ToastProvider` once; call `useToast().show({...})` anywhere below it.
 */

type ToastOptions = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** ms before auto-dismiss. */
  duration?: number;
};

const ToastContext = React.createContext<{ show: (options: ToastOptions) => void } | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // `id` changes on every show so re-triggering the same message restarts its timer/animation.
  const [toast, setToast] = React.useState<(ToastOptions & { id: number }) | null>(null);
  const progress = React.useRef(new Animated.Value(0)).current;
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismiss = React.useCallback(() => {
    clearTimeout(timer.current);
    Animated.timing(progress, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.quad),
      useNativeDriver: false,
    }).start(() => setToast(null));
  }, [progress]);

  const show = React.useCallback((options: ToastOptions) => {
    setToast({ ...options, id: Date.now() });
  }, []);

  React.useEffect(() => {
    if (!toast) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    clearTimeout(timer.current);
    timer.current = setTimeout(dismiss, toast.duration ?? 4500);
    return () => clearTimeout(timer.current);
  }, [toast, progress, dismiss]);

  const value = React.useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Portal name="toast">
          {/* Positioning wrapper ignores touches so only the card itself is interactive. */}
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', left: 16, right: 16, bottom: 24, zIndex: 100 }}
            className="items-center md:items-end">
            {/* Animated.View carries only the animated style — NativeWind doesn't process
                className on it, so the card's classes live on the plain View inside. */}
            <Animated.View
              role="alert"
              aria-live="polite"
              style={{
                width: '100%',
                maxWidth: 380,
                opacity: progress,
                transform: [
                  {
                    translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
                  },
                ],
              }}>
              <View className="flex-row items-start gap-3 rounded-lg border border-border bg-popover p-4 shadow-lg">
                {toast.icon && (
                  <View className="pt-0.5">
                    <Icon as={toast.icon} size={16} className="text-foreground" />
                  </View>
                )}
                <View className="flex-1 gap-1">
                  <Text className="font-plex-semibold text-sm text-popover-foreground">
                    {toast.title}
                  </Text>
                  {toast.description ? (
                    <Text className="text-sm text-muted-foreground">{toast.description}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={dismiss}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss notification"
                  hitSlop={8}
                  className="web:cursor-pointer">
                  <Icon as={X} size={14} className="text-muted-foreground" />
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Portal>
      )}
    </ToastContext.Provider>
  );
}
