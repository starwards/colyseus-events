# Client-side Callbacks – Colyseus

## Client-side Schema Callbacks

When applying state changes coming from the server, the client-side is going to trigger callbacks on local instances according to the changes being applied.

In order to register callbacks to Schema instances, you must access the instances through a "callbacks handler".

## Overview

### Get the callback handler

**TypeScript Example:**

```typescript
// client.ts
import { Client, getStateCallbacks } from "colyseus.js";

// initialize SDK
const client = new Client("ws://localhost:2567");

// join room
const room = await client.joinOrCreate("my_room");

// get state callbacks handler
const $ = getStateCallbacks(room);
```

**Unity (C#) Example:**

```csharp
// client.cs
using Colyseus;

// initialize SDK
var client = new Client("ws://localhost:2567");

// join room
var room = await client.JoinOrCreate<MyRoomState>("my_room");

// get state callbacks handler
var callbacks = Colyseus.Schema.Callbacks.Get(room);
```

**Defold (Lua) Example:**

```lua
-- client.lua
local ColyseusSDK = require("colyseus.sdk")

-- initialize SDK
local client = ColyseusSDK.Client("ws://localhost:2567")

-- join room
client:join_or_create("my_room", function(room)

    -- get state callbacks handler
    local callbacks = ColyseusSDK.callbacks(room)
end)
```

**Haxe Example:**

```haxe
// client.hx
import colyseus.Client;
import io.colyseus.serializer.schema.Callbacks;

// initialize SDK
var client = new Colyseus.Client("ws://localhost:2567");

// join room
client.joinOrCreate("my_room", [], MyRoomState, function(err, room) {

    // get state callbacks handler
    var callbacks = Callbacks.get(room);
});
```

### Register the callbacks

**TypeScript Example:**

```typescript
// client.ts
$(room.state).listen("currentTurn", (currentValue, previousValue) => {
    // ...
});

// when an entity was added (ArraySchema or MapSchema)
$(room.state).entities.onAdd((entity, sessionId) => {
    // ...
    console.log("entity added", entity);

    $(entity).listen("hp", (currentHp, previousHp) => {
        console.log("entity", sessionId, "changed hp to", currentHp);
    })
});

// when an entity was removed (ArraySchema or MapSchema)
$(room.state).entities.onRemove((entity, sessionId) => {
    // ...
    console.log("entity removed", entity);
});
```

**Unity (C#) Example:**

```csharp
// client.cs
callbacks.Listen(state => state.currentTurn, (currentValue, previousValue) => {
    // ...
});

// when an entity was added (ArraySchema or MapSchema)
callbacks.OnAdd(state => state.entities, (sessionId, entity) => {
    // ...
    Debug.Log($"entity added, {entity}");

    callbacks.Listen(entity, entity => entity.hp, (currentHp, previousHp) => {
        Debug.Log($"entity {sessionId} changed hp to {currentHp}");
    });
});

// when an entity was removed (ArraySchema or MapSchema)
callbacks.OnRemove(state => state.entities, (sessionId, entity) => {
    // ...
    Debug.Log($"entity removed {entity}");
});
```

**Defold (Lua) Example:**

```lua
-- client.lua
callbacks:listen("currentTurn", function (currentValue, previousValue)
    -- ...
end)

-- when an entity was added (ArraySchema or MapSchema)
callbacks:on_add("entities", function (entity, sessionId)
    -- ...
    print("entity added", entity)

    callbacks:listen(entity, "hp", function (currentHp, previousHp)
        print("entity", sessionId, "changed hp to", currentHp)
    end)
end)

-- when an entity was removed (ArraySchema or MapSchema)
callbacks:on_remove("entities", function (entity, sessionId)
    -- ...
    print("entity removed")
    pprint(entity)
end)
```

**Haxe Example:**

```haxe
// client.hx
callbacks.listen("currentTurn", function (currentValue, previousValue) {
    // ...
});

// when an entity was added (ArraySchema or MapSchema)
callbacks.onAdd("entities", function (entity, sessionId) {
    // ...
    trace("entity added", entity);

    callbacks.listen(entity, "hp", function (currentHp, previousHp) {
        trace("entity", sessionId, "changed hp to", currentHp);
    });
});

// when an entity was removed (ArraySchema or MapSchema)
callbacks.onRemove("entities", function (entity, sessionId) {
    // ...
    trace("entity removed", entity);
});
```

⚠️ **C#, C++, Haxe** - When using statically typed languages, you need to generate the client-side schema files based on your TypeScript schema definitions. [See generating schema on the client-side](#client-side-schema-generation).

---

## How to use

### On Schema Instances

#### Listen

Listens for a single property change within a `Schema` instance.

**TypeScript Example:**

```typescript
// client.ts
$(room.state).listen("currentTurn", (currentValue, previousValue) => {
    console.log(`currentTurn is now ${currentValue}`);
    console.log(`previous value was: ${previousValue}`);
});
```

**Unity (C#) Example:**

```csharp
// client.cs
callbacks.Listen(state => state.currentTurn, (currentValue, previousValue) => {
    Debug.Log($"currentTurn is now {currentValue}");
    Debug.Log($"previous value was: {previousValue}");
});
```

**Defold (Lua) Example:**

```lua
-- client.lua
callbacks:listen("currentTurn", function (currentValue, previousValue)
    print("currentTurn is now " .. currentValue)
    print("previous value was: " .. previousValue)
end)
```

**Haxe Example:**

```haxe
// client.hx
callbacks.listen("currentTurn", function (currentValue, previousValue) {
    trace("currentTurn is now " + currentValue);
    trace("previous value was: " + previousValue);
});
```

**Removing the callback:** The `.listen()` method returns a function that, when called, removes the attached callback:

**TypeScript:**

```typescript
// client.ts
const unbindCallback = $(room.state).listen("currentTurn", (currentValue, previousValue) => {
    // ...
});

// stop listening for `"currentTurn"` changes.
unbindCallback();
```

**Unity (C#):**

```csharp
// client.cs
var unbindCallback = callbacks.Listen(state => state.currentTurn, (currentValue, previousValue) => {
    // ...
});

// stop listening for `"currentTurn"` changes.
unbindCallback();
```

**Defold (Lua):**

```lua
-- client.lua
local unbind_callback = callbacks:listen("currentTurn", function (currentValue, previousValue)
    -- ...
end)

-- stop listening for `"currentTurn"` changes.
unbind_callback()
```

**Haxe:**

```haxe
// client.hx
var unbindCallbacks = callbacks.listen("currentTurn", function (currentValue, previousValue) {
    // ...
});

// stop listening for `"currentTurn"` changes.
unbindCallback();
```

---

#### Bind To

Bind properties directly to `targetObject`, whenever the client receives an update from the server.

**Parameters:**

- `targetObject`: the object that will receive updates
- `properties`: (optional) list of properties that will be assigned to `targetObject`. By default, every `@type()`'d property will be used.

**TypeScript Example:**

```typescript
// client.ts
$(room.state).players.onAdd((player, sessionId) => {
    const playerVisual = PIXI.Sprite.from('player');
    $(player).bindTo(playerVisual);
});
```

**Unity (C#) Example:**

```csharp
// client.cs
callbacks.OnAdd(state => state.players, (sessionId, player) => {
    var playerVisual = new PlayerVisual();
    callbacks.BindTo(player, playerVisual);
});
```

**Note:** `bindTo()` is not implemented in Lua and Haxe SDKs yet - contributions are welcome!

---

#### On Change

The On Change callback is invoked whenever a direct property of a `Schema` instance is modified.

- **Triggers only for direct property changes:** It does not cascade or propagate changes from nested properties within the Schema.
- The callback fires after the changes have been applied to the Schema instance. This means you're dealing with the updated instance when the callback executes.

**TypeScript Example:**

```typescript
// client.ts
$(room.state).entities.onAdd((entity, sessionId) => {
    // ...
    $(entity).onChange(() => {
        // some property changed inside `entity`
    })
});
```

**Unity (C#) Example:**

```csharp
// client.cs
callbacks.OnAdd(state => state.entities, (sessionId, entity) => {
    // ...
    callbacks.OnChange(entity, () => {
        // some property changed inside `entity`
    });
});
```

**Defold (Lua) Example:**

```lua
-- client.lua
callbacks:on_add("entities", function (entity, sessionId)
    -- ...
    callbacks:on_change(entity, function ()
        -- some property changed inside `entity`
    end)
end)
```

**Haxe Example:**

```haxe
// client.hx
callbacks.onAdd("entities", function(entity, sessionId) {
    // ...
    callbacks.onChange(entity, function() {
        // some property changed inside `entity`
    });
});
```

---

### On Maps or Arrays

#### On Add

Register the `onAdd` callback is called whenever a new instance is added to a collection.

By default, the callback is called immediately for existing items in the collection.

**TypeScript Example:**

```typescript
// client.ts
$(room.state).players.onAdd((player, sessionId) => {
    console.log(player, "has been added at", sessionId);

    // add your player entity to the game world!

    // detecting changes on object properties
    $(player).listen("field_name", (value, previousValue) => {
        console.log(value);
        console.log(previousValue);
    });
});
```

**Unity (C#) Example:**

```csharp
// client.cs
callbacks.OnAdd(state => state.players, (string sessionId, Player player) => {
    Debug.Log("player has been added at " + sessionId);

    // add your player entity to the game world!

    // detecting changes on object properties
    callbacks.Listen(player, player => player.field_name, (value, previousValue) => {
        Debug.Log(value);
        Debug.Log(previousValue);
    });
});
```

**Defold (Lua) Example:**

```lua
-- client.lua
callbacks:on_add("players", function (player, sessionId)
    print("player has been added at " .. sessionId);

    -- add your player entity to the game world!

    -- detecting changes on object properties
    callbacks:listen(player, "field_name", function(value, previous_value)
        print(value)
        print(previousValue)
    end)
end)
```

**Haxe Example:**

```haxe
// client.hx
callbacks.onAdd("players", (player, sessionId) => {
    trace("player has been added at " + sessionId);

    // add your player entity to the game world!

    // detecting changes on object properties
    callbacks.listen(player, "field_name", (value, previousValue) => {
        trace(value);
        trace(previousValue);
    });
});
```

---

#### On Remove

The `onRemove` callback is called with the removed item and its key on holder object as argument.

**TypeScript Example:**

```typescript
// client.ts
$(room.state).players.onRemove((player, sessionId) => {
    console.log(player, "has been removed at", sessionId);

    // remove your player entity from the game world!
});
```

**Unity (C#) Example:**

```csharp
// client.cs
callbacks.OnRemove(state => state.players, (string sessionId, Player player) => {
    Debug.Log("player has been removed at " + sessionId);

    // remove your player entity from the game world!
});
```

**Defold (Lua) Example:**

```lua
-- client.lua
callbacks:on_remove("players", function (player, sessionId)
    print("player has been removed at " .. sessionId)

    -- remove your player entity from the game world!
end)
```

**Haxe Example:**

```haxe
// client.hx
callbacks.onRemove("players", (player, sessionId) => {
    trace("player has been removed at " + sessionId);

    // remove your player entity from the game world!
});
```

---

## Client-side Schema Generation

⚠️ **Not required when using JavaScript SDK or Defold SDK** - The following section is only required when using statically typed languages in your front-end, such as C#, Haxe, etc.

The `schema-codegen` is a command-line tool designed to convert your server-side schema definitions into compatible client-side schemas.

To decode the state on the client side, its local schema definitions must be compatible with those on the server.

### Usage

To see the usage, From your terminal, `cd` into your server's directory and run the following command:

```bash
npx schema-codegen --help
```

**Output:**

```
schema-codegen [path/to/Schema.ts]

Usage (C#/Unity)
    schema-codegen src/Schema.ts --output client-side/ --csharp --namespace MyGame.Schema

Valid options:
    --output: fhe output directory for generated client-side schema files
    --csharp: generate for C#/Unity
    --cpp: generate for C++
    --haxe: generate for Haxe
    --ts: generate for TypeScript
    --js: generate for JavaScript
    --java: generate for Java

Optional:
    --namespace: generate namespace on output code
```

### Example: Unity / C#

Below is a real example to generate the C# schema files from the demo Unity project.

```bash
npx schema-codegen src/rooms/schema/* --csharp --output ../Assets/Scripts/States/"
generated: Player.cs
generated: State.cs
```

**Using `npm` scripts:**

For short, it is recommended to have your `schema-codegen` arguments configured under a `npm` script in your `package.json`:

```json
// package.json
"scripts": {
    "schema-codegen": "schema-codegen src/rooms/schema/* --csharp --output ../Assets/Scripts/States/"
}
```

This way you can run `npm run schema-codegen` rather than the full command:

```bash
npm run schema-codegen
generated: Player.cs
generated: State.cs
```

---

*Source: https://docs.colyseus.io/state/callbacks*
*Last updated on May 31, 2025*
