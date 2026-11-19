export const workOrderDocumentId = "workOrder";

export function orderWorkGalleries<T>(
  galleries: readonly T[],
  savedOrder: readonly string[] | null | undefined,
  getId: (gallery: T) => string | undefined,
) {
  const positions = new Map<string, number>();
  for (const id of savedOrder ?? []) {
    if (!positions.has(id)) positions.set(id, positions.size);
  }

  const position = (gallery: T) => positions.get(getId(gallery) ?? "") ?? positions.size;
  return [...galleries].sort((first, second) => position(first) - position(second));
}
