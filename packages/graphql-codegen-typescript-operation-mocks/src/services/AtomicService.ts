/**
 * Common interface for all atomic services in the plugin architecture.
 *
 * This interface ensures consistency across all services and enables
 * service validation and dependency checking.
 */
export interface AtomicService {
    /** Unique identifier for this service */
    readonly serviceName: string;

    /**
     * Validates that the service is properly configured and ready to use.
     * @returns Validation result with any errors found
     */
    validate(): ServiceValidationResult;
}

/**
 * Result of service validation.
 */
export interface ServiceValidationResult {
    /** Whether the service passed validation */
    isValid: boolean;
    /** Array of validation error messages */
    errors: string[];
    /** Array of validation warning messages */
    warnings: string[];
}

/**
 * Helper function to create a successful validation result.
 */
export function createValidResult(): ServiceValidationResult {
    return {
        isValid: true,
        errors: [],
        warnings: [],
    };
}

/**
 * Helper function to create a failed validation result.
 */
export function createInvalidResult(
    errors: string[],
    warnings: string[] = [],
): ServiceValidationResult {
    return {
        isValid: false,
        errors,
        warnings,
    };
}

/**
 * Helper function to combine multiple validation results.
 */
export function combineValidationResults(
    results: ServiceValidationResult[],
): ServiceValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let isValid = true;

    for (const result of results) {
        if (!result.isValid) {
            isValid = false;
        }
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }

    return {
        isValid,
        errors: allErrors,
        warnings: allWarnings,
    };
}
