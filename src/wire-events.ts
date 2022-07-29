import { Colyseus, Events, Visitor, isPrimitive } from './types';

import { coreVisitors } from './core-visitors';

/**
 * make every change in Colyseus state trigger an event in the EventEmitter using the provided namespace.
 * @param state Colyseus state to track
 * @param events EventsEmitter of you choice. has to at least have the method `emit(eventName, value)`.
 * @param namespace (optional) Prefix of json pointer
 * @returns the provided events emitter (2nd argument)
 */
export type WireEvents = ReturnType<typeof customWireEvents>;

/**
 * create a version of `wireEvents` with custom visitors
 * @param visitors a collection of visitors, ordered by specificity. the first visitor to return `true` for an object will prevent the next visitors from visiting it.
 * @returns a customized `wireEvents` function
 */
export function customWireEvents(visitors: Iterable<Visitor>) {
    return function recursive<T extends Events>(state: Colyseus, events: T, namespace = ''): T {
        if (isPrimitive(state)) {
            return events;
        }

        for (const ch of visitors) {
            if (ch.visit(recursive, state, events, namespace)) {
                return events;
            }
        }
        return events;
    };
}

/**
 * make every change in Colyseus state trigger an event in the EventEmitter using the provided namespace.
 * Only handle vanilla Colyseus types : Schema, ArraySchema, MapSchema. To add special behavior for custom types, use `customWireEvents()`
 * @param state Colyseus state to track
 * @param events EventsEmitter of you choice. has to at least have the method `emit(eventName, value)`.
 * @param namespace (optional) Prefix of json pointer
 * @returns the provided events emitter (2nd argument)
 */
export const wireEvents = customWireEvents(coreVisitors);
