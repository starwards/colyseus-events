import { Add, Colyseus, Container, Events, Remove, Replace, Traverse, Visitor } from './types';
import { ArraySchema, MapSchema, Schema, type SchemaCallbackProxy } from '@colyseus/schema';

import { CallbacksCleanup } from './destructors';
import { getFieldsList } from './internals-extract';

export const handleSchema = Object.freeze({
    cache: new CallbacksCleanup(),
    visit<T extends Schema>(
        traverse: Traverse,
        state: T,
        events: Events,
        namespace: string,
        callbackProxy: SchemaCallbackProxy<unknown>,
    ) {
        if (!(state instanceof Schema)) {
            return false;
        }
        const destructors = this.cache.resetDestructors(state);
        const $ = callbackProxy(state);
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

                        // Clean up old Schema on replacement
                        const isPrevSchema = previousValue instanceof Schema;
                        if (isPrevSchema) {
                            this.cache.resetDestructors(previousValue as Container);
                        }

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
    cache: new CallbacksCleanup(),
    visit<T extends Colyseus>(
        traverse: Traverse,
        state: ArraySchema<T>,
        events: Events,
        namespace: string,
        callbackProxy: SchemaCallbackProxy<unknown>,
    ) {
        if (!(state instanceof ArraySchema)) {
            return false;
        }
        const destructors = this.cache.resetDestructors(state);
        const knownAdds = new Set<number>(); // Track indices seen in onAdd
        const knownChanges = new Set<number>(); // Track indices seen in onChange (to filter initial onChange)
        const $ = callbackProxy(state);
        destructors.add(
            $.onAdd((value: unknown, field: unknown) => {
                const fieldNum = field as number;
                const fieldNamespace = `${namespace}/${fieldNum}`;
                if (knownAdds.has(fieldNum)) {
                    // onAdd firing again for same index = value changed
                    events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                } else {
                    // First onAdd for this index = truly new element
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
            $.onRemove((_: unknown, field: unknown) => {
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
    cache: new CallbacksCleanup(),
    visit<T extends Colyseus>(
        traverse: Traverse,
        state: MapSchema<T>,
        events: Events,
        namespace: string,
        callbackProxy: SchemaCallbackProxy<unknown>,
    ) {
        // Check if it is going to handle the state object, and return `false` if not.
        if (!(state instanceof MapSchema)) {
            return false;
        }
        const destructors = this.cache.resetDestructors(state);
        const knownAdds = new Set<string>(); // Track keys seen in onAdd
        const knownChanges = new Set<string>(); // Track keys seen in onChange (to filter initial onChange)
        const $ = callbackProxy(state);
        // Hook on new elements
        destructors.add(
            $.onAdd((value: unknown, field: unknown) => {
                const fieldStr = field as string;
                const fieldNamespace = `${namespace}/${fieldStr}`;
                if (knownAdds.has(fieldStr)) {
                    // onAdd firing again for same key = value changed
                    events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                } else {
                    // First onAdd for this key = truly new element
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
            $.onRemove((_: unknown, field: unknown) => {
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
