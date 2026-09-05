export const normalizedQuestion = (value: string) => value.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim();
// Category matching alone can sell the wrong answer (e.g. a different shoe size).
export const sameQuestion = (a: string, b: string) => normalizedQuestion(a) === normalizedQuestion(b);
