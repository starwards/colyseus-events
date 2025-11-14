/* eslint-disable sort-imports */
import { ColRoom, Colyseus, Events, Visitor, isPrimitive } from './types';

import { Decoder } from '@colyseus/schema';
import { coreVisitors } from './core-visitors';
import { getDecoderStateCallbacks } from './spoon/get-decoder-state-callbacks';

/* eslint-enable sort-imports */

/**
 * make every change in Colyseus room state trigger an event in the EventEmitter using the provided namespace.
 * @param state Root Colyseus state object (Schema instance)
 * @param callbackProxy Callback proxy obtained from getStateCallbacks(room) in colyseus.js
 * @param events EventsEmitter of you choice. has to at least have the method `emit(eventName, value)`.
 * @param namespace (optional) Prefix of json pointer
 * @returns the provided events emitter (3rd argument)
 */
export type WireEvents = ReturnType<typeof customWireEvents>;

/**
 * create a version of `wireEvents` with custom visitors
 * @param visitors a collection of visitors, ordered by specificity. the first visitor to return `true` for an object will prevent the next visitors from visiting it.
 * @returns a customized `wireEvents` function
 */
export function customWireEvents(visitors: Iterable<Visitor>) {
    return function wireEvents<T extends Events>(room: ColRoom<Colyseus>, userEvents: T, rootNamespace = '') {
        // @ts-expect-error accessing private Decoder
        const decoder = room.serializer['decoder'] as Decoder;
        const refIds = decoder.root.refIds;
        const state = room.state;
        const wiredContainers = new Set<number>();

        // Get callback proxy from room
        const callbackProxy = getDecoderStateCallbacks(decoder);

        function recursive(node: Colyseus, events: Events, namespace: string) {
            if (isPrimitive(node)) return;
            const refId = refIds.get(node);
            if (refId === undefined) throw new Error('Could not get refId for non-primitive node in wireEvents');
            if (wiredContainers.has(refId)) return;
            wiredContainers.add(refId);
            for (const ch of visitors) {
                if (ch.visit(recursive, node, events, namespace, callbackProxy)) return;
            }
        }

        // Initial wiring
        recursive(state, userEvents, rootNamespace);
        return { events: userEvents };
    };
}

/**
 * make every change in Colyseus room state trigger an event in the EventEmitter using the provided namespace.
 * Only handle vanilla Colyseus types : Schema, ArraySchema, MapSchema. To add special behavior for custom types, use `customWireEvents()`
 * @param state Root Colyseus state object (Schema instance)
 * @param callbackProxy Callback proxy obtained from getStateCallbacks(room) in colyseus.js
 * @param events EventsEmitter of you choice. has to at least have the method `emit(eventName, value)`.
 * @param namespace (optional) Prefix of json pointer
 * @returns the provided events emitter (3rd argument)
 */
export const wireEvents = customWireEvents(coreVisitors);
