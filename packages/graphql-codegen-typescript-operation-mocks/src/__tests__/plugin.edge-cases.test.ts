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
            expect(result).toContain("bestFriend: {");
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
            expect(result).toContain("name: string");
            expect(result).toContain("email: string");
            expect(result).toContain("title: string");
            expect(result).toContain("content: string");
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
    });
});
