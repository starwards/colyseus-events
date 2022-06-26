import { FakeClientServer, RecordedEvents } from './helper.test';
import { Schema, type } from '@colyseus/schema';

import test from 'tape';
import { wireEvents } from '.';

export class DeepState extends Schema {
    @type('uint8') public counter: number | undefined;
    @type(DeepState) public child: DeepState | undefined;
}

test('DeepState add field', (t) => {
    t.plan(2);
    const fixture = new FakeClientServer(DeepState);
    const events = wireEvents(fixture.client, new RecordedEvents());

    fixture.server.child = new DeepState();
    fixture.sync();
    events.assertEvents(t, [fixture.client.child, 'child']);

    fixture.server.child.child = new DeepState();
    fixture.sync();
    events.assertEvents(t, [fixture.client.child?.child, 'child.child']);
});

test('DeepState change field deep', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(DeepState);
    const events = wireEvents(fixture.client, new RecordedEvents());

    fixture.server.child = new DeepState();
    fixture.sync();
    events.clear();

    fixture.server.child.counter = 1;
    fixture.sync();
    fixture.server.child.counter = 2;
    fixture.sync();
    events.assertEvents(t, [1, 'child.counter'], [2, 'child.counter']);
});

test('DeepState change field with deep value', (t) => {
    t.plan(2);
    const child1 = new DeepState();
    child1.counter = 1;

    const child2 = new DeepState();
    child2.counter = 2;

    const fixture = new FakeClientServer(DeepState);
    const events = wireEvents(fixture.client, new RecordedEvents());

    fixture.server.child = child1;
    fixture.sync();
    events.assertEvents(t, [fixture.client.child, 'child'], [1, 'child.counter']);
    fixture.server.child = child2;
    fixture.sync();
    events.assertEvents(t, [fixture.client.child, 'child'], [2, 'child.counter']);
});
