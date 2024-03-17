import { Event } from '.';
import { Schema } from '@colyseus/schema';
import { Test } from 'tape';

/**
 * manage the state we need for a simple test
 * simulate the wiring that colyseus is suppoed to do in a real environment
 */
export class FakeClientServer<T> {
    /**
     * represents the state of the server room
     */
    server: T & Schema;
    /**
     * represents the colyseus state of the client
     */
    client: T & Schema;

    constructor(constructor: new () => T & Schema) {
        this.server = new constructor();
        this.client = new constructor();
        this.client.decode(this.server.encodeAll());
    }

    /**
     * update the client after changes are made to the server state
     */
    sync() {
        this.client.decode(this.server.encode());
    }
}

export class RecordedEvents {
    private clearCb: null | (() => void) = null;
    private eventsLog = new Array<[string, Event]>();

    emit(eventName: string, value: Event) {
        this.eventsLog.push([eventName, value]);
    }

    onClear(cb: () => void) {
        this.clearCb = cb;
    }
    clear() {
        this.eventsLog.splice(0, this.eventsLog.length);
        this.clearCb?.();
        return this;
    }

    assertEvents(t: Test, ...events: [string, Event][]) {
        t.deepEquals(this.eventsLog, events);
        this.clear();
    }
}
