import { FakeClientServer, RecordedEvents } from './helper.test';
import { Schema, type } from '@colyseus/schema';

import test from 'tape';
import { wireEvents } from '.';

export class ShallowState extends Schema {
    @type('uint8') public counter: number | undefined;
}

test('ShallowState add field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowState);
    const events = wireEvents(fixture.client, new RecordedEvents());
    fixture.server.counter = 1;
    fixture.sync();
    events.assertEvents(t, { op: 'replace', path: '/counter', value: 1 });
});

test('ShallowState change field', (t) => {
    t.plan(2);
    const fixture = new FakeClientServer(ShallowState);
    const events = wireEvents(fixture.client, new RecordedEvents());
    fixture.server.counter = 1;
    fixture.sync();
    events.assertEvents(t, { op: 'replace', path: '/counter', value: 1 });
    fixture.server.counter = 2;
    fixture.sync();
    events.assertEvents(t, { op: 'replace', path: '/counter', value: 2 });
});
