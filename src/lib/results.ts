import { QueryType } from '@/lib/places';

export type MockResult = {
  headline: string;
  detail: string;
  structured: Record<string, string | number | boolean>;
  confidence: number;
  ttlSeconds: number;
  facesBlurred: number;
};

export const RESULTS: Record<string, MockResult> = {
  'pier2:availability': { headline: 'One court is available', detail: '4 of 5 courts occupied. 18 players on site.', structured: { availableCourts: 1, occupiedCourts: 4, playersDetected: 18 }, confidence: 0.96, ttlSeconds: 300, facesBlurred: 4 },
  'joes:queue': { headline: 'About a 12 minute wait', detail: '9 people in line, 2 registers open.', structured: { peopleInQueue: 9, estimatedWaitMinutes: 12 }, confidence: 0.94, ttlSeconds: 300, facesBlurred: 6 },
  'unionsq:accessibility': { headline: 'The north elevator is working', detail: 'Doors cycling, no service notice posted.', structured: { operational: true, noticePosted: false }, confidence: 0.93, ttlSeconds: 1800, facesBlurred: 2 },
  'nikesoho:stock_check': { headline: 'Yes, 2 pairs on the shelf', detail: 'Black Pegasus 41, size 10, wall display aisle 3.', structured: { productPresent: true, unitsVisible: 2, location: 'wall display, aisle 3' }, confidence: 0.92, ttlSeconds: 1800, facesBlurred: 1 },
  'tjs:queue': { headline: 'About a 7 minute wait', detail: 'Line is inside the store, not wrapping outside.', structured: { estimatedWaitMinutes: 7 }, confidence: 0.9, ttlSeconds: 300, facesBlurred: 8 },
  'bryant:availability': { headline: '12 open tables', detail: 'Terrace side is emptiest.', structured: { openTables: 12, totalTables: 60 }, confidence: 0.91, ttlSeconds: 300, facesBlurred: 14 },
};

export const resultFor = (placeId: string, queryType: QueryType) =>
  RESULTS[`${placeId}:${queryType}`] ?? {
    headline: 'Conditions verified',
    detail: 'The requested place condition was visible in the live capture.',
    structured: { verified: true },
    confidence: 0.88,
    ttlSeconds: 300,
    facesBlurred: 0,
  };

export const compileSpec = (placeId: string, queryType: QueryType) => {
  if (placeId === 'pier2' && queryType === 'availability') {
    return ['All five courts, full playing surface', 'Whether at least one court is unoccupied', 'availableCourts, occupiedCourts', '5 minutes'];
  }

  const map: Record<QueryType, string[]> = {
    availability: ['The complete public area', 'Whether space is available now', 'availableCount, occupiedCount', '5 minutes'],
    queue: ['The full visible queue', 'Current line length and movement', 'peopleInQueue, estimatedWaitMinutes', '5 minutes'],
    crowd: ['The main public area', 'Current crowd density', 'peopleVisible, density', '5 minutes'],
    condition: ['The requested surface or feature', 'Its visible condition right now', 'condition, obstruction', '10 minutes'],
    stock_check: ['The named product display', 'Whether the exact item is visible', 'productPresent, unitsVisible', '30 minutes'],
    accessibility: ['The named access point', 'Whether it is operating right now', 'operational, noticePosted', '30 minutes'],
    open_closed: ['The public entrance', 'Whether customers are entering', 'openNow, entranceStatus', '10 minutes'],
  };
  return map[queryType];
};
