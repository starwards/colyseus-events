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
    private cacheByState = new WeakMap<Container, Destructors>();

    resetDestructors(state: Container) {
        const dByState = this.cacheByState.get(state);
        const newD = dByState || new Destructors();
        this.cacheByState.set(state, newD);
        newD.cleanup();
        return newD;
    }
}
