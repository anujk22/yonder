import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { brand, font } from '@/lib/theme';

// An editorial map, intentionally labeled as an illustration rather than navigation.
export function NeighborhoodMap({ onPlace }: { onPlace: (id: string) => void }) {
  return <View style={styles.map}>
    <Svg width="100%" height="100%" viewBox="0 0 600 440" preserveAspectRatio="xMidYMid slice">
      <Rect width="600" height="440" fill="#DCE6DF"/>
      <Path d="M0 0H398L366 52 397 102 352 143 354 181 302 238 259 290 216 329 119 353 0 363Z" fill="#F1F0E5" stroke="#C9D3C5" strokeWidth="2"/>
      <Path d="M600 196 478 212 461 258 397 291 359 348 301 398 285 440H600Z" fill="#F1F0E5" stroke="#C9D3C5" strokeWidth="2"/>
      <G stroke="#FFFDF6" strokeWidth="9" fill="none">
        {[0,1,2,3,4,5,6,7,8,9,10].map(i=><Path key={'h'+i} d={`M-40 ${20+i*31} ${380-i*10} ${-40+i*31}`}/>)}
        {[0,1,2,3,4,5,6,7,8].map(i=><Path key={'v'+i} d={`M${-20+i*45} -20 ${70+i*32} 330`}/>)}
        {[0,1,2,3,4,5].map(i=><Path key={'b'+i} d={`M${330+i*45} 440 ${455+i*30} 237`}/>)}
        <Path d="M358 350 620 302M328 393 620 342M390 314 620 269"/>
      </G>
      <Path d="M185 17 194 200 242 261 199 320" fill="none" stroke="#D4CBAE" strokeWidth="6"/>
      <Path d="M284 264 447 311M308 209 486 251" stroke="#BDC9BB" strokeWidth="8"/>
      <Path d="M284 264 447 311M308 209 486 251" stroke="#FFFDF6" strokeWidth="3"/>
      <Rect x="125" y="84" width="45" height="46" rx="5" fill="#B4C6A0" transform="rotate(-10 125 84)"/>
      <Rect x="58" y="235" width="43" height="36" rx="4" fill="#B4C6A0"/>
      <Path d="M403 329 435 300 450 313 422 344Z" fill="#B4C6A0"/>
      <Path d="M180 122C240 110 175 226 249 237S388 345 431 319" stroke="#718B69" strokeWidth="2" strokeDasharray="5 6" fill="none"/>
      <G fill="#7C8473" fontSize="10" fontFamily="sans-serif" letterSpacing="2">
        <SvgText x="229" y="77">EAST VILLAGE</SvgText><SvgText x="85" y="205">SOHO</SvgText><SvgText x="122" y="300">TRIBECA</SvgText><SvgText x="460" y="390">BROOKLYN</SvgText><SvgText x="350" y="165" transform="rotate(35 350 165)" fill="#829D95">EAST RIVER</SvgText>
      </G>
      <Circle cx="268" cy="199" r="28" fill="#52745C" opacity="0.08"/><Circle cx="268" cy="199" r="7" fill="#52745C" stroke="white" strokeWidth="3"/>
    </Svg>
    <View style={styles.mapLabel}><View style={styles.dot}/><Text style={styles.label}>A LITTLE LOOK AROUND NYC</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Check the line at Joe's Pizza" onPress={() => onPlace('joes')} style={[styles.bubble, { left: '12%', top: '31%', transform: [{ rotate: '-5deg' }] }]}><Text style={styles.bubbleTitle}>Worth the wait?</Text><Text style={styles.bubbleSub}>Joe’s Pizza  ↗</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Check Pier 2 basketball courts" onPress={() => onPlace('pier2')} style={[styles.bubble, { right: '7%', bottom: '19%', transform: [{ rotate: '5deg' }], backgroundColor: brand.oat }]}><Text style={styles.bubbleTitle}>Room for a game?</Text><Text style={styles.bubbleSub}>Pier 2 courts  ↗</Text></Pressable>
    <View style={styles.compass}><Text style={styles.label}>N</Text><Text style={{ fontSize: 24, color: brand.espresso }}>↑</Text></View>
    <Text style={styles.note}>Neighborhood illustration · not to scale</Text>
  </View>;
}
const styles = StyleSheet.create({
  map: { width: '100%', height: '100%', minHeight: 300, overflow: 'hidden', borderRadius: 20 }, mapLabel: { position: 'absolute', top: 20, left: 20, flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#F7F7F0', padding: 10, borderRadius: 6 }, dot: { width: 6, height: 6, borderRadius: 4, backgroundColor: '#52745C' }, label: { fontFamily: font.mono500, fontSize: 8, color: brand.espresso, letterSpacing: 0.5 },
  bubble: { position: 'absolute', backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#242A221A', boxShadow: '0 5px 0 #242A2215' }, bubbleTitle: { fontFamily: font.ui600, fontSize: 17, color: brand.espresso, letterSpacing: -0.5 }, bubbleSub: { fontFamily: font.ui400, fontSize: 10, color: '#60665B', marginTop: 6 }, compass: { position: 'absolute', right: 17, top: 18, alignItems: 'center' }, note: { position: 'absolute', bottom: 12, left: 16, fontFamily: font.mono400, color: '#60665B', fontSize: 8 },
});
