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

        {/* Segoe UI is a Microsoft system font — there's no webfont file we can legally bundle,
            so each weight is declared as a named alias that resolves to the real local "Segoe UI"
            (Windows) via `local()`, and simply fails to match (falling through to the
            fontFamily stack's system-ui/-apple-system entries in tailwind.config.js) on
            platforms that don't have it installed. */}
        <style>{`
          @font-face {
            font-family: 'SegoeUI-Regular';
            src: local('Segoe UI'), local('SegoeUI');
            font-weight: 400;
          }
          @font-face {
            font-family: 'SegoeUI-Medium';
            src: local('Segoe UI Semibold'), local('Segoe UI'), local('SegoeUI');
            font-weight: 500;
          }
          @font-face {
            font-family: 'SegoeUI-SemiBold';
            src: local('Segoe UI Semibold'), local('Segoe UI'), local('SegoeUI');
            font-weight: 600;
          }
          @font-face {
            font-family: 'SegoeUI-Bold';
            src: local('Segoe UI Bold'), local('Segoe UI'), local('SegoeUI');
            font-weight: 700;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
