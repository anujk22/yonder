import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen, MissingDataState, PrimaryButton, ScreenHeader } from '@/components/ui';
import { Scout } from '@/components/Brand';
import { useYonderStore } from '@/lib/store';
import { ask, font, type } from '@/lib/theme';
import { money } from '@/lib/pricing';

export default function StatusScreen() {
  const router = useRouter();
  const query = useYonderStore(s => s.queries.find(q => q.id === s.activeQueryId));
  const place = useYonderStore(s => s.places.find(p => p.id === query?.placeId));
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()),1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (query?.state === 'ANSWERED' && query.answerId) router.replace(`/ask/answer/${query.answerId}`); }, [query?.state, query?.answerId, router]);
  if (!query || !place) return <MissingDataState title="No request is waiting here."/>;
  const cancelled = ['REFUNDED','BLOCKED'].includes(query.state);
  const remaining = Math.max(0, Math.ceil((query.createdAt + query.deadlineMinutes*60000-now)/1000));
  const expired = remaining === 0 && !cancelled && query.state !== 'ANSWERED';
  const simulate = () => { const state = useYonderStore.getState(); state.setCaptureMode('demo'); state.setActiveTask(query.id); router.push(`/observe/task/${query.id}`); };
  return <AppScreen><ScreenHeader eyebrow="03 / YOUR REQUEST"/><View style={styles.hero}><Scout size={98}/><Text accessibilityRole="header" style={styles.title}>{cancelled ? 'Plans change.\nNo worries.' : expired ? 'Time’s up.\nNo charge.' : 'Your question\nhas a place.'}</Text><Text style={styles.question}>{query.question}</Text><Text style={styles.place}>{place.name}</Text></View>
    <View style={styles.card}><View style={styles.row}><Text style={styles.label}>{cancelled ? 'CANCELLED' : expired ? 'DEADLINE PASSED' : 'SAVED ON THIS DEVICE'}</Text><Text style={styles.clock}>{cancelled || expired ? '—' : `${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`}</Text></View><Text style={styles.body}>{cancelled ? 'This request has been closed. No demo credits were used.' : expired ? 'No answer arrived within your deadline. Create a new request when you’re ready.' : 'This preview does not contact other people. Try the observer’s side to see how a fresh answer comes together.'}</Text><Text style={styles.body}>Demo estimate: {money(query.bountyCents)} · no real payment</Text></View>
    {!cancelled && !expired && <View style={styles.actions}><PrimaryButton label="Try the observer’s side" onPress={simulate}/><PrimaryButton label="Cancel this request" variant="secondary" onPress={() => useYonderStore.getState().cancelQuery(query.id)}/></View>}
    <View style={styles.actions}><PrimaryButton label="Back to your activity" variant="secondary" onPress={() => router.push('/activity')}/></View>
  </AppScreen>;
}
const styles = StyleSheet.create({ hero: { paddingVertical: 24, alignItems: 'center', gap: 15 }, title: { fontFamily: font.black, fontSize: 44, lineHeight: 46, letterSpacing: -2, color: ask.ink, textAlign: 'center' }, question: { ...type.body, fontSize: 19, textAlign: 'center', color: ask.ink, marginTop: 8 }, place: { ...type.label, color: ask.inkSoft }, card: { padding: 24, borderRadius: 18, backgroundColor: ask.surfaceAlt, gap: 14, marginVertical: 20 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, label: { ...type.micro, color: ask.fresh }, clock: { fontFamily: font.mono500, fontSize: 22, color: ask.ink }, body: { ...type.body, color: ask.inkSoft, fontSize: 14, lineHeight: 23 }, actions: { gap: 12, marginBottom: 12 } });
