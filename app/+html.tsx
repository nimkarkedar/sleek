import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Matches app.config.js — only set when building for GitHub Pages, where the site lives at
// /sleek/ instead of the domain root, so these hand-authored absolute paths need the prefix too
// (Expo Router's own bundler-managed asset paths pick this up automatically; these don't).
const BASE_PATH = process.env.GH_PAGES_BASE_PATH || '';

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
          href={`${BASE_PATH}/fonts/IBMPlexSans_400Regular.ttf`}
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href={`${BASE_PATH}/fonts/IBMPlexSans_600SemiBold.ttf`}
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <style>{`
          @font-face {
            font-family: 'IBMPlexSans_400Regular';
            src: url('${BASE_PATH}/fonts/IBMPlexSans_400Regular.ttf') format('truetype');
            font-weight: 400;
            font-display: block;
          }
          @font-face {
            font-family: 'IBMPlexSans_500Medium';
            src: url('${BASE_PATH}/fonts/IBMPlexSans_500Medium.ttf') format('truetype');
            font-weight: 500;
            font-display: block;
          }
          @font-face {
            font-family: 'IBMPlexSans_600SemiBold';
            src: url('${BASE_PATH}/fonts/IBMPlexSans_600SemiBold.ttf') format('truetype');
            font-weight: 600;
            font-display: block;
          }
          @font-face {
            font-family: 'IBMPlexSans_700Bold';
            src: url('${BASE_PATH}/fonts/IBMPlexSans_700Bold.ttf') format('truetype');
            font-weight: 700;
            font-display: block;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
