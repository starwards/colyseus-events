import { FakeClientServer, RecordedEvents } from './helper.test';
import { MapSchema, Schema, type } from '@colyseus/schema';

import test from 'tape';
import { wireEvents } from '.';

export class ShallowMapState extends Schema {
    @type({ map: 'uint8' }) public mapNumbers = new MapSchema<number>();
}

test('ShallowMapState add field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    fixture.sync();
    events.clear();

    fixture.server.mapNumbers.set('1', 1);
    fixture.sync();

    fixture.server.mapNumbers.set('2', 2);
    fixture.sync();
    events.assertEvents(
        t,
        ['/mapNumbers', { op: 'add', path: '/mapNumbers/1', value: 1 }],
        ['/mapNumbers', { op: 'add', path: '/mapNumbers/2', value: 2 }]
    );
});

test('ShallowMapState change field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    fixture.sync();
    events.clear();

    fixture.server.mapNumbers.set('1', 1);
    fixture.sync();

    fixture.server.mapNumbers.set('1', 2);
    fixture.sync();
    events.assertEvents(
        t,
        ['/mapNumbers', { op: 'add', path: '/mapNumbers/1', value: 1 }],
        ['/mapNumbers/1', { op: 'replace', path: '/mapNumbers/1', value: 2 }]
    );
});

test('ShallowMapState change map field with new state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    fixture.sync();
    events.clear();

    fixture.server.mapNumbers = new MapSchema<number>({ '1': 1 });
    fixture.sync();

    events.assertEvents(
        t,
        ['/mapNumbers', { op: 'replace', path: '/mapNumbers', value: fixture.room.state.mapNumbers }],
        ['/mapNumbers', { op: 'add', path: '/mapNumbers/1', value: 1 }]
    );
});

test('ShallowMapState change map field with previous state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    fixture.server.mapNumbers.set('1', 1);
    fixture.sync();
    events.clear();

    fixture.server.mapNumbers = new MapSchema();
    fixture.sync();

    events.assertEvents(
        t,
        ['/mapNumbers', { op: 'remove', path: '/mapNumbers/1' }],
        ['/mapNumbers', { op: 'replace', path: '/mapNumbers', value: fixture.room.state.mapNumbers }]
    );
});

test('ShallowMapState change map field with same (previous and existing) state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    fixture.server.mapNumbers.set('1', 1);
    fixture.sync();
    events.clear();

    fixture.server.mapNumbers = new MapSchema<number>({ '1': 1 });
    fixture.sync();

    events.assertEvents(
        t,
        ['/mapNumbers', { op: 'remove', path: '/mapNumbers/1' }],
        ['/mapNumbers', { op: 'replace', path: '/mapNumbers', value: fixture.room.state.mapNumbers }],
        ['/mapNumbers', { op: 'add', path: '/mapNumbers/1', value: 1 }]
    );
});

test('ShallowMapState remove field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    fixture.server.mapNumbers.set('1', 1);
    fixture.server.mapNumbers.set('2', 2);
    fixture.sync();
    events.clear();

    fixture.server.mapNumbers.delete('1');
    fixture.sync();

    fixture.server.mapNumbers.delete('2');
    fixture.sync();
    events.assertEvents(
        t,
        ['/mapNumbers', { op: 'remove', path: '/mapNumbers/1' }],
        ['/mapNumbers', { op: 'remove', path: '/mapNumbers/2' }]
    );
});
