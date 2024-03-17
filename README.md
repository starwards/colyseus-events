# colyseus-events

Generate json-patch events from [colyseus](https://www.colyseus.io/) state.
```typescript
import { wireEvents } from 'colyseus-events';
const room: Room<GameState> = await client.joinOrCreate("game");
const { events } = wireEvents(room.state, new EventEmitter());
// `events` will emit json-patch events whenever the room state changes
```

## version support 

Due to breaking API changes in Colyseus, this version only supports Colyseus 0.15 and above (@colyseus/schema 2.x)

## Pending support

The schema types new to Colyseus 0.14 (`CollectionSchema` and `SetSchema`) are not yet supported. please open an issue if you would like to see them supported.

## Installation
`npm install colyseus-events --save`

## How to use
### wireEvents
Import `wireEvents` and call it once when connecting to a room on the client side: 
```typescript
import { wireEvents } from 'colyseus-events';
const room: Room<GameState> = await client.joinOrCreate("game");
const { events } = wireEvents(room.state, new EventEmitter());
// `events` will emit json-patch events whenever the room state changes
```
then you can wire listeners to `events` using the [JSON-pointer](https://github.com/janl/node-jsonpointer) of target field as event name.

### customWireEvents
To change the behavior for parts or all of your state, use `customWireEvents` to produce your own version of `wireEvents`:
```typescript
import { customWireEvents, coreVisitors} from 'colyseus-events';
const special = {
    visit: (traverse: Traverse, state: Container, events: Events, jsonPath: string): boolean => { /* see Visitor implementation below*/},
};
const wireEvents = customWireEvents([ special, ...coreVisitors]);
const room: Room<GameState> = await client.joinOrCreate("game");
const { events } = wireEvents(room.state, new EventEmitter());
// `events` will emit json-patch events whenever the room state changes
```
`customWireEvents` accepts a single argument, a collection of `Visitor` objects, and returns afunctyion compatible with the default `wireEvents`. In fact, the default `wireEvents` function is itself the result `customWireEvents` when using `coreVisitors` as the argument. it is defined in [wire-events.ts](src/wire-events.ts#L42) by the following line:
```typescript
export const wireEvents = customWireEvents(coreVisitors);
```
The order of the visitors is crucial: they are executed as a fallback chain: the first visitor to return `true` will stop the chain and prevent later visitors from wiring the same state. So be sure to order them by specificity: the more specific handlers should first check for their use case before the generic visitors, and `coreVisitors` should be the last visitors.
#### Visitor implementation
A visitor must implement a single method, `visit`. This method should:
1. Check if it is going to handle the state object, and return `false` if not.
2. Call the traverse function for each child member of the state.
3. Hook on the state's [Client-side Callbacks](https://docs.colyseus.io/state/schema-callbacks/#state-sync-client-side-callbacks). Make sure to only hook once per state object. This may become trickey with Proxies, and 'stickey' callbacks.
4. For every new value in each child member of the state, call the traverse function and emit the events using the event emitter.
Examples can be found in [core-visitors.ts](src/core-visitors.ts). Here is a brief of the visitor that handles `MapSchema`:
```typescript
{
    
    visit: (traverse: Traverse, state: Container, events: Events, namespace: string) => {
            // Check if it is going to handle the state object, and return `false` if not.
            if (!(state instanceof MapSchema)) {
                return false;
            }
            // Hook on new elements
            state.onAdd = (value: Colyseus, field) => {
                const fieldNamespace = `${namespace}/${field}`; // path to the new element
                events.emit(namespace, Add(fieldNamespace, value)); // emit the add event
                traverse(value, events, fieldNamespace); // call the traverse function on the new value
            };
            
            ...

            // finally return true. this will break the visitors fallback chain and complete the wiring for this object.
            return true;
        }
}
```
In addition to the code above, there ais also code to handle duplicate events and keeping only one registration per state object.
## Examples

For example, given the room state:
```typescript
export class Inner extends Schema {
    @type('uint8') public x = 0;
    @type('uint8') public y = 0;
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
 - when the server executes: `room.state.bar.x = 1` an event named `'/bar/x'` will be emitted with value `{ op: 'replace', path: '/bar/x', value: 1 }`
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
