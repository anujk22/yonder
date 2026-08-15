import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { font, radii } from '@/lib/theme';

type CityMapProps = {
  height?: number;
  fullBleed?: boolean;
  variant?: 'city' | 'detail';
};

const palette = {
  water: '#AFC8D2',
  waterLine: '#8DAFBE',
  land: '#E7E2D7',
  street: '#F8F4EC',
  road: '#C7BFB0',
  park: '#B9C5A8',
  parkDark: '#75915F',
  ink: '#393229',
  paper: '#F6EBDD',
  pin: '#493721',
  court: '#6E91A5',
  courtLine: '#DFE8E8',
} as const;

export function CityMap({ height = 420, fullBleed = false, variant = 'city' }: CityMapProps) {
  return (
    <View style={[styles.shell, fullBleed && styles.fullBleed, { height }]}>
      {variant === 'detail' ? <DetailMap /> : <CityOverview />}
    </View>
  );
}

function CityOverview() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
      <Rect width="400" height="520" fill={palette.water} />

      <Path d="M0 0H248L238 46 229 99 220 156 208 214 191 274 171 337 142 403 111 466 86 520H0Z" fill={palette.land} />
      <Path d="M319 0H400V520H170L191 469 221 416 248 372 270 324 287 272 298 214 302 151 307 82Z" fill={palette.land} />
      <Path d="M0 400 33 390 77 398 113 420 132 456 111 520H0Z" fill={palette.park} opacity={0.9} />
      <Path d="M182 404 216 381 249 368 269 388 242 431 209 464 169 488 150 459Z" fill={palette.park} />

      <G stroke={palette.street} strokeWidth={4} opacity={0.96}>
        {[18, 37, 56, 75, 94, 113, 132, 151, 170, 189, 208, 227].map((x) => (
          <Line key={`m-avenue-${x}`} x1={x} y1={-20} x2={x - 94} y2={526} />
        ))}
        {[36, 63, 90, 117, 144, 171, 198, 225, 252, 279, 306, 333, 360, 387].map((y) => (
          <Line key={`m-cross-${y}`} x1={-8} y1={y} x2={226} y2={y + 11} />
        ))}
      </G>
      <G stroke={palette.road} strokeWidth={1} opacity={0.6}>
        <Path d="M20 0 0 115M68 0 0 292M122 0 25 520M178 0 88 520M231 0 131 520" />
        <Path d="M0 52 238 64M0 113 229 127M0 183 216 195M0 246 200 262M0 322 178 338" />
      </G>

      <G stroke={palette.street} strokeWidth={4} opacity={0.95}>
        {[326, 350, 374, 398, 422, 446, 470, 494].map((y) => (
          <Line key={`b-cross-${y}`} x1={214} y1={y} x2={409} y2={y - 67} />
        ))}
        {[224, 251, 278, 305, 332, 359, 386].map((x) => (
          <Line key={`b-avenue-${x}`} x1={x} y1={290} x2={x + 94} y2={526} />
        ))}
      </G>

      <Path d="M207 216C246 236 284 258 326 280" fill="none" stroke={palette.road} strokeWidth={8} />
      <Path d="M207 216C246 236 284 258 326 280" fill="none" stroke={palette.street} strokeWidth={4} />
      <Path d="M178 267C221 285 262 302 304 319" fill="none" stroke={palette.waterLine} strokeWidth={1.2} strokeDasharray="6 7" opacity={0.75} />
      <Path d="M188 83C240 112 268 156 283 219" fill="none" stroke={palette.waterLine} strokeWidth={1.2} strokeDasharray="6 7" opacity={0.7} />

      <Label x={112} y={58} text="MANHATTAN" size={19} />
      <Label x={28} y={142} text="TRIBECA" size={13} />
      <Label x={17} y={247} text="FINANCIAL" size={12} />
      <Label x={18} y={262} text="DISTRICT" size={12} />
      <Label x={286} y={356} text="DUMBO" size={13} />
      <Label x={202} y={397} text={'Brooklyn\nBridge Park'} size={13} />
      <SvgText x={271} y={162} fill="#557E9C" fontFamily={font.serif} fontSize={17} fontStyle="italic" transform="rotate(-10 271 162)">East River</SvgText>
      <SvgText x={230} y={242} fill={palette.ink} fontFamily={font.ui500} fontSize={10} transform="rotate(27 230 242)">Brooklyn Bridge</SvgText>
      <SvgText x={21} y={409} fill={palette.ink} fontFamily={font.ui500} fontSize={10}>Battery Park</SvgText>

      <ParkGlyph x={24} y={392} />
      <ParkGlyph x={215} y={406} />
      <BridgeGlyph x={292} y={270} />

      <MapTag x={210} y={146} text="Pier 17" />
      <Circle cx={210} cy={173} r={4} fill={palette.pin} />
      <MapTag x={253} y={330} text="Pier 6" />
      <Circle cx={253} cy={357} r={4} fill={palette.pin} />
      <MapTag x={191} y={418} text="Pier 2" />
      <Circle cx={191} cy={445} r={4} fill={palette.pin} />
    </Svg>
  );
}

function DetailMap() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
      <Rect width="400" height="520" fill={palette.water} />
      <Path d="M190 196 243 154 303 131 400 143V520H56L81 446 111 378 139 310Z" fill={palette.land} />
      <Path d="M165 222 225 180 293 159 377 171 400 247 359 304 308 348 246 388 184 423 119 441 85 412 105 345 132 278Z" fill={palette.park} />
      <Path d="M0 404 68 373 101 403 80 475 25 520H0Z" fill={palette.land} />

      <Path d="M185 -18 426 98" fill="none" stroke={palette.road} strokeWidth={18} />
      <Path d="M185 -18 426 98" fill="none" stroke={palette.street} strokeWidth={12} />
      <G stroke={palette.road} strokeWidth={1.2} opacity={0.8}>
        {[196, 219, 242, 265, 288, 311, 334, 357, 380].map((x) => (
          <Line key={`bridge-${x}`} x1={x} y1={(x - 196) * 0.48 - 6} x2={x + 7} y2={(x - 196) * 0.48 + 8} />
        ))}
      </G>

      <Path d="M291 165C317 224 348 285 400 344" fill="none" stroke={palette.street} strokeWidth={13} />
      <Path d="M291 165C317 224 348 285 400 344" fill="none" stroke={palette.road} strokeWidth={1.6} />
      <Path d="M176 224C220 263 274 302 344 337" fill="none" stroke={palette.street} strokeWidth={8} />
      <Path d="M107 402C179 379 234 358 303 316" fill="none" stroke={palette.street} strokeWidth={6} />
      <Path d="M145 288C199 304 243 328 276 367" fill="none" stroke={palette.street} strokeWidth={5} />

      <Pier x={126} y={238} width={103} height={61} label="Pier 2" courts />
      <Pier x={206} y={163} width={95} height={54} label="Pier 1" />
      <Pier x={39} y={373} width={101} height={62} label="Pier 3" courts />

      <Circle cx={227} cy={314} r={3} fill={palette.parkDark} opacity={0.8} />
      <Circle cx={257} cy={280} r={3} fill={palette.parkDark} opacity={0.8} />
      <Circle cx={190} cy={349} r={3} fill={palette.parkDark} opacity={0.8} />
      <Circle cx={304} cy={244} r={3} fill={palette.parkDark} opacity={0.8} />

      <SvgText x={257} y={42} fill={palette.ink} fontFamily={font.ui600} fontSize={13} transform="rotate(25 257 42)">Brooklyn Bridge</SvgText>
      <SvgText x={18} y={214} fill="#557E9C" fontFamily={font.serif} fontSize={16} fontStyle="italic">East River</SvgText>
      <Label x={260} y={248} text={'Brooklyn\nBridge Park'} size={15} />
      <SvgText x={342} y={271} fill={palette.ink} fontFamily={font.ui500} fontSize={10} transform="rotate(-51 342 271)">Furman St</SvgText>
      <ParkGlyph x={250} y={302} />
    </Svg>
  );
}

function Pier({ x, y, width, height, label, courts = false }: { x: number; y: number; width: number; height: number; label: string; courts?: boolean }) {
  return (
    <G>
      <Rect x={x} y={y} width={width} height={height} rx={3} fill="#C9C9BB" stroke={palette.road} strokeWidth={1} transform={`rotate(-17 ${x + width / 2} ${y + height / 2})`} />
      {courts ? (
        <G transform={`rotate(-17 ${x + width / 2} ${y + height / 2})`}>
          <Rect x={x + 10} y={y + 10} width={(width - 25) / 2} height={height - 20} fill={palette.court} />
          <Rect x={x + 15 + (width - 25) / 2} y={y + 10} width={(width - 25) / 2} height={height - 20} fill={palette.court} />
          <Line x1={x + width / 2} y1={y + 10} x2={x + width / 2} y2={y + height - 10} stroke={palette.courtLine} strokeWidth={1} />
        </G>
      ) : null}
      <SvgText x={x + width / 2} y={y + height / 2 + 4} fill={palette.ink} fontFamily={font.ui600} fontSize={12} textAnchor="middle">{label}</SvgText>
    </G>
  );
}

function MapTag({ x, y, text }: { x: number; y: number; text: string }) {
  const width = text.length * 7.2 + 18;
  return (
    <G>
      <Rect x={x - width / 2} y={y} width={width} height={23} rx={5} fill={palette.paper} />
      <SvgText x={x} y={y + 16} fill={palette.ink} fontFamily={font.ui500} fontSize={11} textAnchor="middle">{text}</SvgText>
    </G>
  );
}

function Label({ x, y, text, size }: { x: number; y: number; text: string; size: number }) {
  const lines = text.split('\n');
  return (
    <SvgText x={x} y={y} fill={palette.ink} fontFamily={font.ui600} fontSize={size} textAnchor="middle">
      {lines.map((line, index) => <SvgText key={line} x={x} dy={index === 0 ? 0 : size + 1}>{line}</SvgText>)}
    </SvgText>
  );
}

function ParkGlyph({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={8} fill={palette.parkDark} />
      <Path d={`M${x} ${y - 5}l-4 6h3v4h2V${y + 1}h3Z`} fill={palette.street} />
    </G>
  );
}

function BridgeGlyph({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={9} fill={palette.pin} />
      <Path d={`M${x - 5} ${y + 4}h10M${x - 4} ${y + 2}v-7m8 7v-7m-8 2 4 3 4-3`} fill="none" stroke={palette.paper} strokeWidth={1} />
    </G>
  );
}

const styles = StyleSheet.create({
  shell: { width: '100%', overflow: 'hidden', borderRadius: radii.card, backgroundColor: palette.water },
  fullBleed: { borderRadius: 0 },
});
