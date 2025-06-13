# graphql-codegen-typescript-operation-mocks

Generate type-safe, overrideable mock data for your GraphQL operations using [GraphQL Code Generator](https://the-guild.dev/graphql/codegen), `casual`, and `lodash`.

This plugin is ideal for testing, Storybook development, and fixture generation.

---

## ✨ Features

- ✅ Generates per-operation mocks: `aAddTodoMutation`, `aTodosPageQuery`, etc.
- ✅ Builders use `DeepPartial` + `lodash.merge` for easy overrides
- ✅ Support for inline fragments and union/interface types
- ✅ Support for `Date`, `UUID`, and other custom scalars via config
- ✅ Fully static types — no runtime dependencies beyond your mocks
- ✅ Designed for [`near-operation-file`](https://the-guild.dev/graphql/codegen/plugins/presets/near-operation-file) workflows

---

## 📦 Installation

```bash
yarn add -D graphql-codegen-typescript-operation-mocks casual lodash
# or
npm install -D graphql-codegen-typescript-operation-mocks casual lodash
```

---

## ⚙️ Configuration

**Do not use this plugin alongside `typescript-operations` in the same output target.**  
Instead, generate your mock files using the `near-operation-file` preset in a separate folder:

```ts
// codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
    schema: "http://localhost:4000/graphql",
    generates: {
        // Base types for operations
        "src/types.generated.ts": {
            documents: ["src/**/*.graphql"],
            plugins: ["typescript"],
        },

        // Mock data per operation
        "src/": {
            documents: ["src/**/*.graphql"],
            preset: "near-operation-file",
            presetConfig: {
                baseTypesPath: "types.generated.ts",
                folder: "mocks",
                extension: ".mock.ts",
            },
            plugins: ["typescript-operation-mocks"],
            config: {
                scalars: {
                    Date: {
                        generator: "date",
                        arguments: "YYYY-MM-DD",
                    },
                },
            },
        },
    },
};

export default config;
```

---

## 🔧 Scalar Mocking

You can define how custom scalars are mocked via the `scalars` config.

### Simple form

```yaml
scalars:
    Date: date
```

➡️ Becomes `casual.date()`

### With arguments

```yaml
scalars:
    Date:
        generator: date
        arguments: "YYYY-MM-DD"
```

➡️ Becomes `casual.date('YYYY-MM-DD')`

---

## 🔀 Fragments & Union Types

The plugin supports several GraphQL fragment patterns:

### Inline Fragments

```graphql
query TodoDetails($id: ID!) {
    todoById(id: $id) {
        ... on Todo {
            id
            title
            completed
        }
        ... on Error {
            message
        }
    }
}
```

This generates multiple mock variants:

- `aTodoDetailsAsTodo()` - for the Todo case
- `aTodoDetailsAsError()` - for the Error case

### Same-File Fragments

```graphql
fragment AuthorInfo on Author {
    id
    name
    email
}

query TodosWithAuthor {
    todos {
        id
        title
        author {
            ...AuthorInfo
        }
    }
}
```

✅ **Works:** Fragment and query are in the same `.graphql` file

### Cross-File Fragments (Limited)

❌ **Limited:** Fragment spreads across separate files don't work with `near-operation-file` preset due to how GraphQL Code Generator processes documents independently.

---

## 🧱 Example Output

Generated mock:

```ts
type AddTodoMutation = {
    __typename: "Mutation";
    addTodo: {
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aAddTodoMutation = createBuilder<AddTodoMutation>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "some-uuid",
        title: "Write a plugin",
        completed: false,
    },
});
```

---

## 🔁 Builder API

Mocks use the builder pattern so you can override fields without retyping everything:

```ts
const customTodo = aAddTodoMutation({
    addTodo: {
        title: "Do laundry",
        completed: true,
    },
});
```

---

## ❗ Validation

The plugin will validate your schema at build time. You must tell the plugin how to resolve non-primitive scalars in your schema. If your schema includes a custom scalar (e.g. `Date`) and it's not configured, you'll get:

```
Missing mock generators for custom scalars: Date.
Please define them under the 'scalars' field in your plugin config.
```

---

### 🧼 Code Formatting

Mock files are emitted as plain TypeScript.  
To format them using your local Prettier config:

```bash
prettier --write 'src/**/*.mock.ts'
```

---

## 📂 Output Structure (Example)

```
src/
├── pages/
│   └── graphql/
│       └── AddTodoMutation.graphql
├── types.generated.ts
└── pages/
    └── graphql/
        └── mocks/
            └── AddTodoMutation.mock.ts
```

---

## 💬 Feedback & Contributions

This plugin is actively evolving.
Feel free to open [issues](https://github.com/farmstrong8/graphql-code-generator/issues) or [PRs](https://github.com/farmstrong8/graphql-code-generator/pulls) to improve its capabilities.
