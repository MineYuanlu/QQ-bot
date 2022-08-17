export type MaybePromise<T> = T | Promise<T>;
export type MaybeArray<T> = T | T[];
export type Expand<T> = { [k in keyof T]: T[k] };
