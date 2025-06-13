// Export the properly named types
export * from "./GeneratedCodeArtifact";
export * from "./MockDataObject";

// Backward compatibility exports (deprecated - use new names)
export type { GeneratedCodeArtifact as MockArtifact } from "./GeneratedCodeArtifact";
export type { MockDataObject as NamedMock } from "./MockDataObject";
