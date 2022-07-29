import { ArraySchema, CollectionSchema, MapSchema, Schema, SetSchema } from '@colyseus/schema';

export type Primitive = number | string | boolean | null | undefined;
export type Container = Schema | ArraySchema | MapSchema | CollectionSchema | SetSchema;
export type Colyseus = Primitive | Container;

export function isPrimitive(val: unknown): val is Primitive {
    return typeof val !== 'object' || !val;
}

export interface Events<E = string> {
    emit(eventName: E, value: Event): unknown;
}

export type Add = { op: 'add'; path: string; value: Colyseus };
export type Replace = { op: 'replace'; path: string; value: Colyseus };
export type Remove = { op: 'remove'; path: string };
export type Event = Add | Remove | Replace;

export function Add(path: string, value: Colyseus): Add {
    return { op: 'add', path, value };
}
export function Replace(path: string, value: Colyseus): Replace {
    return { op: 'replace', path, value };
}
export function Remove(path: string): Remove {
    return { op: 'remove', path };
}

export type Traverse<T extends Events = Events> = (state: Colyseus, events: T, jsonPath: string) => T;

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
     * @return `true` if this visitor wired and traversed the current `state`. Otherwise do nothing and treturn `false`.
     */
    visit(traverse: Traverse, state: Container, events: Events, jsonPath: string): boolean;
};
