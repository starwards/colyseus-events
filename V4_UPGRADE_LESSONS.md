# V4 Upgrade Debugging Session: Lessons Learned

## Summary
Attempted to fix collection field replacement detection in colyseus-events v4 upgrade. After multiple approaches, the fundamental issue remains: **Colyseus v3's `.listen()` callback fires for BOTH container replacement AND element changes within collections, making them indistinguishable.**

## The Core Problem

### Failing Tests (4 tests)
All related to ArraySchema/MapSchema field replacement:

1. **Test 18**: `ShallowArrayState change array field with new state`
   - Operation: `state.numbersArray = new ArraySchema(0)`
   - Expected: `[add /numbersArray/0]`
   - Actual: `[]` (no events)
   - Location: `src/shallow-array.test.ts:74`

2. **Test 20**: `ShallowArrayState change array field with same state`
   - Operation: Replace array with new array containing same values
   - Expected: `[remove /0, add /0]`
   - Actual: `[remove /0]` (missing add)
   - Location: `src/shallow-array.test.ts:112`

3. **Test 24**: `ShallowMapState change map field with new state`
   - Operation: `state.mapNumbers = new MapSchema({'1': 1})`
   - Expected: `[add /mapNumbers/1]`
   - Actual: `[]`
   - Location: `src/shallow-map.test.ts:75`

4. **Test 26**: `ShallowMapState change map field with same state`
   - Operation: Replace map with new map containing same values
   - Expected: `[remove /1, add /1]`
   - Actual: `[remove /1]` (missing add)
   - Location: `src/shallow-map.test.ts:115`

### Passing Tests (27 tests)
- All Schema field tests pass (primitive and nested Schema replacement)
- All collection element change tests pass (tests 17, 21, 23, 27)
- All other functionality works correctly

## Key Insights About Colyseus v3 Behavior

### 1. `.listen()` Callback Behavior (CRITICAL)
From debug logging:
```
# When adding element to existing array: numbersArray[0] = 0
[LISTEN] /numbersArray: value type=ArraySchema, prev type=ArraySchema, same=false

# When replacing array: numbersArray = new ArraySchema(0)
[LISTEN] /numbersArray: value type=ArraySchema, prev type=ArraySchema, same=false
```

**The callbacks are IDENTICAL**. Colyseus v3 returns different proxy objects on each access, so:
- `value === previousValue` is ALWAYS false (even for same instance)
- `value instanceof ArraySchema` is true for BOTH cases
- No way to distinguish replacement from element change using `.listen()` alone

### 2. Collection Tracking Required Dual Sets
For ArraySchema and MapSchema:
- `addedKeys` Set: Track which keys have been added to prevent duplicate onAdd events (v3 fires onAdd for value changes)
- `initializedKeys` Set: Track which keys have received their first onChange (v3 fires onChange after onAdd)

### 3. Session-Local Tracking is Essential
- Module-level caches cause test pollution (state leaks between tests)
- Tracking must be scoped to each `wireEvents()` call
- Implemented by attaching caches to `clearNamespace` function as properties

### 4. Namespace-Based Wiring Prevention
- Object identity tracking doesn't work (SymbolWeakSet fails due to proxy behavior)
- Must use namespace string tracking via `wiredNamespaces` Set
- Check `wiredNamespaces.has(namespace)` before wiring to prevent duplicates

## What We Tried (and Why It Failed)

### Attempt 1: Ignore Collections in `.listen()`
**Code**: Simply skip ArraySchema/MapSchema in `.listen()` callback
**Result**: Tests 17, 21, 23, 27 pass ✓ BUT tests 18, 20, 24, 26 fail ✗
**Why**: New containers never get wired, so their onAdd callbacks never fire

### Attempt 2: Only Wire on `previousValue === undefined`
**Code**: `if ((value instanceof ArraySchema) && previousValue === undefined)`
**Result**: Fails because initialized fields have `previousValue` set
**Why**: `numbersArray = new ArraySchema()` in class definition means it's never undefined

### Attempt 3: Container Instance Tracking
**Code**: Store container instances in Map, compare on `.listen()` fire
**Result**: Failed - same issue as SymbolWeakSet
**Why**: Colyseus proxies return different objects, so `lastInstance === value` always false

### Attempt 4: Check `wiredNamespaces` to Detect Replacement
**Code**: If namespace not in `wiredNamespaces`, wire it; otherwise ignore
**Result**: Tests 18, 20, 24, 26 still fail
**Why**: Namespace IS in wiredNamespaces (wired during initial traversal), so replacement not detected

## The Fundamental Challenge

**The Catch-22**:
- If we wire collections in `.listen()`: Get duplicate events for element changes (tests 17, 21, 23, 27 fail)
- If we don't wire collections in `.listen()`: Miss container replacements (tests 18, 20, 24, 26 fail)
- We cannot distinguish the two cases using `.listen()` alone

**Why the original approach (from continuation summary) was abandoned**:
The session started with namespace-based tracking already implemented, but tests were failing because `.listen()` fires for element changes, causing spurious re-wiring.

## Current Architecture (Working Parts)

### Files and Key Functions

**`src/wire-events.ts`** (Modified):
- Session-local `wiredNamespaces` Set prevents duplicate wiring
- Session-local `arrayTracking` and `mapTracking` Maps attached to `clearNamespace`
- `checkWired(ns)` helper function attached to `clearNamespace`

**`src/core-visitors.ts`** (Modified):
- `handleSchema`: Wires Schema fields, handles primitives and Schema replacement
- `handleArraySchema`: Uses dual Sets (`addedKeys`, `initializedKeys`)
- `handleMapSchema`: Uses dual Sets (`addedKeys`, `initializedKeys`)

### Collection Visitor Logic (Working)
```typescript
// In handleArraySchema.visit()
$.onAdd((value, field) => {
    if (addedKeys.has(field)) return; // Prevent duplicate onAdd
    addedKeys.add(field);
    emit('add', ...);
    traverse(value, ...);
});

$.onChange((value, field) => {
    if (initializedKeys.has(field)) {
        // Second+ onChange = actual change
        if (isPrimitive(value)) emit('replace', ...);
        else traverse(value, ...);
    } else {
        // First onChange after onAdd, skip it
        initializedKeys.add(field);
    }
});
```

## Recommendations for Low-Level Approach

### 1. Study the Colyseus Implementation
Check `node_modules/@colyseus/schema/lib/decoder/strategy/StateCallbacks.js`:
- How does it differentiate field changes from container replacement?
- Does it expose any metadata or flags we can use?
- What events fire in what order for replacement vs element change?

### 2. Consider Alternative Detection Strategies

**Option A: Detect via onRemove/onAdd Sequence**
When a container is replaced:
1. Old container fires onRemove for all its elements
2. New container fires onAdd for all its elements
3. Look for "bulk remove + bulk add" pattern as replacement signal?

**Option B: Hook at a Lower Level**
Instead of using `.listen()` for collections, perhaps:
- Only use `onAdd`/`onChange`/`onRemove` callbacks
- Detect replacement by checking if ALL keys removed then new keys added
- Wire new container when this pattern is detected

**Option C: Custom Callback Strategy**
From https://docs.colyseus.io/state/callbacks/custom:
- Implement custom callback strategy that exposes more metadata
- Intercept at decoder level before proxies obscure identity

### 3. Test Case Analysis

Create minimal reproduction:
```typescript
// Test what callbacks fire and in what order
state.array = new ArraySchema();  // Initial
state.array[0] = 1;               // Element add
state.array[0] = 2;               // Element change
state.array = new ArraySchema(3); // Replacement
```

Log ALL callback fires (onChange, onAdd, onRemove) with timestamps to understand the event sequence.

### 4. Alternative: Accept the Limitation

Consider documenting container replacement as unsupported in v4:
- Update CLAUDE.md with clear limitation statement
- Update failing tests to match current behavior (remove replacement expectations)
- Focus on ensuring element changes work correctly (which they do)

This is what the original library author may have intended based on CLAUDE.md:
> **Known Limitation in v4.0**: Collection field replacement events are not emitted.

## Current State of Code

**Working**:
- Schema field changes (primitives and nested Schema objects)
- Collection element additions, changes, removals
- Session-local tracking prevents test pollution
- No duplicate events for element changes

**Not Working**:
- Collection field replacement (ArraySchema/MapSchema assigned new instance)
- New container's callbacks not firing after replacement

**Latest code state**: About to be reverted. The session ended with `.listen()` checking `wiredNamespaces` via `checkWired()` helper, but this doesn't solve the problem because namespaces remain wired even after replacement attempts.

## References

- Colyseus v3 docs: https://docs.colyseus.io/state/callbacks/custom
- Source: `node_modules/@colyseus/schema/lib/decoder/strategy/StateCallbacks.js`
- Known limitation documented in `CLAUDE.md` lines 15-17
- Original test expectations from commit a6d49ee (2022) included both 'replace' and 'add' events for container replacement

## Next Steps for New Session

1. Read StateCallbacks.js implementation thoroughly
2. Create minimal test to log ALL callback sequences for replacement
3. Look for low-level hooks or metadata that expose replacement vs element change
4. If no solution found, consider accepting limitation and updating tests/docs accordingly
