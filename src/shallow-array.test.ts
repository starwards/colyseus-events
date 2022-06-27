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
    fixture.sync();
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');

    fixture.server.numbersArray[0] = 0;
    fixture.sync();

    fixture.server.numbersArray[1] = 1;
    fixture.sync();
    events.assertEvents(
        t,
        ['state/numbersArray', { op: 'add', path: 'state/numbersArray/0', value: 0 }],
        ['state/numbersArray', { op: 'add', path: 'state/numbersArray/1', value: 1 }]
    );
});

test('ShallowArrayState change field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    fixture.sync();
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');

    fixture.server.numbersArray[0] = 0;
    fixture.sync();

    fixture.server.numbersArray[0] = 1;
    fixture.sync();
    events.assertEvents(
        t,
        ['state/numbersArray', { op: 'add', path: 'state/numbersArray/0', value: 0 }],
        ['state/numbersArray/0', { op: 'replace', path: 'state/numbersArray/0', value: 1 }]
    );
});

test('ShallowArrayState change array field with new state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    fixture.sync();
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');
    fixture.server.numbersArray = new ArraySchema(0);
    fixture.sync();
    events.assertEvents(
        t,
        ['state/numbersArray', { op: 'replace', path: 'state/numbersArray', value: fixture.client.numbersArray }],
        ['state/numbersArray', { op: 'add', path: 'state/numbersArray/0', value: 0 }]
    );
});

test('ShallowArrayState change array field with previous state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    fixture.server.numbersArray[0] = 0;
    fixture.sync();
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');
    fixture.server.numbersArray = new ArraySchema();
    fixture.sync();
    events.assertEvents(
        t,
        ['state/numbersArray', { op: 'replace', path: 'state/numbersArray', value: fixture.client.numbersArray }],
        ['state/numbersArray', { op: 'remove', path: 'state/numbersArray/0' }]
    );
});

test('ShallowArrayState change array field with same (previous and existing) state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    fixture.server.numbersArray[0] = 0;
    fixture.sync();
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');
    fixture.server.numbersArray = new ArraySchema(0);
    fixture.sync();
    events.assertEvents(
        t,
        ['state/numbersArray', { op: 'replace', path: 'state/numbersArray', value: fixture.client.numbersArray }],
        ['state/numbersArray', { op: 'remove', path: 'state/numbersArray/0' }],
        ['state/numbersArray', { op: 'add', path: 'state/numbersArray/0', value: 0 }]
    );
});

test('ShallowArrayState remove field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowArrayState);
    const events = wireEvents(fixture.client, new RecordedEvents(), 'state');
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
        ['state/numbersArray', { op: 'remove', path: 'state/numbersArray/1' }],
        ['state/numbersArray', { op: 'remove', path: 'state/numbersArray/0' }]
    );
});
