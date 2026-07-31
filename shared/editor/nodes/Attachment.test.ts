// @vitest-environment jsdom

import { DOMParser, Schema } from "prosemirror-model";
import { EditorState, NodeSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import env from "../../env";
import type { Editor } from "../../../app/editor";
import insertFiles from "../commands/insertFiles";
import Attachment from "./Attachment";

vi.mock("../commands/insertFiles", () => ({
  __esModule: true,
  default: vi.fn(),
}));

const mockedInsertFiles = vi.mocked(insertFiles);

const originalBasePath = env?.BASE_PATH;

afterEach(() => {
  if (env) {
    env.BASE_PATH = originalBasePath;
  }
  vi.restoreAllMocks();
  mockedInsertFiles.mockReset();
});

(env ? describe : describe.skip)("Attachment", () => {
  it("removes the deployment base path when parsing editor DOM", () => {
    env.BASE_PATH = "/apps/knowledge";
    const schema = new Schema({
      nodes: {
        doc: { content: "attachment*" },
        attachment: new Attachment().schema,
        text: { group: "inline" },
      },
    });
    const container = document.createElement("div");
    container.innerHTML =
      '<a class="attachment" href="/apps/knowledge/api/attachments.redirect?id=123">file.pdf</a>';
    const link = container.querySelector("a");
    if (!link) {
      throw new Error("Expected attachment link");
    }
    Object.defineProperty(link, "innerText", { value: "file.pdf" });

    const doc = DOMParser.fromSchema(schema).parse(container);

    expect(doc.firstChild?.attrs.href).toBe("/api/attachments.redirect?id=123");
  });

  it("forces replacement images to remain attachment nodes", () => {
    const extension = new Attachment();
    const schema = new Schema({
      nodes: {
        doc: { content: "attachment*" },
        attachment: extension.schema,
        text: { group: "inline" },
      },
    });
    const doc = schema.node("doc", undefined, [
      schema.node("attachment", {
        href: "/api/attachments.redirect?id=old",
        title: "old-file.png",
        size: 1,
        contentType: "image/png",
        preview: false,
      }),
    ]);
    const state = EditorState.create({
      doc,
      selection: NodeSelection.create(doc, 0),
    });
    const view = new EditorView(document.createElement("div"), { state });
    const uploadFile = vi.fn().mockResolvedValue("/api/attachments.redirect");
    const editor = Object.assign(Object.create(null) as Editor, {
      view,
      schema,
      commands: {},
      props: { uploadFile },
    });
    extension.bindEditor(editor);

    const input = document.createElement("input");
    vi.spyOn(document, "createElement").mockReturnValueOnce(input);
    vi.spyOn(input, "click").mockImplementation(() => undefined);

    const replaceAttachment = extension
      .commands({
        type: schema.nodes.attachment,
      })
      .replaceAttachment();
    expect(replaceAttachment(state)).toBe(true);

    const replacement = new File(["replacement"], "new-file.png", {
      type: "image/png",
    });
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [replacement],
    });
    input.dispatchEvent(new Event("change"));

    expect(mockedInsertFiles).toHaveBeenCalledWith(
      view,
      expect.any(Event),
      0,
      [replacement],
      expect.objectContaining({
        uploadFile,
        isAttachment: true,
        replaceExisting: true,
        attrs: { preview: false },
      })
    );

    view.destroy();
  });
});
