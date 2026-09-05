import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AnswerTierCard } from '@/components/AnswerTierCard';
import { AppScreen, MissingDataState, ScreenHeader } from '@/components/ui';
import { freshness } from '@/lib/freshness';
import { sameQuestion } from '@/lib/queryMatching';
import { useYonderStore } from '@/lib/store';
import { ask, font, type } from '@/lib/theme';
export default function OptionsScreen() {
  const router = useRouter(); const query = useYonderStore(s => s.queries.find(q => q.id === s.activeQueryId)); const answers = useYonderStore(s => s.answers);
  const [now,setNow] = useState(Date.now()); const [error,setError] = useState('');
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()),1000); return () => clearInterval(timer); }, []);
  if (!query) return <MissingDataState title="Start with a place and a question."/>;
  const matching = answers.filter(a => a.placeId === query.placeId && sameQuestion(a.question,query.question)).sort((a,b) => b.observedAt-a.observedAt);
  const recent = matching.find(a => freshness(a.observedAt,a.ttlSeconds,now).band === 'FRESH');
  const old = matching.find(a => freshness(a.observedAt,a.ttlSeconds,now).band !== 'FRESH');
  const cached = (id: string, price: number) => { useYonderStore.getState().chooseCachedAnswer(id,price); if (useYonderStore.getState().queries.find(q => q.id === query.id)?.state === 'ANSWERED') router.push(`/ask/answer/${id}`); else setError('That answer changed or you don’t have enough demo credits. Choose another option.'); };
  return <AppScreen><ScreenHeader eyebrow="02 / CHOOSE YOUR LOOK"/><Text accessibilityRole="header" style={styles.title}>How fresh{`\n`}do you need it?</Text><Text style={styles.question}>{query.question}</Text><Text style={styles.body}>Old observations are free. Recent ones save a trip. A new check starts from scratch.</Text><View style={styles.cards}>
    <AnswerTierCard kind="dispatch" testID="options-dispatch" headline="Ask for a fresh look" priceCents={query.bountyCents} subtitle={`Request within ${query.deadlineMinutes} minutes · demo credits`} onPress={() => { useYonderStore.getState().postActiveQuery(); if (useYonderStore.getState().queries.find(q => q.id === query.id)?.state === 'OPEN') router.push('/ask/status'); else setError('You don’t have enough available demo credits for this request.'); }}/>
    {recent && <AnswerTierCard kind="recent" testID="options-recent" headline={recent.headline} priceCents={15} observedAt={recent.observedAt} ttlSeconds={recent.ttlSeconds} onPress={() => cached(recent.id,15)}/>}
    {old && <AnswerTierCard kind="last" headline={old.headline} priceCents={0} observedAt={old.observedAt} ttlSeconds={old.ttlSeconds} onPress={() => cached(old.id,0)}/>}
    {!recent && !old && <Text style={styles.body}>No matching observation yet. Your question could be the first.</Text>}
    {Boolean(error) && <Text accessibilityRole="alert" style={[styles.body,{color:ask.danger}]}>{error}</Text>}
    </View><Text style={styles.note}>Sample observations are not current real-world reports. This preview does not dispatch people or process payments.</Text></AppScreen>;
}
const styles = StyleSheet.create({ title: { fontFamily: font.black, fontSize: 46, lineHeight: 47, color: ask.ink, letterSpacing: -2, marginTop: 12 }, question: { ...type.body, color: ask.ink, fontSize: 19, marginTop: 20 }, body: { ...type.body, color: ask.inkSoft, fontSize: 13, lineHeight: 22, marginTop: 10 }, cards: { gap: 14, marginTop: 24 }, note: { ...type.label, color: ask.inkSoft, fontSize: 11, lineHeight: 18, marginTop: 24 } });
