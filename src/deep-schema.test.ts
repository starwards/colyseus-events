/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FakeClientServer, RecordedEvents } from './helper.test';
import { Schema, type } from '@colyseus/schema';

import test from 'tape';
import { wireEvents } from '.';

export class DeepState extends Schema {
    @type('uint8') public foo: number | undefined;
    @type(DeepState) public child: DeepState | undefined;
}

test('DeepState add field', (t) => {
    t.plan(2);
    const fixture = new FakeClientServer(DeepState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    events.clear();

    fixture.server.child = new DeepState();
    fixture.sync();
    events.assertEvents(t, ['/child', { op: 'replace', path: '/child', value: fixture.room.state.child! }]);

    const child = new DeepState();
    fixture.server.child.child = child;
    fixture.sync();
    events.assertEvents(t, [
        '/child/child',
        { op: 'replace', path: '/child/child', value: fixture.room.state.child!.child! },
    ]);
});

test('DeepState change field deep', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    events.clear();

    fixture.server.child = new DeepState();
    fixture.sync();
    events.clear();

    fixture.server.child.foo = 1;
    fixture.sync();
    fixture.server.child.foo = 2;
    fixture.sync();
    events.assertEvents(
        t,
        ['/child/foo', { op: 'replace', path: '/child/foo', value: 1 }],
        ['/child/foo', { op: 'replace', path: '/child/foo', value: 2 }],
    );
});

test('DeepState change field with deep value', (t) => {
    t.plan(2);
    const child1 = new DeepState();
    child1.foo = 0; // this change will not be reported
    child1.foo = 1;

    const child2 = new DeepState();
    child2.foo = 0; // this change will not be reported
    child2.foo = 2;

    const fixture = new FakeClientServer(DeepState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    fixture.sync();
    events.clear();

    fixture.server.child = child1;
    fixture.sync();
    events.assertEvents(
        t,
        ['/child', { op: 'replace', path: '/child', value: fixture.room.state.child! }],
        ['/child/foo', { op: 'replace', path: '/child/foo', value: 1 }],
    );

    fixture.server.child = child2;
    fixture.sync();
    events.assertEvents(
        t,
        ['/child', { op: 'replace', path: '/child', value: fixture.room.state.child! }],
        ['/child/foo', { op: 'replace', path: '/child/foo', value: 2 }],
    );
});
