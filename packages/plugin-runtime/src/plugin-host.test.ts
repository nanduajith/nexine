import { describe, expect, it } from "vitest";

import { inspectPlugin, loadPlugin } from "./plugin-host";

describe("plugin-host", () => {
  it("inspectPlugin rejects invalid manifest", () => {
    const result = inspectPlugin({ manifest: { invalid: true } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/manifest failed validation/);
  });

  it("loadPlugin handles invalid manifest", () => {
    const result = loadPlugin({
      manifest: { invalid: true },
      pluginSource: "",
      sandboxDocUrl: "",
    });
    expect(result.ok).toBe(false);
  });

  it("loadPlugin creates sandbox for valid manifest", () => {
    // mock document for createPluginSandbox
    const iframeMock = {
      setAttribute: () => {},
      addEventListener: () => {},
      remove: () => {},
      style: { cssText: "" },
      src: "",
    };
    (globalThis as any).document = {
      createElement: () => iframeMock,
    };

    const manifest = {
      manifestVersion: 1,
      id: "dev.a",
      name: "a",
      version: "1.0.0",
      description: "a",
      category: "data",
      entry: "plugin.js",
      permissions: [],
    };
    
    const result = loadPlugin({
      manifest,
      pluginSource: "console.log(\"hi\")",
      sandboxDocUrl: "/sandbox.html",
    });
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sandbox).toBeDefined();
      expect(result.resolution).toBeDefined();
    }
    
    delete (globalThis as any).document;
  });

  it("loadPlugin uses storageBackend and onFatal", () => {
    const iframeMock = { setAttribute: () => {}, addEventListener: () => {}, remove: () => {}, style: { cssText: "" }, src: "" };
    (globalThis as any).document = { createElement: () => iframeMock };

    const manifest = {
      manifestVersion: 1,
      id: "dev.b",
      name: "b",
      version: "1.0.0",
      description: "b",
      category: "data",
      entry: "plugin.js",
      permissions: [],
    };
    
    const result = loadPlugin({
      manifest,
      pluginSource: "",
      sandboxDocUrl: "",
      storageBackend: {} as any,
      onFatal: () => {}
    });
    
    expect(result.ok).toBe(true);
    delete (globalThis as any).document;
  });
});
