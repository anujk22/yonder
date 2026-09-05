import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { AppScreen, Entrance, PrimaryButton } from '@/components/ui';
import { PlaceTile } from '@/components/PlaceTile';
import { useYonderStore } from '@/lib/store';
import { ask, font } from '@/lib/theme';
export default function SavedScreen(){const router=useRouter();const places=useYonderStore(s=>s.places);const saved=useYonderStore(s=>s.savedPlaceIds);const shown=places.filter(p=>saved.includes(p.id));
return <AppScreen><Entrance style={styles.intro}><Text style={styles.eyebrow}>YOUR LITTLE BLACK BOOK</Text><Text accessibilityRole="header" style={styles.title}>Keep the{`\n`}good ones close.</Text><Text style={styles.copy}>Places you’re curious about. Ready when you are.</Text></Entrance><View style={styles.list}>{shown.map(p=><PlaceTile key={p.id} place={p} compact width="100%"/>)}</View>{!shown.length&&<View style={styles.empty}><View style={styles.heart}><Heart size={36} strokeWidth={1.3} color={ask.fresh}/></View><Text style={styles.emptyTitle}>A few future favorites.</Text><Text style={[styles.copy,{textAlign:'center'}]}>Tap the heart on a place to tuck it away for another day.</Text><View style={{width:'100%',marginTop:12}}><PrimaryButton label="Find somewhere good" onPress={()=>router.navigate('/')}/></View></View>}</AppScreen>;
}
const styles=StyleSheet.create({intro:{paddingTop:13,gap:13},eyebrow:{fontFamily:font.ui700,fontSize:9,letterSpacing:1.2,color:ask.inkSoft},title:{fontFamily:font.serif,fontSize:42,lineHeight:45,color:ask.ink,letterSpacing:-1.5},copy:{fontFamily:font.ui400,fontSize:13,lineHeight:22,color:ask.inkSoft},list:{gap:13,marginTop:26},empty:{alignItems:'center',gap:15,paddingTop:45,paddingHorizontal:12},heart:{width:90,height:90,backgroundColor:ask.surfaceAlt,borderRadius:30,alignItems:'center',justifyContent:'center',transform:[{rotate:'-8deg'}]},emptyTitle:{fontFamily:font.serif,fontSize:27,color:ask.ink,letterSpacing:-.7}});
