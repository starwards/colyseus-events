import { Callbacks, extractCallbacks } from './internals-extract';

import { Container } from './types';

export type Destructor = () => unknown;
export class Destructors {
    private destructors = new Set<Destructor>();

    add = (d: Destructor) => {
        this.destructors.add(d);
    };

    /**
     * cleans up and keep state valid. cleans up and invalidates children.
     */
    cleanup = () => {
        for (const destructor of this.destructors) {
            destructor();
        }
        this.destructors.clear();
    };
}

export class CallbacksCleanup {
    private cacheByCallbacks = new WeakMap<Callbacks, Destructors>();
    private cacheByState = new WeakMap<Container, Destructors>();

    recheckCallbacks(state: Container) {
        const dByState = this.cacheByState.get(state);
        if (dByState) {
            const cb = extractCallbacks(state);
            if (cb) {
                this.cacheByCallbacks.set(cb, dByState);
                this.cacheByState.delete(state);
            }
        }
    }

    resetDestructors(state: Container) {
        const dByState = this.cacheByState.get(state);
        const cb = extractCallbacks(state);
        if (cb) {
            if (dByState) {
                this.cacheByCallbacks.set(cb, dByState);
                this.cacheByState.delete(state);
            }
            const d = this.cacheByCallbacks.get(cb);
            if (d) {
                d.cleanup();
                return d;
            }
            const newD = new Destructors();
            this.cacheByCallbacks.set(cb, newD);
            return newD;
        }
        const newD = dByState || new Destructors();
        this.cacheByState.set(state, newD);
        newD.cleanup();
        return newD;
    }
}
