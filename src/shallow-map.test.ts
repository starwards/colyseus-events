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
    fixture.sync();
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');

    fixture.server.mapNumbers.set('1', 1);
    fixture.sync();

    fixture.server.mapNumbers.set('2', 2);
    fixture.sync();
    events.assertEvents(
        t,
        ['state/mapNumbers', { op: 'add', path: 'state/mapNumbers/1', value: 1 }],
        ['state/mapNumbers', { op: 'add', path: 'state/mapNumbers/2', value: 2 }]
    );
});

test('ShallowMapState change field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    fixture.sync();
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');

    fixture.server.mapNumbers.set('1', 1);
    fixture.sync();

    fixture.server.mapNumbers.set('1', 2);
    fixture.sync();
    events.assertEvents(
        t,
        ['state/mapNumbers', { op: 'add', path: 'state/mapNumbers/1', value: 1 }],
        ['state/mapNumbers/1', { op: 'replace', path: 'state/mapNumbers/1', value: 2 }]
    );
});

test('ShallowMapState change map field with new state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    fixture.sync();
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');

    fixture.server.mapNumbers = new MapSchema({ '1': 1 });
    fixture.sync();

    events.assertEvents(
        t,
        ['state/mapNumbers', { op: 'replace', path: 'state/mapNumbers', value: fixture.client.mapNumbers }],
        ['state/mapNumbers', { op: 'add', path: 'state/mapNumbers/1', value: 1 }]
    );
});

test('ShallowMapState change map field with previous state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    fixture.server.mapNumbers.set('1', 1);
    fixture.sync();
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');

    fixture.server.mapNumbers = new MapSchema();
    fixture.sync();

    events.assertEvents(
        t,
        ['state/mapNumbers', { op: 'replace', path: 'state/mapNumbers', value: fixture.client.mapNumbers }],
        ['state/mapNumbers', { op: 'remove', path: 'state/mapNumbers/1' }]
    );
});

test('ShallowMapState change map field with same (previous and existing) state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    fixture.server.mapNumbers.set('1', 1);
    fixture.sync();
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');

    fixture.server.mapNumbers = new MapSchema({ '1': 1 });
    fixture.sync();

    events.assertEvents(
        t,
        ['state/mapNumbers', { op: 'replace', path: 'state/mapNumbers', value: fixture.client.mapNumbers }],
        ['state/mapNumbers', { op: 'remove', path: 'state/mapNumbers/1' }],
        ['state/mapNumbers', { op: 'add', path: 'state/mapNumbers/1', value: 1 }]
    );
});
test('ShallowMapState remove field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowMapState);
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');
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
        ['state/mapNumbers', { op: 'remove', path: 'state/mapNumbers/1' }],
        ['state/mapNumbers', { op: 'remove', path: 'state/mapNumbers/2' }]
    );
});
