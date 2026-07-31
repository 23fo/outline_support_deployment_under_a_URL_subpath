// @vitest-environment jsdom

import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import env from "../../env";
import FileHelper from "../lib/FileHelper";
import uploadPlaceholderPlugin from "../lib/uploadPlaceholder";
import insertFiles from "./insertFiles";

const originalBasePath = env?.BASE_PATH;

afterEach(() => {
  if (env) {
    env.BASE_PATH = originalBasePath;
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

(env ? describe : describe.skip)("insertFiles", () => {
  it("resolves an uploaded image for loading without changing its stored URL", async () => {
    env.BASE_PATH = "/apps/knowledge";
    vi.spyOn(FileHelper, "getImageDimensions").mockResolvedValue({
      width: 100,
      height: 50,
    });
    vi.spyOn(FileHelper, "getImageSourceAttr").mockResolvedValue(undefined);

    const NativeURL = URL;
    class TestURL extends NativeURL {
      static createObjectURL() {
        return "blob:image";
      }
    }
    vi.stubGlobal("URL", TestURL);

    const loadedSources: string[] = [];
    class TestImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(value: string) {
        loadedSources.push(value);
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", TestImage);

    const schema = new Schema({
      nodes: {
        doc: { content: "paragraph+" },
        paragraph: {
          content: "image*",
          toDOM: () => ["p", 0],
        },
        image: {
          inline: true,
          attrs: {
            src: { default: "" },
            source: { default: null },
            width: { default: null },
            height: { default: null },
          },
          toDOM: (node) => ["img", { src: node.attrs.src }],
        },
        text: {},
      },
    });
    const state = EditorState.create({
      schema,
      doc: schema.node("doc", null, [schema.node("paragraph")]),
      plugins: [uploadPlaceholderPlugin],
    });
    const view = new EditorView(document.createElement("div"), { state });
    const uploadFile = vi
      .fn()
      .mockResolvedValue("/api/attachments.redirect?id=image");
    const file = new File(["image"], "image.png", { type: "image/png" });

    await insertFiles(view, new Event("change"), 1, [file], { uploadFile });

    await vi.waitFor(() => {
      expect(loadedSources).toContain(
        "/apps/knowledge/api/attachments.redirect?id=image"
      );

      let storedSrc: string | undefined;
      view.state.doc.descendants((node) => {
        if (node.type === schema.nodes.image) {
          storedSrc = node.attrs.src;
        }
      });
      expect(storedSrc).toBe("/api/attachments.redirect?id=image");
    });

    view.destroy();
  });
});
