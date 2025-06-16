import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSchema, parse } from "graphql";
import { TypeInferenceService } from "../../services/TypeInferenceService";
import { NestedTypeService } from "../../services/NestedTypeService";
import { TypeDefinitionService } from "../../services/TypeDefinitionService";
import { BuilderCodeService } from "../../services/BuilderCodeService";
import type { MockDataObject } from "../../types";

describe("TypeScriptCodeBuilder (Services)", () => {
    let schema: any;
    let typeInferenceService: TypeInferenceService;
    let nestedTypeService: NestedTypeService;
    let typeDefinitionService: TypeDefinitionService;
    let builderCodeService: BuilderCodeService;

    beforeEach(() => {
        schema = buildSchema(`
            type Query {
                hello: String
                user(id: ID!): User
                users: [User!]!
                search: SearchResult
            }

            type User {
                id: ID!
                name: String!
                email: String
                profile: Profile
            }

            type Profile {
                bio: String
                avatar: String
            }

            type Author {
                id: ID!
                name: String!
                books: [String!]!
            }

            union SearchResult = User | Author

            type Mutation {
                addUser(input: AddUserInput!): User
            }

            input AddUserInput {
                name: String!
                email: String
            }
        `);

        typeInferenceService = new TypeInferenceService(schema);
        nestedTypeService = new NestedTypeService(schema);
        typeDefinitionService = new TypeDefinitionService();
        builderCodeService = new BuilderCodeService();
    });

    describe("TypeDefinitionService", () => {
        it("should generate type definition for simple query mock", () => {
            const mockValue = {
                __typename: "Query",
                hello: "Hello World",
            };

            const result = typeDefinitionService.generateNamedTypeDefinition(
                "HelloQuery",
                mockValue,
            );

            expect(result).toContain("type HelloQuery = {");
            expect(result).toContain('"__typename": "Query"');
            expect(result).toContain('hello: "Hello World"');
        });

        it("should generate type definition for mutation mock", () => {
            const mockValue = {
                __typename: "Mutation",
                addUser: {
                    __typename: "User",
                    id: "1",
                    name: "John Doe",
                    email: "john@example.com",
                },
            };

            const result = typeDefinitionService.generateNamedTypeDefinition(
                "AddUserMutation",
                mockValue,
            );

            expect(result).toContain("type AddUserMutation = {");
            expect(result).toContain('"__typename": "Mutation"');
            expect(result).toContain("addUser: {");
            expect(result).toContain('"__typename": "User"');
        });

        it("should handle nested objects properly", () => {
            const mockValue = {
                __typename: "Query",
                user: {
                    __typename: "User",
                    id: "1",
                    name: "John Doe",
                    profile: {
                        __typename: "Profile",
                        bio: "Developer",
                        avatar: "avatar.jpg",
                    },
                },
            };

            const result = typeDefinitionService.generateNamedTypeDefinition(
                "UserWithProfileQuery",
                mockValue,
            );

            expect(result).toContain("user: {");
            expect(result).toContain("profile: {");
            expect(result).toContain('"__typename": "Profile"');
            expect(result).toContain('bio: "Developer"');
            expect(result).toContain('avatar: "avatar.jpg"');
        });

        it("should handle arrays correctly", () => {
            const mockValue = {
                __typename: "Query",
                users: [
                    {
                        __typename: "User",
                        id: "1",
                        name: "John Doe",
                    },
                    {
                        __typename: "User",
                        id: "2",
                        name: "Jane Smith",
                    },
                ],
            };

            const result = typeDefinitionService.generateNamedTypeDefinition(
                "UsersQuery",
                mockValue,
            );

            expect(result).toContain("users: Array<{");
            expect(result).toContain('"__typename": "User"');
            expect(result).toContain('id: "1"');
            expect(result).toContain('name: "John Doe"');
        });
    });

    describe("BuilderCodeService", () => {
        it("should generate builder function", () => {
            const mockValue = {
                __typename: "Query",
                hello: "Hello World",
            };

            const result = builderCodeService.generateBuilderFunction(
                "aHelloQuery",
                "HelloQuery",
                mockValue,
            );

            expect(result).toContain(
                "export const aHelloQuery = createBuilder<HelloQuery>",
            );
            expect(result).toContain('"__typename": "Query"');
            expect(result).toContain('hello: "Hello World"');
        });

        it("should handle nested objects in builder", () => {
            const mockValue = {
                __typename: "Query",
                user: {
                    __typename: "User",
                    id: "1",
                    name: "John Doe",
                    profile: {
                        __typename: "Profile",
                        bio: "Developer",
                        avatar: "avatar.jpg",
                    },
                },
            };

            const result = builderCodeService.generateBuilderFunction(
                "aUserWithProfileQuery",
                "UserWithProfileQuery",
                mockValue,
            );

            expect(result).toContain("export const aUserWithProfileQuery");
            expect(result).toContain("user: {");
            expect(result).toContain("profile: {");
            expect(result).toContain('"__typename": "Profile"');
        });
    });

    describe("TypeInferenceService", () => {
        it("should infer scalar types correctly", () => {
            const userType = schema.getType("User");
            const idField = userType.getFields().id;

            const result = typeInferenceService.analyzeGraphQLType(
                idField.type,
            );

            expect(result.typeString).toBe("string");
            expect(result.isNullable).toBe(false);
            expect(result.isArray).toBe(false);
        });

        it("should infer object types correctly", () => {
            const userType = schema.getType("User");

            const result = typeInferenceService.analyzeGraphQLType(userType);

            // The service returns null for typeString when no selection set is provided
            expect(result.typeString).toBe("null");
            // Without a selection set, objectFields won't be populated
            expect(result.isNullable).toBe(true);
            expect(result.isArray).toBe(false);
        });

        it("should infer union types correctly", () => {
            const searchResultType = schema.getType("SearchResult");

            const result =
                typeInferenceService.analyzeGraphQLType(searchResultType);

            expect(result.typeString).toBe("object");
        });

        it("should generate TypeScript type strings", () => {
            const typeInfo = {
                typeString: "string",
                isArray: false,
                isNullable: true,
            };

            const result = typeInferenceService.generateTypeString(typeInfo);

            expect(result).toBe("string");
        });

        it("should generate array type strings", () => {
            const typeInfo = {
                typeString: "string",
                isArray: true,
                isNullable: true,
            };

            const result = typeInferenceService.generateTypeString(typeInfo);

            expect(result).toBe("Array<string>");
        });
    });

    describe("NestedTypeService", () => {
        it("should generate builder names correctly", () => {
            const result = nestedTypeService.generateBuilderName(
                "GetUser",
                "user.profile",
                "Profile",
            );

            expect(result).toBe("aGetUserUserProfile");
        });
    });

    describe("integration tests", () => {
        it("should work together to generate complete mock", () => {
            const mockValue = {
                __typename: "Query",
                hello: "world",
            };

            // Generate type definition
            const typeDefinition =
                typeDefinitionService.generateNamedTypeDefinition(
                    "TestQuery",
                    mockValue,
                );

            // Generate builder function
            const builderFunction = builderCodeService.generateBuilderFunction(
                "aTestQuery",
                "TestQuery",
                mockValue,
            );

            expect(typeDefinition).toContain("type TestQuery = {");
            expect(builderFunction).toContain("export const aTestQuery");
            expect(builderFunction).toContain("createBuilder<TestQuery>");
        });
    });
});
