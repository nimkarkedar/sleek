import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@rn-primitives/dialog';
import { X } from 'lucide-react-native';
import * as React from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

/** shadcn Dialog (react-native-reusables), on @rn-primitives/dialog. Use it controlled —
 * `<Dialog open={…} onOpenChange={…}>` — with `DialogContent` holding a header, body and footer. */

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

// The scrim is a direct style — opacity-modifier classes (`bg-black/50`) don't compile reliably
// in this project's NativeWind setup.
const SCRIM = { backgroundColor: 'rgba(0, 0, 0, 0.4)' };

function DialogOverlay({
  className,
  children,
  ...props
}: Omit<DialogPrimitive.OverlayProps, 'asChild'> &
  React.RefAttributes<DialogPrimitive.OverlayRef> & { children?: React.ReactNode }) {
  return (
    <FullWindowOverlay>
      <DialogPrimitive.Overlay
        style={SCRIM}
        className={cn(
          'absolute bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center p-2',
          Platform.select({ web: 'fixed cursor-default animate-in fade-in-0 [&>*]:cursor-auto' }),
          className
        )}
        {...props}
        asChild={Platform.OS !== 'web'}>
        <NativeOnlyAnimatedView entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <NativeOnlyAnimatedView entering={FadeIn.delay(50)} exiting={FadeOut.duration(150)}>
            <>{children}</>
          </NativeOnlyAnimatedView>
        </NativeOnlyAnimatedView>
      </DialogPrimitive.Overlay>
    </FullWindowOverlay>
  );
}

function DialogContent({
  className,
  portalHost,
  children,
  showClose = true,
  ...props
}: DialogPrimitive.ContentProps &
  React.RefAttributes<DialogPrimitive.ContentRef> & {
    portalHost?: string;
    showClose?: boolean;
  }) {
  return (
    <DialogPortal hostName={portalHost}>
      <DialogOverlay>
        <DialogPrimitive.Content
          className={cn(
            'z-50 mx-auto flex w-full max-w-[calc(100%-2rem)] flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-lg shadow-black/5 sm:max-w-lg',
            Platform.select({ web: 'duration-200 animate-in fade-in-0 zoom-in-95' }),
            className
          )}
          {...props}>
          <>{children}</>
          {showClose && (
            <DialogPrimitive.Close
              className={cn(
                'absolute right-4 top-4 rounded opacity-70 active:opacity-100',
                Platform.select({
                  web: 'cursor-pointer transition-opacity hover:opacity-100 focus-visible:outline-none',
                })
              )}
              hitSlop={12}>
              <Icon as={X} size={16} className="shrink-0 text-muted-foreground" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogOverlay>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: ViewProps) {
  return <View className={cn('flex flex-col gap-1.5 pr-6', className)} {...props} />;
}

function DialogFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: DialogPrimitive.TitleProps & React.RefAttributes<DialogPrimitive.TitleRef>) {
  return (
    <DialogPrimitive.Title
      className={cn('font-plex-bold text-lg leading-tight text-foreground', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.DescriptionProps & React.RefAttributes<DialogPrimitive.DescriptionRef>) {
  return (
    <DialogPrimitive.Description
      className={cn('font-sans text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

/** Form row inside a dialog: label above its control. */
function DialogField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-plex-semibold text-sm text-foreground">{label}</Text>
      {children}
    </View>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogField,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
