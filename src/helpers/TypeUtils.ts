// https://stackoverflow.com/a/65210846
export type ReverseMap<T> = T[keyof T];

// https://stackoverflow.com/a/68404823
export type DotPrefix<T extends string> = T extends '' ? '' : T extends undefined ? '' : `.${T}`

export type DotNestedKeys<T> = (T extends object ?
  { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}` }[Exclude<keyof T, symbol>]
  : '') extends infer D ? Extract<D, string> : never;
