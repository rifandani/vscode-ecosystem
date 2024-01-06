/**
 * create `URLSearchParams` from object query params
 *
 * @example
 *
 * ```ts
 * createSearchParamsFromObject({ limit: '10', skip: 2 }).toString() // -> 'limit=10&skip=2'
 * createSearchParamsFromObject({ limit: ['10', '20], skip: 2 }).toString() // -> 'limit=10&limit=20&skip=2'
 * ```
 */
export function createSearchParamsFromObject(obj: Record<string, any>) {
  return new URLSearchParams(
    Object.entries(obj).flatMap(([key, values]) =>
      Array.isArray(values) ? values.map(value => [key, value]) : [[key, values]],
    ),
  )
}
