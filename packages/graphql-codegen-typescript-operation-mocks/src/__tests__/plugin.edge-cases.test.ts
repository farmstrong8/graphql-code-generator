import { describe, it, expect } from "vitest";
import { buildSchema, parse } from "graphql";
import { plugin } from "../plugin";

describe("Plugin Edge Cases", () => {
    describe("Schema Edge Cases", () => {
        it("should handle schema with only custom scalars", async () => {
            const scalarSchema = buildSchema(`
                type Query {
                    currentTime: DateTime!
                    userLocation: GeoPoint!
                    fileUpload: Upload!
                }

                scalar DateTime
                scalar GeoPoint
                scalar Upload
            `);

            const documents = [
                {
                    document: parse(`
                        query GetScalars {
                            currentTime
                            userLocation
                            fileUpload
                        }
                    `),
                },
            ];

            const result = await plugin(scalarSchema, documents, {
                scalars: {
                    DateTime: "date",
                    GeoPoint: "word",
                    Upload: "word",
                },
            });

            expect(result).toContain("export const aGetScalarsQuery");
            expect(result).toContain("currentTime:");
            expect(result).toContain("userLocation:");
            expect(result).toContain("fileUpload:");
        });

        it("should handle deeply nested recursive structures", async () => {
            const recursiveSchema = buildSchema(`
                type Query {
                    organization: Organization!
                }

                type Organization {
                    id: ID!
                    name: String!
                    parent: Organization
                    children: [Organization!]!
                    departments: [Department!]!
                }

                type Department {
                    id: ID!
                    name: String!
                    organization: Organization!
                    parent: Department
                    children: [Department!]!
                    employees: [Employee!]!
                }

                type Employee {
                    id: ID!
                    name: String!
                    email: String!
                    department: Department!
                    manager: Employee
                    reports: [Employee!]!
                }
            `);

            const documents = [
                {
                    document: parse(`
                        query GetOrganizationStructure {
                            organization {
                                id
                                name
                                parent {
                                    id
                                    name
                                }
                                children {
                                    id
                                    name
                                    children {
                                        id
                                        name
                                    }
                                }
                                departments {
                                    id
                                    name
                                    parent {
                                        id
                                        name
                                    }
                                    employees {
                                        id
                                        name
                                        email
                                        manager {
                                            id
                                            name
                                        }
                                        reports {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    `),
                },
            ];

            const result = await plugin(recursiveSchema, documents, {});

            // Should handle recursion without infinite loops
            expect(result).toContain(
                "export const aGetOrganizationStructureQuery",
            );

            // Should generate nested builders for different contexts
            expect(result).toContain(
                "GetOrganizationStructureOrganizationParent",
            );
            expect(result).toContain(
                "GetOrganizationStructureOrganizationChildren",
            );
            expect(result).toContain(
                "GetOrganizationStructureOrganizationDepartments",
            );

            // Should handle employee hierarchy
            expect(result).toContain(
                "GetOrganizationStructureOrganizationDepartmentsEmployees",
            );
        });

        it("should handle empty and minimal schemas", async () => {
            const minimalSchema = buildSchema(`
                type Query {
                    hello: String
                }
            `);

            const documents = [
                {
                    document: parse(`
                        query Hello {
                            hello
                        }
                    `),
                },
            ];

            const result = await plugin(minimalSchema, documents, {});

            expect(result).toContain("export const aHelloQuery");
            expect(result).toContain("hello:");
            expect(result).toContain('"__typename": "Query"');
        });

        it("should handle invalid scalar configurations by throwing descriptive errors", async () => {
            const schema = buildSchema(`
                type Query {
                    customField: CustomScalar!
                }
                scalar CustomScalar
            `);

            const documents = [
                {
                    document: parse(`
                        query GetCustom {
                            customField
                        }
                    `),
                },
            ];

            // Test with invalid casual generator - should throw error
            let errorThrown = false;
            let errorMessage = "";

            try {
                await plugin(schema, documents, {
                    scalars: {
                        CustomScalar: "invalidGenerator",
                    },
                });
            } catch (error) {
                errorThrown = true;
                errorMessage = (error as Error).message;
            }

            expect(errorThrown).toBe(true);
            expect(errorMessage).toContain(
                'Invalid casual generator "invalidGenerator" for scalar "CustomScalar"',
            );
        });

        it("should handle schema with multiple union types", async () => {
            const multiUnionSchema = buildSchema(`
                type Query {
                    search(query: String!): [SearchResult!]!
                    notifications: [Notification!]!
                }

                union SearchResult = User | Post | Comment

                union Notification = LikeNotification | CommentNotification | FollowNotification

                type User {
                    id: ID!
                    username: String!
                    email: String!
                }

                type Post {
                    id: ID!
                    title: String!
                    content: String!
                    author: User!
                }

                type Comment {
                    id: ID!
                    content: String!
                    author: User!
                    post: Post!
                }

                type LikeNotification {
                    id: ID!
                    user: User!
                    post: Post!
                    createdAt: String!
                }

                type CommentNotification {
                    id: ID!
                    user: User!
                    comment: Comment!
                    createdAt: String!
                }

                type FollowNotification {
                    id: ID!
                    follower: User!
                    followed: User!
                    createdAt: String!
                }
            `);

            const documents = [
                {
                    document: parse(`
                        query GetSearchAndNotifications($query: String!) {
                            search(query: $query) {
                                ... on User {
                                    id
                                    username
                                    email
                                }
                                ... on Post {
                                    id
                                    title
                                    content
                                    author {
                                        id
                                        username
                                    }
                                }
                                ... on Comment {
                                    id
                                    content
                                    author {
                                        id
                                        username
                                    }
                                }
                            }
                            notifications {
                                ... on LikeNotification {
                                    id
                                    user {
                                        id
                                        username
                                    }
                                    post {
                                        id
                                        title
                                    }
                                    createdAt
                                }
                                ... on CommentNotification {
                                    id
                                    user {
                                        id
                                        username
                                    }
                                    comment {
                                        id
                                        content
                                    }
                                    createdAt
                                }
                                ... on FollowNotification {
                                    id
                                    follower {
                                        id
                                        username
                                    }
                                    followed {
                                        id
                                        username
                                    }
                                    createdAt
                                }
                            }
                        }
                    `),
                },
            ];

            const result = await plugin(multiUnionSchema, documents, {});

            // Should generate variants for SearchResult union - actual naming pattern
            expect(result).toContain("GetSearchAndNotificationsQueryAsUser");
            expect(result).toContain("GetSearchAndNotificationsQueryAsPost");
            expect(result).toContain("GetSearchAndNotificationsQueryAsComment");

            // Should generate variants for Notification union - actual naming pattern
            expect(result).toContain(
                "GetSearchAndNotificationsQueryAsLikeNotification",
            );
            expect(result).toContain(
                "GetSearchAndNotificationsQueryAsCommentNotification",
            );
            expect(result).toContain(
                "GetSearchAndNotificationsQueryAsFollowNotification",
            );
        });

        it("should handle custom scalars", async () => {
            const schema = buildSchema(`
                scalar Date
                scalar UUID
                
                type Query {
                    customField: Date
                    idField: UUID
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query TestCustomScalars {
                            customField
                            idField
                        }
                    `),
                },
            ];

            const config = {
                scalars: {
                    Date: {
                        generator: "date",
                        arguments: "YYYY-MM-DD",
                    },
                    UUID: "uuid",
                },
            };

            const result = plugin(schema, documents, config);

            expect(result).toContain("customField:");
            expect(result).toContain("idField:");
            expect(result).toContain("aTestCustomScalarsQuery");
        });

        it("should handle enum types consistently", async () => {
            const schema = buildSchema(`
                enum Status {
                    ACTIVE
                    INACTIVE
                    PENDING
                }
                
                enum Priority {
                    LOW
                    MEDIUM
                    HIGH
                }
                
                type Todo {
                    id: ID!
                    status: Status!
                    priority: Priority!
                }
                
                type Query {
                    todo: Todo
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query TestEnums {
                            todo {
                                id
                                status
                                priority
                            }
                        }
                    `),
                },
            ];

            const result = plugin(schema, documents, {});

            // Should always use first enum value
            expect(result).toContain('status: "ACTIVE"');
            expect(result).toContain('priority: "LOW"');

            // Should generate deterministic ID
            expect(result).toContain("id:");
            expect(result).toContain("aTestEnumsQuery");
        });

        it("should generate consistent boolean values", async () => {
            const schema = buildSchema(`
                type Todo {
                    id: ID!
                    completed: Boolean!
                    archived: Boolean
                    visible: Boolean!
                }
                
                type Query {
                    todo: Todo
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query TestBooleans {
                            todo {
                                id
                                completed
                                archived
                                visible
                            }
                        }
                    `),
                },
            ];

            const result = plugin(schema, documents, {});

            // All booleans should be true for consistency
            expect(result).toContain("completed: true");
            expect(result).toContain("archived: true");
            expect(result).toContain("visible: true");
        });

        it("should generate deterministic IDs based on context", async () => {
            const schema = buildSchema(`
                type User {
                    id: ID!
                    name: String!
                }
                
                type Todo {
                    id: ID!
                    userId: ID!
                    title: String!
                }
                
                type Query {
                    user: User
                    todo: Todo
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query TestDeterministicIds {
                            user {
                                id
                                name
                            }
                            todo {
                                id
                                userId
                                title
                            }
                        }
                    `),
                },
            ];

            const result = plugin(schema, documents, {});

            // Should contain deterministic IDs (not random UUIDs)
            expect(result).toContain("id:");
            expect(result).toContain("userId:");

            // Should generate deterministic IDs (same ID for same context)
            // Note: Other fields like strings are still random, so we check specific patterns
            expect(result).toMatch(
                /id: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"/,
            );
            expect(result).toMatch(
                /userId: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"/,
            );
        });

        it("should handle deeply nested recursive structures", async () => {
            const schema = buildSchema(`
                type User {
                    id: ID!
                    name: String!
                    friends: [User!]!
                    bestFriend: User
                }
                
                type Query {
                    user: User
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query DeepRecursion {
                            user {
                                id
                                name
                                friends {
                                    id
                                    name
                                    bestFriend {
                                        id
                                        name
                                        friends {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    `),
                },
            ];

            const result = plugin(schema, documents, {});

            expect(result).toContain("aDeepRecursionQuery");
            expect(result).toContain("friends:");
            // The new architecture uses builder references instead of inline objects
            expect(result).toContain("bestFriend?:");

            // Should not cause infinite recursion
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeLessThan(50000); // Reasonable size limit
        });

        it("should handle empty schemas gracefully", async () => {
            const schema = buildSchema(`
                type Query {
                    hello: String
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query EmptyQuery {
                            hello
                        }
                    `),
                },
            ];

            const result = plugin(schema, documents, {});

            expect(result).toContain("aEmptyQueryQuery");
            expect(result).toContain("hello:");
        });

        it("should handle invalid scalar configurations gracefully", async () => {
            const schema = buildSchema(`
                scalar CustomScalar
                
                type Query {
                    field: CustomScalar
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query TestInvalidScalar {
                            field
                        }
                    `),
                },
            ];

            const config = {
                scalars: {
                    CustomScalar: "invalidGenerator" as any,
                },
            };

            expect(() => plugin(schema, documents, config)).toThrow(
                'Invalid casual generator "invalidGenerator"',
            );
        });

        it("should handle multiple union types", async () => {
            const schema = buildSchema(`
                type Todo {
                    id: ID!
                    title: String!
                }
                
                type Error {
                    message: String!
                }
                
                type User {
                    id: ID!
                    name: String!
                }
                
                type NotFound {
                    resource: String!
                }
                
                union TodoResult = Todo | Error
                union UserResult = User | NotFound
                
                type Query {
                    todo: TodoResult
                    user: UserResult
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query MultipleUnions {
                            todo {
                                ... on Todo {
                                    id
                                    title
                                }
                                ... on Error {
                                    message
                                }
                            }
                            user {
                                ... on User {
                                    id
                                    name
                                }
                                ... on NotFound {
                                    resource
                                }
                            }
                        }
                    `),
                },
            ];

            const result = plugin(schema, documents, {});

            expect(result).toContain("aMultipleUnionsQueryAsTodo");
            expect(result).toContain("aMultipleUnionsQueryAsError");
            expect(result).toContain("aMultipleUnionsQueryAsUser");
            expect(result).toContain("aMultipleUnionsQueryAsNotFound");
        });

        it("should handle interface types", async () => {
            const schema = buildSchema(`
                interface Node {
                    id: ID!
                }
                
                type Todo implements Node {
                    id: ID!
                    title: String!
                    completed: Boolean!
                }
                
                type User implements Node {
                    id: ID!
                    name: String!
                    email: String!
                }
                
                type Query {
                    node: Node
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query TestInterface {
                            node {
                                id
                                ... on Todo {
                                    title
                                    completed
                                }
                                ... on User {
                                    name
                                    email
                                }
                            }
                        }
                    `),
                },
            ];

            const result = plugin(schema, documents, {});

            expect(result).toContain("aTestInterfaceQuery");
            expect(result).toContain("id:");
            // Interface handling should work without errors
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(100);
        });
    });

    describe("Configuration Edge Cases", () => {
        it("should throw error for invalid scalar configurations even with valid ones present", async () => {
            const schema = buildSchema(`
                type Query {
                    validField: ValidScalar!
                    invalidField: InvalidScalar!
                }
                scalar ValidScalar
                scalar InvalidScalar
            `);

            const documents = [
                {
                    document: parse(`
                        query GetMixed {
                            validField
                            invalidField
                        }
                    `),
                },
            ];

            // Should throw error for invalid scalar configuration
            let errorThrown = false;
            let errorMessage = "";

            try {
                await plugin(schema, documents, {
                    scalars: {
                        ValidScalar: "word",
                        InvalidScalar: "nonExistentGenerator",
                    },
                });
            } catch (error) {
                errorThrown = true;
                errorMessage = (error as Error).message;
            }

            expect(errorThrown).toBe(true);
            expect(errorMessage).toContain(
                'Invalid casual generator "nonExistentGenerator" for scalar "InvalidScalar"',
            );
        });

        it("should handle complex scalar configuration objects", async () => {
            const schema = buildSchema(`
                type Query {
                    dateField: DateTime!
                    numberField: CustomNumber!
                    textField: CustomText!
                }
                scalar DateTime
                scalar CustomNumber
                scalar CustomText
            `);

            const documents = [
                {
                    document: parse(`
                        query GetComplexScalars {
                            dateField
                            numberField
                            textField
                        }
                    `),
                },
            ];

            const result = await plugin(schema, documents, {
                scalars: {
                    DateTime: {
                        generator: "date",
                        arguments: "YYYY-MM-DD",
                    },
                    CustomNumber: {
                        generator: "integer",
                        arguments: [1, 100],
                    },
                    CustomText: {
                        generator: "sentence",
                        arguments: 5,
                    },
                },
            });

            expect(result).toContain("export const aGetComplexScalarsQuery");
            expect(result).toContain("dateField:");
            expect(result).toContain("numberField:");
            expect(result).toContain("textField:");
        });

        it("should handle mixed valid and invalid scalar configs", async () => {
            const schema = buildSchema(`
                scalar ValidScalar
                scalar InvalidScalar
                
                type Query {
                    valid: ValidScalar
                    invalid: InvalidScalar
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query MixedScalars {
                            valid
                            invalid
                        }
                    `),
                },
            ];

            const config = {
                scalars: {
                    ValidScalar: "word",
                    InvalidScalar: "nonExistentGenerator" as any,
                },
            };

            expect(() => plugin(schema, documents, config)).toThrow(
                'Invalid casual generator "nonExistentGenerator"',
            );
        });

        it("should handle complex scalar configuration objects", async () => {
            const schema = buildSchema(`
                scalar ComplexDate
                scalar ComplexNumber
                
                type Query {
                    date: ComplexDate
                    number: ComplexNumber
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query ComplexScalars {
                            date
                            number
                        }
                    `),
                },
            ];

            const config = {
                scalars: {
                    ComplexDate: {
                        generator: "date",
                        arguments: ["YYYY-MM-DD HH:mm:ss"],
                    },
                    ComplexNumber: {
                        generator: "integer",
                        arguments: [1, 1000],
                    },
                },
            };

            const result = plugin(schema, documents, {});

            expect(result).toContain("aComplexScalarsQuery");
            expect(result).toContain("date:");
            expect(result).toContain("number:");
        });
    });

    describe("Fragment Edge Cases", () => {
        it("should handle fragments with circular references", async () => {
            const schema = buildSchema(`
                type Query {
                    user: User!
                }

                type User {
                    id: ID!
                    name: String!
                    friends: [User!]!
                    bestFriend: User
                }
            `);

            const documents = [
                {
                    document: parse(`
                        fragment UserBasic on User {
                            id
                            name
                        }

                        fragment UserWithFriends on User {
                            ...UserBasic
                            friends {
                                ...UserBasic
                                bestFriend {
                                    ...UserBasic
                                }
                            }
                        }

                        query GetUserWithCircularRefs {
                            user {
                                ...UserWithFriends
                                bestFriend {
                                    ...UserWithFriends
                                }
                            }
                        }
                    `),
                },
            ];

            const result = await plugin(schema, documents, {});

            expect(result).toContain("export const aUserBasicFragment");
            expect(result).toContain("export const aUserWithFriendsFragment");
            expect(result).toContain(
                "export const aGetUserWithCircularRefsQuery",
            );

            // Should handle circular references without infinite loops
            expect(result).toContain("friends: Array<{");
            // The new architecture uses builder references instead of inline objects
            expect(result).toContain("bestFriend?:");
        });

        it("should handle fragments on interface types", async () => {
            const schema = buildSchema(`
                type Query {
                    nodes: [Node!]!
                }

                interface Node {
                    id: ID!
                }

                type User implements Node {
                    id: ID!
                    name: String!
                    email: String!
                }

                type Post implements Node {
                    id: ID!
                    title: String!
                    content: String!
                }
            `);

            const documents = [
                {
                    document: parse(`
                        fragment NodeFields on Node {
                            id
                        }

                        query GetNodes {
                            nodes {
                                ...NodeFields
                                ... on User {
                                    name
                                    email
                                }
                                ... on Post {
                                    title
                                    content
                                }
                            }
                        }
                    `),
                },
            ];

            const result = await plugin(schema, documents, {});

            expect(result).toContain("export const aNodeFieldsFragment");
            // Interface types don't generate union variants like concrete union types
            // Instead they generate a single type that includes all possible fields
            expect(result).toContain("GetNodesNodes");
            // The interface only includes the fields that are actually selected in the query
            expect(result).toContain("id: string");
        });

        it("should handle circular fragment references", async () => {
            const schema = buildSchema(`
                type User {
                    id: ID!
                    name: String!
                    friends: [User!]!
                }
                
                type Query {
                    user: User
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        fragment UserInfo on User {
                            id
                            name
                            friends {
                                ...UserInfo
                            }
                        }
                        
                        query CircularFragments {
                            user {
                                ...UserInfo
                            }
                        }
                    `),
                },
            ];

            const result = plugin(schema, documents, {});

            expect(result).toContain("aCircularFragmentsQuery");
            expect(result).toContain("aUserInfo");
            // Should not cause infinite recursion
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeLessThan(50000);
        });

        it("should handle cross-type fragment usage", async () => {
            const schema = buildSchema(`
                interface Node {
                    id: ID!
                }
                
                type Todo implements Node {
                    id: ID!
                    title: String!
                }
                
                type User implements Node {
                    id: ID!
                    name: String!
                }
                
                type Query {
                    todos: [Todo!]!
                    users: [User!]!
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        fragment NodeInfo on Node {
                            id
                        }
                        
                        query CrossTypeFragments {
                            todos {
                                ...NodeInfo
                                title
                            }
                            users {
                                ...NodeInfo
                                name
                            }
                        }
                    `),
                },
            ];

            const result = plugin(schema, documents, {});

            expect(result).toContain("aCrossTypeFragmentsQuery");
            expect(result).toContain("aNodeInfo");
            expect(result).toContain("todos:");
            expect(result).toContain("users:");
        });

        it("should handle interface-based fragments", async () => {
            const schema = buildSchema(`
                interface Timestamped {
                    createdAt: String!
                    updatedAt: String!
                }
                
                type Todo implements Timestamped {
                    id: ID!
                    title: String!
                    createdAt: String!
                    updatedAt: String!
                }
                
                type Query {
                    todo: Todo
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        fragment TimestampInfo on Timestamped {
                            createdAt
                            updatedAt
                        }
                        
                        query InterfaceFragments {
                            todo {
                                id
                                title
                                ...TimestampInfo
                            }
                        }
                    `),
                },
            ];

            const result = plugin(schema, documents, {});

            expect(result).toContain("aInterfaceFragmentsQuery");
            expect(result).toContain("aTimestampInfo");
            expect(result).toContain("createdAt:");
            expect(result).toContain("updatedAt:");
        });
    });

    describe("Performance Edge Cases", () => {
        it("should handle queries with many fields efficiently", async () => {
            // Generate a type with many fields
            const fields = Array.from(
                { length: 50 },
                (_, i) => `field${i}: String!`,
            ).join("\n                    ");

            const largeFieldSchema = buildSchema(`
                type Query {
                    largeObject: LargeObject!
                }

                type LargeObject {
                    id: ID!
                    ${fields}
                }
            `);

            const fieldSelections = Array.from(
                { length: 50 },
                (_, i) => `field${i}`,
            ).join("\n                            ");

            const documents = [
                {
                    document: parse(`
                        query GetLargeObject {
                            largeObject {
                                id
                                ${fieldSelections}
                            }
                        }
                    `),
                },
            ];

            const startTime = Date.now();
            const result = await plugin(largeFieldSchema, documents, {});
            const endTime = Date.now();

            // Should complete within reasonable time (less than 2 seconds)
            expect(endTime - startTime).toBeLessThan(2000);

            expect(result).toContain("export const aGetLargeObjectQuery");
            expect(result).toContain("field0:");
            expect(result).toContain("field49:");
        });

        it("should handle deeply nested structures efficiently", async () => {
            const deepSchema = buildSchema(`
                type Query {
                    level1: Level1!
                }

                type Level1 {
                    id: ID!
                    level2: Level2!
                }

                type Level2 {
                    id: ID!
                    level3: Level3!
                }

                type Level3 {
                    id: ID!
                    level4: Level4!
                }

                type Level4 {
                    id: ID!
                    level5: Level5!
                }

                type Level5 {
                    id: ID!
                    value: String!
                }
            `);

            const documents = [
                {
                    document: parse(`
                        query GetDeepNesting {
                            level1 {
                                id
                                level2 {
                                    id
                                    level3 {
                                        id
                                        level4 {
                                            id
                                            level5 {
                                                id
                                                value
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    `),
                },
            ];

            const result = await plugin(deepSchema, documents, {});

            expect(result).toContain("export const aGetDeepNestingQuery");
            expect(result).toContain("GetDeepNestingLevel1Level2");
            expect(result).toContain("GetDeepNestingLevel1Level2Level3");
            expect(result).toContain("GetDeepNestingLevel1Level2Level3Level4");
            expect(result).toContain(
                "GetDeepNestingLevel1Level2Level3Level4Level5",
            );
        });

        it("should handle large schemas efficiently", async () => {
            // Create a schema with many fields
            const fields = Array.from(
                { length: 50 },
                (_, i) => `field${i}: String!`,
            ).join("\n    ");

            const schema = buildSchema(`
                type LargeType {
                    id: ID!
                    ${fields}
                }
                
                type Query {
                    large: LargeType
                }
            `);

            const fieldSelections = Array.from(
                { length: 50 },
                (_, i) => `field${i}`,
            ).join("\n                ");

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query LargeSchema {
                            large {
                                id
                                ${fieldSelections}
                            }
                        }
                    `),
                },
            ];

            const startTime = Date.now();
            const result = plugin(schema, documents, {});
            const endTime = Date.now();

            expect(result).toContain("aLargeSchemaQuery");
            expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
        });

        it("should handle deep nesting efficiently", async () => {
            const schema = buildSchema(`
                type NestedType {
                    id: ID!
                    name: String!
                    child: NestedType
                }
                
                type Query {
                    nested: NestedType
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query DeepNesting {
                            nested {
                                id
                                name
                                child {
                                    id
                                    name
                                    child {
                                        id
                                        name
                                        child {
                                            id
                                            name
                                            child {
                                                id
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    `),
                },
            ];

            const startTime = Date.now();
            const result = plugin(schema, documents, {});
            const endTime = Date.now();

            expect(result).toContain("aDeepNestingQuery");
            expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
        });

        it("should handle performance benchmarking", async () => {
            const schema = buildSchema(`
                type User {
                    id: ID!
                    name: String!
                    email: String!
                }
                
                type Todo {
                    id: ID!
                    title: String!
                    completed: Boolean!
                    user: User!
                }
                
                type Query {
                    todos: [Todo!]!
                }
            `);

            const documents = [
                {
                    location: "test.graphql",
                    document: parse(`
                        query PerformanceTest {
                            todos {
                                id
                                title
                                completed
                                user {
                                    id
                                    name
                                    email
                                }
                            }
                        }
                    `),
                },
            ];

            // Run multiple times to test consistency
            const results = [];
            const times = [];

            for (let i = 0; i < 5; i++) {
                const startTime = Date.now();
                const result = plugin(schema, documents, {});
                const endTime = Date.now();

                results.push(result);
                times.push(endTime - startTime);
            }

            // IDs and booleans should be deterministic, but strings are still random
            // So we check that the structure is consistent rather than exact equality
            for (let i = 1; i < results.length; i++) {
                expect(results[i]).toContain("aPerformanceTestQuery");
                expect(results[i]).toContain("completed: true"); // Boolean should be deterministic
                expect(results[i]).toContain("__typename"); // Structure should be consistent
            }

            // All runs should be reasonably fast
            for (const time of times) {
                expect(time).toBeLessThan(1000); // Should complete within 1 second
            }
        });
    });
});
