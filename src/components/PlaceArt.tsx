import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export function PlaceArt({ kind }: { kind: 'court' | 'pizza' | 'park' | 'shop' }) {
  return <Svg width="100%" height="100%" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid slice" accessibilityRole="image" accessibilityLabel={`${kind} illustration`}>
    <Rect width="360" height="180" fill={kind === 'court' ? '#C7D6DD' : kind === 'pizza' ? '#EDD8C8' : kind === 'park' ? '#DEE3BD' : '#DCD6E8'}/>
    {kind === 'court' ? <>
      <Path d="M0 74H360M0 69 37 47 68 63 98 35 136 56 174 30 226 59 251 38 283 63 322 29 360 48" fill="#9BAFB6"/>
      <Path d="m47 106 215-28 104 90-294 26Z" fill="#69927B" stroke="#3F6353" strokeWidth="2"/>
      <G stroke="#F2ECD9" strokeWidth="2" fill="none"><Path d="m65 111 190-24 89 73-263 27Zm97-11 44 76M75 136l50-5 13 19-49 7M281 108l-48 8 20 25 54-8"/><Path d="M168 126c-20 3-12 24 10 27s37-23 8-27Z"/></G>
      <Path d="M62 140V76m0 7h31m-7-10v24H63V73Z" stroke="#384C43" strokeWidth="3" fill="#F5F1DC"/><Path d="M78 98h14" stroke="#D77349" strokeWidth="3"/>
      <Circle cx="259" cy="144" r="10" fill="#D77B4D"/><Path d="m251 139 15 10m-10-14 5 18" stroke="#6C4937"/>
    </> : kind === 'pizza' ? <>
      <Rect x="66" y="22" width="228" height="180" fill="#C68F72"/><Rect x="85" y="40" width="190" height="34" fill="#F5EDCE"/><Path d="M83 76H278L292 98H68Z" fill="#446C56"/>
      {[0,1,2,3,4,5,6].map(i=><Path key={i} d={`m${86+i*28} 76-7 22h13l5-22`} fill="#F3EACB"/>)}
      <Rect x="89" y="107" width="73" height="73" fill="#3E5247"/><Rect x="179" y="107" width="93" height="73" fill="#3E5247"/>
      <Path d="M200 126h52v40h-52ZM225 126v40M97 143h56" fill="none" stroke="#DDC499" strokeWidth="2"/>
      <Path d="m140 47-29 19h47Z" fill="#CF6C46"/><Circle cx="137" cy="59" r="3" fill="#F5CE72"/>
      <Path d="M176 52h79m-79 10h56" stroke="#587159" strokeWidth="4"/>
      {[46,311].map(x=><G key={x}><Circle cx={x} cy="127" r="8" fill="#9C654D"/><Path d={`M${x} 137v28m0-19-8 10m8 9-6 15m6-15 7 15`} stroke="#3C5147" strokeWidth="6" strokeLinecap="round"/></G>)}
    </> : kind === 'park' ? <>
      <Path d="M0 139Q120 100 360 128V180H0Z" fill="#A6B281"/><Path d="m174 118-64 62h75l18-62" fill="#EDE5C3"/>
      {[45,95,278,330].map((x,i)=><G key={x}><Path d={`M${x} 80v65`} stroke="#646F43" strokeWidth="5"/><Circle cx={x} cy={65+i%2*12} r={31} fill={i%2 ? '#6F8961' : '#8A9D6C'}/><Circle cx={x-12} cy={82+i%2*12} r="22" fill={i%2 ? '#6F8961' : '#8A9D6C'}/></G>)}
      <Path d="M198 135h53m-45 0-5 32m41-32 5 32m-21-32v30" stroke="#496B57" strokeWidth="4"/><Path d="M203 124h45v10h-45Z" fill="#5B7C60"/>
      <Circle cx="190" cy="35" r="18" fill="#F6D767"/>
    </> : <>
      <Rect x="77" y="24" width="211" height="160" fill="#B2A6C1"/><Rect x="97" y="46" width="170" height="120" fill="#F2EEE5"/><Rect x="112" y="90" width="140" height="60" fill="#D5D9CE"/>
      <Path d="m148 103 20 15 41 8c14 9-18 17-68 7-14-4-15-8 7-30Z" fill="#4C6253"/><Path d="m147 126 49 5" stroke="#F4E5B1" strokeWidth="4"/><Path d="M136 67h94" stroke="#737166" strokeWidth="4"/>
    </>}
  </Svg>;
}
