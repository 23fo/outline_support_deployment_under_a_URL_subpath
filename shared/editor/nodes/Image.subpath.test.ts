// @vitest-environment jsdom

import { Schema } from "prosemirror-model";
import env from "../../env";
import Image, { downloadImageNode } from "./Image";

const originalBasePath = env?.BASE_PATH;

afterEach(() => {
  if (env) {
    env.BASE_PATH = originalBasePath;
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

(env ? describe : describe.skip)("Image subpath handling", () => {
  it("resolves a root-relative image before downloading", async () => {
    env.BASE_PATH = "/apps/knowledge";
    const schema = new Schema({
      nodes: {
        doc: { content: "image*" },
        image: new Image().schema,
        text: { group: "inline" },
      },
    });
    const node = schema.node("image", {
      src: "/api/attachments.redirect?id=image",
      alt: "image",
    });
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(
        new Blob(["image"], {
          type: "image/png",
        })
      )
    );
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:image"),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined
    );

    await downloadImageNode(node);

    expect(fetch).toHaveBeenCalledWith(
      "/apps/knowledge/api/attachments.redirect?id=image",
      { cache: undefined }
    );
  });
});
