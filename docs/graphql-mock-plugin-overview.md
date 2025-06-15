# `@graphql-codegen/typescript-mock-data` Plugin Overview

## Purpose

The purpose of this plugin is to generate **TypeScript mock data builders** for GraphQL operations and fragments. It is intended to integrate with the GraphQL Code Generator ecosystem, making it easy to produce mock data for unit tests, Storybook, or development environments without relying on a real backend.

It produces **strongly typed mock builder functions** using the actual GraphQL schema and documents (queries/fragments), and supports partial overrides by users.

---

## Responsibilities

### ✅ Parse GraphQL Documents

- Traverse GraphQL queries, mutations, and fragments.
- Resolve and inline fragment spreads and inline fragments.
- Understand union and interface types to generate mocks for all possible types.

### ✅ Generate TypeScript Mock Builders

- Output mock functions named with the pattern `a{TypeName}` or `a{OperationName}` (e.g., `aTodo`, `aAddTodoMutation`, `aUserFragment`).
- Each mock is a function that returns a strongly typed object.
- The mock should support overrides by merging `partial` input.

Example:

```ts
export const aUser = createBuilder<User>(() => ({
    id: casual.uuid,
    name: casual.first_name,
}));
```

### ✅ Support DeepPartial-style Overrides

- Consumers can pass in overrides to customize nested fields.
- Use lodash’s `merge()` to apply deep overrides.

```ts
aUser({ name: "Ferris" }); // Only overrides name, everything else remains mocked
```

### ✅ Handle Scalar Types

- Use `casual` for generating fake values for known scalars (e.g. `String`, `Int`, `Date`, `Boolean`).
- Support user-defined scalar mappings via plugin config:

```yaml
config:
    scalars:
        Date: date
        EmailAddress: email
```

### ✅ Union and Interface Handling

- For unions/interfaces, generate:
    - One default mock using the first possible type.
    - Separate named mocks for each possible concrete type (e.g., `aItemAsFoo`, `aItemAsBar`).

### ✅ Plugin Configuration

- Accept configuration via `codegen.yml`, including:
    - `scalars`: Custom scalar-to-generator mappings.
    - `namingConvention` (optional): Customize generated function names.
    - `addTypename`: Whether to include `__typename` in mocks.

---

## Output Expectations

For every query or fragment:

- Generate a mock builder function.
- Co-locate the mock builders in a generated file (`mocks.generated.ts`).
- Export all builders from this file.

For example:

```ts
import { aUser } from "./mocks.generated";

const mock = aUser({ name: "Alice" });
```

---

## Internal Design Notes

- Uses `graphql` package to introspect schema and resolve types.
- Recursively processes selection sets, resolving fragment definitions from a collected registry.
- Uses a central `createBuilder<T>()` helper to wrap the mock generation and apply overrides.

---

## Philosophy

- **Deterministic and typed**: Mock functions should always return a complete, valid, typed object unless overridden.
- **Extensible**: Users can easily extend or replace scalars and nested mocks.
- **Clear and minimal output**: Avoid noise; only emit what is required for accurate and useful mocks.
