import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createYonderState, YonderStore } from './state';
import { ask, observe } from './theme';

export const useYonderStore = create<YonderStore>()(persist(createYonderState, {
  // v3: demo credits replaced by the bounty tab and Scout payouts.
  name: 'yonder-session-v3',
  storage: createJSONStorage(() => AsyncStorage),
  // Never persist raw photos, device location or the transient capture mode.
  partialize: ({ places, answers, queries, tab, payouts, savedPlaceIds, draftQuestion, resolvedPlaceId, deadlineMinutes, draftBountyCents, targetHint, activeQueryId, activeTaskId, activeAnswerId }) => ({
    places, answers: answers.map(a => ({ ...a, proofFrameUri: null })), queries, tab, payouts, savedPlaceIds, draftQuestion, resolvedPlaceId, deadlineMinutes, draftBountyCents, targetHint, activeQueryId, activeTaskId, activeAnswerId,
  }),
}));
export const useActiveTheme = () => useYonderStore(state => state.mode === 'ask' ? ask : observe);
