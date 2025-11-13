import {
    ArraySchema,
    CollectionSchema,
    MapSchema,
    Schema,
    type SchemaCallbackProxy,
    SetSchema,
} from '@colyseus/schema';

export type Primitive = number | string | boolean | null | undefined;
export type Container = Schema | ArraySchema | MapSchema | CollectionSchema | SetSchema;
export type Colyseus = Primitive | Container;

/**
 * Minimal Colyseus Room interface for wireEvents
 */
export interface ColRoom<T = unknown> {
    state: T;
    serializer: unknown;
}

export function isPrimitive(val: unknown): val is Primitive {
    return typeof val !== 'object' || !val;
}
export function isContainer(val: unknown): val is Container {
    return (
        val instanceof Schema ||
        val instanceof ArraySchema ||
        val instanceof MapSchema ||
        val instanceof CollectionSchema ||
        val instanceof SetSchema
    );
}
export interface Events<E = string> {
    emit(eventName: E, value: Event): unknown;
}

export type Add = { op: 'add'; path: string; value: Colyseus };
export type Replace = { op: 'replace'; path: string; value: Colyseus };
export type Remove = { op: 'remove'; path: string };
export type Event = Add | Remove | Replace;

export function equalEvents(a: Event, b: Event): boolean {
    if (a === b) return true;
    if (a.op !== b.op || a.path !== b.path) return false;
    if (a.op === 'remove') return true; // 'remove' events have no 'value'
    return a.value === (b as Add | Replace).value;
}

export function Add(path: string, value: Colyseus): Add {
    return { op: 'add', path, value };
}
export function Replace(path: string, value: Colyseus): Replace {
    return { op: 'replace', path, value };
}
export function Remove(path: string): Remove {
    return { op: 'remove', path };
}

export type Traverse<T extends Events = Events> = (
    state: Colyseus,
    events: T,
    jsonPath: string,
    callbackProxy: SchemaCallbackProxy<unknown>,
) => unknown;

/**
 * logic to wire events for a single entity type
 */
export type Visitor = {
    /**
     * optionally wire events to a single state container
     * @param traverse call this function for each property of the state container
     * @param state the state container
     * @param events events emitter to emit events on
     * @param jsonPath the path of the current state container
     * @param callbackProxy the callback proxy function for registering callbacks on state
     * @return `true` if this visitor wired and traversed the current `state`. Otherwise do nothing and treturn `false`.
     */
    visit(
        traverse: Traverse,
        state: Container,
        events: Events,
        jsonPath: string,
        callbackProxy: SchemaCallbackProxy<unknown>,
    ): boolean;
};
