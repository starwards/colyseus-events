/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FakeClientServer, RecordedEvents } from './helper.test';
import { Schema, type } from '@colyseus/schema';

import test from 'tape';
import { wireEvents } from '.';

export class ParentState extends Schema {
    @type('uint8') public parent: number | undefined;
}
export class ChildState extends ParentState {
    @type('uint8') public child: number | undefined;
}

test('ParentState add field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ChildState);
    const events = wireEvents(fixture.client, new RecordedEvents());
    fixture.server.parent = 1;
    fixture.sync();
    events.assertEvents(t, ['/parent', { op: 'replace', path: '/parent', value: 1 }]);
});

test('ParentState change field', (t) => {
    t.plan(2);
    const fixture = new FakeClientServer(ChildState);
    const events = wireEvents(fixture.client, new RecordedEvents());
    fixture.server.parent = 1;
    fixture.sync();
    events.assertEvents(t, ['/parent', { op: 'replace', path: '/parent', value: 1 }]);
    fixture.server.parent = 2;
    fixture.sync();
    events.assertEvents(t, ['/parent', { op: 'replace', path: '/parent', value: 2 }]);
});

test('ChildState add field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ChildState);
    const events = wireEvents(fixture.client, new RecordedEvents());
    fixture.server.child = 1;
    fixture.sync();
    events.assertEvents(t, ['/child', { op: 'replace', path: '/child', value: 1 }]);
});

test('ChildState change field', (t) => {
    t.plan(2);
    const fixture = new FakeClientServer(ChildState);
    const events = wireEvents(fixture.client, new RecordedEvents());
    fixture.server.child = 1;
    fixture.sync();
    events.assertEvents(t, ['/child', { op: 'replace', path: '/child', value: 1 }]);
    fixture.server.child = 2;
    fixture.sync();
    events.assertEvents(t, ['/child', { op: 'replace', path: '/child', value: 2 }]);
});
