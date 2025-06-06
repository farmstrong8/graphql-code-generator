import type { GraphQLSchema } from "graphql";
import { PluginConfig } from "../config/PluginConfig";
import { DocumentProcessor } from "../processors/DocumentProcessor";
import { MockObjectBuilder } from "../builders/MockObjectBuilder";
import { TypeScriptCodeBuilder } from "../builders/TypeScriptCodeBuilder";
import { ScalarHandler } from "../handlers/ScalarHandler";
import { UnionHandler } from "../handlers/UnionHandler";
import { SelectionSetHandler } from "../handlers/SelectionSetHandler";
import { TypeInferenceService } from "../services/TypeInferenceService";
import { NestedTypeCollector } from "../services/NestedTypeCollector";

/**
 * Factory for creating specialized processors and handlers for mock generation.
 *
 * This factory encapsulates the dependency injection setup, ensuring that all
 * components are properly wired together with their required dependencies.
 */
export class ArtifactFactory {
    private readonly scalarHandler: ScalarHandler;
    private readonly selectionSetHandler: SelectionSetHandler;
    private readonly typeInferenceService: TypeInferenceService;
    private readonly nestedTypeCollector: NestedTypeCollector;
    private readonly mockObjectBuilder: MockObjectBuilder;
    private readonly codeBuilder: TypeScriptCodeBuilder;
    private readonly unionHandler: UnionHandler;

    constructor(
        private readonly schema: GraphQLSchema,
        private readonly config: PluginConfig,
    ) {
        // Initialize services first
        this.typeInferenceService = new TypeInferenceService(this.schema);
        this.nestedTypeCollector = new NestedTypeCollector(this.schema);

        // Initialize handlers with minimal dependencies first
        this.scalarHandler = new ScalarHandler(this.config);
        this.selectionSetHandler = new SelectionSetHandler(this.schema);
        this.codeBuilder = new TypeScriptCodeBuilder(
            this.typeInferenceService,
            this.nestedTypeCollector,
        );

        // Initialize builders that depend on handlers
        this.mockObjectBuilder = new MockObjectBuilder(
            this.schema,
            this.scalarHandler,
            this.selectionSetHandler,
        );

        // Initialize union handler (without circular dependency)
        this.unionHandler = new UnionHandler(this.schema);

        // Wire the circular dependency between union handler and mock object builder
        this.mockObjectBuilder.setUnionHandler(this.unionHandler);
    }

    /**
     * Creates a new document processor instance.
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
}
