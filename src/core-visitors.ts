import { Add, Colyseus, Events, Remove, Replace, Traverse, Visitor } from './types';
import { ArraySchema, CollectionSchema, MapSchema, Schema, SetSchema } from '@colyseus/schema';

import { ManagedCallbackProxy } from './managed-callback-proxy';
import { getFieldsList } from './spoon/internals-extract';

export const handleSchema = Object.freeze({
    visit<T extends Schema>(
        traverse: Traverse,
        state: T,
        events: Events,
        namespace: string,
        callbackProxy: ManagedCallbackProxy,
    ) {
        if (!(state instanceof Schema)) {
            return false;
        }
        const $ = callbackProxy(state);
        for (const field of getFieldsList(state)) {
            const fieldNamespace = `${namespace}/${field as string}`;
            const initialValue = state[field] as Colyseus;
            traverse(initialValue, events, fieldNamespace, callbackProxy);
            // @ts-expect-error - trouble with union types for overloaded .listen() method
            $.listen(
                field,
                (value: unknown, previousValue: unknown) => {
                    if (value === previousValue) return;
                    callbackProxy.cleanup(previousValue);
                    events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                    traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
                },
                false,
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
        callbackProxy: ManagedCallbackProxy,
    ) {
        if (!(state instanceof ArraySchema)) {
            return false;
        }
        const $ = callbackProxy(state);
        const knownAdds = new Set<number>();
        const knownChanges = new Set<number>();
        $.onAdd((value: unknown, field: unknown) => {
            const fieldNum = field as number;
            const fieldNamespace = `${namespace}/${fieldNum}`;
            if (!knownAdds.has(fieldNum)) {
                knownAdds.add(fieldNum);
                events.emit(namespace, Add(fieldNamespace, value as Colyseus));
            }
            traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
        }, true);
        $.onChange((value: unknown, field: unknown) => {
            const fieldNum = field as number;
            if (knownChanges.has(fieldNum)) {
                const fieldNamespace = `${namespace}/${fieldNum}`;
                events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
            } else {
                knownChanges.add(fieldNum);
            }
        });
        $.onRemove((item: unknown, field: unknown) => {
            callbackProxy.cleanup(item);
            const fieldNum = field as number;
            knownAdds.delete(fieldNum);
            knownChanges.delete(fieldNum);
            const fieldNamespace = `${namespace}/${fieldNum}`;
            events.emit(namespace, Remove(fieldNamespace));
        });
        return true;
    },
});

export const handleMapSchema = Object.freeze({
    visit<T extends Colyseus>(
        traverse: Traverse,
        state: MapSchema<T>,
        events: Events,
        namespace: string,
        callbackProxy: ManagedCallbackProxy,
    ) {
        if (!(state instanceof MapSchema)) {
            return false;
        }
        const $ = callbackProxy(state);
        const knownAdds = new Set<string>();
        const knownChanges = new Set<string>();
        $.onAdd((value: unknown, field: unknown) => {
            const fieldStr = field as string;
            const fieldNamespace = `${namespace}/${fieldStr}`;
            if (!knownAdds.has(fieldStr)) {
                knownAdds.add(fieldStr);
                events.emit(namespace, Add(fieldNamespace, value as Colyseus));
            }
            traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
        }, true);
        $.onChange((value: unknown, field: unknown) => {
            const fieldStr = field as string;
            if (knownChanges.has(fieldStr)) {
                const fieldNamespace = `${namespace}/${fieldStr}`;
                events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
            } else {
                knownChanges.add(fieldStr);
            }
        });
        $.onRemove((item: unknown, field: unknown) => {
            callbackProxy.cleanup(item);
            const fieldStr = field as string;
            knownAdds.delete(fieldStr);
            knownChanges.delete(fieldStr);
            const fieldNamespace = `${namespace}/${fieldStr}`;
            events.emit(namespace, Remove(fieldNamespace));
        });
        return true;
    },
});

export const handleCollectionSchema = Object.freeze({
    visit<T extends Colyseus>(
        traverse: Traverse,
        state: CollectionSchema<T>,
        events: Events,
        namespace: string,
        callbackProxy: ManagedCallbackProxy,
    ) {
        if (!(state instanceof CollectionSchema)) {
            return false;
        }
        const $ = callbackProxy(state);
        const knownAdds = new Set<number>();
        const knownChanges = new Set<number>();
        $.onAdd((value: unknown, field: unknown) => {
            const fieldNum = field as number;
            const fieldNamespace = `${namespace}/${fieldNum}`;
            if (!knownAdds.has(fieldNum)) {
                knownAdds.add(fieldNum);
                events.emit(namespace, Add(fieldNamespace, value as Colyseus));
            }
            traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
        }, true);
        $.onChange((value: unknown, field: unknown) => {
            const fieldNum = field as number;
            if (knownChanges.has(fieldNum)) {
                const fieldNamespace = `${namespace}/${fieldNum}`;
                events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
            } else {
                knownChanges.add(fieldNum);
            }
        });
        $.onRemove((item: unknown, field: unknown) => {
            callbackProxy.cleanup(item);
            const fieldNum = field as number;
            knownAdds.delete(fieldNum);
            knownChanges.delete(fieldNum);
            const fieldNamespace = `${namespace}/${fieldNum}`;
            events.emit(namespace, Remove(fieldNamespace));
        });
        return true;
    },
});

export const handleSetSchema = Object.freeze({
    visit<T extends Colyseus>(
        traverse: Traverse,
        state: SetSchema<T>,
        events: Events,
        namespace: string,
        callbackProxy: ManagedCallbackProxy,
    ) {
        if (!(state instanceof SetSchema)) {
            return false;
        }
        const $ = callbackProxy(state);
        const knownAdds = new Set<number>();
        const knownChanges = new Set<number>();
        $.onAdd((value: unknown, field: unknown) => {
            const fieldNum = field as number;
            const fieldNamespace = `${namespace}/${fieldNum}`;
            if (!knownAdds.has(fieldNum)) {
                knownAdds.add(fieldNum);
                events.emit(namespace, Add(fieldNamespace, value as Colyseus));
            }
            traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
        }, true);
        $.onChange((value: unknown, field: unknown) => {
            const fieldNum = field as number;
            if (knownChanges.has(fieldNum)) {
                const fieldNamespace = `${namespace}/${fieldNum}`;
                events.emit(fieldNamespace, Replace(fieldNamespace, value as Colyseus));
                traverse(value as Colyseus, events, fieldNamespace, callbackProxy);
            } else {
                knownChanges.add(fieldNum);
            }
        });
        $.onRemove((item: unknown, field: unknown) => {
            callbackProxy.cleanup(item);
            const fieldNum = field as number;
            knownAdds.delete(fieldNum);
            knownChanges.delete(fieldNum);
            const fieldNamespace = `${namespace}/${fieldNum}`;
            events.emit(namespace, Remove(fieldNamespace));
        });
        return true;
    },
});

export const coreVisitors: ReadonlyArray<Visitor> = Object.freeze([
    handleSchema,
    handleArraySchema,
    handleMapSchema,
    handleCollectionSchema,
    handleSetSchema,
]);
