export type Mode = 'ask' | 'observe';
export type PlaceStatus = 'public' | 'indoor' | 'verified_vendor' | 'blocked';
export type QueryType =
  | 'availability'
  | 'queue'
  | 'crowd'
  | 'condition'
  | 'stock_check'
  | 'accessibility'
  | 'open_closed';

export type Place = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  status: PlaceStatus;
  geofenceM: number;
  categories: QueryType[];
};

export type Answer = {
  id: string;
  placeId: string;
  queryType: QueryType;
  question: string;
  headline: string;
  detail: string;
  structured: Record<string, string | number | boolean>;
  confidence: number;
  observedAt: number;
  ttlSeconds: number;
  capturedByVendor: boolean;
  proofFrameUri: string | null;
  facesBlurred: number;
};

export type QueryState =
  | 'DRAFT'
  | 'OPEN'
  | 'ACCEPTED'
  | 'APPROACHING'
  | 'CAPTURING'
  | 'VERIFYING'
  | 'ANSWERED'
  | 'REFUNDED'
  | 'BLOCKED';

export type Query = {
  id: string;
  question: string;
  placeId: string;
  queryType: QueryType;
  targetHint: string | null;
  spec: string[];
  bountyCents: number;
  observerRewardCents: number;
  platformFeeCents: number;
  deadlineMinutes: number;
  createdAt: number;
  state: QueryState;
  statusLog: { label: string; at: number; detail?: string }[];
  answerId: string | null;
  refundReason: string | null;
  isNew?: boolean;
};

export const PLACES: Place[] = [
  { id: 'pier2', name: 'Pier 2 Basketball Courts', area: 'Brooklyn Bridge Park', lat: 40.6975, lng: -73.9975, status: 'public', geofenceM: 75, categories: ['availability', 'crowd'] },
  { id: 'bryant', name: 'Bryant Park Lawn Terrace', area: 'Midtown', lat: 40.7536, lng: -73.9832, status: 'public', geofenceM: 60, categories: ['availability', 'crowd'] },
  { id: 'joes', name: "Joe's Pizza", area: 'Carmine St, West Village', lat: 40.7305, lng: -74.002, status: 'public', geofenceM: 40, categories: ['queue', 'open_closed'] },
  { id: 'tjs', name: "Trader Joe's Union Square", area: '14th St', lat: 40.7359, lng: -73.9911, status: 'indoor', geofenceM: 50, categories: ['queue', 'stock_check'] },
  { id: 'nikesoho', name: 'Nike SoHo', area: 'Broadway & Prince', lat: 40.7243, lng: -73.9985, status: 'verified_vendor', geofenceM: 45, categories: ['stock_check', 'queue'] },
  { id: 'unionsq', name: '14 St - Union Sq Station', area: 'North Elevator', lat: 40.7349, lng: -73.9903, status: 'public', geofenceM: 50, categories: ['accessibility'] },
  { id: 'wsp', name: 'Washington Square Park', area: 'Greenwich Village', lat: 40.7308, lng: -73.9973, status: 'public', geofenceM: 90, categories: ['crowd', 'condition'] },
  { id: 'applesq', name: 'Apple Union Square', area: '14th St & Broadway', lat: 40.737, lng: -73.9903, status: 'blocked', geofenceM: 40, categories: ['stock_check'] },
];

export const DECOY_PLACES: Place[] = [
  { id: 'pier6', name: 'Pier 6', area: 'Brooklyn Bridge Park', lat: 40.6937, lng: -74.0016, status: 'public', geofenceM: 70, categories: ['availability', 'crowd'] },
  { id: 'pier17', name: 'Pier 17', area: 'South Street Seaport', lat: 40.7061, lng: -74.0033, status: 'public', geofenceM: 65, categories: ['availability', 'crowd'] },
  { id: 'target-atlantic', name: 'Target Atlantic Terminal', area: 'Fort Greene', lat: 40.6842, lng: -73.9774, status: 'indoor', geofenceM: 55, categories: ['stock_check', 'queue'] },
  { id: 'target-herald', name: 'Target Herald Square', area: 'Midtown South', lat: 40.7501, lng: -73.9877, status: 'indoor', geofenceM: 55, categories: ['stock_check', 'queue'] },
  { id: 'target-les', name: 'Target Lower East Side', area: 'Lower East Side', lat: 40.7186, lng: -73.9881, status: 'indoor', geofenceM: 55, categories: ['stock_check', 'queue'] },
];

export const SEARCH_DISTANCE_MI: Record<string, string> = {
  pier2: '0.8 mi',
  pier6: '1.1 mi',
  pier17: '2.4 mi',
  'target-atlantic': '2.2 mi',
  'target-herald': '3.1 mi',
  'target-les': '1.8 mi',
  bryant: '3.2 mi',
  wsp: '1.6 mi',
};

export const SEARCH_PLACE_NAME: Record<string, string> = {
  pier2: 'Pier 2',
};

export const searchPlaces = (input: string) => {
  const query = input.trim().toLowerCase();
  if (!query) return [];
  return [...PLACES, ...DECOY_PLACES].filter((place) => `${place.name} ${place.area}`.toLowerCase().includes(query));
};

export const OBSERVERS_NEARBY: Record<string, number> = {
  pier2: 7,
  bryant: 14,
  joes: 11,
  tjs: 9,
  nikesoho: 6,
  unionsq: 12,
  wsp: 16,
  applesq: 10,
};

export const TYPE_KEYWORDS: Record<QueryType, string[]> = {
  accessibility: ['elevator', 'escalator', 'ramp', 'accessible', 'out of service'],
  stock_check: ['in stock', 'on the shelf', 'have the', 'size', 'carry', 'pair'],
  queue: ['line', 'wait', 'queue', 'backed up'],
  availability: ['free', 'available', 'open table', 'open seat', 'court', 'spot'],
  condition: ['muddy', 'wet', 'dry', 'blocked', 'broken', 'clean'],
  open_closed: ['still open', 'closed', 'hours'],
  crowd: ['crowded', 'packed', 'how many people', 'busy'],
};

export const inferQueryType = (question: string): QueryType => {
  const value = question.toLowerCase();
  const order = Object.keys(TYPE_KEYWORDS) as QueryType[];
  return order.find((queryType) => TYPE_KEYWORDS[queryType].some((keyword) => value.includes(keyword))) ?? 'crowd';
};

export const resolvePlace = (question: string, places = PLACES) => {
  const value = question.toLowerCase();
  return places.find((place) => {
    const candidates = [place.name, place.area, place.name.replace('14 St - ', '')]
      .flatMap((candidate) => [candidate, ...candidate.split(/[,&-]/)])
      .map((candidate) => candidate.trim().toLowerCase())
      .filter((candidate) => candidate.length >= 4);
    if (candidates.some((candidate) => value.includes(candidate))) return true;
    const nameTokens = place.name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 3 || /^\d+$/.test(token));
    const matchingTokens = nameTokens.filter((token) => value.includes(token));
    return matchingTokens.length >= Math.min(2, nameTokens.length);
  });
};

export const PLACE_DISTANCE: Record<string, string> = {
  pier2: '21m',
  bryant: '3.1 km',
  joes: '1.8 km',
  tjs: '2.4 km',
  nikesoho: '2.1 km',
  unionsq: '2.5 km',
  wsp: '1.9 km',
  applesq: '2.4 km',
};
