# Colyseus State Synchronization Reference Documentation

This directory contains comprehensive reference documentation for Colyseus state synchronization and the `@colyseus/schema` library.

## Quick Reference Guide

**Looking for something specific? Use this guide to find answers fast:**

### Common Questions → Documentation Mapping

| Question | Document to Read |
|----------|------------------|
| How do I define schema structures? | [colyseus-schema-definition.md](./colyseus-schema-definition.md) |
| What data types are available? | [colyseus-schema-definition.md](./colyseus-schema-definition.md#data-types) |
| How do I use ArraySchema/MapSchema? | [colyseus-schema-definition.md](./colyseus-schema-definition.md#array-arrayschema) |
| How do I listen to state changes on the client? | [colyseus-callbacks.md](./colyseus-callbacks.md) |
| How do I use getStateCallbacks()? | [colyseus-callbacks.md](./colyseus-callbacks.md#overview) |
| How do I filter state per client? | [colyseus-state-view.md](./colyseus-state-view.md) |
| What are StateView and @view()? | [colyseus-state-view.md](./colyseus-state-view.md) |
| How do I implement custom callbacks? | [colyseus-callbacks-custom.md](./colyseus-callbacks-custom.md) |
| How do I create custom types? | [colyseus-advanced-usage.md](./colyseus-advanced-usage.md#custom-types-and-encoding) |
| What are the Schema limitations? | [colyseus-best-practices.md](./colyseus-best-practices.md) |
| How do I handle inherited types? | [colyseus-schema-definition.md](./colyseus-schema-definition.md#inheritance-support) |
| How does state synchronization work internally? | [colyseus-schema-docs.md](./colyseus-schema-docs.md#how-does-it-work-internally) |

---

## Document Overview

### 1. [colyseus-schema-docs.md](./colyseus-schema-docs.md)
**Main Overview Document**

High-level introduction to Colyseus state synchronization.

**Key Topics:**
- Overview of schema-based state synchronization
- Server-side state definition patterns
- Client-side state reception and mutation requests
- How state changes work internally (handshake, refId, ChangeTree)
- Basic client-side callback examples

**Best for:** Understanding the big picture and core concepts.

---

### 2. [colyseus-schema-definition.md](./colyseus-schema-definition.md)
**Schema Definition Reference**

Complete guide to defining state structures on the server.

**Key Topics:**
- Defining Schema structures (TypeScript & JavaScript)
- **Primitive types:** string, number, boolean, int8-64, uint8-64, float32/64, bigInt
- **Complex types:** Schema, ArraySchema, MapSchema, SetSchema, CollectionSchema
- Type limitations and ranges
- Collection methods (push, pop, forEach, etc.)
- Versioning with @deprecated()
- Inheritance support

**Best for:** Defining your server-side state structures.

---

### 3. [colyseus-callbacks.md](./colyseus-callbacks.md)
**Client-side Callbacks Guide**

Complete guide to listening for state changes on the client.

**Key Topics:**
- Getting callback handler with `getStateCallbacks(room)`
- **Schema instance callbacks:** `.listen()`, `.bindTo()`, `.onChange()`
- **Collection callbacks:** `.onAdd()`, `.onRemove()`
- Multi-language examples (TypeScript, C#, Lua, Haxe)
- Client-side schema generation with `schema-codegen`
- Removing callbacks

**Best for:** Implementing client-side state change listeners.

---

### 4. [colyseus-state-view.md](./colyseus-state-view.md)
**Per-client State Visibility**

Guide to filtering which state is visible to each client.

**Key Topics:**
- StateView initialization
- `@view()` decorator for field-level filtering
- Adding/removing instances from StateView
- Specialized tags with `@view(tag: number)`
- Visibility tables
- Filtering ArraySchema/MapSchema items

**Best for:** Implementing private fields, fog of war, or team-based visibility.

---

### 5. [colyseus-callbacks-custom.md](./colyseus-callbacks-custom.md)
**Custom Callback Systems**

Advanced guide for implementing your own callback system.

**Key Topics:**
- Overriding `Decoder.triggerChanges`
- Accessing raw DataChange arrays
- Decoder internals (.refs, .refIds, .refCounts)
- SDK-specific implementations

**Best for:** Building custom state change handlers or debugging.

---

### 6. [colyseus-advanced-usage.md](./colyseus-advanced-usage.md)
**Advanced Schema Features**

Experimental APIs for low-level customization.

**Key Topics:**
- **Custom types:** defineCustomTypes() with custom encode/decode
- **Variable-length encoding:** varInt, varUint, varFloat32/64
- **Change tracking:** Customizing $track
- **Byte-level encoding:** Customizing $encoder
- **Byte-level decoding:** Customizing $decoder
- **Third-party structures:** Encoding non-Schema types

**Best for:** Performance optimization, custom encodings, or third-party integrations.

---

### 7. [colyseus-best-practices.md](./colyseus-best-practices.md)
**Limitations & Best Practices**

Critical constraints and recommendations.

**Key Topics:**
- 64 field limit per Schema
- NaN/Infinity encoding behavior
- null string encoding
- Multi-dimensional array workarounds
- Field order requirements

**Best for:** Avoiding common pitfalls.

---

## Topic-Based Navigation

### Working with Collections

**ArraySchema:**
- Definition: [colyseus-schema-definition.md#array-arrayschema](./colyseus-schema-definition.md#array-arrayschema)
- Methods: push, pop, shift, unshift, splice, shuffle, move, forEach, clear
- Callbacks: [colyseus-callbacks.md#on-add](./colyseus-callbacks.md#on-add)

**MapSchema:**
- Definition: [colyseus-schema-definition.md#map-mapschema](./colyseus-schema-definition.md#map-mapschema)
- Methods: get, set, delete, forEach, clear
- Callbacks: [colyseus-callbacks.md#on-add](./colyseus-callbacks.md#on-add)

**SetSchema & CollectionSchema:**
- Definition: [colyseus-schema-definition.md#set-setschema](./colyseus-schema-definition.md#set-setschema)
- Note: JavaScript SDK only

### Client-side State Changes

1. **Get callback handler:** [colyseus-callbacks.md#get-the-callback-handler](./colyseus-callbacks.md#get-the-callback-handler)
2. **Listen to property changes:** [colyseus-callbacks.md#listen](./colyseus-callbacks.md#listen)
3. **Listen to instance changes:** [colyseus-callbacks.md#on-change](./colyseus-callbacks.md#on-change)
4. **Listen to collection changes:** [colyseus-callbacks.md#on-add](./colyseus-callbacks.md#on-add)

### State Filtering

1. **Basic filtering:** [colyseus-state-view.md#tagging-fields-with-view](./colyseus-state-view.md#tagging-fields-with-view)
2. **Multiple views:** [colyseus-state-view.md#specialized-tags-with-viewtag-number](./colyseus-state-view.md#specialized-tags-with-viewtag-number)
3. **Collection filtering:** [colyseus-state-view.md#items-of-arrayschema-and-mapschema](./colyseus-state-view.md#items-of-arrayschema-and-mapschema)

### Performance & Optimization

1. **Custom types:** [colyseus-advanced-usage.md#custom-types-and-encoding](./colyseus-advanced-usage.md#custom-types-and-encoding)
2. **Variable-length encoding:** [colyseus-advanced-usage.md#custom-types-and-encoding](./colyseus-advanced-usage.md#custom-types-and-encoding)
3. **Byte-level control:** [colyseus-advanced-usage.md#byte-level-encoding](./colyseus-advanced-usage.md#byte-level-encoding)

---

## Document Relationships

```
colyseus-schema-docs.md (Overview)
├── colyseus-schema-definition.md (Server: Define state)
├── colyseus-callbacks.md (Client: Listen to changes)
│   └── colyseus-callbacks-custom.md (Advanced: Custom callbacks)
├── colyseus-state-view.md (Server: Filter per client)
├── colyseus-advanced-usage.md (Advanced: Custom encoding)
└── colyseus-best-practices.md (Limitations)
```

---

## Getting Started Workflow

**For new users, follow this sequence:**

1. **Read:** [colyseus-schema-docs.md](./colyseus-schema-docs.md) - Understand the concepts
2. **Define state:** [colyseus-schema-definition.md](./colyseus-schema-definition.md) - Create your schema
3. **Listen to changes:** [colyseus-callbacks.md](./colyseus-callbacks.md) - Wire up client callbacks
4. **Check constraints:** [colyseus-best-practices.md](./colyseus-best-practices.md) - Avoid pitfalls

**Advanced features (optional):**
- Filter state per client: [colyseus-state-view.md](./colyseus-state-view.md)
- Custom encodings: [colyseus-advanced-usage.md](./colyseus-advanced-usage.md)
- Custom callbacks: [colyseus-callbacks-custom.md](./colyseus-callbacks-custom.md)

---

## Version Information

All documentation is based on:
- **Colyseus:** 0.16+
- **@colyseus/schema:** 3.0+

Note: StateView was introduced in version 0.16 (replaces @filter() decorators)

---

## External Links

- [Colyseus Official Docs](https://docs.colyseus.io/state)
- [@colyseus/schema GitHub](https://github.com/colyseus/schema)
- [Schema Tests (Examples)](https://github.com/colyseus/schema/tree/master/test)
