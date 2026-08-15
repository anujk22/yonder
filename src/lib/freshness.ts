import { AppTheme } from '@/lib/theme';

export type FreshnessBand = 'FRESH' | 'AGING' | 'STALE';

export const freshness = (observedAt: number, ttlSeconds: number, now = Date.now()) => {
  const ageSeconds = Math.max(0, Math.floor((now - observedAt) / 1000));
  const ratio = ageSeconds / ttlSeconds;
  const band: FreshnessBand = ratio >= 1 ? 'STALE' : ratio >= 0.75 ? 'AGING' : 'FRESH';
  return { ageSeconds, ratio, band };
};

export const freshnessColor = (band: FreshnessBand, theme: AppTheme) => {
  if (band === 'FRESH') return theme.fresh;
  if (band === 'AGING') return theme.aging;
  return theme.stale;
};

export const formatAge = (seconds: number) => {
  if (seconds < 90) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

export const formatVerifiedAge = (seconds: number) => `Verified ${formatAge(seconds)}`;
