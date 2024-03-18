import { Add, Colyseus, Container, Events, Remove, Replace, Traverse, Visitor } from './types';
import { ArraySchema, MapSchema, Schema } from '@colyseus/schema';

import { CallbacksCleanup } from './destructors';
import { getFieldsList } from './internals-extract';

export const handleSchema = Object.freeze({
    cache: new CallbacksCleanup(),
    visit(traverse: Traverse, state: Container, events: Events, namespace: string) {
        if (!(state instanceof Schema)) {
            return false;
        }
        const destructors = this.cache.resetDestructors(state);
        for (const field of getFieldsList(state)) {
            const fieldNamespace = `${namespace}/${field as string}`;
            const d = state.listen(field, (value, previousValue) => {
                if (value === previousValue) return;
                events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                traverse(value as Colyseus, events, fieldNamespace);
            });
            destructors.add(d);
        }
        this.cache.recheckCallbacks(state);
        return true;
    },
});

export const handleArraySchema = Object.freeze({
    cache: new CallbacksCleanup(),
    visit(traverse: Traverse, state: Container, events: Events, namespace: string) {
        if (!(state instanceof ArraySchema)) {
            return false;
        }
        const knownKeys = new Set<number>(); // for ignoring first and last onChange
        const destructors = this.cache.resetDestructors(state);
        destructors.add(
            state.onAdd((value: Colyseus, field: number) => {
                const fieldNamespace = `${namespace}/${field}`;
                events.emit(namespace, Add(fieldNamespace, value));
                traverse(value, events, fieldNamespace);
            })
        );
        destructors.add(
            state.onChange((value: Colyseus, field: number) => {
                if (knownKeys.has(field)) {
                    const fieldNamespace = `${namespace}/${field}`;
                    events.emit(fieldNamespace, Replace(fieldNamespace, value));
                    traverse(value, events, fieldNamespace);
                } else {
                    knownKeys.add(field);
                }
            })
        );
        destructors.add(
            state.onRemove((_, field: number) => {
                knownKeys.delete(field);
                const fieldNamespace = `${namespace}/${field}`;
                events.emit(namespace, Remove(fieldNamespace));
            })
        );
        this.cache.recheckCallbacks(state);
        return true;
    },
});

export const handleMapSchema = Object.freeze({
    cache: new CallbacksCleanup(),
    visit(traverse: Traverse, state: Container, events: Events, namespace: string) {
        // Check if it is going to handle the state object, and return `false` if not.
        if (!(state instanceof MapSchema)) {
            return false;
        }
        const knownKeys = new Set<string>(); // for ignoring first and last onChange
        const destructors = this.cache.resetDestructors(state);
        // Hook on new elements and register destructors
        destructors.add(
            state.onAdd((value: Colyseus, field: string) => {
                const fieldNamespace = `${namespace}/${field}`; // path to the new element
                events.emit(namespace, Add(fieldNamespace, value)); // emit the add event
                traverse(value, events, fieldNamespace); // call the traverse function on the new value
            })
        );
        destructors.add(
            state.onChange((value: Colyseus, field: string) => {
                if (knownKeys.has(field)) {
                    const fieldNamespace = `${namespace}/${field}`;
                    events.emit(fieldNamespace, Replace(fieldNamespace, value));
                    traverse(value, events, fieldNamespace);
                } else {
                    knownKeys.add(field);
                }
            })
        );
        destructors.add(
            state.onRemove((_, field: string) => {
                knownKeys.delete(field);
                const fieldNamespace = `${namespace}/${field}`;
                events.emit(namespace, Remove(fieldNamespace));
            })
        );
        this.cache.recheckCallbacks(state);
        return true;
    },
});

// TODO handle CollectionSchema and andSetSchema

export const coreVisitors: ReadonlyArray<Visitor> = Object.freeze([handleSchema, handleArraySchema, handleMapSchema]);
