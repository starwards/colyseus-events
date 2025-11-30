import { FakeClientServer, RecordedEvents } from './helper.test';
import { Schema, SetSchema, type } from '@colyseus/schema';

import test from 'tape';
import { wireEvents } from '.';

export class ShallowSetState extends Schema {
    @type({ set: 'uint8' }) public numbers = new SetSchema<number>();
}

test('ShallowSetState add single item', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowSetState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.numbers.add(42);
    fixture.sync();

    events.assertEvents(t, ['/numbers', { op: 'add', path: '/numbers/0', value: 42 }]);
});

test('ShallowSetState add multiple unique items', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowSetState);
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

test('ShallowSetState rejects duplicate items', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowSetState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.numbers.add(5);
    fixture.server.numbers.add(5); // Duplicate - should be ignored
    fixture.sync();

    // Only one add event should be emitted
    events.assertEvents(t, ['/numbers', { op: 'add', path: '/numbers/0', value: 5 }]);
});

test('ShallowSetState remove item', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowSetState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.server.numbers.add(10);
    fixture.server.numbers.add(20);
    fixture.sync();
    events.clear();

    fixture.server.numbers.delete(10);
    fixture.sync();

    events.assertEvents(t, ['/numbers', { op: 'remove', path: '/numbers/0' }]);
});

test('ShallowSetState replace set field with new instance', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowSetState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.numbers = new SetSchema([5]);
    fixture.sync();

    events.assertEvents(
        t,
        ['/numbers', { op: 'replace', path: '/numbers', value: fixture.room.state.numbers }],
        ['/numbers', { op: 'add', path: '/numbers/0', value: 5 }],
    );
});

test('ShallowSetState replace set with previous state', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowSetState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.server.numbers.add(100);
    fixture.sync();
    events.clear();

    fixture.server.numbers = new SetSchema();
    fixture.sync();

    events.assertEvents(
        t,
        ['/numbers', { op: 'remove', path: '/numbers/0' }],
        ['/numbers', { op: 'replace', path: '/numbers', value: fixture.room.state.numbers }],
    );
});

test('ShallowSetState clear set', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowSetState);
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
