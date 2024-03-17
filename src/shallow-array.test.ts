import { ArraySchema, Schema, type } from '@colyseus/schema';
import { FakeClientServer, RecordedEvents } from './helper.test';

import test from 'tape';
import { wireEvents } from '.';

export class ShallowArrayState extends Schema {
    @type(['uint8']) public numbersArray = new ArraySchema<number>();
}

test('ShallowArrayState add field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    const { events, clearCache } = wireEvents(fixture.client, new RecordedEvents());
    events.onClear(clearCache);
    fixture.sync();
    events.clear();

    fixture.server.numbersArray[0] = 0;
    fixture.sync();

    fixture.server.numbersArray[1] = 1;
    fixture.sync();
    events.assertEvents(
        t,
        ['/numbersArray', { op: 'add', path: '/numbersArray/0', value: 0 }],
        ['/numbersArray', { op: 'add', path: '/numbersArray/1', value: 1 }]
    );
});

test('ShallowArrayState change field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    const { events, clearCache } = wireEvents(fixture.client, new RecordedEvents());
    events.onClear(clearCache);
    fixture.sync();
    events.clear();

    fixture.server.numbersArray[0] = 0;
    fixture.sync();

    fixture.server.numbersArray[0] = 1;
    fixture.sync();
    events.assertEvents(
        t,
        ['/numbersArray', { op: 'add', path: '/numbersArray/0', value: 0 }],
        ['/numbersArray/0', { op: 'replace', path: '/numbersArray/0', value: 1 }]
    );
});

test('ShallowArrayState change array field with new state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    const { events, clearCache } = wireEvents(fixture.client, new RecordedEvents());
    events.onClear(clearCache);
    fixture.sync();
    events.clear();

    fixture.server.numbersArray = new ArraySchema(0);
    fixture.sync();
    events.assertEvents(
        t,
        ['/numbersArray', { op: 'replace', path: '/numbersArray', value: fixture.client.numbersArray }],
        ['/numbersArray', { op: 'add', path: '/numbersArray/0', value: 0 }]
    );
});

test('ShallowArrayState change array field with previous state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    const { events, clearCache } = wireEvents(fixture.client, new RecordedEvents());
    events.onClear(clearCache);
    fixture.server.numbersArray[0] = 0;
    fixture.sync();
    events.clear();

    fixture.server.numbersArray = new ArraySchema();
    fixture.sync();
    events.assertEvents(
        t,
        ['/numbersArray', { op: 'remove', path: '/numbersArray/0' }],
        ['/numbersArray', { op: 'replace', path: '/numbersArray', value: fixture.client.numbersArray }]
    );
});

test('ShallowArrayState change array field with same (previous and existing) state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    const { events, clearCache } = wireEvents(fixture.client, new RecordedEvents());
    events.onClear(clearCache);
    fixture.server.numbersArray[0] = 0;
    fixture.sync();
    events.clear();

    fixture.server.numbersArray = new ArraySchema(0);
    fixture.sync();
    events.assertEvents(
        t,
        ['/numbersArray', { op: 'remove', path: '/numbersArray/0' }],
        ['/numbersArray', { op: 'replace', path: '/numbersArray', value: fixture.client.numbersArray }],
        ['/numbersArray', { op: 'add', path: '/numbersArray/0', value: 0 }]
    );
});

test('ShallowArrayState remove field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    const { events, clearCache } = wireEvents(fixture.client, new RecordedEvents());
    events.onClear(clearCache);
    fixture.sync();
    events.clear();

    fixture.server.numbersArray[0] = 0;
    fixture.server.numbersArray[1] = 1;
    fixture.sync();
    events.clear();

    fixture.server.numbersArray.pop();
    fixture.sync();

    fixture.server.numbersArray.pop();
    fixture.sync();
    events.assertEvents(
        t,
        ['/numbersArray', { op: 'remove', path: '/numbersArray/1' }],
        ['/numbersArray', { op: 'remove', path: '/numbersArray/0' }]
    );
});
