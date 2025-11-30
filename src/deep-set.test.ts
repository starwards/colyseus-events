import { FakeClientServer, RecordedEvents } from './helper.test';
import { Schema, SetSchema, type } from '@colyseus/schema';

import test from 'tape';
import { wireEvents } from '.';

class ItemSchema extends Schema {
    @type('string') public name: string | undefined;
    @type('uint8') public value: number | undefined;
}

class DeepSetState extends Schema {
    @type({ set: ItemSchema }) public items = new SetSchema<ItemSchema>();
}

// Helper to get item by index from SetSchema
function getItemAt<T>(set: SetSchema<T>, index: number): T | undefined {
    return set.toArray()[index];
}

test('DeepSetState add Schema element to set', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepSetState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    const item = new ItemSchema();
    item.name = 'test';
    fixture.server.items.add(item);
    fixture.sync();

    events.assertEvents(
        t,
        ['/items', { op: 'add', path: '/items/0', value: getItemAt(fixture.room.state.items, 0) }],
        ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'test' }],
    );
});

test('DeepSetState change nested property within set element', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepSetState);
    const item = new ItemSchema();
    fixture.server.items.add(item);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    getItemAt(fixture.server.items, 0)!.name = 'updated';
    fixture.sync();

    events.assertEvents(t, ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'updated' }]);
});

test('DeepSetState add multiple Schema elements', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepSetState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    const item1 = new ItemSchema();
    item1.name = 'first';
    const item2 = new ItemSchema();
    item2.name = 'second';
    fixture.server.items.add(item1);
    fixture.server.items.add(item2);
    fixture.sync();

    // Events fire in batches: all adds first, then nested property changes
    events.assertEvents(
        t,
        ['/items', { op: 'add', path: '/items/0', value: getItemAt(fixture.room.state.items, 0) }],
        ['/items', { op: 'add', path: '/items/1', value: getItemAt(fixture.room.state.items, 1) }],
        ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'first' }],
        ['/items/1/name', { op: 'replace', path: '/items/1/name', value: 'second' }],
    );
});

test('DeepSetState remove Schema element from set', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepSetState);
    const item = new ItemSchema();
    fixture.server.items.add(item);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.items.delete(item);
    fixture.sync();

    events.assertEvents(t, ['/items', { op: 'remove', path: '/items/0' }]);
});

test('DeepSetState change nested properties on multiple elements', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepSetState);
    const item1 = new ItemSchema();
    const item2 = new ItemSchema();
    fixture.server.items.add(item1);
    fixture.server.items.add(item2);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    getItemAt(fixture.server.items, 0)!.name = 'updated1';
    getItemAt(fixture.server.items, 1)!.value = 99;
    fixture.sync();

    events.assertEvents(
        t,
        ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'updated1' }],
        ['/items/1/value', { op: 'replace', path: '/items/1/value', value: 99 }],
    );
});

test('DeepSetState rejects duplicate Schema references', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepSetState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    const item = new ItemSchema();
    item.name = 'unique';
    fixture.server.items.add(item);
    fixture.server.items.add(item); // Same reference - should be ignored
    fixture.sync();

    // Only one add event should be emitted
    events.assertEvents(
        t,
        ['/items', { op: 'add', path: '/items/0', value: getItemAt(fixture.room.state.items, 0) }],
        ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'unique' }],
    );
});
