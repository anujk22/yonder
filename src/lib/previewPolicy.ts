export function featurePreviewEnabled(development: boolean, flag: string | undefined) {
  return development || flag === "1";
}
