import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen, Entrance } from '@/components/ui';
import { Scout } from '@/components/Brand';
import { Glyph } from '@/components/Glyph';
import { useYonderStore } from '@/lib/store';
import { observe, font, type } from '@/lib/theme';
import { money } from '@/lib/pricing';
export default function ObserveHome() {
  const router = useRouter(); const queries = useYonderStore(s => s.queries); const places = useYonderStore(s => s.places);
  const tasks = queries.filter(q => q.state === 'OPEN').sort((a,b) => Number(Boolean(b.isNew))-Number(Boolean(a.isNew)));
  return <AppScreen><Entrance style={styles.intro}><Scout size={65}/><Text style={styles.eyebrow}>A SMALL FAVOR. A BETTER DAY.</Text><Text accessibilityRole="header" style={styles.title}>Be someone’s{`\n`}eyes out there.</Text><Text style={styles.body}>Already at a place? Take a quick look and help someone decide whether to make the trip.</Text></Entrance>
    <View style={styles.explainer}><Text style={styles.explainerTitle}>Two ways to try a check</Text><Text style={styles.body}>Walk through a sample task with no permissions, or use your device to test real GPS and camera capture. Rewards shown here are demo amounts.</Text></View>
    <Text style={styles.listLabel}>{tasks.length} REQUESTS TO EXPLORE · SAMPLE BOARD</Text>
    {tasks.map((q,i) => <Pressable key={q.id} accessibilityRole="button" accessibilityLabel={`Check ${q.question}`} onPress={() => { useYonderStore.getState().setActiveTask(q.id); router.push(`/observe/task/${q.id}`); }} style={({ pressed }) => [styles.card,{opacity:pressed ? .85 : 1},i === 0 && {borderColor:observe.accent}]}><View style={styles.row}><Text style={styles.eyebrow}>{q.isNew ? 'YOUR REQUEST' : 'SAMPLE REQUEST'}</Text><Text style={styles.reward}>{money(q.observerRewardCents)}</Text></View><Text style={styles.question}>{q.question}</Text><View style={styles.row}><Text style={styles.place}>{places.find(p => p.id === q.placeId)?.name}</Text><Glyph name="arrow" color={observe.accent}/></View></Pressable>)}
    {!tasks.length && <Text style={styles.body}>All caught up. Try asking a question from Explore.</Text>}
  </AppScreen>;
}
const styles = StyleSheet.create({ intro:{gap:16,paddingVertical:22},eyebrow:{...type.micro,fontSize:9,color:observe.inkSoft},title:{fontFamily:font.black,fontSize:48,lineHeight:49,letterSpacing:-2.4,color:observe.ink},body:{...type.body,fontSize:14,lineHeight:23,color:observe.inkSoft},explainer:{padding:20,borderRadius:16,backgroundColor:observe.surface,gap:9,marginVertical:14},explainerTitle:{...type.label,color:observe.accent,fontSize:15},listLabel:{...type.micro,color:observe.inkSoft,fontSize:10,marginVertical:18},card:{padding:22,borderWidth:1,borderColor:observe.border,borderRadius:16,gap:18,marginBottom:14,backgroundColor:observe.surface},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},reward:{fontFamily:font.mono500,fontSize:25,color:observe.accent},question:{fontFamily:font.ui600,fontSize:23,lineHeight:29,letterSpacing:-.7,color:observe.ink},place:{...type.label,color:observe.inkSoft,flex:1} });
