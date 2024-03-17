/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import { Container, Events, Replace, Traverse, coreVisitors, customWireEvents } from '.';
import { FakeClientServer, RecordedEvents } from './helper.test';

import test from 'tape';

export class Inner extends Schema {
    @type('uint8') public x = 0;
    @type('uint8') public y = 0;
}
export class GameState extends Schema {
    @type('uint8') public foo = 0;
    @type(Inner) public bar = new Inner();
    @type(['uint8']) public numbersArray = new ArraySchema<number>();
    @type({ map: 'uint8' }) public mapNumbers = new MapSchema<number>();
}
export const handleInner = Object.freeze({
    visit: (_: Traverse, state: Container, events: Events, namespace: string) => {
        if (!(state instanceof Inner)) {
            return false;
        }
        state.onChange(() => {
            events.emit(namespace, Replace(namespace, state));
        });
        return true;
    },
});
const wireEvents = customWireEvents([handleInner, ...coreVisitors]);

test('custom visitor yields control gracefully', (t) => {
    t.plan(2);

    const fixture = new FakeClientServer(GameState);
    const events = wireEvents(fixture.client, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.bar = new Inner();
    fixture.sync();
    events.assertEvents(t, ['/bar', { op: 'replace', path: '/bar', value: fixture.client.bar }]);

    fixture.server.mapNumbers.set('1', 1);
    fixture.sync();
    events.assertEvents(t, ['/mapNumbers', { op: 'add', path: '/mapNumbers/1', value: 1 }]);
});

test('custom visitor changes events', (t) => {
    t.plan(2);

    const fixture = new FakeClientServer(GameState);
    const events = wireEvents(fixture.client, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.bar.x = 1;
    fixture.sync();
    events.assertEvents(t, ['/bar', { op: 'replace', path: '/bar', value: fixture.client.bar }]);

    fixture.server.bar.x = 2;
    fixture.server.bar.y = 2;
    fixture.sync();
    events.assertEvents(t, ['/bar', { op: 'replace', path: '/bar', value: fixture.client.bar }]);
});
