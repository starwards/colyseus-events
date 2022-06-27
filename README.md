# colyseus-events

Generate json-patch events from colyseus state.
```typescript
import { wireEvents } from 'colyseus-events';
const room: Room<GameState> = await client.joinOrCreate("game");
const events = wireEvents(room.state, new EventEmitter());
// `events` will emit json-patch events whenever the room state changes
```

## version support 

Due to breaking API changes in Colyseus, this version only supports Colyseus 0.14 and above (@colyseus/schema >= 1.0.2)

## Pending support

The schema types new to Colyseus 0.14 (`CollectionSchema` and `SetSchema`) are not yet supported. please open an issue if you would like to see them supported.

## Installation
`npm install colyseus-events --save`

## How to use
Import `wireEvents` and call it once when connecting to a room on the client side, 
```typescript
import { wireEvents } from 'colyseus-events';
const room: Room<GameState> = await client.joinOrCreate("game");
const events = wireEvents(room.state, new EventEmitter());
// `events` will emit json-patch events whenever the room state changes
```
then you can wire listeners to `events` using their [JSON-pointer](https://github.com/janl/node-jsonpointer) as event name.

## Examples

For example, given the room state:
```typescript
export class Inner extends Schema {
    @type('uint8') public baz = 0;
}
export class GameState extends Schema {
    @type('uint8') public foo = 0;
    @type(Inner) public bar = new Inner();
    @type(['uint8']) public numbersArray = new ArraySchema<number>();
    @type({ map: 'uint8' }) public mapNumbers = new MapSchema<number>();
}
```
### changing values
when changing a value in Schema or collection (ArraySchema or MapSchema), an event will be emitted. The name of the event will be the [JSON-pointer](https://github.com/janl/node-jsonpointer) describing the location of the property. The event value will be a ["replace" JSON Patch](https://jsonpatch.com/#replace) corresponding with the change.
For example:
 - when the server executes: `room.state.foo = 1` an event named `'/foo'` will be emitted with value `{ op: 'replace', path: '/foo', value: 1 }`
 - when the server executes: `room.numbersArray[0] = 1` (assuming numbersArray had a previous value at index 0) an event named `'/numbersArray/1'` will be emitted with value `{ op: 'replace', path: '/numbersArray/1', value: 1 }`
 - when the server executes: `room.mapNumbers.set('F00', 1)` (assuming mapNumbers had a previous value at key `F00`) an event named `'/mapNumbers/F00'` will be emitted with value `{ op: 'replace', path: '/mapNumbers/F00', value: 1 }`
 - when the server executes: `room.state.bar.baz = 1` an event named `'/bar/baz'` will be emitted with value `{ op: 'replace', path: '/bar/baz', value: 1 }`
 - when the server executes: `room.state.bar = new Inner()` an event named `'/bar'` will be emitted with value `{ op: 'replace', path: '/bar', value: {{the actual object in state.bar }} }`

...and so on.
### adding and removing elements in collections
when adding or removing elements in a collection (ArraySchema or MapSchema), an event will be also be emitted. The name of the event will be the [JSON-pointer](https://github.com/janl/node-jsonpointer) describing the location of the **container**. The event value will be a ["add"](https://jsonpatch.com/#add) or ["remove"](https://jsonpatch.com/#remove) JSON Patch corresponding with the change. the `path` in the event value will point to the location of the **element** that was added or removed.
For example:
 - when the server executes: `room.numbersArray.push(1)` an event named `'/numbersArray'` will be triggered with value `{ op: 'add', path: '/numbersArray/0', value: 1 }`
 - when the server executes: `room.numbersArray.pop()` an event named `'/numbersArray'` will be triggered with value `{ op: 'remove', path: '/numbersArray/0' }`
 - when the server executes: `room.mapNumbers.set('F00', 1)` an event named `'/mapNumbers'` will be triggered with value `{ op: 'add', path: '/mapNumbers/F00', value: 1 }`
 - when the server executes: `room.mapNumbers.delete('F00')` an event named `'/mapNumbers'` will be triggered with value `{ op: 'remove', path: '/mapNumbers/F00' }`

...and so on.

You are welcomed to explore the tests in the github repo for more examples.
## Contributor instructions

### Installing workspace

to install a development environment, you need to have node.js git installd.
Then, `git clone` this repo locally and run:
```
$ npm install
$ npm test
```
and that's it, you've just installed the development environment!

This project is written with [VSCode](https://code.visualstudio.com/) in mind. specifically configured for these extensions: [dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), [esbenp.prettier-vscode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

### test

`npm run test`

execute all tests.

### clean

`npm run clean`

Removes any built code and any built executables.

### build

`npm run build`

Cleans, then builds the library.

Your built code will be in the `./dist/` directory.
