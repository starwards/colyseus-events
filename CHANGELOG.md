# Changelog

## Unreleased (proposed 4.2.0)

### Added
- Support for `@colyseus/schema` 5.x and `@colyseus/sdk` 0.18 (Colyseus 0.18), alongside schema 3.x / `colyseus.js` 0.16. Same code path; a small adapter (`src/spoon/schema-compat.ts`) resolves refIds either from `decoder.root.refIds` (schema 3) or from the `$refId` instance symbol (schema 4+, where `refIds` was removed).
- `ManagedCallbackProxy` type is exported, so custom visitors can type their `callbackProxy` parameter.

### Changed
- Replacing an existing collection entry (`array[i] = x`, `map.set(existingKey, x)`) now emits a single `replace` event on the entry path, as documented. Previously, real servers (which `discardChanges()` after every patch) send this as a `DELETE_AND_ADD` operation and colyseus-events emitted `remove` + `add` on the collection path. This affects schema 3 users too.
- `peerDependencies`: `@colyseus/schema` `^3.0.0 || ^5.0.0`; removed the `colyseus.js` peer (never imported at runtime).

### Known differences between schema versions
- Reconnect: `@colyseus/sdk` 0.18 applies a rejoin's full state with `decodeResync()`, so entries deleted while offline emit `remove`. With `colyseus.js` 0.16 those entries stay in the client state and no event is emitted.
- On schema 5, when a Schema field is replaced with a new instance, the new instance's field changes are decoded after the parent's `replace`, so an `onChange` registered by a custom visitor while handling the replacement fires in the same patch.
- Not supported: `StreamSchema` (schema 5).

### Tests
- Test suite runs against both schema 3 (`npm run test:schema3`) and schema 5 + `@colyseus/sdk` (`npm run test:schema5`, via a module-resolution hook); `npm test` runs both.
- The test fixture now calls `encoder.discardChanges()` after every patch, like the Colyseus server.
- New tests decode through the real client `SchemaSerializer`, including a full-state reconnect.
- 5 Collection/Set "add Schema element" tests are skipped on schema 3: @colyseus/schema 3.0.76 fails to decode them (`"refId" not found`) once changes are discarded between patches. This is an upstream bug.
