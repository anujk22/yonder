export function placeMapRoute(placeId: string) {
  return { pathname: "/map", params: { placeId } } as const;
}
