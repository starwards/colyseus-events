# colyseus-events

generate notification events from colyseus state. forked from https://github.com/amir-arad/colyseus-mobx

## version support 

Due to breaking API changes in Colyseus, this version only supports Colyseus 0.14 and above (@colyseus/schema >= 1.0.2)

## Pending support

The schema types new to Colyseus 0.14 (`CollectionSchema` and `SetSchema`) are not yet supported. please open an issue if you would like to use them.

## Installation
`npm install colyseus-events --save`

## How to use
Import `wireEvents` and call it once when connecting to a room on the client side, 
```typescript
import { wireEvents } from 'colyseus-events';
const room: Room<GameState> = await client.joinOrCreate("game");
const events = wireEvents(room.state, new EventEmitter());
```
then you can wire listeners to `events` and start triggering them. 

whenever something changes in the state, an event will be emitted immediately. the name of the event will be the path of the changed property (or element). The event value will be the new value of that property or element. for convenience, the second value will be the event name. this can be helpful for listeners thatregister for more that one property.

examples:
when the server executes: `room.state.foo.bar = 15` event `'foo.bar'` will be emitted with values `15` and `'foo.bar'`.
when the server executes: `room.state.foo.bar.push(15)` event `'foo.bar[0]'` will be emitted with values `15` and `'foo.bar[0]'`.


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
