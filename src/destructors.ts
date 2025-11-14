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
    private cacheByState = new Map<number, Destructors>();

    resetDestructors(refId: number) {
        const dByState = this.cacheByState.get(refId);
        const newD = dByState || new Destructors();
        this.cacheByState.set(refId, newD);
        newD.cleanup();
        return newD;
    }
}
