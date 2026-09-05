import { StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotionPressable } from './MotionPressable';
import { PlaceArt } from './PlaceArt';
import { artFor, categoryFor, questionFor } from '@/lib/discovery';
import { Place } from '@/lib/places';
import { useYonderStore } from '@/lib/store';
import { ask, font } from '@/lib/theme';

export function openPlaceDraft(place: Place, router: ReturnType<typeof useRouter>) {
  const state = useYonderStore.getState(); state.addPlace(place); state.setResolvedPlace(place.id); state.setDraftQuestion(''); state.setDeadline(10); state.setTargetHint(''); router.push('/ask/place');
}

export function PlaceTile({ place, width = 266, compact = false }: { place: Place; width?: number | `${number}%`; compact?: boolean }) {
  const router = useRouter(); const saved = useYonderStore(s => s.savedPlaceIds.includes(place.id));
  return <View style={[styles.card, { width }, compact && { flexDirection: 'row' }]}>
    <MotionPressable accessibilityRole="button" accessibilityLabel={`Ask about ${place.name}`} onPress={() => openPlaceDraft(place, router)} style={[{ flex: 1 }, compact && { flexDirection: 'row', alignItems: 'center' }]}>
      <View style={[styles.art, compact && { width: 94, height: 128, borderRadius: 14, margin: 10 }]}><PlaceArt kind={artFor(place)}/>{!compact && <View style={styles.tag}><Text style={styles.tagText}>{categoryFor(place)}</Text></View>}</View>
      <View style={[styles.body, compact && { flex: 1, paddingLeft: 2, paddingRight: 44 }]}><Text style={styles.area} numberOfLines={1}>{place.area}</Text><Text style={[styles.name, compact && { fontSize: 21, lineHeight: 25 }]} numberOfLines={2}>{place.name}</Text>{!compact && <View style={styles.bottom}><Text style={styles.question} numberOfLines={2}>{questionFor(place)}</Text><View style={styles.arrow}><ArrowUpRight size={17} color={ask.ink}/></View></View>}</View>
    </MotionPressable>
    <MotionPressable accessibilityRole="button" accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${place.name}`} accessibilityState={{ selected: saved }} onPress={() => useYonderStore.getState().toggleSavedPlace(place.id)} style={[styles.save, saved && { backgroundColor: ask.accentSoft }]}><Heart size={18} strokeWidth={1.7} color={ask.ink} fill={saved ? ask.ink : 'transparent'}/></MotionPressable>
  </View>;
}
const styles = StyleSheet.create({ card: { borderRadius: 22, borderWidth: 1, borderColor: '#E1E1D7', overflow: 'hidden', backgroundColor: '#FFFEFA' }, art: { height: 135, overflow: 'hidden' }, tag: { position: 'absolute', left: 12, bottom: 12, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#F8F7F2F0', borderRadius: 8 }, tagText: { fontFamily: font.ui600, color: ask.ink, fontSize: 9 }, body: { padding: 17, gap: 6 }, area: { fontFamily: font.ui500, color: ask.inkSoft, fontSize: 10, lineHeight: 15 }, name: { fontFamily: font.serif, fontSize: 25, lineHeight: 28, color: ask.ink, letterSpacing: -.7 }, bottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }, question: { fontFamily: font.ui400, fontSize: 11, lineHeight: 17, color: ask.inkSoft, flex: 1 }, arrow: { width: 29, height: 29, borderRadius: 15, backgroundColor: ask.surfaceAlt, alignItems: 'center', justifyContent: 'center' }, save: { position: 'absolute', top: 9, right: 9, width: 40, height: 40, borderRadius: 21, backgroundColor: '#F8F7F2F0', alignItems: 'center', justifyContent: 'center' } });
