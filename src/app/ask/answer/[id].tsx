import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppScreen, MissingDataState, PrimaryButton, ScreenHeader } from '@/components/ui';
import { PlaceArt } from '@/components/PlaceArt';
import { Scout } from '@/components/Brand';
import { Glyph } from '@/components/Glyph';
import { useYonderStore } from '@/lib/store';
import { freshness, formatAge } from '@/lib/freshness';
import { artFor } from '@/lib/discovery';
import { money } from '@/lib/pricing';
import { ask, font, type } from '@/lib/theme';
export default function AnswerScreen() {
  const {id}=useLocalSearchParams<{id:string}>();const router=useRouter();const answer=useYonderStore(s=>s.answers.find(a=>a.id===id));const place=useYonderStore(s=>s.places.find(p=>p.id===answer?.placeId));const queries=useYonderStore(s=>s.queries);const active=useYonderStore(s=>s.activeQueryId);const [now,setNow]=useState(() => Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  if(!answer||!place)return <MissingDataState title="That answer is not available."/>;
  const age=freshness(answer.observedAt,answer.ttlSeconds,now);const query=queries.find(q=>q.id===active&&q.answerId===answer.id)??queries.find(q=>q.answerId===answer.id&&!q.id.startsWith('seed-'));
  const refresh=()=>{const state=useYonderStore.getState();state.setResolvedPlace(place.id);state.setDraftQuestion(answer.question);state.setDeadline(10);router.push('/ask/place');};
  return <AppScreen><ScreenHeader eyebrow="YOUR LITTLE LOOK AROUND" title={place.name}/><View style={styles.status}><Text style={[styles.statusText,{color:age.band==='FRESH'?ask.fresh:ask.aging}]}>{age.band==='FRESH'?'● FRESH SAMPLE':'◷ PAST OBSERVATION'} · {formatAge(age.ageSeconds)}</Text><Scout size={34}/></View><Text accessibilityRole="header" style={styles.headline}>{answer.headline}.</Text><Text style={styles.detail}>{answer.detail}</Text>
    <View style={styles.art}><PlaceArt kind={artFor(place)}/><View style={styles.artCaption}><Text style={styles.caption}>PLACE ILLUSTRATION · NOT PHOTO EVIDENCE</Text></View></View>
    <View style={[styles.notice,{backgroundColor:age.band==='FRESH'?ask.surfaceAlt:ask.accentSoft}]}><Glyph name="clock" color={ask.ink}/><Text style={styles.noticeText}>{age.band==='FRESH'?`Sample freshness window: ${Math.max(0,answer.ttlSeconds-age.ageSeconds)} seconds remaining.`:'This observation is past its freshness window. Conditions may have changed.'}</Text></View>
    <View style={styles.card}><Text style={styles.label}>WHAT’S BEHIND THE ANSWER</Text><View style={styles.row}><Text style={styles.body}>Source</Text><Text style={styles.value}>Sample observation</Text></View><View style={styles.row}><Text style={styles.body}>Recorded</Text><Text style={styles.value}>{new Date(answer.observedAt).toLocaleString()}</Text></View><View style={styles.row}><Text style={styles.body}>Freshness window</Text><Text style={styles.value}>{Math.round(answer.ttlSeconds/60)} minutes</Text></View><Text style={styles.body}>This answer demonstrates the product. Its contents, confidence, and location have not been independently verified. Don’t use it as a current report.</Text></View>
    {query&&<View style={styles.receipt}><Text style={styles.label}>YOUR DEMO RECEIPT</Text><View style={styles.row}><Text style={styles.body}>Demo credits used</Text><Text style={styles.value}>{money(answer.charged?query.bountyCents:0)}</Text></View>{query.observerRewardCents>0&&<Text style={styles.body}>{money(answer.charged?query.observerRewardCents:0)} observer reward · {money(answer.charged?query.platformFeeCents:0)} platform fee</Text>}<Text style={styles.body}>No real payment was made.</Text></View>}
    <View style={styles.actions}><PrimaryButton label="Ask for a fresh look" onPress={refresh}/><PrimaryButton testID="answer-home" label="Keep exploring" variant="secondary" onPress={()=>router.push('/')}/></View></AppScreen>;
}
const styles=StyleSheet.create({status:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:18},statusText:{...type.micro,fontSize:10},headline:{fontFamily:font.black,fontSize:44,lineHeight:46,letterSpacing:-2,color:ask.ink},detail:{...type.body,fontSize:16,lineHeight:25,color:ask.inkSoft,marginTop:17,marginBottom:22},art:{height:220,borderRadius:16,overflow:'hidden'},artCaption:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'#242A22DD',padding:10},caption:{fontFamily:font.mono400,fontSize:8,letterSpacing:.6,color:ask.bg,textAlign:'center'},notice:{flexDirection:'row',gap:12,padding:17,borderRadius:12,alignItems:'center',marginTop:18},noticeText:{...type.label,color:ask.ink,flex:1,fontSize:12,lineHeight:20},card:{marginVertical:20,borderWidth:1,borderColor:ask.border,borderRadius:16,padding:20,gap:12},label:{...type.micro,fontSize:10,color:ask.inkSoft},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'},body:{...type.body,fontSize:12,lineHeight:20,color:ask.inkSoft},value:{...type.label,color:ask.ink,fontSize:12},receipt:{padding:20,borderRadius:16,backgroundColor:ask.surfaceAlt,gap:12},actions:{marginTop:24,gap:12}});

