/**
 * Tests for the "late wireEvents" scenario where wireEvents is called AFTER
 * state has already been synced to the client. This tests the `immediate` parameter
 * behavior of onAdd callbacks.
 *
 * Without immediate=true, existing elements won't trigger onAdd, which means
 * nested listeners never get set up, and property changes on those elements
 * won't emit events.
 */
import { ArraySchema, CollectionSchema, MapSchema, Schema, SetSchema, type } from '@colyseus/schema';
import { FakeClientServer, RecordedEvents } from './helper.test';

import test from 'tape';
import { wireEvents } from '.';

// Shared nested Schema for all container tests
class ItemSchema extends Schema {
    @type('string') public name: string | undefined;
    @type('uint8') public value: number | undefined;
}

// Container schemas
class ArrayContainer extends Schema {
    @type([ItemSchema]) public items = new ArraySchema<ItemSchema>();
}

class MapContainer extends Schema {
    @type({ map: ItemSchema }) public items = new MapSchema<ItemSchema>();
}

class CollectionContainer extends Schema {
    @type({ collection: ItemSchema }) public items = new CollectionSchema<ItemSchema>();
}

class SetContainer extends Schema {
    @type({ set: ItemSchema }) public items = new SetSchema<ItemSchema>();
}

// Helper to get item by index from SetSchema
function getSetItemAt<T>(set: SetSchema<T>, index: number): T | undefined {
    return set.toArray()[index];
}

/**
 * ArraySchema: Test nested property change after late wireEvents
 * Expected: PASS (immediate=true is already in place)
 */
test('ArraySchema: nested property change after late wireEvents', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ArrayContainer);

    // Add element on server
    const item = new ItemSchema();
    item.name = 'initial';
    fixture.server.items.push(item);

    // CRITICAL: Sync BEFORE wireEvents - client already has the item
    fixture.sync();

    // Late wireEvents - with immediate=false, onAdd wouldn't fire for existing item
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    events.clear();

    // Modify nested property
    fixture.server.items[0].name = 'updated';
    fixture.sync();

    // Assert event was emitted - this only works if traverse() was called for existing item
    events.assertEvents(t, ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'updated' }]);
});

/**
 * MapSchema: Test nested property change after late wireEvents
 * Expected: FAIL without fix (immediate=false)
 */
test('MapSchema: nested property change after late wireEvents', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(MapContainer);

    // Add element on server
    const item = new ItemSchema();
    item.name = 'initial';
    fixture.server.items.set('key1', item);

    // CRITICAL: Sync BEFORE wireEvents - client already has the item
    fixture.sync();

    // Late wireEvents
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    events.clear();

    // Modify nested property
    fixture.server.items.get('key1')!.name = 'updated';
    fixture.sync();

    // Assert event was emitted
    events.assertEvents(t, ['/items/key1/name', { op: 'replace', path: '/items/key1/name', value: 'updated' }]);
});

/**
 * CollectionSchema: Test nested property change after late wireEvents
 * Expected: FAIL without fix (immediate=false)
 */
test('CollectionSchema: nested property change after late wireEvents', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(CollectionContainer);

    // Add element on server
    const item = new ItemSchema();
    item.name = 'initial';
    fixture.server.items.add(item);

    // CRITICAL: Sync BEFORE wireEvents - client already has the item
    fixture.sync();

    // Late wireEvents
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    events.clear();

    // Modify nested property
    fixture.server.items.at(0)!.name = 'updated';
    fixture.sync();

    // Assert event was emitted
    events.assertEvents(t, ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'updated' }]);
});

/**
 * SetSchema: Test nested property change after late wireEvents
 * Expected: FAIL without fix (immediate=false)
 */
test('SetSchema: nested property change after late wireEvents', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(SetContainer);

    // Add element on server
    const item = new ItemSchema();
    item.name = 'initial';
    fixture.server.items.add(item);

    // CRITICAL: Sync BEFORE wireEvents - client already has the item
    fixture.sync();

    // Late wireEvents
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    events.clear();

    // Modify nested property
    getSetItemAt(fixture.server.items, 0)!.name = 'updated';
    fixture.sync();

    // Assert event was emitted
    events.assertEvents(t, ['/items/0/name', { op: 'replace', path: '/items/0/name', value: 'updated' }]);
});

/**
 * ArraySchema: Multiple existing elements after late wireEvents
 */
test('ArraySchema: multiple existing elements after late wireEvents', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ArrayContainer);

    // Add multiple elements on server
    const item1 = new ItemSchema();
    item1.name = 'first';
    const item2 = new ItemSchema();
    item2.name = 'second';
    fixture.server.items.push(item1);
    fixture.server.items.push(item2);

    // Sync BEFORE wireEvents
    fixture.sync();

    // Late wireEvents
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    events.clear();

    // Modify nested properties on both elements
    fixture.server.items[0].value = 10;
    fixture.server.items[1].value = 20;
    fixture.sync();

    events.assertEvents(
        t,
        ['/items/0/value', { op: 'replace', path: '/items/0/value', value: 10 }],
        ['/items/1/value', { op: 'replace', path: '/items/1/value', value: 20 }],
    );
});

/**
 * MapSchema: Multiple existing elements after late wireEvents
 */
test('MapSchema: multiple existing elements after late wireEvents', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(MapContainer);

    // Add multiple elements on server
    const item1 = new ItemSchema();
    item1.name = 'first';
    const item2 = new ItemSchema();
    item2.name = 'second';
    fixture.server.items.set('a', item1);
    fixture.server.items.set('b', item2);

    // Sync BEFORE wireEvents
    fixture.sync();

    // Late wireEvents
    const { events } = wireEvents(fixture.room, new RecordedEvents());
    events.clear();

    // Modify nested properties on both elements
    fixture.server.items.get('a')!.value = 10;
    fixture.server.items.get('b')!.value = 20;
    fixture.sync();

    events.assertEvents(
        t,
        ['/items/a/value', { op: 'replace', path: '/items/a/value', value: 10 }],
        ['/items/b/value', { op: 'replace', path: '/items/b/value', value: 20 }],
    );
});
