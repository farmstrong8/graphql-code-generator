import { describe, it, expect } from "vitest";
import { buildSchema } from "graphql";
import { ServiceContainer } from "../ServiceContainer";
import { PluginConfig } from "../../config/PluginConfig";

describe("ServiceContainer", () => {
    const schema = buildSchema(`
        type Query {
            hello: String
        }
    `);

    describe("validateServices", () => {
        it("should validate all services successfully with valid configuration", () => {
            const config = new PluginConfig({});
            const container = new ServiceContainer(schema, config);

            const result = container.validateServices();

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should validate atomic services", () => {
            const config = new PluginConfig({});
            const container = new ServiceContainer(schema, config);

            const result = container.validateServices();

            // Should validate NamingService and BoilerplateService
            expect(result.isValid).toBe(true);

            // The validation should have run without errors
            expect(result.errors).toHaveLength(0);
        });

        it("should validate that all required services are instantiated", () => {
            const config = new PluginConfig({});
            const container = new ServiceContainer(schema, config);

            // All services should be properly instantiated
            expect(container.getScalarHandler()).toBeDefined();
            expect(container.getTypeInferenceService()).toBeDefined();
            expect(container.getNestedTypeService()).toBeDefined();
            expect(container.getUnionMockService()).toBeDefined();
            expect(container.getFieldMockService()).toBeDefined();
            expect(container.getMockObjectBuilder()).toBeDefined();
            expect(container.getCodeBuilder()).toBeDefined();
            expect(container.getBoilerplateService()).toBeDefined();
            expect(container.getNamingService()).toBeDefined();

            const result = container.validateServices();
            expect(result.isValid).toBe(true);
        });

        it("should provide service names for atomic services", () => {
            const config = new PluginConfig({});
            const container = new ServiceContainer(schema, config);

            const boilerplateService = container.getBoilerplateService();
            const namingService = container.getNamingService();

            expect(boilerplateService.serviceName).toBe("BoilerplateService");
            expect(namingService.serviceName).toBe("NamingService");
        });

        it("should validate individual atomic services", () => {
            const config = new PluginConfig({});
            const container = new ServiceContainer(schema, config);

            const boilerplateService = container.getBoilerplateService();
            const namingService = container.getNamingService();

            // Test individual service validation
            const boilerplateResult = boilerplateService.validate();
            expect(boilerplateResult.isValid).toBe(true);

            const namingResult = namingService.validate();
            expect(namingResult.isValid).toBe(true);
        });
    });

    describe("service instantiation", () => {
        it("should create document processor with all dependencies", () => {
            const config = new PluginConfig({});
            const container = new ServiceContainer(schema, config);

            const processor = container.createDocumentProcessor();
            expect(processor).toBeDefined();
        });

        it("should provide access to all required services", () => {
            const config = new PluginConfig({});
            const container = new ServiceContainer(schema, config);

            // Verify all getter methods work
            expect(container.getTypeInferenceService()).toBeDefined();
            expect(container.getNestedTypeService()).toBeDefined();
            expect(container.getScalarHandler()).toBeDefined();
            expect(container.getUnionMockService()).toBeDefined();
            expect(container.getFieldMockService()).toBeDefined();
            expect(container.getMockObjectBuilder()).toBeDefined();
            expect(container.getCodeBuilder()).toBeDefined();
            expect(container.getBoilerplateService()).toBeDefined();
            expect(container.getNamingService()).toBeDefined();
        });
    });
});
