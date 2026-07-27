import { describe, expect, it, vi, afterEach } from "vitest";

import type { HostServices } from "./rpc-host";
import { createPluginSandbox } from "./sandbox";

describe("sandbox", () => {
  afterEach(() => {
    delete (globalThis as any).document;
    vi.restoreAllMocks();
  });

  it("creates an iframe and attaches rpc host on load", () => {
    const addEventListenerMock = vi.fn();
    const setAttributeMock = vi.fn();
    const removeMock = vi.fn();
    
    let loadHandler: () => void = () => {};
    
    addEventListenerMock.mockImplementation((event, handler) => {
      if (event === "load") {
        loadHandler = handler;
      }
    });

    const iframeMock = {
      setAttribute: setAttributeMock,
      addEventListener: addEventListenerMock,
      remove: removeMock,
      style: { cssText: "" },
      src: "",
      contentWindow: {
        postMessage: vi.fn(),
      },
    };

    (globalThis as any).document = {
      createElement: vi.fn(() => iframeMock),
    };

    const services = {
      storage: {} as any,
      clipboard: {} as any,
    } as HostServices;

    const sandbox = createPluginSandbox({
      manifest: { name: "test", id: "t", version: "1", entry: "a" } as any,
      granted: [],
      pluginSource: "code",
      services,
      sandboxDocUrl: "http://localhost/sandbox.html",
    });

    expect((globalThis as any).document.createElement).toHaveBeenCalledWith("iframe");
    expect(setAttributeMock).toHaveBeenCalledWith("sandbox", "allow-scripts");
    expect(iframeMock.src).toBe("http://localhost/sandbox.html");

    // trigger load
    loadHandler();

    expect(iframeMock.contentWindow.postMessage).toHaveBeenCalled();
    const callArgs = (iframeMock.contentWindow.postMessage as any).mock.calls[0];
    expect(callArgs[0]).toEqual({ type: "nx:port" });
    expect(callArgs[1]).toBe("*");
    expect(callArgs[2][0]).toBeInstanceOf(MessagePort);

    sandbox.dispose();
    expect(removeMock).toHaveBeenCalled();
    
    // trigger load after dispose
    (iframeMock.contentWindow.postMessage as any).mockClear();
    loadHandler();
    expect(iframeMock.contentWindow.postMessage).not.toHaveBeenCalled();
  });
  
  it("does nothing on load if contentWindow is null", () => {
    let loadHandler: () => void = () => {};
    const iframeMock = {
      setAttribute: vi.fn(),
      addEventListener: (event: string, handler: any) => { if (event === "load") loadHandler = handler; },
      remove: vi.fn(),
      style: { cssText: "" },
      src: "",
      contentWindow: null,
    };
    (globalThis as any).document = {
      createElement: vi.fn(() => iframeMock),
    };

    const sandbox = createPluginSandbox({
      manifest: { name: "test", id: "t", version: "1", entry: "a" } as any,
      granted: [],
      pluginSource: "code",
      services: {} as any,
      sandboxDocUrl: "http://localhost/sandbox.html",
    });

    loadHandler(); // Should not throw
    
    sandbox.dispose();
  });

  it("attaches onFatal handler if provided", () => {
    const iframeMock = {
      setAttribute: () => {},
      addEventListener: (e: any, h: any) => { if (e === "load") h(); },
      remove: () => {},
      style: { cssText: "" },
      src: "",
      contentWindow: { postMessage: () => {} }
    };
    (globalThis as any).document = { createElement: () => iframeMock };
    
    const s = createPluginSandbox({
      manifest: { name: "t", id: "t", version: "1", entry: "a" } as any,
      granted: [],
      pluginSource: "c",
      services: {} as any,
      sandboxDocUrl: "",
      onFatal: () => {}
    });
    s.dispose();
  });
});
