import { Decoder, Ref } from '@colyseus/schema';
import { SchemaCallbackProxy, getDecoderStateCallbacks } from './spoon/get-decoder-state-callbacks';

import { CallbacksCleanup } from './destructors';
import { isContainer } from './types';

/**
 * Enhanced SchemaCallbackProxy that automatically manages cache cleanup and destructor registration
 */
export type ManagedCallbackProxy = SchemaCallbackProxy & {
    /**
     * Cleanup callbacks for a container value
     * @param value The container value to cleanup
     */
    cleanup(value: unknown): void;
};

/**
 * Creates a managed callback proxy that handles cache lifecycle and automatic destructor registration
 * @param callbackProxy The underlying SchemaCallbackProxy to wrap
 * @returns A ManagedCallbackProxy with automatic cleanup and registration
 */
export function createManagedCallbackProxy(decoder: Decoder): ManagedCallbackProxy {
    const callbackProxy = getDecoderStateCallbacks(decoder);
    const refIds = decoder.root.refIds;
    const cache = new CallbacksCleanup();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function managed<T extends Ref>(instance: T): any {
        const refId = refIds.get(instance);
        if (refId === undefined) return;
        const $ = callbackProxy(instance);
        const destructors = cache.resetDestructors(refId);

        // Create a proxy that auto-registers destructors for callback methods
        return new Proxy($, {
            get(target, prop) {
                const value = target[prop as keyof typeof target];

                // Intercept callback registration methods and auto-register their destructors
                if (prop === 'listen' || prop === 'onAdd' || prop === 'onChange' || prop === 'onRemove') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return function (this: any, ...args: any[]) {
                        // Call the original method
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-function-type
                        const destructor = (value as Function).apply(target, args);
                        // Auto-register the destructor if it's a function
                        if (typeof destructor === 'function') {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            destructors.add(destructor);
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                        return destructor;
                    };
                }

                return value;
            },
        });
    }

    // Add cleanup method to the managed function
    (managed as ManagedCallbackProxy).cleanup = function (value: unknown) {
        const refId = refIds.get(value as Ref);
        if (refId === undefined) return;
        if (isContainer(value)) {
            cache.resetDestructors(refId);
        }
    };

    return managed as ManagedCallbackProxy;
}
