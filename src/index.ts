import { ArraySchema, CollectionSchema, MapSchema, Schema, SetSchema } from '@colyseus/schema';

export type Primitive = number | string | boolean | null | undefined;
export type Container = Schema | ArraySchema | MapSchema | CollectionSchema | SetSchema;
export type Colyseus = Primitive | Container;

const schemaKeys: string[] = Object.keys(new (class extends Schema {})()).concat(['onChange']); // keys that exist on any schema object - are not data fields

function isPrimitive(val: unknown): val is Primitive {
    return typeof val !== 'object' || !val;
}

export interface Events<E = string> {
    emit(event: E, value: Event): unknown;
    on(event: E, fn: (value: Event) => unknown): unknown;
}

export type Add = { op: 'add'; path: string; value: Colyseus };
export type Replace = { op: 'replace'; path: string; value: Colyseus };
export type Remove = { op: 'remove'; path: string };
export type Event = Add | Remove | Replace;

export function add(path: string, value: Colyseus): Add {
    return { op: 'add', path, value };
}
export function replace(path: string, value: Colyseus): Replace {
    return { op: 'replace', path, value };
}
export function remove(path: string): Remove {
    return { op: 'remove', path };
}

/**
 * make every change in Colyseus state trigger an event in the EventEmitter using the provided namespace.
 * @param state Colyseus state to track
 * @param events EventsEmitter of you choice. has to support `emit()` and `on()`
 * @param namespace Prefix of events name to emit
 * @returns the provided events emitter
 */
export function wireEvents<T extends Events>(state: Colyseus, events: T, namespace = ''): T {
    if (isPrimitive(state)) {
        return events;
    }

    if (state instanceof Schema) {
        state.onChange = (changes) => {
            for (const { field, value } of changes) {
                const fieldNamespace = `${namespace}/${field}`;
                events.emit(fieldNamespace, replace(fieldNamespace, value as Colyseus));
                wireEvents(value as Colyseus, events, fieldNamespace);
            }
        };
        for (const field in state) {
            if (!schemaKeys.includes(field) && Object.prototype.hasOwnProperty.call(state, field)) {
                const fieldNamespace = `${namespace}/${field}`;
                const value = state[field as keyof typeof state] as unknown as Colyseus;
                // events.emit(fieldNamespace, add(fieldNamespace, value));
                wireEvents(value, events, fieldNamespace);
            }
        }
    } else if (state instanceof ArraySchema) {
        state.onAdd = (value: Colyseus, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, add(fieldNamespace, value));
            wireEvents(value, events, fieldNamespace);
        };
        state.onChange = (value: Colyseus, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, replace(fieldNamespace, value));
            wireEvents(value, events, fieldNamespace);
        };
        state.onRemove = (_, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, remove(fieldNamespace));
        };
        for (const [field, value] of state.entries()) {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, add(fieldNamespace, value as Colyseus));
            wireEvents(value as Colyseus, events, fieldNamespace);
        }
    } else if (state instanceof MapSchema) {
        state.onAdd = (value: Colyseus, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, add(fieldNamespace, value));
            wireEvents(value, events, fieldNamespace);
        };
        state.onChange = (value: Colyseus, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, replace(fieldNamespace, value));
            wireEvents(value, events, fieldNamespace);
        };
        state.onRemove = (_, field) => {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, remove(fieldNamespace));
        };
        for (const [field, value] of state.entries()) {
            const fieldNamespace = `${namespace}/${field}`;
            events.emit(fieldNamespace, add(fieldNamespace, value as Colyseus));
            wireEvents(value as Colyseus, events, fieldNamespace);
        }
    }
    // TODO handle CollectionSchema and andSetSchema
    return events;
}
