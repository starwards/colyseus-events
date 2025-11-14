// eslint-disable-next-line sort-imports
import { Decoder, Encoder, Schema } from '@colyseus/schema';
import { Room, getStateCallbacks } from 'colyseus.js';

import { Event } from '.';
import { Test } from 'tape';

// Re-export getStateCallbacks for use in tests
export { getStateCallbacks };

/**
 * manage the state we need for a simple test
 * simulate the wiring that colyseus is suppoed to do in a real environment
 */
export class FakeClientServer<T extends Schema> {
    /**
     * represents the state of the server room
     */
    server: T;
    /**
     * represents the colyseus client room (with state and decoder)
     */
    room: Room<T>;

    private encoder: Encoder;
    private decoder: Decoder;

    constructor(constructor: new () => T) {
        this.server = new constructor();
        const client = new constructor();
        this.encoder = new Encoder(this.server);
        this.decoder = new Decoder(client);
        this.decoder.decode(this.encoder.encodeAll());
        // @ts-ignore hack
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        this.decoder.state['_decoder'] = this.decoder;
        // Create a mock room object that has state and serializer for getStateCallbacks
        // getStateCallbacks() expects room.serializer.decoder to exist
        this.room = {
            state: client,
            serializer: {
                decoder: this.decoder,
            },
        } as unknown as Room<T>;
    }

    /**
     * update the client after changes are made to the server state
     */
    sync() {
        this.decoder.decode(this.encoder.encode());
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
