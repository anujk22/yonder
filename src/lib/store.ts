import { create } from 'zustand';

import { CONFIDENCE_THRESHOLD } from '@/lib/constants';
import { Answer, DECOY_PLACES, inferQueryType, Mode, Place, PLACES, Query, QueryState, QueryType, resolvePlace } from '@/lib/places';
import { priceQuery, splitBounty } from '@/lib/pricing';
import { compileSpec, resultFor } from '@/lib/results';
import { ask, observe } from '@/lib/theme';

const makeSeededAnswers = (startedAt: number): Answer[] => [
  {
    id: 'seed-pier2-last',
    placeId: 'pier2',
    queryType: 'availability',
    question: 'Are any basketball courts free?',
    headline: 'One court is available',
    detail: '3 of 4 courts occupied. 18 players on site.',
    structured: { availableCourts: 1, occupiedCourts: 3, playersDetected: 18 },
    confidence: 0.9,
    charged: true,
    observedAt: startedAt - 3 * 60 * 60_000,
    ttlSeconds: 300,
    capturedByVendor: false,
    proofFrameUri: null,
    facesBlurred: 4,
  },
  {
    id: 'seed-nike-stock',
    placeId: 'nikesoho',
    queryType: 'stock_check',
    question: 'Is the black Pegasus 41 in a 10 at Nike SoHo?',
    headline: 'Yes, 2 pairs on the shelf',
    detail: 'Black Pegasus 41, size 10, wall display aisle 3.',
    structured: { productPresent: true, unitsVisible: 2, location: 'wall display, aisle 3' },
    confidence: 0.92,
    charged: true,
    observedAt: startedAt - 45_000,
    ttlSeconds: 1800,
    capturedByVendor: true,
    proofFrameUri: null,
    facesBlurred: 1,
  },
  {
    id: 'seed-joes',
    placeId: 'joes',
    queryType: 'queue',
    question: "How long is the line at Joe's Pizza?",
    headline: 'About a 12 minute wait',
    detail: '9 people in line, 2 registers open',
    structured: { peopleInQueue: 9, estimatedWaitMinutes: 12 },
    confidence: 0.94,
    charged: true,
    observedAt: startedAt - 95_000,
    ttlSeconds: 300,
    capturedByVendor: false,
    proofFrameUri: null,
    facesBlurred: 6,
  },
  {
    id: 'seed-bryant',
    placeId: 'bryant',
    queryType: 'availability',
    question: 'Are there open tables at Bryant Park?',
    headline: '12 open tables',
    detail: 'Terrace side is emptiest, shade under the trees',
    structured: { openTables: 12, totalTables: 60 },
    confidence: 0.91,
    charged: true,
    observedAt: startedAt - 260_000,
    ttlSeconds: 300,
    capturedByVendor: false,
    proofFrameUri: null,
    facesBlurred: 14,
  },
  {
    id: 'seed-tjs',
    placeId: 'tjs',
    queryType: 'queue',
    question: "How long is the line at Trader Joe's Union Square?",
    headline: 'About a 15 minute wait',
    detail: 'Line wrapped past the wine section',
    structured: { estimatedWaitMinutes: 15 },
    confidence: 0.89,
    charged: true,
    observedAt: startedAt - 3 * 86_400_000,
    ttlSeconds: 300,
    capturedByVendor: false,
    proofFrameUri: null,
    facesBlurred: 11,
  },
];

const makeSeedQuery = (
  id: string,
  question: string,
  placeId: string,
  queryType: QueryType,
  bountyCents: number,
  observerRewardCents: number,
  createdOffsetMs: number,
  startedAt: number,
): Query => ({
  id,
  question,
  placeId,
  queryType,
  targetHint: null,
  spec: compileSpec(placeId, queryType),
  bountyCents,
  observerRewardCents,
  platformFeeCents: bountyCents - observerRewardCents,
  deadlineMinutes: 10,
  createdAt: startedAt - createdOffsetMs,
  state: 'OPEN',
  statusLog: [],
  answerId: null,
  refundReason: null,
  isNew: false,
});

const makeSeededQueries = (startedAt: number): Query[] => [
  makeSeedQuery('seed-pier2', 'Are any basketball courts free?', 'pier2', 'availability', 150, 120, 12_000, startedAt),
  makeSeedQuery('seed-joes-query', "How long is the line at Joe's Pizza?", 'joes', 'queue', 200, 160, 22_000, startedAt),
  makeSeedQuery('seed-unionsq', 'Is the Union Sq north elevator working?', 'unionsq', 'accessibility', 150, 120, 31_000, startedAt),
  makeSeedQuery('seed-nike', 'Is the black Pegasus 41 in a 10 at Nike SoHo?', 'nikesoho', 'stock_check', 250, 200, 44_000, startedAt),
];

const makeInitialState = () => {
  const startedAt = Date.now();
  return {
    mode: 'ask' as Mode,
    places: [...PLACES, ...DECOY_PLACES],
    answers: makeSeededAnswers(startedAt),
    queries: makeSeededQueries(startedAt),
    walletCents: 2000,
    earnedCents: 0,
    draftQuestion: '',
    resolvedPlaceId: null,
    pinnedCoordinate: null,
    deadlineMinutes: 10,
    draftBountyCents: null,
    targetHint: '',
    activeQueryId: null,
    activeTaskId: null,
    activeAnswerId: null,
    capturedFrames: [],
    wideShot: false,
    modeReveal: null,
    isModeSwitching: false,
  };
};

type ModeRevealState = {
  id: number;
  x: number;
  y: number;
  to: Mode;
  reduceMotion: boolean;
} | null;

type YonderStore = {
  mode: Mode;
  places: Place[];
  answers: Answer[];
  queries: Query[];
  walletCents: number;
  earnedCents: number;
  draftQuestion: string;
  resolvedPlaceId: string | null;
  pinnedCoordinate: { lat: number; lng: number } | null;
  deadlineMinutes: number;
  draftBountyCents: number | null;
  targetHint: string;
  activeQueryId: string | null;
  activeTaskId: string | null;
  activeAnswerId: string | null;
  capturedFrames: string[];
  wideShot: boolean;
  modeReveal: ModeRevealState;
  isModeSwitching: boolean;
  setDraftQuestion: (question: string) => void;
  setResolvedPlace: (placeId: string | null) => void;
  setPinnedCoordinate: (coordinate: { lat: number; lng: number }) => void;
  resolveDraftPlace: () => string | null;
  setDeadline: (minutes: number) => void;
  setDraftBountyCents: (bountyCents: number | null) => void;
  setTargetHint: (hint: string) => void;
  createDraftQuery: () => string | null;
  postActiveQuery: () => void;
  chooseCachedAnswer: (answerId: string, priceCents: number) => void;
  setActiveTask: (queryId: string) => void;
  updateQueryState: (queryId: string, state: QueryState, label?: string, detail?: string) => void;
  acceptActiveTask: () => void;
  setCapturedFrames: (frames: string[]) => void;
  completeObservation: () => string | null;
  releaseActiveTask: (reason: string) => void;
  blockActivePlace: () => void;
  setWideShot: (wideShot: boolean) => void;
  startModeReveal: (reveal: NonNullable<ModeRevealState>) => void;
  swapMode: (mode: Mode) => void;
  finishModeReveal: () => void;
  resetDemo: () => void;
};

export const useYonderStore = create<YonderStore>((set, get) => ({
  ...makeInitialState(),

  setDraftQuestion: (draftQuestion) => set({ draftQuestion }),
  setResolvedPlace: (resolvedPlaceId) => {
    const place = get().places.find((candidate) => candidate.id === resolvedPlaceId);
    set({ resolvedPlaceId, pinnedCoordinate: place ? { lat: place.lat, lng: place.lng } : null, draftBountyCents: null });
  },
  setPinnedCoordinate: (pinnedCoordinate) => set({ pinnedCoordinate }),
  resolveDraftPlace: () => {
    const place = resolvePlace(get().draftQuestion, get().places);
    set({
      resolvedPlaceId: place?.id ?? null,
      pinnedCoordinate: place ? { lat: place.lat, lng: place.lng } : null,
      draftBountyCents: null,
    });
    return place?.id ?? null;
  },
  setDeadline: (deadlineMinutes) => set({ deadlineMinutes }),
  setDraftBountyCents: (draftBountyCents) => set({ draftBountyCents }),
  setTargetHint: (targetHint) => set({ targetHint }),
  createDraftQuery: () => {
    const state = get();
    if (!state.resolvedPlaceId || !state.draftQuestion.trim()) return null;
    const queryType = inferQueryType(state.draftQuestion);
    const calculatedPricing = priceQuery(state.resolvedPlaceId, queryType, state.deadlineMinutes);
    const pricing = splitBounty(state.draftBountyCents ?? calculatedPricing.bountyCents);
    const id = `query-${Date.now()}`;
    const query: Query = {
      id,
      question: state.draftQuestion.trim(),
      placeId: state.resolvedPlaceId,
      queryType,
      targetHint: state.targetHint.trim() || null,
      spec: compileSpec(state.resolvedPlaceId, queryType),
      ...pricing,
      deadlineMinutes: state.deadlineMinutes,
      createdAt: Date.now(),
      state: 'DRAFT',
      statusLog: [{ label: 'Query compiled', at: Date.now() }],
      answerId: null,
      refundReason: null,
      isNew: true,
    };
    set((current) => ({ queries: [query, ...current.queries], activeQueryId: id }));
    return id;
  },
  postActiveQuery: () => {
    const { activeQueryId } = get();
    if (!activeQueryId) return;
    set((state) => {
      const query = state.queries.find((item) => item.id === activeQueryId);
      if (!query || query.state !== 'DRAFT') return state;
      return {
        queries: state.queries.map((item) =>
          item.id === activeQueryId
            ? { ...item, state: 'OPEN' as const, isNew: true, statusLog: [...item.statusLog, { label: 'Finding eyes nearby', at: Date.now() }] }
            : item,
        ),
        activeTaskId: activeQueryId,
      };
    });
  },
  chooseCachedAnswer: (answerId, priceCents) =>
    set((state) => ({
      queries: state.queries.map((query) =>
        query.id === state.activeQueryId
          ? {
              ...query,
              state: 'ANSWERED' as const,
              bountyCents: priceCents,
              observerRewardCents: 0,
              platformFeeCents: priceCents,
              answerId,
              isNew: false,
              statusLog: [...query.statusLog, { label: 'Fresh cached answer delivered', at: Date.now() }],
            }
          : query,
      ),
      activeAnswerId: answerId,
      walletCents: Math.max(0, state.walletCents - priceCents),
    })),
  setActiveTask: (activeTaskId) => set({ activeTaskId, capturedFrames: [], wideShot: false }),
  updateQueryState: (queryId, queryState, label, detail) =>
    set((state) => ({
      queries: state.queries.map((query) =>
        query.id === queryId
          ? {
              ...query,
              state: queryState,
              statusLog: label ? [...query.statusLog, { label, at: Date.now(), detail }] : query.statusLog,
            }
          : query,
      ),
    })),
  acceptActiveTask: () => {
    const { activeTaskId } = get();
    if (!activeTaskId) return;
    get().updateQueryState(activeTaskId, 'ACCEPTED', 'Observer accepted', 'already on site');
  },
  setCapturedFrames: (capturedFrames) => set({ capturedFrames }),
  completeObservation: () => {
    const state = get();
    const query = state.queries.find((item) => item.id === state.activeTaskId);
    if (!query) return null;
    const place = state.places.find((item) => item.id === query.placeId);
    const result = resultFor(query.placeId, query.queryType);
    const charged = result.confidence >= CONFIDENCE_THRESHOLD;
    const answerId = `answer-${query.id}-${Date.now()}`;
    const answer: Answer = {
      id: answerId,
      placeId: query.placeId,
      queryType: query.queryType,
      question: query.question,
      ...result,
      charged,
      observedAt: Date.now(),
      capturedByVendor: place?.status === 'verified_vendor',
      proofFrameUri: state.capturedFrames[0] ?? null,
    };
    set((current) => ({
      answers: [answer, ...current.answers],
      queries: current.queries.map((item) =>
        item.id === query.id
          ? { ...item, state: 'ANSWERED' as const, answerId, isNew: false, statusLog: [...item.statusLog, { label: 'Verified answer ready', at: Date.now() }] }
          : item,
      ),
      activeQueryId: query.isNew ? query.id : current.activeQueryId,
      activeAnswerId: answerId,
      earnedCents: current.earnedCents + query.observerRewardCents,
      walletCents: Math.max(0, current.walletCents - (query.isNew && charged ? query.bountyCents : 0)) + query.observerRewardCents,
    }));
    return answerId;
  },
  releaseActiveTask: (reason) => {
    const { activeTaskId } = get();
    if (!activeTaskId) return;
    set((state) => ({
      queries: state.queries.map((query) =>
        query.id === activeTaskId
          ? { ...query, state: 'OPEN' as const, isNew: false, refundReason: reason, statusLog: [...query.statusLog, { label: 'Observation released', at: Date.now(), detail: reason }] }
          : query,
      ),
      activeTaskId: null,
    }));
  },
  blockActivePlace: () => {
    const state = get();
    const query = state.queries.find((item) => item.id === state.activeTaskId);
    if (!query) return;
    set((current) => ({
      places: current.places.map((place) => (place.id === query.placeId ? { ...place, status: 'blocked' as const } : place)),
      queries: current.queries.map((item) =>
        item.id === query.id ? { ...item, state: 'BLOCKED' as const, refundReason: 'Staff asked the observer to stop', isNew: false } : item,
      ),
      walletCents: current.walletCents + query.observerRewardCents,
      earnedCents: current.earnedCents + query.observerRewardCents,
    }));
  },
  setWideShot: (wideShot) => set({ wideShot }),
  startModeReveal: (modeReveal) => set({ modeReveal, isModeSwitching: true }),
  swapMode: (mode) => set({ mode }),
  finishModeReveal: () => set({ modeReveal: null, isModeSwitching: false }),
  resetDemo: () => set(makeInitialState()),
}));

export const useActiveTheme = () => useYonderStore((state) => (state.mode === 'ask' ? ask : observe));
