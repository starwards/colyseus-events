import { ArraySchema, Decoder, Encoder, MapSchema, Schema, type } from '@colyseus/schema';
import { RecordedEvents, SCHEMA_MAJOR } from './helper.test';

import { SchemaSerializer } from 'colyseus.js';
import test from 'tape';
import { wireEvents } from '.';

// these tests decode through the real client SchemaSerializer
// (colyseus.js on the schema 3 leg, @colyseus/sdk on the schema 5 leg)

class Item extends Schema {
    @type('string') public name = '';
    @type('uint8') public hp = 0;
}
class State extends Schema {
    @type('uint8') public tick = 0;
    @type(Item) public ship = new Item();
    @type({ map: Item }) public map = new MapSchema<Item>();
    @type([Item]) public list = new ArraySchema<Item>();
}

function item(name: string, hp = 0) {
    const i = new Item();
    i.name = name;
    i.hp = hp;
    return i;
}

class RealClient {
    server = new State();
    encoder = new Encoder(this.server);
    serializer = new SchemaSerializer<State>();
    constructor() {
        this.serializer.state = new State();
        this.serializer.decoder = new Decoder(this.serializer.state);
    }
    get room() {
        return { state: this.serializer.state, serializer: this.serializer };
    }
    /** full state, as sent on join and on reconnect */
    fullState() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        this.serializer.setState(this.encoder.encodeAll() as any);
    }
    /** patch, as broadcast by the server every tick */
    patch() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        this.serializer.patch(this.encoder.encode() as any);
        this.encoder.discardChanges();
    }
    /** server ticks the client never receives (disconnected) */
    offline() {
        this.encoder.encode();
        this.encoder.discardChanges();
    }
}

test('real serializer: map, array and nested schema events', (t) => {
    t.plan(5);
    const c = new RealClient();
    c.server.map.set('a', item('a'));
    c.server.list.push(item('l0'));
    c.fullState();
    const { events } = wireEvents(c.room, new RecordedEvents());
    c.patch();
    events.clear();

    c.server.tick = 1;
    c.server.ship.hp = 5;
    c.patch();
    events.assertEvents(
        t,
        ['/tick', { op: 'replace', path: '/tick', value: 1 }],
        ['/ship/hp', { op: 'replace', path: '/ship/hp', value: 5 }],
    );

    c.server.map.set('b', item('b', 2));
    c.server.list.push(item('l1', 3));
    c.patch();
    events.assertEvents(
        t,
        ['/map', { op: 'add', path: '/map/b', value: c.room.state.map.get('b') }],
        ['/map/b/name', { op: 'replace', path: '/map/b/name', value: 'b' }],
        ['/map/b/hp', { op: 'replace', path: '/map/b/hp', value: 2 }],
        ['/list', { op: 'add', path: '/list/1', value: c.room.state.list[1] }],
        ['/list/1/name', { op: 'replace', path: '/list/1/name', value: 'l1' }],
        ['/list/1/hp', { op: 'replace', path: '/list/1/hp', value: 3 }],
    );

    c.server.map.get('a')!.hp = 7;
    c.server.list[0].hp = 8;
    c.patch();
    events.assertEvents(
        t,
        ['/map/a/hp', { op: 'replace', path: '/map/a/hp', value: 7 }],
        ['/list/0/hp', { op: 'replace', path: '/list/0/hp', value: 8 }],
    );

    c.server.map.delete('a');
    c.server.list.pop();
    c.patch();
    events.assertEvents(t, ['/map', { op: 'remove', path: '/map/a' }], ['/list', { op: 'remove', path: '/list/1' }]);

    c.server.ship = item('new-ship', 1);
    c.patch();
    events.assertEvents(
        t,
        ['/ship', { op: 'replace', path: '/ship', value: c.room.state.ship }],
        ['/ship/name', { op: 'replace', path: '/ship/name', value: 'new-ship' }],
        ['/ship/hp', { op: 'replace', path: '/ship/hp', value: 1 }],
    );
});

test('real serializer: full state replace on reconnect', (t) => {
    t.plan(3);
    const c = new RealClient();
    c.server.map.set('stay', item('stay'));
    c.server.map.set('gone', item('gone'));
    c.fullState();
    const { events } = wireEvents(c.room, new RecordedEvents());
    c.patch();
    events.clear();

    // disconnected while the server changes state
    c.server.map.delete('gone');
    c.server.map.set('new', item('new', 4));
    c.server.map.get('stay')!.hp = 9;
    c.server.tick = 3;
    c.offline();

    // rejoin: the server sends the full state
    c.fullState();
    const expected: [string, unknown][] = [
        ['/tick', { op: 'replace', path: '/tick', value: 3 }],
        ['/map', { op: 'add', path: '/map/new', value: c.room.state.map.get('new') }],
        ['/map/new/name', { op: 'replace', path: '/map/new/name', value: 'new' }],
        ['/map/new/hp', { op: 'replace', path: '/map/new/hp', value: 4 }],
        ['/map/stay/hp', { op: 'replace', path: '/map/stay/hp', value: 9 }],
    ];
    if (SCHEMA_MAJOR === 5) {
        // @colyseus/sdk 0.18 reconciles the snapshot with decodeResync(): stale entries are removed
        expected.push(['/map', { op: 'remove', path: '/map/gone' }]);
    }
    t.deepEquals(
        [...events.eventsLog].sort((a, b) => a[0].localeCompare(b[0])),
        expected.sort((a, b) => a[0].localeCompare(b[0])),
    );
    t.equals(c.room.state.map.has('gone'), SCHEMA_MAJOR !== 5, 'stale entry kept only without decodeResync');
    events.clear();

    // listeners still work after the reconnect
    c.server.map.get('new')!.hp = 5;
    c.patch();
    events.assertEvents(t, ['/map/new/hp', { op: 'replace', path: '/map/new/hp', value: 5 }]);
});
