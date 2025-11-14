import { Add, Colyseus, Events, Remove, Replace, Traverse, Visitor, isContainer } from './types';
import { ArraySchema, MapSchema, Schema } from '@colyseus/schema';

import { CallbacksCleanup } from './destructors';
import { SchemaCallbackProxy } from './spoon/get-decoder-state-callbacks';
import { getFieldsList } from './spoon/internals-extract';

const cache = new CallbacksCleanup();
export const handleSchema = Object.freeze({
    visit<T extends Schema>(
        traverse: Traverse,
        state: T,
        events: Events,
        namespace: string,
        callbackProxy: SchemaCallbackProxy,
    ) {
        if (!(state instanceof Schema)) {
            return false;
        }
        const $ = callbackProxy(state);
        const destructors = cache.resetDestructors($.refId);
        for (const field of getFieldsList(state)) {
            const fieldNamespace = `${namespace}/${field as string}`;
            const initialValue = state[field] as Colyseus;

            // Always traverse initial value to wire up nested callbacks
            traverse(initialValue, events, fieldNamespace, callbackProxy);

            destructors.add(
                // @ts-expect-error - TypeScript has trouble with union types for overloaded .listen() method
                $.listen(
                    field,
                    (value: unknown, previousValue: unknown) => {
                        if (value === previousValue) return;
                        if (isContainer(previousValue)) cache.resetDestructors(callbackProxy(previousValue).refId);
                        events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                        traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
                    },
                    false,
                ) as () => void,
            );
        }
        return true;
    },
});

export const handleArraySchema = Object.freeze({
    visit<T extends Colyseus>(
        traverse: Traverse,
        state: ArraySchema<T>,
        events: Events,
        namespace: string,
        callbackProxy: SchemaCallbackProxy,
    ) {
        if (!(state instanceof ArraySchema)) {
            return false;
        }
        const $ = callbackProxy(state);
        const destructors = cache.resetDestructors($.refId);
        const knownAdds = new Set<number>(); // Track indices seen in onAdd
        const knownChanges = new Set<number>(); // Track indices seen in onChange (to filter initial onChange)
        destructors.add(
            $.onAdd((value: unknown, field: unknown) => {
                const fieldNum = field as number;
                const fieldNamespace = `${namespace}/${fieldNum}`;
                if (!knownAdds.has(fieldNum)) {
                    knownAdds.add(fieldNum);
                    events.emit(namespace, Add(fieldNamespace, value as Colyseus));
                }
                traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
            }, false),
        );
        destructors.add(
            $.onChange((value: unknown, field: unknown) => {
                const fieldNum = field as number;
                if (knownChanges.has(fieldNum)) {
                    // We've seen onChange for this index before, so it's a real change
                    const fieldNamespace = `${namespace}/${fieldNum}`;
                    events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                    traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
                } else {
                    // First onChange for this index - this fires after onAdd, so skip it
                    knownChanges.add(fieldNum);
                }
            }),
        );
        destructors.add(
            $.onRemove((item: unknown, field: unknown) => {
                if (isContainer(item)) cache.resetDestructors(callbackProxy(item).refId);
                const fieldNum = field as number;
                knownAdds.delete(fieldNum);
                knownChanges.delete(fieldNum);
                const fieldNamespace = `${namespace}/${fieldNum}`;
                events.emit(namespace, Remove(fieldNamespace));
            }),
        );
        return true;
    },
});

export const handleMapSchema = Object.freeze({
    visit<T extends Colyseus>(
        traverse: Traverse,
        state: MapSchema<T>,
        events: Events,
        namespace: string,
        callbackProxy: SchemaCallbackProxy,
    ) {
        // Check if it is going to handle the state object, and return `false` if not.
        if (!(state instanceof MapSchema)) {
            return false;
        }
        const $ = callbackProxy(state);
        const destructors = cache.resetDestructors($.refId);
        const knownAdds = new Set<string>(); // Track keys seen in onAdd
        const knownChanges = new Set<string>(); // Track keys seen in onChange (to filter initial onChange)
        // Hook on new elements
        destructors.add(
            $.onAdd((value: unknown, field: unknown) => {
                const fieldStr = field as string;
                const fieldNamespace = `${namespace}/${fieldStr}`;
                if (!knownAdds.has(fieldStr)) {
                    knownAdds.add(fieldStr);
                    events.emit(namespace, Add(fieldNamespace, value as Colyseus));
                }
                traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
            }, false),
        );
        // onChange returns void in v3, so we don't capture its return value
        destructors.add(
            $.onChange((value: unknown, field: unknown) => {
                const fieldStr = field as string;
                if (knownChanges.has(fieldStr)) {
                    // We've seen onChange for this key before, so it's a real change
                    const fieldNamespace = `${namespace}/${fieldStr}`;
                    events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                    traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
                } else {
                    // First onChange for this key - this fires after onAdd, so skip it
                    knownChanges.add(fieldStr);
                }
            }),
        );
        destructors.add(
            $.onRemove((item: unknown, field: unknown) => {
                if (isContainer(item)) cache.resetDestructors(callbackProxy(item).refId);
                const fieldStr = field as string;
                knownAdds.delete(fieldStr);
                knownChanges.delete(fieldStr);
                const fieldNamespace = `${namespace}/${fieldStr}`;
                events.emit(namespace, Remove(fieldNamespace));
            }),
        );
        return true;
    },
});

// TODO handle CollectionSchema and andSetSchema

export const coreVisitors: ReadonlyArray<Visitor> = Object.freeze([handleSchema, handleArraySchema, handleMapSchema]);
