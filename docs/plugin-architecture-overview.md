# GraphQL TypeScript Mock Data Plugin - Architecture Overview

## Executive Summary

The GraphQL TypeScript Mock Data Plugin is a sophisticated code generation tool that transforms GraphQL operations into type-safe, overrideable TypeScript mock builders. The architecture follows modern software engineering principles with a focus on **atomic services**, **single responsibility**, **composability**, and **testability**.

## Core Design Principles

### 1. **Atomic Services Architecture**

- Each service has a single, focused responsibility
- Services are stateless and easily testable in isolation
- Business logic is separated from orchestration logic
- Services are composed together to create complex workflows

### 2. **Schema-First Approach**

- GraphQL schema is the single source of truth
- All code generation cascades from schema analysis
- Mock values are generated based on schema types, not hardcoded patterns
- Type inference leverages GraphQL type system for semantic accuracy

### 3. **Nested Builder Pattern**

- Every nested object type gets its own reusable builder function
- Builders follow the pattern: `aOperationNameFieldPath` (e.g., `aTodosPageQueryTodos`)
- Path-based naming ensures unique builders for same types in different contexts
- Hierarchical composition enables clean, maintainable test code

### 4. **Fragment Resolution Strategy**

- Global fragment registry enables cross-file fragment usage
- Synthetic fragment field generation for near-operation-file preset
- Graceful degradation when fragments are unavailable
- Maintains consistency across different generation modes

## Architectural Layers

The plugin follows a layered architecture with clear separation of concerns:

### Layer 1: Entry Point

- **plugin.ts**: Main plugin entry point that integrates with GraphQL Code Generator

### Layer 2: Orchestrators

- **PluginOrchestrator**: Top-level workflow coordination and document processing
- **ServiceContainer**: Dependency injection and service lifecycle management

### Layer 3: Processors

- **DocumentProcessor**: High-level GraphQL document processing and coordination

### Layer 4: Builders

- **TypeScriptCodeBuilder**: TypeScript code generation and assembly
- **MockObjectBuilder**: Mock data object creation and processing

### Layer 5: Services (Atomic Business Logic)

- **SchemaAnalysisService**: GraphQL schema structure analysis
- **TypeInferenceService**: Semantic TypeScript type generation
- **ValueGenerationService**: Mock value generation
- **NestedTypeService**: Nested type analysis and builder management
- **SchemaFirstCodeService**: Schema-first code generation orchestration
- **BuilderCodeService**: Builder function code generation
- **UnionMockService**: GraphQL union type processing
- **FieldMockService**: Individual field mock generation
- **NamingService**: Consistent naming conventions
- **BoilerplateService**: TypeScript boilerplate generation

### Layer 6: Handlers (Coordination Layer)

- **SelectionSetHandler**: GraphQL selection set processing and fragment resolution
- **ScalarHandler**: Scalar value generation coordination

## Key Components Deep Dive

### Orchestrators

#### PluginOrchestrator

- **Purpose**: Top-level workflow coordination
- **Responsibilities**:
    - Document processing orchestration
    - Global fragment registry management
    - Multi-document coordination
    - Final output assembly
- **Key Features**:
    - Handles both global and near-operation-file generation modes
    - Fragment resolution across multiple documents
    - Duplicate detection and prevention
    - Caching mechanism to prevent overwriting correct results

#### ServiceContainer

- **Purpose**: Dependency injection and service wiring
- **Responsibilities**:
    - Service instantiation and configuration
    - Dependency resolution
    - Component lifecycle management
- **Pattern**: Inversion of Control (IoC) container

### Atomic Services

#### SchemaAnalysisService

- **Purpose**: GraphQL schema structure analysis
- **Atomic Responsibility**: Parse and categorize GraphQL schema elements
- **Key Methods**:
    - `analyzeSelectionSet()` - Structured selection set analysis
    - `analyzeField()` - Individual field analysis
    - `validateSelectionSet()` - Schema compatibility validation

#### TypeInferenceService

- **Purpose**: Semantic TypeScript type generation
- **Atomic Responsibility**: Convert GraphQL types to TypeScript semantic types
- **Key Features**:
    - Scalar type mapping (String → string, Int → number)
    - Object type inference from selection sets
    - Union type variant handling
    - Fragment field inference with schema fallback

#### ValueGenerationService

- **Purpose**: Mock value generation
- **Atomic Responsibility**: Generate realistic mock values for GraphQL fields
- **Key Features**:
    - Schema-driven value generation
    - Scalar value delegation to ScalarHandler
    - Union type default value creation
    - Heuristic-based field value generation

#### SchemaFirstCodeService

- **Purpose**: Schema-first code generation orchestration
- **Atomic Responsibility**: Coordinate atomic services for complete code generation
- **Key Features**:
    - Pure orchestration (no business logic)
    - Union variant generation (only variants, no main builder)
    - Nested artifact management
    - Service composition pattern

#### BuilderCodeService

- **Purpose**: Builder function code generation
- **Atomic Responsibility**: Generate TypeScript builder function code
- **Key Features**:
    - Nested builder reference substitution
    - Type-safe builder function creation
    - Mock value literal generation

#### UnionMockService

- **Purpose**: GraphQL union type processing
- **Atomic Responsibility**: Handle union types and inline fragments
- **Key Features**:
    - Inline fragment processing
    - Union variant name generation
    - Union field detection

#### FieldMockService

- **Purpose**: Individual field mock generation
- **Atomic Responsibility**: Generate mock values for specific GraphQL fields
- **Key Features**:
    - Field type analysis
    - List type handling
    - Nested object delegation

#### NamingService

- **Purpose**: Consistent naming conventions
- **Atomic Responsibility**: Generate consistent names throughout the plugin
- **Key Features**:
    - Builder name generation (`aOperationName`)
    - Type name generation with operation suffixes
    - Operation type inference
    - Naming validation

#### BoilerplateService

- **Purpose**: TypeScript boilerplate generation
- **Atomic Responsibility**: Generate standard TypeScript helper code
- **Key Features**:
    - Import statement generation
    - Helper function creation (createBuilder, DeepPartial)
    - Context-aware boilerplate

### Handlers (Coordination Layer)

#### SelectionSetHandler

- **Purpose**: GraphQL selection set processing
- **Responsibilities**:
    - Fragment spread resolution
    - Inline fragment processing
    - Synthetic fragment field generation
- **Key Features**:
    - Cross-file fragment resolution
    - Near-operation-file mode support
    - Graceful fragment fallback

#### ScalarHandler

- **Purpose**: Scalar value generation coordination
- **Responsibilities**:
    - Scalar mock value generation
    - Custom scalar configuration
    - Casual.js integration
- **Key Features**:
    - Configurable scalar mappings
    - Built-in scalar support
    - Validation and error handling

## Key Patterns and Strategies

### Path-Based Naming Strategy

- **Problem**: Same GraphQL type in different contexts needs unique builders
- **Solution**: Use hierarchical field path for naming
- **Example**:
    - `todo.author` → `aTodosPageQueryTodoAuthor`
    - `user.author` → `aTodosPageQueryUserAuthor`

### Nested Builder Pattern

- **Problem**: Complex nested objects are hard to mock and maintain
- **Solution**: Generate separate builder for each nested object type
- **Benefits**:
    - Reusable builders across different contexts
    - Clean composition in test code
    - Type-safe overrides at any nesting level

### Union Type Variant Generation

- **Problem**: GraphQL unions require handling multiple possible types
- **Solution**: Generate separate builders for each union variant, NO main builder
- **Pattern**:
    - `aTodoDetailsPageQueryAsTodo` - Query wrapper for Todo variant
    - `aTodoDetailsPageQueryAsTodoTodo` - Todo object builder
    - `aTodoDetailsPageQueryAsError` - Query wrapper for Error variant
    - `aTodoDetailsPageQueryAsErrorError` - Error object builder
- **Key Principle**: When union fields are present, only generate variant builders to force explicit choice

### Fragment Resolution Strategy

- **Problem**: Fragments may be defined in separate files (near-operation-file preset)
- **Solution**: Multi-layered resolution approach
    1. **Global Registry**: Collect all fragments from all documents
    2. **Local Resolution**: Use available fragments when possible
    3. **Synthetic Generation**: Create fallback fields when fragments missing
    4. **Schema Inference**: Use GraphQL schema to generate reasonable defaults

## Data Flow Architecture

### 1. **Input Processing**

```
GraphQL Documents → PluginOrchestrator → DocumentProcessor
```

### 2. **Fragment Resolution**

```
Documents → Global Fragment Registry → SelectionSetHandler → Resolved Selection Sets
```

### 3. **Schema Analysis**

```
GraphQL Schema + Selection Sets → SchemaAnalysisService → Structured Field Analysis
```

### 4. **Type Generation**

```
Field Analysis → TypeInferenceService → Semantic Type Information → TypeScript Types
```

### 5. **Value Generation**

```
Field Analysis → ValueGenerationService → Mock Values → Builder Functions
```

### 6. **Code Assembly**

```
Types + Values → TypeScriptCodeBuilder → Complete TypeScript Code
```

## Testing Strategy

### Unit Testing Approach

- **Atomic Services**: Each service tested in complete isolation
- **Mock Dependencies**: All dependencies mocked for pure unit tests
- **Focused Scenarios**: Each test covers a single responsibility
- **Edge Cases**: Comprehensive coverage of error conditions

### Integration Testing

- **End-to-End Workflows**: Complete document processing pipelines
- **Real Schema Testing**: Tests with actual GraphQL schemas
- **Fragment Resolution**: Cross-file fragment scenarios
- **Union Type Generation**: Complex union type handling

### Test Coverage Areas

- Path-based naming collision prevention
- Recursion protection and depth limits
- Fragment resolution across different modes
- Union type variant generation
- Schema-first type inference
- Error handling and validation

## Configuration and Extensibility

### Plugin Configuration

```typescript
interface TypeScriptMockDataPluginConfig {
    scalars?: Record<string, ScalarGeneratorConfig>;
    naming?: NamingOptions;
}
```

### Scalar Configuration

```typescript
// Simple form
scalars: {
  Date: "date"
}

// Advanced form
scalars: {
  Date: {
    generator: "date",
    arguments: "YYYY-MM-DD"
  }
}
```

### Naming Configuration

```typescript
naming: {
    addOperationSuffix: true; // Adds Query, Mutation, Fragment suffixes
}
```

## Performance Considerations

### Optimization Strategies

- **Service Caching**: Results cached within single generation run
- **Fragment Registry Reuse**: Global fragment registry shared across documents
- **Lazy Evaluation**: Services only instantiated when needed
- **Minimal Object Creation**: Efficient object creation and reuse

### Memory Management

- **Stateless Services**: Services don't retain state between generations
- **Garbage Collection Friendly**: Minimal long-lived object references
- **Efficient Data Structures**: Maps and Sets for fast lookups

## Error Handling and Validation

### Validation Layers

1. **Schema Validation**: GraphQL schema compatibility checks
2. **Configuration Validation**: Plugin configuration validation
3. **Type Validation**: Generated type consistency checks
4. **Runtime Validation**: Mock value structure validation

### Error Recovery

- **Graceful Degradation**: Continue generation when possible
- **Fallback Strategies**: Synthetic generation when data unavailable
- **Clear Error Messages**: Actionable error reporting
- **Partial Success**: Generate what's possible, report what failed

## Future Architecture Considerations

### Potential Enhancements

1. **Plugin System**: Allow custom services and handlers
2. **Caching Layer**: Persistent caching across runs
3. **Streaming Generation**: Large schema support with streaming
4. **Custom Type Mappers**: User-defined type mapping strategies
5. **Performance Profiling**: Built-in performance monitoring

### Scalability Considerations

- **Large Schema Support**: Efficient handling of complex schemas
- **Memory Optimization**: Streaming and chunked processing
- **Parallel Processing**: Multi-threaded generation for large projects
- **Incremental Generation**: Only regenerate changed parts

## Conclusion

The GraphQL TypeScript Mock Data Plugin architecture represents a modern, maintainable approach to code generation. By following atomic service principles, schema-first design, and comprehensive testing strategies, the plugin provides a robust foundation for generating type-safe, realistic mock data for GraphQL applications.

The architecture's emphasis on composability, testability, and single responsibility ensures that the plugin can evolve and scale while maintaining code quality and developer experience.
