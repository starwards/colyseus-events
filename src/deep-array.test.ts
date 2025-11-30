import { ArraySchema, Schema, type } from '@colyseus/schema';
import { FakeClientServer, RecordedEvents } from './helper.test';

import test from 'tape';
import { wireEvents } from '.';

class ItemSchema extends Schema {
    @type('string') public name: string | undefined;
    @type('uint8') public value: number | undefined;
}

class DeepArrayState extends Schema {
    @type([ItemSchema]) public items = new ArraySchema<ItemSchema>();
}

test('DeepArrayState add Schema element to array', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepArrayState);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    const item = new ItemSchema();
    item.name = 'test';
    fixture.server.items.push(item);
    fixture.sync();

    events.assertEvents(
        t,
        ['/items', { op: 'add', path: '/items/0', value: fixture.room.state.items[0] }],
        ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'test' }],
    );
});

test('DeepArrayState change nested property within array element', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepArrayState);
    const item = new ItemSchema();
    fixture.server.items.push(item);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.items[0].name = 'updated';
    fixture.sync();

    events.assertEvents(t, ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'updated' }]);
});

test('DeepArrayState replace entire Schema element at index', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepArrayState);
    const item1 = new ItemSchema();
    item1.name = 'first';
    fixture.server.items.push(item1);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    const item2 = new ItemSchema();
    item2.name = 'second';
    fixture.server.items[0] = item2;
    fixture.sync();

    events.assertEvents(
        t,
        ['/items/0', { op: 'replace', path: '/items/0', value: fixture.room.state.items[0] }],
        ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'second' }],
    );
});

test('DeepArrayState remove Schema element from array', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepArrayState);
    const item = new ItemSchema();
    fixture.server.items.push(item);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    fixture.server.items.pop();
    fixture.sync();

    events.assertEvents(t, ['/items', { op: 'remove', path: '/items/0' }]);
});

test('DeepArrayState change nested property after element replacement', (t) => {
    t.plan(2);
    const fixture = new FakeClientServer(DeepArrayState);
    const item1 = new ItemSchema();
    fixture.server.items.push(item1);
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    fixture.sync();
    events.clear();

    // Replace element at index
    const item2 = new ItemSchema();
    fixture.server.items[0] = item2;
    fixture.sync();
    events.assertEvents(t, ['/items/0', { op: 'replace', path: '/items/0', value: fixture.room.state.items[0] }]);

    // Now change nested property - should still emit at nested path
    fixture.server.items[0].name = 'after-replacement';
    fixture.sync();
    events.assertEvents(t, ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'after-replacement' }]);
});
