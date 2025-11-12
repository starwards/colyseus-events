# Advanced: Implement Your Own Callback System – Colyseus

## Overview

The `@colyseus/schema` version `3.0` introduced a way to bring your own callback system during decoding.

The standard way of attaching callbacks uses the same "flavor" as Colyseus is used to from previous versions. However, you can bring your own callback system by overriding the `Decoder`'s `triggerChanges` method.

## Example: Custom Callback System

This is an example of how you can bring your own callback system:

```typescript
// client.ts
import { Room } from "colyseus.js";
import { DataChange } from "@colyseus/schema";

function getRawChangesCallback(room: Room, callback: (changes: DataChange[]) => void) {
    room['serializer']['decoder'].triggerChanges = callback;

    // .refs => contains a map of all Schema instances
    room['serializer']['decoder'].root.refs

    // .refIds => contains a map of all refIds by Schema instances
    room['serializer']['decoder'].root.refIds

    // .refCounts => contains a map of all reference counts by refId
    room['serializer']['decoder'].root.refCounts
}

const room = await client.joinOrCreate("my_room");
getRawChangesCallback(room, (changes) => {
    console.log("raw list of changes", changes);
});
```

On the above example, the raw list of changes is being printed to the console.

## SDK-Specific Implementations

Each SDK has its own way of handling the callback system:

- **JavaScript SDK**: [StateCallbacks.ts](https://github.com/colyseus/schema/blob/3.0/src/decoder/strategy/StateCallbacks.ts)
- **Unity SDK**: [Callbacks.cs](https://github.com/colyseus/colyseus-unity-sdk/blob/0.16/Assets/Colyseus/Runtime/Colyseus/Serializer/Schema/Callbacks/Callbacks.cs)
- **Defold SDK**: [callbacks.lua](https://github.com/colyseus/colyseus-defold/blob/0.16/colyseus/serializer/schema/callbacks.lua)
- **Haxe SDK**: [Callbacks.hx](https://github.com/colyseus/colyseus-haxe/blob/0.16/src/io/colyseus/serializer/schema/Callbacks.hx)

---

*Source: https://docs.colyseus.io/state/callbacks/custom*
*Last updated on March 18, 2025*
