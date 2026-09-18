import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />

        {/* Declared directly in <head> (not via expo-font's async useFonts) so the browser
            knows about IBM Plex before first paint — avoids a flash of a fallback serif font
            on load/refresh while the JS-driven font loader is still resolving. */}
        <link
          rel="preload"
          href="/fonts/IBMPlexSans_400Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/IBMPlexSans_600SemiBold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <style>{`
          @font-face {
            font-family: 'IBMPlexSans_400Regular';
            src: url('/fonts/IBMPlexSans_400Regular.ttf') format('truetype');
            font-weight: 400;
            font-display: block;
          }
          @font-face {
            font-family: 'IBMPlexSans_500Medium';
            src: url('/fonts/IBMPlexSans_500Medium.ttf') format('truetype');
            font-weight: 500;
            font-display: block;
          }
          @font-face {
            font-family: 'IBMPlexSans_600SemiBold';
            src: url('/fonts/IBMPlexSans_600SemiBold.ttf') format('truetype');
            font-weight: 600;
            font-display: block;
          }
          @font-face {
            font-family: 'IBMPlexSans_700Bold';
            src: url('/fonts/IBMPlexSans_700Bold.ttf') format('truetype');
            font-weight: 700;
            font-display: block;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
