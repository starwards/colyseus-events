import { FakeClientServer, RecordedEvents } from './helper.test';
import { MapSchema, Schema, type } from '@colyseus/schema';

import test from 'tape';
import { wireEvents } from '.';

class ItemSchema extends Schema {
    @type('string') public name: string | undefined;
    @type('uint8') public value: number | undefined;
}

class DeepMapState extends Schema {
    @type({ map: ItemSchema }) public items = new MapSchema<ItemSchema>();
}

test('DeepMapState add Schema element to map', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepMapState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    const item = new ItemSchema();
    item.name = 'test';
    fixture.server.items.set('key1', item);
    fixture.sync();

    events.assertEvents(
        t,
        ['/items', { op: 'add', path: '/items/key1', value: fixture.room.state.items.get('key1') }],
        ['/items/key1/name', { op: 'replace', path: '/items/key1/name', value: 'test' }],
    );
});

test('DeepMapState change nested property within map element', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepMapState);
    const item = new ItemSchema();
    fixture.server.items.set('key1', item);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.items.get('key1')!.name = 'updated';
    fixture.sync();

    events.assertEvents(t, ['/items/key1/name', { op: 'replace', path: '/items/key1/name', value: 'updated' }]);
});

test('DeepMapState replace entire Schema element at key', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepMapState);
    const item1 = new ItemSchema();
    item1.name = 'first';
    fixture.server.items.set('key1', item1);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    const item2 = new ItemSchema();
    item2.name = 'second';
    fixture.server.items.set('key1', item2);
    fixture.sync();

    events.assertEvents(
        t,
        ['/items/key1', { op: 'replace', path: '/items/key1', value: fixture.room.state.items.get('key1') }],
        ['/items/key1/name', { op: 'replace', path: '/items/key1/name', value: 'second' }],
    );
});

test('DeepMapState remove Schema element from map', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepMapState);
    const item = new ItemSchema();
    fixture.server.items.set('key1', item);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.items.delete('key1');
    fixture.sync();

    events.assertEvents(t, ['/items', { op: 'remove', path: '/items/key1' }]);
});

test('DeepMapState change nested property after element replacement', (t) => {
    t.plan(2);
    const fixture = new FakeClientServer(DeepMapState);
    const item1 = new ItemSchema();
    fixture.server.items.set('key1', item1);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    // Replace element at key
    const item2 = new ItemSchema();
    fixture.server.items.set('key1', item2);
    fixture.sync();
    events.assertEvents(t, [
        '/items/key1',
        { op: 'replace', path: '/items/key1', value: fixture.room.state.items.get('key1') },
    ]);

    // Now change nested property - should still emit at nested path
    fixture.server.items.get('key1')!.name = 'after-replacement';
    fixture.sync();
    events.assertEvents(t, [
        '/items/key1/name',
        { op: 'replace', path: '/items/key1/name', value: 'after-replacement' },
    ]);
});
