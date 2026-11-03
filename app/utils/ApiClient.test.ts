vi.unmock("~/utils/ApiClient");

import env from "~/env";
import { client } from "./ApiClient";

const originalBasePath = env.BASE_PATH;

beforeEach(() => {
  env.BASE_PATH = "/outline";
});

afterEach(() => {
  env.BASE_PATH = originalBasePath;
  vi.restoreAllMocks();
});

describe("ApiClient", () => {
  it("prefixes root-relative base URL overrides with the application subpath", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await client.post("/passkeys.generateRegistrationOptions", undefined, {
      baseUrl: "/auth",
      retry: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/outline/auth/passkeys.generateRegistrationOptions",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("does not confuse an API base URL with the application base path", async () => {
    env.BASE_PATH = "/api";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await client.post("/passkeys.verifyRegistration", undefined, {
      baseUrl: "/api",
      retry: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/api/passkeys.verifyRegistration",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("leaves absolute base URL overrides unchanged", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await client.post("/endpoint", undefined, {
      baseUrl: "https://api.example.com/auth",
      retry: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/auth/endpoint",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("leaves root deployments unchanged", async () => {
    env.BASE_PATH = "";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await client.post("/passkeys.generateRegistrationOptions", undefined, {
      baseUrl: "/auth",
      retry: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/passkeys.generateRegistrationOptions",
      expect.objectContaining({ method: "POST" })
    );
  });
});
