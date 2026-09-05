import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen, MissingDataState, PrimaryButton, ScreenHeader } from '@/components/ui';
import { MapSurface, detailRegion } from '@/components/MapSurface';
import { Scout } from '@/components/Brand';
import { useYonderStore } from '@/lib/store';
import { useLiveLocation } from '@/lib/location';
import { validateLocation } from '@/lib/geo';
import { observe, font, type } from '@/lib/theme';
export default function ApproachScreen() {
  const router=useRouter();const query=useYonderStore(s=>s.queries.find(q=>q.id===s.activeTaskId));const place=useYonderStore(s=>s.places.find(p=>p.id===query?.placeId));const mode=useYonderStore(s=>s.captureMode);const location=useLiveLocation();const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  if(!query||!place||['ANSWERED','REFUNDED','BLOCKED'].includes(query.state))return <MissingDataState title="No check is ready here."/>;
  const target={latitude:place.lat,longitude:place.lng};const validation=validateLocation(location.fix,target,place.geofenceM,now);const demo=mode==='demo';
  const open=()=>{if(!demo&&!validateLocation(location.fix,target,place.geofenceM).valid)return;const state=useYonderStore.getState();state.setLocationEvidence(demo?null:location.fix);state.updateQueryState(query.id,'APPROACHING',demo?'Demo location step':'Device location checked',demo?'Simulation selected':validation.reason);router.push('/observe/capture');};
  return <AppScreen><ScreenHeader eyebrow={demo?'DEMO / LOCATION STEP':'DEVICE / LOCATION CHECK'} title={place.name}/><View style={styles.map}><MapSurface mode="observe" style={StyleSheet.absoluteFill} initialRegion={detailRegion(target)} geofence={{center:target,radius:place.geofenceM}} userLocation={location.fix} markers={[{id:place.id,coordinate:target,label:'Check area'}]}/></View><View style={styles.center}><Scout size={64}/><Text style={styles.distance}>{demo?'Let’s take a look.':validation.distance===null?'Are you there?':`${Math.round(validation.distance)} m away`}</Text><Text style={styles.body}>{demo?'This is a practice run. No GPS is used and the camera shows a sample scene.':validation.reason}</Text></View>
    {!demo&&<View style={styles.card}><Text style={styles.label}>THREE CHECKS BEFORE CAPTURE</Text><Text style={styles.body}>Inside the {place.geofenceM} m area, including your accuracy radius.{`\n`}A reading less than 30 seconds old.{`\n`}Accuracy within ±{Math.min(place.geofenceM/2,50)} m.</Text><Text style={styles.note}>Device GPS can be spoofed. This is a proximity check, not independent proof.</Text></View>}
    {Boolean(location.error)&&<Text accessibilityRole="alert" style={[styles.body,{color:observe.danger,marginBottom:14}]}>{location.error}</Text>}
    <View style={styles.actions}>{!demo&&!location.active&&<PrimaryButton label={location.loading?'Finding your location…':'Share location for this check'} onPress={location.start} disabled={location.loading}/>}<PrimaryButton testID="approach-capture" label={demo?'Open demo camera':validation.valid?'Open camera':'Camera locked until you’re there'} icon={demo||validation.valid?'camera':'lock'} disabled={!demo&&!validation.valid} onPress={open}/><PrimaryButton label="Back to requests" variant="secondary" onPress={()=>{useYonderStore.getState().releaseActiveTask('Returned to requests');router.replace('/observe');}}/></View>
  </AppScreen>;
}
const styles=StyleSheet.create({map:{height:220,borderRadius:16,overflow:'hidden'},center:{alignItems:'center',paddingVertical:24,gap:15},distance:{fontFamily:font.ui600,fontSize:32,lineHeight:38,color:observe.ink,letterSpacing:-1},body:{...type.body,fontSize:14,lineHeight:23,color:observe.inkSoft},card:{borderRadius:16,backgroundColor:observe.surface,padding:20,gap:12,marginBottom:22},label:{...type.micro,color:observe.accent,fontSize:10},note:{...type.label,color:observe.inkSoft,fontSize:11,lineHeight:18},actions:{gap:12}});
