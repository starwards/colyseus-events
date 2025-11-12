# Schema Definition – Colyseus

## Overview

Schema structures are defined on the server side and represent the state of your game within a room.

- Only fields decorated with `@type()` are going to be considered for synchronization.
- ⚠️ `Schema` structures should be used within the **state only**. Do not use `Schema` structures for messages, or other data that is not related to your state.

## Defining a Schema Structure

**TypeScript Example:**

```typescript
// MyState.ts
import { Schema, type } from "@colyseus/schema";

export class MyState extends Schema {
    @type("string") currentTurn: string;
}
```

**JavaScript Example (Recommended - Colyseus 0.16+):**

```javascript
// MyState.js
const schema = require('@colyseus/schema');

const MyState = schema.schema({
    currentTurn: "string"
});
```

**JavaScript (Legacy - Deprecated):**

```javascript
// MyState.js
const schema = require('@colyseus/schema');
const Schema = schema.Schema;

class MyState extends Schema {
}
schema.defineTypes(MyState, {
    currentTurn: "string"
});
```

🚫 The `defineTypes()` method will be removed in future versions of Colyseus. It is recommended to use the `schema.schema()` method instead.

## Using the State in Your Room

```typescript
// MyRoom.ts
import { Room } from "colyseus";
import { MyState } from "./MyState";

export class MyRoom extends Room<MyState> {
    state = new MyState()
}
```

### What is this `@type()` keyword?

The `@type()` you see heavily used on this page is an upcoming JavaScript feature that is yet to be formally established by TC39. `type` is actually just a function imported from `@colyseus/schema` module. By calling `type` with the `@` prefix at the property level means we're calling it as a _property decorator_. [See the decorators proposal here](https://github.com/tc39/proposal-decorators). 

Make sure your `tsconfig.json` includes `"experimentalDecorators": true`, and `"useDefineForClassFields": false` when using target `ES2022` or higher.

---

## Data Types

### Primitive Types

- `string`: utf8 string type
- `boolean`: `true` or `false`
- `number`: auto-detects the number type to use. (may use one extra byte when encoding)
- `int8`, `int16`, `int32`, `int64`: signed number types.
- `uint8`, `uint16`, `uint32`, `uint64`: unsigned number types.
- `float32`, `float64`: floating-point number types.
- `bigInt64`, `bigUint64`: unsigned / signed 64-bit bigint type.

#### Table of Types and Their Limitations

| Type | Description | Limitation |
|------|-------------|------------|
| `"string"` | length-prefixed utf8 strings | maximum byte size of `4294967295` |
| `"number"` | variable length encoding. Auto-detects the number type to use. (may use one extra byte) | `5e-324` to `5e+324` (float64 limits) |
| `"boolean"` | `true` or `false` | `0` or `1` |
| `"int64"` and `"uint64"` | JavaScript numbers are 64 bit floats and cannot represent full 64 bit integers safely | The minimum/maximum integer that can be safely represented by float64 is `-9007199254740991` to `9007199254740991` (53 bits of precision) |

#### Specialized Number Types

| Type | Description | Limitation |
|------|-------------|------------|
| `"int8"` | signed 8-bit integer | `-128` to `127` |
| `"uint8"` | unsigned 8-bit integer | `0` to `255` |
| `"int16"` | signed 16-bit integer | `-32768` to `32767` |
| `"uint16"` | unsigned 16-bit integer | `0` to `65535` |
| `"int32"` | signed 32-bit integer | `-2147483648` to `2147483647` |
| `"uint32"` | unsigned 32-bit integer | `0` to `4294967295` |
| `"int64"` | signed 64-bit integer (`number` type) | `-2^53-1 (-9007199254740991)` to `2^53-1 (9007199254740991)` (safely) |
| `"uint64"` | unsigned 64-bit integer (`number` type) | `0` to `2^53-1 (9007199254740991)` (safely) |
| `"float32"` | single-precision floating-point number | `-3.40282347e+38` to `3.40282347e+38` |
| `"float64"` | double-precision floating-point number | `-1.7976931348623157e+308` to `1.7976931348623157e+308` |
| `"bigInt64"` | signed 64-bit integer (`bigint` type) | `-2^63 (-9223372036854775808)` to `2^63-1 (9223372036854775807)` |
| `"bigUint64"` | unsigned 64-bit integer (`bigint` type) | `0` to `2^64-1 (18446744073709551615)` |

---

### Schema Type

A `Schema` type can define properties as primitives, other `Schema` types, or collections (e.g., arrays or maps) that may contain nested types.

**TypeScript Example:**

```typescript
// MyState.ts
import { Schema, type } from "@colyseus/schema";

class World extends Schema {
    @type("number") width: number;
    @type("number") height: number;
    @type("number") items: number = 10;
}

class MyState extends Schema {
    @type(World) world: World = new World();
}
```

**JavaScript Example:**

```javascript
// MyState.js
const schema = require('@colyseus/schema');

const World = schema.schema({
  width: "number",
  height: "number",
  items: "number"
});

const MyState = schema.schema({
  world: World
});
```

⚠️ A `Schema` type may hold up to **64 synchronizable properties**.

---

### Array (`ArraySchema`)

The `ArraySchema` is a synchronizeable version of the built-in JavaScript [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) type.

⚠️ You can't mix types inside `ArraySchema`.

**Example with Primitive Child Type (TypeScript):**

```typescript
// MyState.ts
import { Schema, ArraySchema, type } from "@colyseus/schema";

class MyState extends Schema {
    @type([ "string" ]) animals = new ArraySchema<string>();
}
```

**Example with Primitive Child Type (JavaScript):**

```javascript
// MyState.js
const schema = require('@colyseus/schema');

const MyState = schema.schema({
    animals: [ "string" ]
});
```

**Example with Schema Child Type (TypeScript):**

```typescript
// MyState.ts
import { Schema, ArraySchema, type } from "@colyseus/schema";

class Block extends Schema {
    @type("number") x: number;
    @type("number") y: number;
}

class MyState extends Schema {
    @type([ Block ]) blocks = new ArraySchema<Block>();
}
```

**Example with Schema Child Type (JavaScript):**

```javascript
// MyState.js
const schema = require('@colyseus/schema');

const Block = schema.schema({
    x: "number",
    y: "number"
});

const MyState = schema.schema({
    blocks: [ Block ]
});
```

#### ArraySchema Methods

**`array.push()`** - Adds one or more elements to the end of an array and returns the new length of the array.

```javascript
const animals = new ArraySchema<string>();
animals.push("pigs", "goats");
animals.push("sheeps");
animals.push("cows");
// output: 4
```

**`array.pop()`** - Removes the last element from an array and returns that element.

```javascript
animals.pop();
// output: "cows"

animals.length
// output: 3
```

**`array.shift()`** - Removes the first element from an array and returns that removed element.

```javascript
animals.shift();
// output: "pigs"

animals.length
// output: 2
```

**`array.unshift()`** - Adds one or more elements to the beginning of an array and returns the new length of the array.

```javascript
animals.unshift("pigeon");
// output: 3
```

**`array.indexOf()`** - Returns the first index at which a given element can be found in the array, or -1 if it is not present.

```javascript
const itemIndex = animals.indexOf("sheeps");
```

**`array.splice()`** - Changes the contents of an array by removing or replacing existing elements and/or adding new elements in place.

```javascript
// find the index of the item you'd like to remove
const itemIndex = animals.findIndex((animal) => animal === "sheeps");

// remove it!
animals.splice(itemIndex, 1);
```

**`array.shuffle()`** - Shuffles the array in place. This method returns the shuffled array.

```javascript
const animals = new ArraySchema<string>();
animals.push("pigs", "goats", "sheeps", "cows");
animals.shuffle();
// output: ["cows", "pigs", "sheeps", "goats"]
```

**`array.move(cb)`** - Allows you to move elements from one index to another without re-encoding them.

```javascript
state.cards.move((cards) => {
    // swap items at index 2 and 3
    [cards[3], cards[2]] = [cards[2], cards[3]];
})
```

**`array.forEach()`** - Iterates over each element of the array.

```javascript
this.state.array1 = new ArraySchema<string>('a', 'b', 'c');

this.state.array1.forEach(element => {
    console.log(element);
});
// output: "a"
// output: "b"
// output: "c"
```

**`array.clear()`** - Empties the array. The client-side will trigger the `onRemove` callback for each element.

More methods available - Have a look at the [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/).

---

### Map (`MapSchema`)

The `MapSchema` is a synchronizeable version of the built-in JavaScript [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) type.

Maps are recommended to track your game entities by id, such as players, enemies, etc.

⚠️ **Only string keys are supported** - Currently, the `MapSchema` only allows you to customize the value type. The key type is always `string`.

**TypeScript Example:**

```typescript
// MyState.ts
import { Schema, MapSchema, type } from "@colyseus/schema";

class Player extends Schema {
    @type("number") x: number;
    @type("number") y: number;
}

class MyState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
}
```

**JavaScript Example:**

```javascript
// MyState.js
const schema = require('@colyseus/schema');

const Player = schema.schema({
    x: "number",
    y: "number"
});

const MyState = schema.schema({
    players: { map: Player, default: new Map() }
});
```

#### MapSchema Methods

**`map.get()`** - Getting a map item by its key:

```javascript
const map = new MapSchema<string>();
const item = map.get("key");
```

**`map.set()`** - Setting a map item by key:

```javascript
const map = new MapSchema<string>();
map.set("key", "value");
```

**`map.delete()`** - Removes a map item by key:

```javascript
map.delete("key");
```

**`map.size`** - Return the number of elements in a `MapSchema` object.

```javascript
const map = new MapSchema<number>();
map.set("one", 1);
map.set("two", 2);

console.log(map.size);
// output: 2
```

**`map.forEach()`** - Iterates over each key/value pair of the map, in insertion order.

```javascript
this.state.players.forEach((value, key) => {
    console.log("key =>", key)
    console.log("value =>", value)
});
```

**`map.clear()`** - Empties the Map. (Client-side will trigger `onRemove` for each element.)

More methods available - Have a look at the [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/).

---

### Set (`SetSchema`)

⚠️ **`SetSchema` is only available for JavaScript SDK** - Haxe, C# and Lua SDKs are not implemented.

The `SetSchema` is a synchronizeable version of the built-in JavaScript [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) type.

The usage of `SetSchema` is very similar to `CollectionSchema`, the biggest difference is that Sets hold unique values. Sets do not have a way to access a value directly.

**TypeScript Example:**

```typescript
// MyState.ts
import { Schema, SetSchema, type } from "@colyseus/schema";

class Effect extends Schema {
    @type("number") radius: number;
}

class Player extends Schema {
    @type({ set: Effect }) effects = new SetSchema<Effect>();
}
```

**JavaScript Example:**

```javascript
// MyState.js
const schema = require('@colyseus/schema');

const Effect = schema.schema({
    radius: "number"
});

const Player = schema.schema({
    effects: { set: Effect }
});
```

#### SetSchema Methods

**`set.add()`** - Appends an item to the `SetSchema` object.

```javascript
const set = new SetSchema<number>();
set.add(1);
set.add(2);
set.add(3);
```

**`set.delete()`** - Delete an item by its value.

```javascript
set.delete("three");
```

**`set.has()`** - Returns a boolean value whether an item exists in the Set or not.

```javascript
if (set.has("two")) {
    console.log("Exists!");
} else {
    console.log("Does not exist!");
}
```

**`set.size`** - Return the number of elements in a `SetSchema` object.

```javascript
const set = new SetSchema<number>();
set.add(10);
set.add(20);
set.add(30);

console.log(set.size);
// output: 3
```

**`set.clear()`** - Empties the Set. (Client-side will trigger `onRemove` for each element.)

More methods available - Have a look at the [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/).

---

### CollectionSchema

⚠️ **`CollectionSchema` is only available for JavaScript SDK** - Haxe, C#, Lua and C++ clients are not implemented.

The `CollectionSchema` works similarly as the `ArraySchema`, with the caveat that you don't have control over its indexes.

**TypeScript Example:**

```typescript
// MyState.ts
import { Schema, CollectionSchema, type } from "@colyseus/schema";

class Item extends Schema {
    @type("number") damage: number;
}

class Player extends Schema {
    @type({ collection: Item }) items = new CollectionSchema<Item>();
}
```

**JavaScript Example:**

```javascript
// MyState.js
const schema = require('@colyseus/schema');

const Item = schema.schema({
    damage: "number"
});

const Player = schema.schema({
    items: { collection: Item }
});
```

#### CollectionSchema Methods

**`collection.add()`** - Appends an item to the `CollectionSchema` object.

```javascript
const collection = new CollectionSchema<number>();
collection.add(1);
collection.add(2);
collection.add(3);
```

**`collection.at()`** - Gets an item at the specified `index`.

```javascript
const collection = new CollectionSchema<string>();
collection.add("one");
collection.add("two");
collection.add("three");

collection.at(1);
// output: "two"
```

**`collection.delete()`** - Delete an item by its value.

```javascript
collection.delete("three");
```

**`collection.has()`** - Returns a boolean value whether an item exists in the Collection or not.

```javascript
if (collection.has("two")) {
    console.log("Exists!");
} else {
    console.log("Does not exist!");
}
```

**`collection.size`** - Return the number of elements in a `CollectionSchema` object.

```javascript
const collection = new CollectionSchema<number>();
collection.add(10);
collection.add(20);
collection.add(30);

console.log(collection.size);
// output: 3
```

**`collection.forEach()`** - Executes a provided function once per each index/value pair in the `CollectionSchema` object, in insertion order.

```javascript
collection.forEach((value, at) => {
    console.log("at =>", at)
    console.log("value =>", value)
});
```

**`collection.clear()`** - Empties the Collection. (Client-side will trigger `onRemove` for each element.)

---

## Versioning and Backwards/Forwards Compatibility

Backwards/forwards compatibility is possible by declaring new fields at the end of existing structures, and earlier declarations to not be removed, but be marked `@deprecated()` when needed.

**Live version 1:**

```typescript
// MyState.ts
import { Schema, type, deprecated } from "@colyseus/schema";

class MyState extends Schema {
    @type("string") myField: string;
}
```

**Live version 2:**

```typescript
// MyState.ts
import { Schema, type, deprecated } from "@colyseus/schema";

class MyState extends Schema {
    // Flag field as deprecated.
    @deprecated() @type("string") myField: string;

    // To allow your server to play nicely with multiple client-side versions.
    @type("string") newField: string;
}
```

**Live version 3:**

```typescript
// MyState.ts
import { Schema, type, deprecated } from "@colyseus/schema";

class MyState extends Schema {
    // Flag field as deprecated.
    @deprecated() @type("string") myField: string;

    // Flag field as deprecated again.
    @deprecated() @type("string") newField: string;

    // New fields always at the end of the structure
    @type("string") anotherNewField: string;
}
```

This is particularly useful for native-compiled targets, such as C#, C++, Haxe, etc - where the client-side can potentially not have the most up-to-date version of the schema definitions.

---

## Inheritance Support

The collection types (`ArraySchema`, `MapSchema`, etc) must hold items of the same type. They support inherited types from the same base instance. These inherited types may define their own serialized fields.

**TypeScript Example:**

```typescript
// MyState.ts
import { Schema, type } from "@colyseus/schema";

class Item extends Schema {/* base Item fields */}
class Weapon extends Item {/* specialized Weapon fields */}
class Shield extends Item {/* specialized Shield fields */}

class Inventory extends Schema {
    @type({ map: Item }) items = new MapSchema<Item>();
}

const inventory = new Inventory();
inventory.items.set("left", new Weapon());
inventory.items.set("right", new Shield());
```

**JavaScript Example:**

```javascript
// MyState.js
const schema = require('@colyseus/schema');

const Item = schema.schema({/* base Item fields */});
const Weapon = Item.extend({/* specialized Weapon fields */});
const Shield = Item.extend({/* specialized Shield fields */});

const Inventory = schema.schema({
    items: { map: Item }
});

const inventory = new Inventory();
inventory.items.set("left", new Weapon());
inventory.items.set("right", new Shield());
```

---

*Source: https://docs.colyseus.io/state/schema*
*Last updated on April 9, 2025*
