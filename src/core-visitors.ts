import { Add, Colyseus, Container, Events, Remove, Replace, Traverse, Visitor } from './types';
import { ArraySchema, MapSchema, Schema } from '@colyseus/schema';

// all objects in this module are frozen, to narrow API surface

export const schemaKeys = Object.freeze(Object.keys(new (class extends Schema {})()).concat(['onChange', 'onRemove']));

export const handleSchema = Object.freeze({
    /**
     * keys that exist on any schema object - are not data fields
     */
    schemaKeys,
    visit: (traverse: Traverse, state: Container, events: Events, namespace: string) => {
        if (!(state instanceof Schema)) {
            return false;
        }
        state.onChange = (changes) => {
            for (const { field, value } of changes) {
                const fieldNamespace = `${namespace}/${field}`;
                events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                traverse(value as Colyseus, events, fieldNamespace);
            }
        };
        for (const field in state) {
            if (!schemaKeys.includes(field) && Object.prototype.hasOwnProperty.call(state, field)) {
                const fieldNamespace = `${namespace}/${field}`;
                const value = state[field as keyof typeof state] as unknown as Colyseus;
                traverse(value, events, fieldNamespace);
            }
        }
        return true;
    },
});

export const handleArraySchema = Object.freeze({
    visit: (traverse: Traverse, state: Container, events: Events, namespace: string) => {
        if (!(state instanceof ArraySchema)) {
            return false;
        }
        state.onAdd = (value: Colyseus, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(namespace, Add(fieldNamespace, value));
            traverse(value, events, fieldNamespace);
        };
        state.onChange = (value: Colyseus, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, Replace(fieldNamespace, value));
            traverse(value, events, fieldNamespace);
        };
        state.onRemove = (_, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(namespace, Remove(fieldNamespace));
        };
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
        state.onAdd = (value: Colyseus, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(namespace, Add(fieldNamespace, value));
            traverse(value, events, fieldNamespace);
        };
        state.onChange = (value: Colyseus, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, Replace(fieldNamespace, value));
            traverse(value, events, fieldNamespace);
        };
        state.onRemove = (_, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(namespace, Remove(fieldNamespace));
        };
        for (const [field, value] of state.entries()) {
            const fieldNamespace = `${namespace}/${field}`;
            traverse(value as Colyseus, events, fieldNamespace);
        }
        return true;
    },
});

// TODO handle CollectionSchema and andSetSchema

export const coreVisitors: ReadonlyArray<Visitor> = Object.freeze([handleSchema, handleArraySchema, handleMapSchema]);
