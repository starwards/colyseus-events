import { CollectionSchema, Schema, type } from '@colyseus/schema';
import { FakeClientServer, RecordedEvents } from './helper.test';

import test from 'tape';
import { wireEvents } from '.';

class ItemSchema extends Schema {
    @type('string') public name: string | undefined;
    @type('uint8') public value: number | undefined;
}

class DeepCollectionState extends Schema {
    @type({ collection: ItemSchema }) public items = new CollectionSchema<ItemSchema>();
}

test('DeepCollectionState add Schema element to collection', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepCollectionState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    const item = new ItemSchema();
    item.name = 'test';
    fixture.server.items.add(item);
    fixture.sync();

    events.assertEvents(
        t,
        ['/items', { op: 'add', path: '/items/0', value: fixture.room.state.items.at(0) }],
        ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'test' }],
    );
});

test('DeepCollectionState change nested property within collection element', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepCollectionState);
    const item = new ItemSchema();
    fixture.server.items.add(item);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.items.at(0)!.name = 'updated';
    fixture.sync();

    events.assertEvents(t, ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'updated' }]);
});

test('DeepCollectionState add multiple Schema elements', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepCollectionState);
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
        ['/items', { op: 'add', path: '/items/0', value: fixture.room.state.items.at(0) }],
        ['/items', { op: 'add', path: '/items/1', value: fixture.room.state.items.at(1) }],
        ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'first' }],
        ['/items/1/name', { op: 'replace', path: '/items/1/name', value: 'second' }],
    );
});

test('DeepCollectionState remove Schema element from collection', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepCollectionState);
    const item = new ItemSchema();
    fixture.server.items.add(item);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.items.delete(item);
    fixture.sync();

    events.assertEvents(t, ['/items', { op: 'remove', path: '/items/0' }]);
});

test('DeepCollectionState change nested properties on multiple elements', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepCollectionState);
    const item1 = new ItemSchema();
    const item2 = new ItemSchema();
    fixture.server.items.add(item1);
    fixture.server.items.add(item2);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.items.at(0)!.name = 'updated1';
    fixture.server.items.at(1)!.value = 99;
    fixture.sync();

    events.assertEvents(
        t,
        ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'updated1' }],
        ['/items/1/value', { op: 'replace', path: '/items/1/value', value: 99 }],
    );
});
