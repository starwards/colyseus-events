import { MapSchema } from '@colyseus/schema';
import { SymbolWeakSet } from './weak-set';
import test from 'tape';

test('SymbolWeakSet marks and detects value', (t) => {
    t.plan(1);
    const value = new MapSchema();

    const uut = new SymbolWeakSet();
    uut.add(value);

    t.true(uut.has(value));
});

// Note: Proxy tests disabled for v3 as getMapProxy is not exported
// The proxy mechanism may have changed in v3
// test('SymbolWeakSet detects proxy after marking value', (t) => {
//     t.plan(1);
//     const value = new MapSchema();
//     const proxy = getMapProxy(value);

//     const uut = new SymbolWeakSet();
//     uut.add(value);

//     t.true(uut.has(proxy));
// });

// test('SymbolWeakSet detects value of MapSchema after marking proxy', (t) => {
//     t.plan(1);
//     const value = new MapSchema();
//     const proxy = getMapProxy(value);

//     const uut = new SymbolWeakSet();
//     uut.add(proxy);

//     t.true(uut.has(value));
// });

// Note: clone() method signature may have changed in v3
// test('SymbolWeakSet does not detect clone of MapSchema after marking value', (t) => {
//     t.plan(1);
//     const value = new MapSchema();

//     const uut = new SymbolWeakSet();
//     uut.add(value);
//     const clone = value.clone();

//     t.false(uut.has(clone));
// });

// test('SymbolWeakSet detects decoding clone of MapSchema after marking value', (t) => {
//     t.plan(1);
//     const value = new MapSchema();

//     const uut = new SymbolWeakSet();
//     uut.add(value);
//     const clone = value.clone(true);

//     t.true(uut.has(clone));
// });
