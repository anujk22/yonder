import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen, MissingDataState, PrimaryButton } from '@/components/ui';
import { Scout } from '@/components/Brand';
import { useYonderStore } from '@/lib/store';
import { money } from '@/lib/pricing';
import { observe, font, type } from '@/lib/theme';
export default function EarnedScreen(){
  const router=useRouter();const query=useYonderStore(s=>s.queries.find(q=>q.id===s.activeTaskId));const answer=useYonderStore(s=>s.answers.find(a=>a.id===query?.answerId));
  if(!query||!answer)return <MissingDataState title="No completed demo check is available."/>;
  const reward=answer.charged?query.observerRewardCents:0;
  return <AppScreen><View style={styles.hero}><Scout size={115}/><Text style={styles.label}>DEMO CHECK COMPLETE</Text><Text style={styles.title}>{reward?'A little help.\nA better day.':'Some questions\nneed another look.'}</Text><Text style={styles.amount}>+{money(reward)}</Text><Text style={styles.body}>Demo earnings · not withdrawable</Text></View><View style={styles.card}><Text style={styles.body}>{reward?'You’ve completed the sample observer journey. The answer is ready to view from the asker’s side.':'There is no confident sample answer for this question. No demo credits were charged and no reward was added.'}</Text><Text style={styles.body}>No location, photo analysis, or payment was verified in this simulation.</Text></View><View style={styles.actions}><PrimaryButton label="See the answer you helped create" onPress={()=>router.push(`/ask/answer/${answer.id}`)}/><PrimaryButton label="Back to requests" variant="secondary" onPress={()=>router.replace('/observe')}/></View></AppScreen>;
}
const styles=StyleSheet.create({hero:{alignItems:'center',gap:18,paddingVertical:35},label:{...type.micro,color:observe.accent},title:{fontFamily:font.black,fontSize:43,lineHeight:46,letterSpacing:-2,color:observe.ink,textAlign:'center'},amount:{fontFamily:font.mono500,fontSize:50,color:observe.accent,marginTop:10},body:{...type.body,fontSize:14,lineHeight:23,color:observe.inkSoft},card:{backgroundColor:observe.surface,borderRadius:16,padding:24,gap:16},actions:{marginTop:24,gap:14}});
