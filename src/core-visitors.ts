import { Add, Colyseus, Container, Events, Remove, Replace, Traverse, Visitor } from './types';
import { ArraySchema, MapSchema, Schema } from '@colyseus/schema';

export const handleSchema = Object.freeze({
    visit: (traverse: Traverse, state: Container, events: Events, namespace: string) => {
        if (!(state instanceof Schema)) {
            return false;
        }
        // @ts-ignore: access _definition to get fields list
        const fieldsList = Object.values(state._definition.fieldsByIndex);
        for (const field of fieldsList) {
            const fieldNamespace = `${namespace}/${field}`;
            state.listen(field as never, (value) => {
                events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                traverse(value as Colyseus, events, fieldNamespace);
            });
            const value = state[field as keyof typeof state] as unknown as Colyseus;
            traverse(value, events, fieldNamespace);
        }
        return true;
    },
});

export const handleArraySchema = Object.freeze({
    visit: (traverse: Traverse, state: Container, events: Events, namespace: string) => {
        if (!(state instanceof ArraySchema)) {
            return false;
        }
        state.onAdd((value: Colyseus, field: number) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(namespace, Add(fieldNamespace, value));
            traverse(value, events, fieldNamespace);
        });
        state.onChange((value: Colyseus, field: number) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, Replace(fieldNamespace, value));
            traverse(value, events, fieldNamespace);
        });
        state.onRemove((_, field: number) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(namespace, Remove(fieldNamespace));
        });
        for (const [field, value] of state.entries()) {
            const fieldNamespace = `${namespace}/${field}`;
            traverse(value as Colyseus, events, fieldNamespace);
        }
        return true;
    },
});

export const handleMapSchema = Object.freeze({
    visit: (traverse: Traverse, state: Container, events: Events, namespace: string) => {
        if (!(state instanceof MapSchema)) {
            return false;
        }
        state.onAdd((value: Colyseus, field: string) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(namespace, Add(fieldNamespace, value));
            traverse(value, events, fieldNamespace);
        });
        state.onChange((value: Colyseus, field: string) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, Replace(fieldNamespace, value));
            traverse(value, events, fieldNamespace);
        });
        state.onRemove((_, field: string) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(namespace, Remove(fieldNamespace));
        });
        for (const [field, value] of state.entries()) {
            const fieldNamespace = `${namespace}/${field}`;
            traverse(value as Colyseus, events, fieldNamespace);
        }
        return true;
    },
});

// TODO handle CollectionSchema and andSetSchema

export const coreVisitors: ReadonlyArray<Visitor> = Object.freeze([handleSchema, handleArraySchema, handleMapSchema]);
