import { Colyseus } from '.';
import { EventEmitter2 } from 'eventemitter2';
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

export type Event = [Colyseus | undefined, string];
export class RecordedEvents extends EventEmitter2 {
    private eventsLog = new Array<[Colyseus, string]>();

    constructor() {
        super({ wildcard: true });
        this.on('**', (val: Colyseus, path: string) => this.eventsLog.push([val, path]));
    }
    clear() {
        this.eventsLog.splice(0, this.eventsLog.length);
    }
    assertEvents(t: Test, ...events: Event[]) {
        t.deepEquals(this.eventsLog, events);
        this.clear();
    }
}
