import Svg, { Circle, Path } from 'react-native-svg';

type GlyphName = 'arrow' | 'back' | 'camera' | 'check' | 'chevron' | 'clock' | 'close' | 'lock' | 'map' | 'shield';

export function Glyph({ name, color, size = 20, strokeWidth = 1.8 }: { name: GlyphName; color: string; size?: number; strokeWidth?: number }) {
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'arrow' && <Path d="M5 12h13m-5-5 5 5-5 5" {...common} />}
      {name === 'back' && <Path d="M19 12H6m5-5-5 5 5 5" {...common} />}
      {name === 'chevron' && <Path d="m9 6 6 6-6 6" {...common} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6 6 18" {...common} />}
      {name === 'check' && <Path d="m5 12 4 4 10-10" {...common} />}
      {name === 'clock' && <><Circle cx="12" cy="12" r="9" {...common} /><Path d="M12 7v5l3 2" {...common} /></>}
      {name === 'lock' && <><Path d="M7 11V8a5 5 0 0 1 10 0v3" {...common} /><Path d="M6 11h12v9H6z" {...common} /></>}
      {name === 'camera' && <><Path d="M4 8h4l1.5-2h5L16 8h4v11H4z" {...common} /><Circle cx="12" cy="13" r="3.2" {...common} /></>}
      {name === 'map' && <><Path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2z" {...common} /><Path d="M9 4v14M15 6v14" {...common} /></>}
      {name === 'shield' && <><Path d="M12 3 5 6v5c0 4.6 2.9 8 7 10 4.1-2 7-5.4 7-10V6z" {...common} /><Path d="m9 12 2 2 4-4" {...common} /></>}
    </Svg>
  );
}
