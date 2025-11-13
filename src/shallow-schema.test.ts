import { FakeClientServer, RecordedEvents } from './helper.test';
import { Schema, type } from '@colyseus/schema';

import test from 'tape';
import { wireEvents } from '.';

export class ShallowState extends Schema {
    @type('uint8') public foo: number | undefined;
}

test('ShallowState add field', (t) => {
    t.plan(1);
    const fixture = new FakeClientServer(ShallowState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    fixture.server.foo = 1;
    fixture.sync();
    events.assertEvents(t, ['/foo', { op: 'replace', path: '/foo', value: 1 }]);
});

test('ShallowState change field', (t) => {
    t.plan(2);
    const fixture = new FakeClientServer(ShallowState);
    const { events, clearCache } = wireEvents(fixture.room, new RecordedEvents());
    events.onClear(clearCache);
    fixture.server.foo = 1;
    fixture.sync();
    events.assertEvents(t, ['/foo', { op: 'replace', path: '/foo', value: 1 }]);
    fixture.server.foo = 2;
    fixture.sync();
    events.assertEvents(t, ['/foo', { op: 'replace', path: '/foo', value: 2 }]);
});
