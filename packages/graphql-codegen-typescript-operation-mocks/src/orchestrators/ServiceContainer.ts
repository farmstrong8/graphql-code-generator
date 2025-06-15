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
}
