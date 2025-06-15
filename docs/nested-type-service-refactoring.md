# NestedTypeService Path-Based Naming Refactoring

## Overview

This document details the comprehensive refactoring of the `NestedTypeService` that eliminated deprecated methods and introduced a superior path-based naming system for GraphQL mock generation.

## Problem Statement

### Technical Debt Issues

The `NestedTypeService` suffered from several architectural problems:

1. **Deprecated Method Overloads**: Two-parameter versions of core methods were deprecated but still widely used
2. **Naming Collisions**: Type-based naming caused identical names for different contexts
3. **Poor Context Awareness**: Same GraphQL type in different query paths generated identical builders
4. **Maintenance Overhead**: Deprecated methods created confusion and inconsistent usage patterns

### Specific Examples of Problems

**Before (Type-Based Naming):**

```typescript
// Both generate the same name despite different contexts
generateTypeName("TodosPageQuery", "Todo")     // → "TodosPageQueryTodo"
generateTypeName("TodoDetailsQuery", "Todo")   // → "TodoDetailsQueryTodo"

// Same type in different fields = name collision
todos { id, title }     // → "TodosPageQueryTodo"
todo { id, title }      // → "TodosPageQueryTodo" (collision!)
```

**After (Path-Based Naming):**

```typescript
// Different contexts generate unique names
generateTypeName("TodosPageQuery", "todos", "Todo"); // → "TodosPageQueryTodos"
generateTypeName("TodosPageQuery", "todo", "Todo"); // → "TodosPageQueryTodo"
generateTypeName("TodosPageQuery", "todo.author", "User"); // → "TodosPageQueryTodoAuthor"
```

## Solution Architecture

### 1. Method Signature Changes

**Removed Deprecated Overloads:**

```typescript
// ❌ REMOVED - Two-parameter deprecated versions
generateTypeName(operationName: string, typeName: string): string
generateBuilderName(operationName: string, typeName: string): string
```

**Kept Only Path-Based Versions:**

```typescript
// ✅ KEPT - Three-parameter path-based versions
generateTypeName(operationName: string, path: string, typeName: string): string
generateBuilderName(operationName: string, path: string, typeName: string): string
```

### 2. Path-Based Naming Logic

The new system uses the hierarchical path from the GraphQL query to generate unique, context-aware names:

```typescript
/**
 * Generates a type name based on the hierarchical path in the query.
 *
 * @param operationName - The GraphQL operation name (e.g., "GetUser")
 * @param path - The field path (e.g., "user.profile.settings")
 * @param typeName - The GraphQL type name (e.g., "Settings")
 * @returns Context-aware type name (e.g., "GetUserUserProfileSettings")
 */
generateTypeName(operationName: string, path: string, typeName: string): string {
    const pathParts = path
        .split(".")
        .map(part => part.charAt(0).toUpperCase() + part.slice(1));
    return `${operationName}${pathParts.join("")}`;
}
```

### 3. Real-World Examples

**Complex Nested Query:**

```graphql
query GetUserProfile {
    user {
        id
        name
        profile {
            bio
            settings {
                theme
                notifications
            }
            address {
                street
                city
            }
        }
        posts {
            id
            title
            author {
                name
            }
        }
    }
}
```

**Generated Builders (Path-Based):**

```typescript
// Each nested type gets its own context-aware builder
export const aGetUserProfileUser = createBuilder<GetUserProfileUser>({ ... });
export const aGetUserProfileUserProfile = createBuilder<GetUserProfileUserProfile>({ ... });
export const aGetUserProfileUserProfileSettings = createBuilder<GetUserProfileUserProfileSettings>({ ... });
export const aGetUserProfileUserProfileAddress = createBuilder<GetUserProfileUserProfileAddress>({ ... });
export const aGetUserProfileUserPosts = createBuilder<GetUserProfileUserPosts>({ ... });
export const aGetUserProfileUserPostsAuthor = createBuilder<GetUserProfileUserPostsAuthor>({ ... });
```

## Implementation Details

### 1. NestedTypeService Changes

**Core Method Updates:**

```typescript
// Before: Deprecated overloads caused confusion
generateTypeName(operationName: string, typeName: string): string; // DEPRECATED
generateTypeName(operationName: string, path: string, typeName: string): string;

// After: Single, clear method signature
generateTypeName(operationName: string, path: string, typeName: string): string;
```

**Enhanced Documentation:**

- Added comprehensive JSDoc comments
- Included real-world examples
- Documented path format expectations
- Explained naming conventions

### 2. TypeScriptCodeBuilder Integration

**Updated Method Calls:**

```typescript
// Before: Using deprecated two-parameter methods
const typeName = this.nestedTypeService.generateTypeName(
    operationName,
    nestedTypeInfo.typeName,
);
const builderName = this.nestedTypeService.generateBuilderName(
    operationName,
    nestedTypeInfo.typeName,
);

// After: Using path-based three-parameter methods
const typeName = this.nestedTypeService.generateTypeName(
    operationName,
    nestedTypeInfo.path,
    nestedTypeInfo.typeName,
);
const builderName = this.nestedTypeService.generateBuilderName(
    operationName,
    nestedTypeInfo.path,
    nestedTypeInfo.typeName,
);
```

### 3. Test Suite Enhancements

**Comprehensive Test Coverage:**

#### Path-Based Naming Tests

```typescript
describe("Path-based naming", () => {
    it("should generate different names for same type in different contexts", () => {
        // Address type in different contexts should get different builders
        const todoAddressName = service.generateTypeName(
            "TodoQuery",
            "todo.address",
            "Address",
        );
        const authorAddressName = service.generateTypeName(
            "TodoQuery",
            "todo.author.address",
            "Address",
        );

        expect(todoAddressName).toBe("TodoQueryTodoAddress");
        expect(authorAddressName).toBe("TodoQueryTodoAuthorAddress");
    });
});
```

#### Recursion Protection Tests

```typescript
describe("Recursion handling", () => {
    it("should handle circular references with depth protection", () => {
        const nestedTypes = service.analyzeSelectionSet({
            parentType: userType,
            selectionSet: circularSelectionSet, // User -> Profile -> User
            operationName: "GetUser",
            fragmentRegistry: new Map(),
        });

        // Should create builders but stop at max depth
        expect(nestedTypes).toHaveLength(2); // User and Profile, but not recursive User
    });
});
```

#### Real-World Scenario Tests

```typescript
describe("Real-world scenarios", () => {
    it("should handle complex hierarchical composition", () => {
        // Tests the exact 4-builder scenario we discussed
        const nestedTypes = service.analyzeSelectionSet({
            parentType: queryType,
            selectionSet: complexSelectionSet,
            operationName: "ComplexQuery",
            fragmentRegistry: new Map(),
        });

        expect(nestedTypes).toHaveLength(4);
        expect(nestedTypes.map((t) => t.builderName)).toEqual([
            "aComplexQueryTodo",
            "aComplexQueryTodoAuthor",
            "aComplexQueryTodoAddress",
            "aComplexQueryTodoAuthorAddress",
        ]);
    });
});
```

## Migration Impact

### Files Updated

**Core Service Files:**

- `src/services/NestedTypeService.ts` - Removed deprecated methods, enhanced documentation
- `src/builders/TypeScriptCodeBuilder.ts` - Updated to use path-based methods

**Test Files:**

- `src/services/__tests__/NestedTypeService.test.ts` - Added comprehensive path-based test coverage
- `src/builders/__tests__/TypeScriptCodeBuilder.test.ts` - Updated for new method signatures

**Integration Tests:**

- `src/__tests__/plugin.integration.test.ts` - Updated naming expectations
- `src/orchestrators/__tests__/PluginOrchestrator.test.ts` - Updated naming expectations

### Breaking Changes

**Method Signature Changes:**

```typescript
// ❌ These deprecated overloads were REMOVED
nestedTypeService.generateTypeName(operationName, typeName);
nestedTypeService.generateBuilderName(operationName, typeName);

// ✅ Use these path-based versions instead
nestedTypeService.generateTypeName(operationName, path, typeName);
nestedTypeService.generateBuilderName(operationName, path, typeName);
```

**Generated Code Changes:**

```typescript
// Before: Type-based naming (potential collisions)
export const aTodosPageQueryTodo = createBuilder<TodosPageQueryTodo>({ ... });

// After: Path-based naming (unique contexts)
export const aTodosPageQueryTodos = createBuilder<TodosPageQueryTodos>({ ... });
```

## Benefits Realized

### 1. **Zero Technical Debt**

- ✅ No deprecated methods remaining in codebase
- ✅ Single, consistent API surface
- ✅ Clear upgrade path for future changes

### 2. **Improved Context Awareness**

- ✅ Same type in different contexts gets unique builders
- ✅ Field names drive builder names (more intuitive)
- ✅ Better relationship between GraphQL structure and generated code

### 3. **Enhanced Developer Experience**

- ✅ More descriptive and meaningful builder names
- ✅ Better IntelliSense support with unique names
- ✅ Clearer debugging with context-aware naming

### 4. **Better Code Quality**

- ✅ Eliminated naming collisions
- ✅ More maintainable generated code
- ✅ Improved test coverage and reliability

## Future Considerations

### Potential Enhancements

1. **Path Optimization**: Consider shortening very long paths for deeply nested structures
2. **Custom Path Strategies**: Allow configuration of path-to-name conversion logic
3. **Name Collision Detection**: Add runtime validation to detect any remaining edge cases
4. **Performance Optimization**: Cache path-based name generation for repeated patterns

### Backward Compatibility

This refactoring intentionally breaks backward compatibility to eliminate technical debt. The benefits of clean, consistent naming outweigh the migration cost, especially since:

- Deprecated methods were already marked for removal
- New naming is more intuitive and descriptive
- Comprehensive test coverage ensures reliability
- Migration path is clear and well-documented

## Conclusion

The NestedTypeService refactoring successfully eliminates technical debt while introducing a superior path-based naming system. The result is:

- **Cleaner Architecture**: No deprecated methods, single consistent approach
- **Better Generated Code**: More descriptive, context-aware names
- **Improved Maintainability**: Clear logic, comprehensive tests, zero ambiguity
- **Enhanced Developer Experience**: Intuitive naming that reflects GraphQL structure

This refactoring sets a strong foundation for future enhancements while providing immediate benefits to developers using the generated mock builders.
