export type ProductMediaDraft = {
  mediaAssetId: string
  url: string
  altText: string
  primary: boolean
}

export function appendProductMedia(
  current: ProductMediaDraft[],
  incoming: Omit<ProductMediaDraft, "primary">[]
) {
  const hasPrimary = current.some((item) => item.primary)

  return [
    ...current,
    ...incoming.map((item, index) => ({
      ...item,
      primary: !hasPrimary && current.length === 0 && index === 0,
    })),
  ]
}

export function removeProductMedia(
  current: ProductMediaDraft[],
  indexToRemove: number
) {
  const remaining = current.filter((_, index) => index !== indexToRemove)
  if (remaining.length === 0 || remaining.some((item) => item.primary)) {
    return remaining
  }

  return remaining.map((item, index) => ({
    ...item,
    primary: index === 0,
  }))
}
