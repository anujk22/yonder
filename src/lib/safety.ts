const REJECT_PATTERNS = [
  'my ex',
  'the guy in',
  'is john',
  'wearing a',
  'apartment',
  'house',
  'where he lives',
  'camera',
  'guard',
  'security',
  'locked',
  'alarm',
  'side door',
  'follow',
  'watch him',
  'watch her',
  'license plate',
  'number plate',
];

export const isUnsafeQuestion = (question: string) => {
  const value = question.toLowerCase();
  return REJECT_PATTERNS.some((pattern) => value.includes(pattern));
};
