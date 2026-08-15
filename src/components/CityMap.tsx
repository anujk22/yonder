import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { freshness, freshnessColor } from '@/lib/freshness';
import { Answer, Query } from '@/lib/places';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { font, radii, type } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 280;
const BOX = { minLat: 40.69, maxLat: 40.76, minLng: -74.02, maxLng: -73.96 } as const;

const project = (lat: number, lng: number) => ({
  x: ((lng - BOX.minLng) / (BOX.maxLng - BOX.minLng)) * VIEW_WIDTH,
  y: (1 - (lat - BOX.minLat) / (BOX.maxLat - BOX.minLat)) * VIEW_HEIGHT,
});

type CityMapProps = {
  height?: number;
  compact?: boolean;
  showOpenBounties?: boolean;
  onAnswerPress?: (answerId: string) => void;
  onQueryPress?: (queryId: string) => void;
};

export function CityMap({ height = 292, compact = false, showOpenBounties = true, onAnswerPress, onQueryPress }: CityMapProps) {
  const theme = useActiveTheme();
  const router = useRouter();
  const places = useYonderStore((state) => state.places);
  const answers = useYonderStore((state) => state.answers);
  const queries = useYonderStore((state) => state.queries);
  const setActiveTask = useYonderStore((state) => state.setActiveTask);
  const swapMode = useYonderStore((state) => state.swapMode);
  const pulse = useSharedValue(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2400 }), -1, false);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [pulse]);

  const newestAnswers = useMemo(() => {
    const seen = new Set<string>();
    return answers.filter((answer) => {
      if (seen.has(answer.placeId)) return false;
      seen.add(answer.placeId);
      return true;
    });
  }, [answers]);
  const openQueries = useMemo(() => queries.filter((query) => query.state === 'OPEN'), [queries]);

  const pulseProps = useAnimatedProps(() => ({
    r: 8 + pulse.value * 12,
    opacity: 0.6 * (1 - pulse.value),
  }));

  const openAnswer = (answer: Answer) => {
    Haptics.selectionAsync();
    if (onAnswerPress) onAnswerPress(answer.id);
    else router.push({ pathname: '/ask/answer/[id]', params: { id: answer.id } });
  };

  const openQuery = (query: Query) => {
    Haptics.selectionAsync();
    if (onQueryPress) onQueryPress(query.id);
    else {
      setActiveTask(query.id);
      swapMode('observe');
      router.push({ pathname: '/observe/task/[id]', params: { id: query.id } });
    }
  };

  return (
    <View style={[styles.shell, { height, backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
        <Path d={`M0 0 H${VIEW_WIDTH} V${VIEW_HEIGHT} H0 Z`} fill={theme.surfaceAlt} />

        <Path d="M86 -12 278 -12 255 44 247 91 226 151 208 219 179 296 54 296 94 231 105 172 92 114Z" fill={theme.bg} />
        <Path d="M250 157 414 111 414 296 177 296 204 250 221 203Z" fill={theme.bg} />
        <Path d="M0 0 72 0 82 74 63 137 72 216 40 280 0 280Z" fill={theme.bg} />

        <Polygon points="201,72 235,66 231,90 198,95" fill={theme.fresh} opacity={0.16} />
        <Polygon points="113,126 153,120 157,139 119,144" fill={theme.fresh} opacity={0.13} />
        <Polygon points="119,222 184,213 189,244 112,251" fill={theme.fresh} opacity={0.14} />

        {[118, 132, 146, 160, 174, 188, 202, 216, 230, 244].map((x, index) => (
          <Line key={`avenue-${x}`} x1={x} y1={index % 2 === 0 ? 10 : 22} x2={x - 52} y2={264} stroke={theme.border} strokeWidth={1} />
        ))}
        {[54, 79, 104, 129, 154, 179, 204, 229].map((y) => (
          <Line key={`cross-${y}`} x1={94} y1={y} x2={251} y2={y - 8} stroke={theme.border} strokeWidth={1} />
        ))}
        <Path d="M230 169 292 153 340 144 399 137M220 191 281 181 344 171 401 168M208 218 274 211 340 201 403 197M193 245 266 241 335 232 401 228" fill={theme.transparent} stroke={theme.border} strokeWidth={1} />
        <Path d="M16 50 60 83 45 133M17 156 58 179 49 224" fill={theme.transparent} stroke={theme.border} strokeWidth={1} />

        {showOpenBounties && openQueries.map((query, index) => {
          const place = places.find((candidate) => candidate.id === query.placeId);
          if (!place) return null;
          const point = project(place.lat, place.lng);
          const y = point.y + (index % 2 === 0 ? 8 : -8);
          return (
            <G key={query.id}>
              <AnimatedCircle cx={point.x} cy={y} fill={theme.transparent} stroke={theme.accent} strokeWidth={1.4} animatedProps={pulseProps} />
              <Circle cx={point.x} cy={y} r={6.5} fill={theme.accent} />
              {!compact ? (
                <>
                  <Rect x={point.x + 10} y={y - 12} width={53} height={24} rx={12} fill={theme.surface} stroke={theme.border} />
                  <SvgText x={point.x + 36.5} y={y + 4} fill={theme.ink} fontFamily={font.mono500} fontSize={10} textAnchor="middle">
                    ${(query.bountyCents / 100).toFixed(2)}
                  </SvgText>
                </>
              ) : null}
            </G>
          );
        })}

        {newestAnswers.map((answer, index) => {
          const place = places.find((candidate) => candidate.id === answer.placeId);
          if (!place) return null;
          const point = project(place.lat, place.lng);
          const state = freshness(answer.observedAt, answer.ttlSeconds, now);
          const opacity = state.band === 'STALE' ? 0.25 : Math.max(0.35, 1 - state.ratio * 0.65);
          const width = compact ? 112 : 148;
          const x = Math.min(VIEW_WIDTH - width - 7, Math.max(7, point.x - width / 2));
          const y = Math.min(VIEW_HEIGHT - 50, Math.max(7, point.y - 58 - index * 2));
          const placeName = place.name.length > 23 ? `${place.name.slice(0, 21)}…` : place.name;
          const headline = answer.headline.length > 27 ? `${answer.headline.slice(0, 25)}…` : answer.headline;
          return (
            <G key={answer.id} opacity={opacity}>
              <Path d={`M${point.x} ${point.y} L${Math.min(x + width - 14, Math.max(x + 14, point.x))} ${y + 42}`} fill={theme.transparent} stroke={freshnessColor(state.band, theme)} strokeWidth={1.25} />
              <Rect x={x} y={y} width={width} height={44} rx={11} fill={theme.surface} stroke={freshnessColor(state.band, theme)} strokeWidth={1.2} />
              <Circle cx={x + 10} cy={y + 11} r={3.2} fill={freshnessColor(state.band, theme)} />
              <SvgText x={x + 18} y={y + 14} fill={theme.inkSoft} fontFamily={font.ui600} fontSize={compact ? 7.5 : 8.5}>
                {placeName}
              </SvgText>
              <SvgText x={x + 10} y={y + 32} fill={theme.ink} fontFamily={font.display600} fontSize={compact ? 9 : 10.5}>
                {headline}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      {showOpenBounties
        ? openQueries.map((query, index) => {
            const place = places.find((candidate) => candidate.id === query.placeId);
            if (!place) return null;
            const point = project(place.lat, place.lng);
            const y = point.y + (index % 2 === 0 ? 8 : -8);
            return (
              <Pressable
                key={`query-hit-${query.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${query.question}, $${(query.bountyCents / 100).toFixed(2)} bounty`}
                onPress={() => openQuery(query)}
                style={[styles.queryHit, { left: `${Math.max(0, (point.x - 12) / VIEW_WIDTH) * 100}%`, top: `${Math.max(0, (y - 18) / VIEW_HEIGHT) * 100}%` }]}
              />
            );
          })
        : null}
      {newestAnswers.map((answer, index) => {
        const place = places.find((candidate) => candidate.id === answer.placeId);
        if (!place) return null;
        const point = project(place.lat, place.lng);
        const width = compact ? 112 : 148;
        const x = Math.min(VIEW_WIDTH - width - 7, Math.max(7, point.x - width / 2));
        const y = Math.min(VIEW_HEIGHT - 50, Math.max(7, point.y - 58 - index * 2));
        return (
          <Pressable
            key={`answer-hit-${answer.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${place.name}, ${answer.headline}`}
            onPress={() => openAnswer(answer)}
            style={[styles.answerHit, { left: `${(x / VIEW_WIDTH) * 100}%`, top: `${(y / VIEW_HEIGHT) * 100}%`, width }]}
          />
        );
      })}
      <View style={[styles.legend, { backgroundColor: theme.glass, borderColor: theme.border }]}> 
        <View style={[styles.legendDot, { backgroundColor: theme.fresh }]} />
        <Text style={[type.micro, styles.legendText, { color: theme.inkSoft }]}>LIVE NYC</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { width: '100%', overflow: 'hidden', borderRadius: radii.card, borderWidth: 1 },
  legend: { position: 'absolute', top: 10, right: 10, height: 27, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 6, pointerEvents: 'none' },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 9, lineHeight: 12 },
  queryHit: { position: 'absolute', width: 78, height: 38 },
  answerHit: { position: 'absolute', height: 48 },
});
