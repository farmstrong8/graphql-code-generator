import { describe, it, expect } from "vitest";
import { PluginConfig } from "../PluginConfig";

describe("PluginConfig", () => {
    it("should create default config when no options provided", () => {
        const config = new PluginConfig({});

        expect(config.getRawConfig()).toEqual({});
        expect(config.getConfiguredScalarNames()).toEqual([]);
    });

    it("should parse simple scalar configurations", () => {
        const config = new PluginConfig({
            scalars: {
                Date: "date",
                UUID: "uuid",
            },
        });

        expect(config.getScalarConfig("Date")).toBe("date");
        expect(config.getScalarConfig("UUID")).toBe("uuid");
        expect(config.hasScalarConfig("Date")).toBe(true);
        expect(config.hasScalarConfig("UUID")).toBe(true);
        expect(config.hasScalarConfig("NotConfigured")).toBe(false);
        expect(config.getConfiguredScalarNames()).toEqual(["Date", "UUID"]);
    });

    it("should parse complex scalar configurations", () => {
        const config = new PluginConfig({
            scalars: {
                Date: {
                    generator: "date",
                    arguments: "YYYY-MM-DD",
                },
                JSON: {
                    generator: "random_value",
                    arguments: ["option1", "option2"],
                },
            },
        });

        expect(config.getScalarConfig("Date")).toEqual({
            generator: "date",
            arguments: "YYYY-MM-DD",
        });
        expect(config.getScalarConfig("JSON")).toEqual({
            generator: "random_value",
            arguments: ["option1", "option2"],
        });
    });

    it("should handle mixed scalar configuration formats", () => {
        const config = new PluginConfig({
            scalars: {
                Date: "date",
                UUID: "uuid",
                JSON: {
                    generator: "random_value",
                    arguments: [],
                },
            },
        });

        expect(config.getScalarConfig("Date")).toBe("date");
        expect(config.getScalarConfig("UUID")).toBe("uuid");
        expect(config.getScalarConfig("JSON")).toEqual({
            generator: "random_value",
            arguments: [],
        });
        expect(config.getConfiguredScalarNames()).toHaveLength(3);
    });

    it("should handle empty scalar configurations", () => {
        const config = new PluginConfig({
            scalars: {},
        });

        expect(config.getRawConfig().scalars).toEqual({});
        expect(config.getConfiguredScalarNames()).toEqual([]);
    });

    it("should handle undefined config", () => {
        const config = new PluginConfig();

        expect(config.getRawConfig()).toEqual({});
        expect(config.getConfiguredScalarNames()).toEqual([]);
    });

    it("should handle null config", () => {
        const config = new PluginConfig({});

        expect(config.getRawConfig()).toEqual({});
        expect(config.getConfiguredScalarNames()).toEqual([]);
    });

    it("should ignore invalid scalar configurations", () => {
        const config = new PluginConfig({
            scalars: {
                Date: "date",
                UUID: "uuid",
            },
        });

        expect(config.getScalarConfig("Date")).toBe("date");
        expect(config.getScalarConfig("UUID")).toBe("uuid");
    });

    it("should validate configuration", () => {
        const validConfig = new PluginConfig({
            scalars: {
                Date: "date",
                JSON: {
                    generator: "sentence",
                    arguments: [],
                },
            },
        });

        const validation = validConfig.validate();
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);
    });
});
