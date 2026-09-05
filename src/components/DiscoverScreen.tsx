import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Scout } from './Brand';
import { Glyph } from './Glyph';
import { MapSurface, MapSurfaceHandle } from './MapSurface';
import { PlaceArt } from './PlaceArt';
import { Entrance } from './ui';
import { useYonderStore } from '@/lib/store';
import { CATEGORIES, Category, artFor, categoryFor, questionFor } from '@/lib/discovery';
import { formatAge, freshness } from '@/lib/freshness';
import { Place } from '@/lib/places';
import { ask, font, type } from '@/lib/theme';
import { searchWorldPlaces } from '@/lib/worldSearch';
import { useLiveLocation } from '@/lib/location';

export default function DiscoverScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 960;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All places');
  const [savedOnly, setSavedOnly] = useState(false);
  const [worldResults, setWorldResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [worldSearched, setWorldSearched] = useState(false);
  const searchVersion = useRef(0);
  const [now, setNow] = useState(Date.now());
  const places = useYonderStore(s => s.places);
  const answers = useYonderStore(s => s.answers);
  const saved = useYonderStore(s => s.savedPlaceIds);
  const toggleSaved = useYonderStore(s => s.toggleSavedPlace);
  const mapRef = useRef<MapSurfaceHandle>(null);
  const location = useLiveLocation();
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(timer); }, []);
  const results = useMemo(() => places.filter(p => p.status !== 'blocked' && (category === 'All places' || categoryFor(p) === category) && (!savedOnly || saved.includes(p.id)) && `${p.name} ${p.area}`.toLowerCase().includes(search.trim().toLowerCase())), [category, places, saved, savedOnly, search]);
  const visiblePlaces = search.trim() || savedOnly || category !== 'All places' ? results : results.slice(0, 4);
  const openPlace = (place: Place) => {
    const state = useYonderStore.getState();
    state.addPlace(place); state.setResolvedPlace(place.id); state.setDraftQuestion(''); state.setDeadline(10); state.setTargetHint('');
    router.push('/ask/place');
  };
  const changeSearch = (value: string) => { searchVersion.current++; setSearch(value); setWorldResults([]); setWorldSearched(false); setSearching(false); setSearchError(''); };
  const searchWorld = async () => {
    if (search.trim().length < 3 || searching) return;
    const version = ++searchVersion.current;
    setSearching(true); setSearchError(''); setWorldSearched(false);
    try { const found = await searchWorldPlaces(search); if (version === searchVersion.current) { setWorldResults(found); setWorldSearched(true); } }
    catch (error) { if (version === searchVersion.current) setSearchError(error instanceof Error ? error.message : 'Place search is unavailable. Try again.'); }
    finally { if (version === searchVersion.current) setSearching(false); }
  };
  useEffect(() => { if (location.fix) mapRef.current?.animateToRegion({ latitude: location.fix.latitude, longitude: location.fix.longitude, latitudeDelta: 0.025, longitudeDelta: 0.025 }, 800); }, [location.fix]);
  return <ScrollView style={{ flex: 1, backgroundColor: ask.bg }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={[styles.container, !wide && styles.compactContainer]}>
      <Entrance style={styles.locationRow}><View style={styles.locationBadge}><Glyph name="map" color={ask.ink} size={14}/><Text style={styles.locationText}>{location.fix ? 'Exploring your location' : 'New York, a little closer'}</Text></View><Text style={styles.issue}>THE NEIGHBORHOOD, NOW. / 001</Text></Entrance>
      <View style={[styles.hero, !wide && { flexDirection: 'column', gap: 30 }]}>
        <Entrance index={1} style={[styles.heroCopy, !wide && { width: '100%' }]}>
          <Text accessibilityRole="header" style={[styles.headline, !wide && { fontSize: width < 450 ? 48 : 64, lineHeight: width < 450 ? 49 : 65, letterSpacing: -2.4 }]}>A little local{`\n`}knowledge.{`\n`}A better <Text style={styles.day}>day.</Text></Text>
          <Text style={styles.subtitle}>The line. The crowd. The free court.{`\n`}Get a fresh look from someone already there.</Text>
          <View style={styles.searchShell}><Glyph name="map" color={ask.inkSoft} size={20}/><TextInput accessibilityLabel="Search places or neighborhoods" placeholder="Where are you headed?" placeholderTextColor={ask.inkFaint} value={search} onChangeText={changeSearch} onSubmitEditing={searchWorld} returnKeyType="search" style={styles.searchInput}/><Pressable accessibilityRole="button" accessibilityLabel="Search worldwide" onPress={searchWorld} style={styles.searchGo}>{searching ? <ActivityIndicator size="small" color={ask.ink}/> : <Glyph name="arrow" color={ask.ink} size={23}/>}</Pressable></View>
          <View style={styles.tryRow}><Text style={styles.tryLabel}>TRY</Text>{['Pizza', 'Park', 'SoHo'].map(term => <Pressable key={term} accessibilityRole="button" onPress={() => changeSearch(term)}><Text style={styles.tryLink}>{term} ↗</Text></Pressable>)}</View>
        </Entrance>
        <Entrance index={2} style={[styles.mapHero, !wide && { width: '100%', height: 330 }]}>
          <MapSurface ref={mapRef} mode="ask" style={StyleSheet.absoluteFill} userLocation={location.fix} markers={places.filter(p => ['pier2', 'joes', 'nikesoho', 'bryant'].includes(p.id)).map(p => ({ id: p.id, label: p.id === 'pier2' ? 'Room for a game?' : p.id === 'joes' ? 'Worth the wait?' : p.name, coordinate: { latitude: p.lat, longitude: p.lng }, onPress: () => openPlace(p) }))}/>
          <View pointerEvents="none" style={styles.mapTag}><View style={styles.dot}/><Text style={styles.mapTagText}>REAL MAP. LITTLE POSSIBILITIES.</Text></View>
          <Pressable accessibilityRole="button" onPress={location.active ? location.stop : location.start} style={styles.locateButton}><Text style={styles.locateText}>{location.loading ? 'Locating…' : location.active ? '◉ Stop live location' : '◎ Use my location'}</Text></Pressable>
          <View pointerEvents="none" style={styles.mapSticker}><Scout size={62}/><Text style={styles.stickerText}>GO ON.{`\n`}GET OUT THERE.</Text></View>
        </Entrance>
      </View>
      {Boolean(location.error) && <Text accessibilityRole="alert" style={styles.error}>{location.error}</Text>}
      {search.trim().length >= 3 && <View style={styles.worldSearch}>
        <View style={styles.sectionHeading}><Text style={styles.worldTitle}>Looking a little further?</Text><Pressable accessibilityRole="button" onPress={searchWorld} disabled={searching}><Text style={styles.textLink}>{searching ? 'Searching…' : 'Search the world ↗'}</Text></Pressable></View>
        <Text style={styles.smallCopy}>Find real places with OpenStreetMap. Search runs when you submit.</Text>
        {searchError ? <Text accessibilityRole="alert" style={styles.error}>{searchError}</Text> : null}
        {worldSearched && !worldResults.length && <Text style={styles.smallCopy}>No matches. Try adding a street or city.</Text>}
        {worldResults.map(place => <Pressable accessibilityRole="button" key={place.id} onPress={() => openPlace(place)} style={styles.worldResult}><Glyph name="map" color={ask.fresh}/><View style={{ flex: 1 }}><Text style={styles.placeName}>{place.name}</Text><Text style={styles.smallCopy}>{place.area}</Text></View><Glyph name="arrow" color={ask.ink}/></Pressable>)}
      </View>}
      <View style={styles.divider}/>
      <View style={styles.sectionHeading}><View><Text style={styles.eyebrow}>LESS GUESSING. MORE GOING.</Text><Text accessibilityRole="header" style={styles.sectionTitle}>{savedOnly ? 'Your little black book.' : search ? 'A place in mind?' : 'What’s happening around you?'}</Text></View><Pressable accessibilityRole="button" accessibilityState={{ selected: savedOnly }} onPress={() => setSavedOnly(!savedOnly)} style={[styles.saveFilter, savedOnly && { backgroundColor: ask.accent }]}><Text style={styles.saveFilterText}>{savedOnly ? 'All places' : `Saved places · ${saved.length}`}</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{CATEGORIES.map((item, i) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.activeCategory]}><Text style={[styles.categoryText, category === item && { color: ask.bg }]}>{['✳', '◒', '↟', '▧', '↗'][i]}  {item}</Text></Pressable>)}</ScrollView>
      <View style={styles.cards}>
        {visiblePlaces.map(place => {
          const answer = answers.filter(a => a.placeId === place.id).sort((a,b) => b.observedAt-a.observedAt)[0];
          const age = answer ? freshness(answer.observedAt, answer.ttlSeconds, now) : null;
          return <View key={place.id} style={[styles.card, { width: wide ? '23.7%' : width >= 620 ? '48.5%' : '100%' }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Ask about ${place.name}`} onPress={() => openPlace(place)} style={({ pressed, hovered }) => [{ opacity: pressed ? 0.85 : 1 }, hovered && { backgroundColor: '#FCFCF7' }]}>
              <View style={styles.art}><PlaceArt kind={artFor(place)}/><View style={styles.artLabel}><Text style={styles.artLabelText}>{categoryFor(place).toUpperCase()}</Text></View></View>
              <View style={styles.cardBody}><Text style={styles.placeArea}>{place.area}</Text><Text style={styles.placeName}>{place.name}</Text><Text style={styles.cardQuestion}>{questionFor(place)}</Text><View style={styles.cardBottom}><Text style={[styles.freshness, { color: age?.band === 'FRESH' ? ask.fresh : ask.inkSoft }]}>{age ? `${age.band === 'FRESH' ? '● Sample' : '◷ Last sample'} · ${formatAge(age.ageSeconds)}` : 'Be the first to ask'}</Text><Glyph name="arrow" color={ask.ink} size={18}/></View></View>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`${saved.includes(place.id) ? 'Unsave' : 'Save'} ${place.name}`} accessibilityState={{ selected: saved.includes(place.id) }} onPress={() => toggleSaved(place.id)} style={[styles.bookmark, saved.includes(place.id) && { backgroundColor: ask.accent }]}><Text style={{ color: ask.ink, fontSize: 22 }}>{saved.includes(place.id) ? '♥' : '♡'}</Text></Pressable>
          </View>;
        })}
      </View>
      {!visiblePlaces.length && <View style={styles.empty}><Scout size={52}/><Text style={styles.worldTitle}>{savedOnly ? 'Good places are worth keeping.' : 'Nothing here just yet.'}</Text><Text style={styles.smallCopy}>{savedOnly ? 'Tap a heart on any place to save it for later.' : 'Try another category, or search worldwide above.'}</Text><Pressable accessibilityRole="button" onPress={() => { changeSearch(''); setCategory('All places'); setSavedOnly(false); }}><Text style={styles.textLink}>Explore all places ↗</Text></Pressable></View>}
      <View style={[styles.bottomBand, !wide && { flexDirection: 'column', alignItems: 'flex-start' }]}><View style={styles.bandIntro}><Scout size={55}/><View style={{ flexShrink: 1 }}><Text style={styles.bandTitle}>Someone there. Someone who cares.</Text><Text style={styles.bandCopy}>A small favor for them. A better day for you.</Text></View></View><Pressable accessibilityRole="button" onPress={() => router.push('/about')} style={styles.bandButton}><Text style={styles.bandButtonText}>Meet your new local instinct ↗</Text></Pressable></View>
      <View style={styles.footer}><Text style={styles.footerBrand}>yonder.</Text><Text style={styles.footerCopy}>A little more in the know. A little more out in the world.</Text><Text style={styles.footerCopy}>Made for the everyday adventure.</Text></View>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { paddingBottom: 20 }, container: { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 48 }, compactContainer: { paddingHorizontal: 22 },
  locationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 25, gap: 12, flexWrap: 'wrap' }, locationBadge: { flexDirection: 'row', gap: 7, alignItems: 'center' }, locationText: { fontFamily: font.ui500, color: ask.inkSoft, fontSize: 12 }, issue: { fontFamily: font.mono400, color: ask.inkFaint, fontSize: 9, letterSpacing: 0.5 },
  hero: { flexDirection: 'row', gap: 40, alignItems: 'center' }, heroCopy: { width: '47%', paddingVertical: 9 }, headline: { fontFamily: font.black, fontSize: 66, lineHeight: 67, color: ask.ink, letterSpacing: -3.7 }, day: { color: '#52745C' }, subtitle: { fontFamily: font.ui400, color: ask.inkSoft, fontSize: 15, lineHeight: 24, marginTop: 22, marginBottom: 25 },
  searchShell: { backgroundColor: ask.surface, borderWidth: 1, borderColor: '#A3AA99', borderRadius: 12, height: 62, flexDirection: 'row', alignItems: 'center', paddingLeft: 17, paddingRight: 6, gap: 9, boxShadow: '0 4px 0 #242A2205' }, searchInput: { flex: 1, minWidth: 0, fontFamily: font.ui400, fontSize: 13, height: '100%', color: ask.ink }, searchGo: { height: 47, width: 47, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: ask.accent }, tryRow: { flexDirection: 'row', gap: 18, alignItems: 'center', marginTop: 14 }, tryLabel: { fontFamily: font.mono400, fontSize: 9, color: ask.inkFaint }, tryLink: { fontFamily: font.ui500, fontSize: 11, color: ask.inkSoft },
  mapHero: { width: '49.6%', height: 401, borderRadius: 20, overflow: 'hidden', backgroundColor: ask.surfaceAlt, borderWidth: 1, borderColor: ask.border }, mapTag: { position: 'absolute', top: 14, left: 14, backgroundColor: ask.bg, flexDirection: 'row', alignItems: 'center', padding: 9, borderRadius: 6, gap: 6 }, dot: { width: 6, height: 6, borderRadius: 4, backgroundColor: ask.fresh }, mapTagText: { fontFamily: font.mono500, fontSize: 8, letterSpacing: 0.5, color: ask.ink }, locateButton: { position: 'absolute', bottom: 28, left: 14, borderRadius: 8, backgroundColor: ask.surface, padding: 11, boxShadow: '0 2px 8px #242A2218' }, locateText: { fontFamily: font.ui600, fontSize: 11, color: ask.ink }, mapSticker: { position: 'absolute', right: 18, bottom: 35, transform: [{ rotate: '9deg' }], alignItems: 'center' }, stickerText: { fontFamily: font.black, fontSize: 8, letterSpacing: 0.4, textAlign: 'center', color: ask.ink, marginTop: 2, backgroundColor: ask.accent, padding: 4 },
  divider: { height: 1, backgroundColor: ask.border, marginTop: 37, marginBottom: 29 }, sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }, eyebrow: { fontFamily: font.mono400, fontSize: 9, color: ask.inkSoft, letterSpacing: 1.1, marginBottom: 9 }, sectionTitle: { fontFamily: font.ui600, color: ask.ink, fontSize: 25, lineHeight: 32, letterSpacing: -1 }, saveFilter: { borderRadius: 30, borderWidth: 1, borderColor: ask.border, paddingVertical: 10, paddingHorizontal: 15 }, saveFilterText: { fontFamily: font.ui500, color: ask.ink, fontSize: 11 },
  categories: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 22 }, category: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 30, borderWidth: 1, borderColor: ask.border }, activeCategory: { backgroundColor: ask.ink, borderColor: ask.ink }, categoryText: { fontFamily: font.ui500, color: ask.inkSoft, fontSize: 11 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 }, card: { borderRadius: 14, borderWidth: 1, borderColor: ask.border, overflow: 'hidden', backgroundColor: ask.surface }, art: { height: 154, backgroundColor: ask.surfaceAlt }, artLabel: { position: 'absolute', left: 10, bottom: 10, paddingVertical: 5, paddingHorizontal: 7, borderRadius: 4, backgroundColor: '#F7F7F0E8' }, artLabelText: { fontFamily: font.mono500, fontSize: 7, letterSpacing: 0.7, color: ask.ink }, bookmark: { position: 'absolute', right: 10, top: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F7F7F0E8', justifyContent: 'center', alignItems: 'center' }, cardBody: { padding: 15 }, placeArea: { fontFamily: font.ui400, fontSize: 10, color: ask.inkSoft, marginBottom: 6 }, placeName: { fontFamily: font.ui600, fontSize: 15, lineHeight: 21, color: ask.ink, letterSpacing: -0.3 }, cardQuestion: { fontFamily: font.ui400, color: ask.inkSoft, fontSize: 12, lineHeight: 18, marginTop: 9, minHeight: 36 }, cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: ask.border, paddingTop: 12, marginTop: 16 }, freshness: { fontFamily: font.mono400, fontSize: 8 },
  bottomBand: { padding: 23, backgroundColor: '#EBEDDF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginTop: 30 }, bandIntro: { flexDirection: 'row', alignItems: 'center', gap: 15, flexShrink: 1 }, bandTitle: { fontFamily: font.ui600, fontSize: 16, lineHeight: 22, letterSpacing: -0.5, color: ask.ink }, bandCopy: { fontFamily: font.ui400, fontSize: 11, lineHeight: 17, color: ask.inkSoft, marginTop: 5 }, bandButton: { paddingVertical: 13, paddingHorizontal: 17, borderRadius: 30, borderWidth: 1, borderColor: '#BFC6B3' }, bandButtonText: { fontFamily: font.ui500, fontSize: 11, color: ask.ink },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingVertical: 30 }, footerBrand: { fontFamily: font.black, color: ask.ink, fontSize: 21, letterSpacing: -1 }, footerCopy: { fontFamily: font.ui400, color: ask.inkFaint, fontSize: 9 }, worldSearch: { padding: 20, backgroundColor: ask.surface, borderRadius: 14, borderWidth: 1, borderColor: ask.border, marginTop: 24, gap: 8 }, worldTitle: { fontFamily: font.ui600, fontSize: 19, color: ask.ink }, textLink: { fontFamily: font.ui600, color: ask.fresh, fontSize: 12, paddingVertical: 8 }, smallCopy: { fontFamily: font.ui400, color: ask.inkSoft, fontSize: 12, lineHeight: 19 }, worldResult: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: ask.border }, error: { ...type.label, color: ask.danger, marginTop: 12 }, empty: { alignItems: 'center', padding: 30, gap: 12 },
});

