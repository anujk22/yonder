import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
export default function Root({ children }: PropsWithChildren) {
  return <html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Yonder — A little local knowledge. A better day.</title><meta name="description" content="The line. The crowd. The free court. Yonder helps you get a fresh look at a place before you go."/><meta name="theme-color" content="#F7F7F0"/><ScrollViewStyleReset/></head><body>{children}</body></html>;
}
