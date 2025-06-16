import type { GraphQLSchema } from "graphql";
import { PluginConfig } from "../config/PluginConfig";
import { DocumentProcessor } from "../processors/DocumentProcessor";
import { MockObjectBuilder } from "../builders/MockObjectBuilder";
import { TypeScriptCodeBuilder } from "../builders/TypeScriptCodeBuilder";
import { ScalarHandler } from "../handlers/ScalarHandler";
import { SelectionSetHandler } from "../handlers/SelectionSetHandler";
import { TypeInferenceService } from "../services/TypeInferenceService";
import { NestedTypeService } from "../services/NestedTypeService";
import { UnionMockService } from "../services/UnionMockService";
import { FieldMockService } from "../services/FieldMockService";
import { BoilerplateService } from "../services/BoilerplateService";
import { NamingService } from "../services/NamingService";
import type {
    AtomicService,
    ServiceValidationResult,
} from "../services/AtomicService";
import { combineValidationResults } from "../services/AtomicService";

/**
 * Service Container for dependency injection and component wiring.
 *
 * This container encapsulates the dependency injection setup, ensuring that all
 * components are properly wired together with their required dependencies.
 * It follows the Inversion of Control (IoC) pattern to manage object creation
 * and dependency resolution.
 */
export class ServiceContainer {
    private readonly scalarHandler: ScalarHandler;
    private readonly selectionSetHandler: SelectionSetHandler;
    private readonly typeInferenceService: TypeInferenceService;
    private readonly nestedTypeService: NestedTypeService;
    private readonly unionMockService: UnionMockService;
    private readonly fieldMockService: FieldMockService;
    private readonly boilerplateService: BoilerplateService;
    private readonly namingService: NamingService;
    private readonly mockObjectBuilder: MockObjectBuilder;
    private readonly codeBuilder: TypeScriptCodeBuilder;

    constructor(
        private readonly schema: GraphQLSchema,
        private readonly config: PluginConfig,
    ) {
        // Initialize core handlers
        this.scalarHandler = new ScalarHandler(config);
        this.selectionSetHandler = new SelectionSetHandler(schema);

        // Initialize services
        this.typeInferenceService = new TypeInferenceService(schema);
        this.nestedTypeService = new NestedTypeService(schema);
        this.unionMockService = new UnionMockService(schema);
        this.fieldMockService = new FieldMockService(this.scalarHandler);
        this.boilerplateService = new BoilerplateService();
        this.namingService = new NamingService(config.getNamingConfig());

        // Initialize builders with all required dependencies
        this.mockObjectBuilder = new MockObjectBuilder(
            schema,
            this.scalarHandler,
            this.selectionSetHandler,
            this.unionMockService,
            this.fieldMockService,
        );

        // TypeScriptCodeBuilder now needs scalarHandler and schema for cascading architecture
        this.codeBuilder = new TypeScriptCodeBuilder(
            this.typeInferenceService,
            this.nestedTypeService,
            this.namingService,
            this.scalarHandler, // Add scalarHandler dependency
            schema, // Add schema dependency
        );
    }

    /**
     * Creates a new document processor instance with all required dependencies.
     *
     * @returns Configured document processor ready to process GraphQL documents
     */
    createDocumentProcessor(): DocumentProcessor {
        return new DocumentProcessor(
            this.schema,
            this.mockObjectBuilder,
            this.codeBuilder,
        );
    }

    /**
     * Gets the configured type inference service.
     *
     * @returns TypeInferenceService instance
     */
    getTypeInferenceService(): TypeInferenceService {
        return this.typeInferenceService;
    }

    /**
     * Gets the configured nested type service.
     *
     * @returns NestedTypeService instance
     */
    getNestedTypeService(): NestedTypeService {
        return this.nestedTypeService;
    }

    /**
     * Gets the configured scalar handler.
     *
     * @returns ScalarHandler instance
     */
    getScalarHandler(): ScalarHandler {
        return this.scalarHandler;
    }

    /**
     * Gets the UnionMockService instance.
     *
     * @returns The configured UnionMockService
     */
    getUnionMockService(): UnionMockService {
        return this.unionMockService;
    }

    /**
     * Gets the FieldMockService instance.
     *
     * @returns The configured FieldMockService
     */
    getFieldMockService(): FieldMockService {
        return this.fieldMockService;
    }

    /**
     * Gets the MockObjectBuilder instance.
     *
     * @returns The configured MockObjectBuilder
     */
    getMockObjectBuilder(): MockObjectBuilder {
        return this.mockObjectBuilder;
    }

    /**
     * Gets the TypeScriptCodeBuilder instance.
     *
     * @returns The configured TypeScriptCodeBuilder
     */
    getCodeBuilder(): TypeScriptCodeBuilder {
        return this.codeBuilder;
    }

    /**
     * Gets the BoilerplateService instance.
     *
     * @returns The configured BoilerplateService
     */
    getBoilerplateService(): BoilerplateService {
        return this.boilerplateService;
    }

    /**
     * Gets the NamingService instance.
     *
     * @returns The configured NamingService
     */
    getNamingService(): NamingService {
        return this.namingService;
    }

    /**
     * Validates all atomic services to ensure they are properly configured.
     *
     * @returns Combined validation result from all services
     */
    validateServices(): ServiceValidationResult {
        const validationResults: ServiceValidationResult[] = [];

        // Validate all services that implement AtomicService interface
        const atomicServices: AtomicService[] = [
            this.boilerplateService,
            this.namingService,
        ];

        for (const service of atomicServices) {
            try {
                const result = service.validate();
                validationResults.push(result);
            } catch (error) {
                validationResults.push({
                    isValid: false,
                    errors: [
                        `${service.serviceName} validation failed: ${error instanceof Error ? error.message : String(error)}`,
                    ],
                    warnings: [],
                });
            }
        }

        // Validate core dependencies
        try {
            // Validate that schema is available
            if (!this.schema) {
                validationResults.push({
                    isValid: false,
                    errors: ["GraphQL schema is required but not provided"],
                    warnings: [],
                });
            }

            // Validate that config is available
            if (!this.config) {
                validationResults.push({
                    isValid: false,
                    errors: [
                        "Plugin configuration is required but not provided",
                    ],
                    warnings: [],
                });
            }

            // Validate that all required services are instantiated
            const requiredServices = [
                { name: "scalarHandler", instance: this.scalarHandler },
                {
                    name: "selectionSetHandler",
                    instance: this.selectionSetHandler,
                },
                {
                    name: "typeInferenceService",
                    instance: this.typeInferenceService,
                },
                { name: "nestedTypeService", instance: this.nestedTypeService },
                { name: "unionMockService", instance: this.unionMockService },
                { name: "fieldMockService", instance: this.fieldMockService },
                { name: "mockObjectBuilder", instance: this.mockObjectBuilder },
                { name: "codeBuilder", instance: this.codeBuilder },
            ];

            for (const service of requiredServices) {
                if (!service.instance) {
                    validationResults.push({
                        isValid: false,
                        errors: [
                            `Required service ${service.name} is not instantiated`,
                        ],
                        warnings: [],
                    });
                }
            }
        } catch (error) {
            validationResults.push({
                isValid: false,
                errors: [
                    `Service container validation failed: ${error instanceof Error ? error.message : String(error)}`,
                ],
                warnings: [],
            });
        }

        return combineValidationResults(validationResults);
    }
}
