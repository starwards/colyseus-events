/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */
import * as schema from '@colyseus/schema';
import { Decoder } from '@colyseus/schema';

// @colyseus/schema 3.x tracks refIds in `decoder.root.refIds` (WeakMap).
// @colyseus/schema 4+ removed it and stores the refId on the instance under the `$refId` symbol.
const $refId: symbol | undefined = (schema as any).$refId;

export function getRefId(decoder: Decoder, ref: unknown): number | undefined {
    if (typeof ref !== 'object' || !ref) return undefined;
    if ($refId) {
        return (ref as any)[$refId];
    }
    return (decoder.root as any).refIds.get(ref);
}

// copied from @colyseus/schema HelperTypes (its deep import path differs between 3.x and 5.x)
export interface Collection<K = unknown, V = unknown, IT = V> {
    [Symbol.iterator](): IterableIterator<IT>;
    forEach(callback: Function): void;
    entries(): IterableIterator<[K, V]>;
}
export type NonFunctionPropNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionNonPrimitivePropNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : T[K] extends number | string | boolean ? never : K;
}[keyof T];
