import { Event, Events, equalEvents } from './types';

export class DeDupeEmitter<E extends string> implements Events<E> {
    private cache = new Map<E, Event>();
    private keyOrder: E[] = [];

    constructor(private inner: Events<E>, private limit = 100) {}

    clearCache = () => {
        this.cache.clear();
        this.keyOrder.splice(0);
    };

    emit(eventName: E, event: Event) {
        const lastEvent = this.cache.get(eventName);
        if (!lastEvent || !equalEvents(event, lastEvent)) {
            this.cacheEvent(eventName, event);
            this.inner.emit(eventName, event);
        }
    }

    private cacheEvent(key: E, event: Event) {
        while (this.cache.size >= this.limit) {
            const oldestKey = this.keyOrder.shift();
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, event);
        const index = this.keyOrder.indexOf(key);
        if (index !== -1) {
            this.keyOrder.splice(index, 1);
        }
        this.keyOrder.push(key);
    }
}
