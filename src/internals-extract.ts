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
