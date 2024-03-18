import { ArraySchema, CollectionSchema, MapSchema, Schema, SetSchema } from '@colyseus/schema';

import { Container } from './types';

export type Callbacks =
    | Schema['$callbacks']
    | ArraySchema['$callbacks']
    | MapSchema['$callbacks']
    | CollectionSchema['$callbacks']
    | SetSchema['$callbacks'];

export function extractCallbacks(obj: Container) {
    //@ts-ignore: the flag symbol is not part of T
    return obj.$callbacks as Callbacks | undefined;
}

export function getFieldsList<T extends Schema>(state: T): Exclude<keyof T, keyof Schema>[] {
    // @ts-ignore: access _definition to get fields list
    return Object.values(state._definition.fieldsByIndex);
}
