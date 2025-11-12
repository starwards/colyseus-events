# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

colyseus-events is a TypeScript library that generates JSON-patch notification events from Colyseus state changes. It monitors Colyseus Schema objects (Schema, ArraySchema, MapSchema) and emits JSON-patch formatted events whenever state changes occur, using JSON-pointer paths as event names.

**Version**: 4.0+ (requires @colyseus/schema 3.x and colyseus.js 0.15+ as peer dependency)

**Known Limitation in v4.0**: Collection field replacement events are not emitted. When a collection field (ArraySchema/MapSchema) is completely replaced with a new instance (e.g., `state.array = new ArraySchema()`), no "replace" event is emitted on the field path. Element changes within the collection ARE properly detected via onAdd/onChange/onRemove callbacks. This limitation exists because v3's `.listen()` callback fires for both field replacement AND element changes, making them indistinguishable.

## Commands

### Development workflow
```bash
npm install          # Install dependencies
npm test             # Run type check, lint, and all tests
npm run typecheck    # Type check without emitting
npm run lint         # Run ESLint
npm run build        # Clean and build to dist/
npm run clean        # Remove dist/ directory
npm run prettify     # Format code with Prettier
```

### Testing
Tests use the `tape` test framework and run via `ts-node`:
```bash
npm test                                           # Run all tests
ts-node node_modules/tape/bin/tape "src/**/*.test.ts?(x)" | tap-color | tap-set-exit
```

Test files are colocated with source files (e.g., `shallow-schema.test.ts` alongside `wire-events.ts`).

## Architecture

### Core Concepts

**Visitor Pattern**: The architecture is built around the visitor pattern. Each Colyseus type (Schema, ArraySchema, MapSchema) has a corresponding visitor that knows how to wire events for that type.

**v3 Callback System**: Accepts a callback proxy parameter obtained via `getStateCallbacks(room)` from colyseus.js (user-provided). This proxy is passed through the visitor chain to register listeners.

**JSON-Patch Events**: All state changes emit JSON-patch events with three operation types:
- `{ op: 'replace', path: '/foo/bar', value: ... }` - value changed
- `{ op: 'add', path: '/foo/bar', value: ... }` - element added to collection
- `{ op: 'remove', path: '/foo/bar' }` - element removed from collection

**Event Paths**: Event names are JSON-pointers. For nested state `state.bar.x`, changes emit on `/bar/x`. For collection changes, events emit on the container path (e.g., `/arrayField` for array changes).

**API Change in v4**: The `wireEvents` function now accepts room.state and a callback proxy parameter instead of the Room object:
```typescript
// v3.x (old)
wireEvents(room.state, eventEmitter)

// v4.0+ (new)
import { getStateCallbacks } from 'colyseus.js';
wireEvents(room.state, getStateCallbacks(room), eventEmitter)
```

### Key Files and Their Roles

**src/wire-events.ts** - Main entry point
- Exports `wireEvents(state, callbackProxy, events)` - the primary API function (v4: accepts state and callback proxy parameters)
- Exports `customWireEvents()` - for creating custom visitor configurations
- No longer has runtime dependency on colyseus.js (callback proxy is user-provided)
- Implements the recursive traversal that walks state tree
- Uses `SymbolWeakSet` to track already-wired objects and prevent duplicate event registration

**src/core-visitors.ts** - Built-in type handlers
- `handleSchema` - Wires events for Schema objects using `$(schema).listen(field, callback)` via callback proxy
- `handleArraySchema` - Handles ArraySchema with `$(array).onAdd/onChange/onRemove` callbacks
- `handleMapSchema` - Handles MapSchema with `$(map).onAdd/onChange/onRemove` callbacks
- Each visitor receives the callback proxy as a parameter and uses it to register listeners
- Visitors return `true` if they handle an object, stopping the visitor chain

**src/types.ts** - Core type definitions
- Defines `Visitor` interface with `visit()` method
- Defines `Traverse` function type for recursive traversal
- Defines event types: `Add`, `Remove`, `Replace`
- Defines `Events` interface (requires `emit()` method)

**src/internals-extract.ts** - Colyseus internals access
- `getFieldsList()` - Extracts field names from Schema using `Symbol.metadata` (v3 API)
- Uses `@ts-ignore` to access internal metadata structure on constructor
- Returns list of non-deprecated field names for a Schema instance

**src/de-dupe-wrapper.ts** - Event deduplication
- `DeDupeEmitter` - Wraps user's event emitter to prevent duplicate events
- Caches last 100 events and compares before emitting
- Prevents redundant events when Colyseus fires multiple callbacks for same change

**src/weak-set.ts** - Tracking visited objects
- `SymbolWeakSet` - WeakSet implementation that works with Colyseus proxies
- Used to prevent re-wiring the same state object multiple times

### Visitor Chain and Extensibility

The visitor chain processes each state object in order until one returns `true`:
1. Custom visitors (if using `customWireEvents()`)
2. `handleSchema`
3. `handleArraySchema`
4. `handleMapSchema`

**Important**: Order matters. More specific visitors must come before generic ones. Users can insert custom visitors before `coreVisitors` to override default behavior for specific types.

### Colyseus v3 Integration Points

**Callback registration via proxy**: Each visitor uses the user-provided callback proxy (obtained via `getStateCallbacks(room)` from colyseus.js):
- Schema: `$(schema).listen(field, callback)` for each field
- ArraySchema/MapSchema: `$(collection).onAdd/onChange/onRemove(callback)`
- The proxy handles all internal decoder wiring automatically

**First-event filtering**: ArraySchema and MapSchema fire `onChange` for initial values. Use `knownKeys` Set to filter these out and only emit for actual changes.

**No manual cleanup needed**: Unlike v2, v3's callback system handles cleanup automatically through the decoder lifecycle.

## TypeScript Configuration

- Target: ES2015, CommonJS modules
- Strict mode enabled with all checks
- Uses experimental decorators (for Colyseus @type decorators)
- Output includes declarations (.d.ts) and source maps

## Pending Features

CollectionSchema and SetSchema (new in Colyseus 0.14) are not yet supported - see TODO in core-visitors.ts:106
