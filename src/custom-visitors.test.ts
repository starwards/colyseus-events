/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import { Container, Event, Events, ManagedCallbackProxy, Replace, Traverse, coreVisitors, customWireEvents } from '.';
import { FakeClientServer, RecordedEvents, SCHEMA_MAJOR } from './helper.test';

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
    visit: (_: Traverse, state: Container, events: Events, namespace: string, callbackProxy: ManagedCallbackProxy) => {
        if (!(state instanceof Inner)) {
            return false;
        }
        const $ = callbackProxy(state);
        $.onChange(() => {
            events.emit('special', Replace(namespace, state));
        });
        return true;
    },
});
const wireEvents = customWireEvents([handleInner, ...coreVisitors]);

test('custom visitor yields control gracefully', (t) => {
    t.plan(2);

    const fixture = new FakeClientServer(GameState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.bar = new Inner();
    fixture.sync();
    const replaced = Replace('/bar', fixture.room.state.bar);
    // schema 5 decodes the new instance's fields after the parent's replace, so the visitor's onChange fires too
    events.assertEvents(
        t,
        ['/bar', replaced],
        ...(SCHEMA_MAJOR === 5 ? [['special', replaced] as [string, Event]] : []),
    );

    fixture.server.mapNumbers.set('1', 1);
    fixture.sync();
    events.assertEvents(t, ['/mapNumbers', { op: 'add', path: '/mapNumbers/1', value: 1 }]);
});

test('custom visitor changes events', (t) => {
    t.plan(2);

    const fixture = new FakeClientServer(GameState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.bar.x = 1;
    fixture.sync();
    events.assertEvents(t, ['special', { op: 'replace', path: '/bar', value: fixture.room.state.bar }]);

    fixture.server.bar.x = 2;
    fixture.server.bar.y = 2;
    fixture.sync();
    events.assertEvents(t, ['special', { op: 'replace', path: '/bar', value: fixture.room.state.bar }]);
});
