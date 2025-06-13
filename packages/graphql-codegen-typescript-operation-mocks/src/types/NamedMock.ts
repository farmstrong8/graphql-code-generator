/**
 * Represents a generated mock data object with its associated metadata.
 * This is the JavaScript object that will be used to generate TypeScript code.
 */
export type MockDataObject = {
    /** The name/identifier for this mock (e.g., "TodosPageQuery", "AddTodoMutation") */
    mockName: string;
    /** The actual mock data object containing the GraphQL response structure */
    mockValue: Record<string, unknown>;
};

/**
 * Represents multiple mock variants for union types or inline fragments.
 * For example, a union field might generate multiple mocks for different union members.
 */
export type MockDataVariants = MockDataObject[];
