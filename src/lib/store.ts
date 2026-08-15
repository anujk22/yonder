import { create } from 'zustand';

import { Answer, DECOY_PLACES, inferQueryType, Mode, Place, PLACES, Query, QueryState, QueryType, resolvePlace } from '@/lib/places';
import { priceQuery } from '@/lib/pricing';
import { compileSpec, resultFor } from '@/lib/results';
import { ask, observe } from '@/lib/theme';

const APP_STARTED_AT = Date.now();

const SEEDED_ANSWERS: Answer[] = [
  {
    id: 'seed-joes',
    placeId: 'joes',
    queryType: 'queue',
    question: "How long is the line at Joe's Pizza?",
    headline: 'About a 12 minute wait',
    detail: '9 people in line, 2 registers open',
    structured: { peopleInQueue: 9, estimatedWaitMinutes: 12 },
    confidence: 0.94,
    observedAt: APP_STARTED_AT - 95_000,
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
    observedAt: APP_STARTED_AT - 260_000,
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
    observedAt: APP_STARTED_AT - 3 * 86_400_000,
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
  createdAt: APP_STARTED_AT - createdOffsetMs,
  state: 'OPEN',
  statusLog: [],
  answerId: null,
  refundReason: null,
  isNew: false,
});

const SEEDED_QUERIES: Query[] = [
  makeSeedQuery('seed-pier2', 'Are any pickleball courts free?', 'pier2', 'availability', 125, 100, 12_000),
  makeSeedQuery('seed-joes-query', "How long is the line at Joe's Pizza?", 'joes', 'queue', 165, 140, 22_000),
  makeSeedQuery('seed-unionsq', 'Is the Union Sq north elevator working?', 'unionsq', 'accessibility', 115, 90, 31_000),
  makeSeedQuery('seed-nike', 'Is the black Pegasus 41 in a 10 at Nike SoHo?', 'nikesoho', 'stock_check', 210, 185, 44_000),
];

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
};

export const useYonderStore = create<YonderStore>((set, get) => ({
  mode: 'ask',
  places: [...PLACES, ...DECOY_PLACES],
  answers: SEEDED_ANSWERS,
  queries: SEEDED_QUERIES,
  walletCents: 2000,
  earnedCents: 0,
  draftQuestion: '',
  resolvedPlaceId: null,
  pinnedCoordinate: null,
  deadlineMinutes: 10,
  targetHint: '',
  activeQueryId: null,
  activeTaskId: null,
  activeAnswerId: null,
  capturedFrames: [],
  wideShot: false,
  modeReveal: null,
  isModeSwitching: false,

  setDraftQuestion: (draftQuestion) => set({ draftQuestion }),
  setResolvedPlace: (resolvedPlaceId) => {
    const place = get().places.find((candidate) => candidate.id === resolvedPlaceId);
    set({ resolvedPlaceId, pinnedCoordinate: place ? { lat: place.lat, lng: place.lng } : null });
  },
  setPinnedCoordinate: (pinnedCoordinate) => set({ pinnedCoordinate }),
  resolveDraftPlace: () => {
    const place = resolvePlace(get().draftQuestion, get().places);
    set({
      resolvedPlaceId: place?.id ?? null,
      pinnedCoordinate: place ? { lat: place.lat, lng: place.lng } : null,
    });
    return place?.id ?? null;
  },
  setDeadline: (deadlineMinutes) => set({ deadlineMinutes }),
  setTargetHint: (targetHint) => set({ targetHint }),
  createDraftQuery: () => {
    const state = get();
    if (!state.resolvedPlaceId || !state.draftQuestion.trim()) return null;
    const queryType = inferQueryType(state.draftQuestion);
    const pricing = priceQuery(state.resolvedPlaceId, queryType, state.deadlineMinutes);
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
    const answerId = `answer-${query.id}-${Date.now()}`;
    const answer: Answer = {
      id: answerId,
      placeId: query.placeId,
      queryType: query.queryType,
      question: query.question,
      ...result,
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
      walletCents: Math.max(0, current.walletCents - (query.isNew ? query.bountyCents : 0)) + query.observerRewardCents,
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
}));

export const useActiveTheme = () => useYonderStore((state) => (state.mode === 'ask' ? ask : observe));
