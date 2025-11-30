import { CollectionSchema, Schema, type } from '@colyseus/schema';
import { FakeClientServer, RecordedEvents } from './helper.test';

import test from 'tape';
import { wireEvents } from '.';

export class ShallowCollectionState extends Schema {
    @type({ collection: 'uint8' }) public numbers = new CollectionSchema<number>();
}

test('ShallowCollectionState add single item', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowCollectionState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.numbers.add(42);
    fixture.sync();

    events.assertEvents(t, ['/numbers', { op: 'add', path: '/numbers/0', value: 42 }]);
});

test('ShallowCollectionState add multiple items', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowCollectionState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.numbers.add(1);
    fixture.server.numbers.add(2);
    fixture.sync();

    events.assertEvents(
        t,
        ['/numbers', { op: 'add', path: '/numbers/0', value: 1 }],
        ['/numbers', { op: 'add', path: '/numbers/1', value: 2 }],
    );
});

test('ShallowCollectionState remove item', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowCollectionState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.server.numbers.add(10);
    fixture.server.numbers.add(20);
    fixture.sync();
    events.clear();

    fixture.server.numbers.delete(10);
    fixture.sync();

    events.assertEvents(t, ['/numbers', { op: 'remove', path: '/numbers/0' }]);
});

test('ShallowCollectionState replace collection field with new instance', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowCollectionState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.numbers = new CollectionSchema([5]);
    fixture.sync();

    events.assertEvents(
        t,
        ['/numbers', { op: 'replace', path: '/numbers', value: fixture.room.state.numbers }],
        ['/numbers', { op: 'add', path: '/numbers/0', value: 5 }],
    );
});

test('ShallowCollectionState replace collection with previous state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowCollectionState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.server.numbers.add(100);
    fixture.sync();
    events.clear();

    fixture.server.numbers = new CollectionSchema();
    fixture.sync();

    events.assertEvents(
        t,
        ['/numbers', { op: 'remove', path: '/numbers/0' }],
        ['/numbers', { op: 'replace', path: '/numbers', value: fixture.room.state.numbers }],
    );
});

test('ShallowCollectionState clear collection', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowCollectionState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.server.numbers.add(1);
    fixture.server.numbers.add(2);
    fixture.sync();
    events.clear();

    fixture.server.numbers.clear();
    fixture.sync();

    events.assertEvents(
        t,
        ['/numbers', { op: 'remove', path: '/numbers/0' }],
        ['/numbers', { op: 'remove', path: '/numbers/1' }],
    );
});
