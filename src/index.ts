import { ArraySchema, CollectionSchema, MapSchema, Schema, SetSchema } from '@colyseus/schema';

export type Primitive = number | string | boolean;
export type Container = Schema | ArraySchema | MapSchema | CollectionSchema | SetSchema;
export type Colyseus = Primitive | Container;

const schemaKeys: string[] = Object.keys(new (class extends Schema {})()).concat(['onChange']); // keys that exist on any schema object - are not data fields

function isPrimitive(val: unknown): val is Primitive | null | undefined {
    return typeof val !== 'object' || !val;
}

export interface Events<E = string> {
    emit(event: E, ...values: unknown[]): unknown;
    on(event: E, fn: (...values: unknown[]) => unknown): unknown;
}

export function wireEvents<T extends Events>(state: Colyseus, events: T, namespace: string): T {
    if (isPrimitive(state)) {
        return events;
    }

    if (state instanceof Schema) {
        state.onChange = (changes) => {
            for (const { field, value } of changes) {
                const fieldNamespace = `${namespace}.${field}`;
                events.emit(fieldNamespace, value, fieldNamespace);
                //@ts-ignore : the field is legal for the state
                wireEvents(state[field as keyof typeof state], events, fieldNamespace);
            }
        };
        for (const f in state) {
            if (!schemaKeys.includes(f) && Object.prototype.hasOwnProperty.call(state, f)) {
                const field = f;
                const fieldNamespace = `${namespace}.${field}`;
                //@ts-ignore : the field is legal for the state
                wireEvents(state[field as keyof typeof state], events, fieldNamespace);
            }
        }
    } else if (state instanceof ArraySchema) {
        state.onAdd = (value, field) => {
            const fieldNamespace = `${namespace}[${field}]`;
            events.emit(fieldNamespace, value, fieldNamespace);
            wireEvents(value as Colyseus, events, fieldNamespace);
        };
        state.onChange = (value, field) => {
            const fieldNamespace = `${namespace}[${field}]`;
            events.emit(fieldNamespace, value, fieldNamespace);
            wireEvents(value as Colyseus, events, fieldNamespace);
        };
        state.onRemove = (_, field) => {
            const fieldNamespace = `${namespace}[${field}]`;
            events.emit(fieldNamespace, undefined, fieldNamespace);
        };
        for (const [field, value] of state.entries()) {
            const fieldNamespace = `${namespace}[${field}]`;
            wireEvents(value as Colyseus, events, fieldNamespace);
        }
    } else if (state instanceof MapSchema) {
        state.onAdd = (value, field) => {
            const fieldNamespace = `${namespace}["${field}"]`;
            events.emit(fieldNamespace, value, fieldNamespace);
            wireEvents(value as Colyseus, events, fieldNamespace);
        };
        state.onChange = (value, field) => {
            const fieldNamespace = `${namespace}["${field}"]`;
            events.emit(fieldNamespace, value, fieldNamespace);
            wireEvents(value as Colyseus, events, fieldNamespace);
        };
        state.onRemove = (_, field) => {
            const fieldNamespace = `${namespace}["${field}"]`;
            events.emit(fieldNamespace, undefined, fieldNamespace);
        };
        for (const [field, value] of state.entries()) {
            const fieldNamespace = `${namespace}["${field}"]`;
            wireEvents(value as Colyseus, events, fieldNamespace);
        }
    }
    // TODO handle CollectionSchema and andSetSchema
    return events;
}
