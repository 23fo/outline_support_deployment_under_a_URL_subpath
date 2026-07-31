// @vitest-environment jsdom

import { Schema } from "prosemirror-model";
import { EditorState, NodeSelection } from "prosemirror-state";
import type { Editor } from "../../../app/editor";
import env from "../../env";
import FileHelper from "../lib/FileHelper";
import Diagrams from "./Diagrams";

const diagramsMocks = vi.hoisted(() => ({
  loadDiagram: vi.fn(),
}));

vi.mock("../lib/DiagramsNetClient", () => {
  class MockDiagramsClient {
    format: "xmlsvg" | "xmlpng" = "xmlsvg";
    loadDiagram = diagramsMocks.loadDiagram;

    constructor(onReady: (client: MockDiagramsClient) => void | Promise<void>) {
      this.onReady = onReady;
    }

    open() {
      void this.onReady(this);
    }

    close() {
      // No-op in tests.
    }

    private readonly onReady: (
      client: MockDiagramsClient
    ) => void | Promise<void>;
  }

  return {
    DiagramsNetClient: MockDiagramsClient,
    EMPTY_DIAGRAM_IMAGE: "empty-diagram",
  };
});

const originalBasePath = env?.BASE_PATH;

afterEach(() => {
  if (env) {
    env.BASE_PATH = originalBasePath;
  }
  vi.restoreAllMocks();
  diagramsMocks.loadDiagram.mockReset();
});

(env ? describe : describe.skip)("Diagrams", () => {
  it("resolves a root-relative diagram before loading it", async () => {
    env.BASE_PATH = "/apps/knowledge";
    const schema = new Schema({
      nodes: {
        doc: { content: "image*" },
        image: {
          attrs: {
            src: { default: "" },
            source: { default: null },
          },
        },
        text: {},
      },
    });
    const doc = schema.node("doc", null, [
      schema.node("image", {
        src: "/api/attachments.redirect?id=diagram",
        source: "diagrams.net",
      }),
    ]);
    const state = EditorState.create({
      schema,
      doc,
      selection: NodeSelection.create(doc, 0),
    });
    const editor = Object.assign(Object.create(null) as Editor, {
      schema,
      props: {
        embeds: [],
        theme: { isDark: false },
      },
    });
    const urlToBase64 = vi
      .spyOn(FileHelper, "urlToBase64")
      .mockResolvedValue("data:image/svg+xml;base64,diagram");
    const extension = new Diagrams();
    extension.bindEditor(editor);

    const editDiagram = extension.commands().editDiagram();
    expect(editDiagram(state, vi.fn())).toBe(true);

    await vi.waitFor(() => {
      expect(urlToBase64).toHaveBeenCalledWith(
        "/apps/knowledge/api/attachments.redirect?id=diagram"
      );
      expect(diagramsMocks.loadDiagram).toHaveBeenCalledWith(
        "data:image/svg+xml;base64,diagram"
      );
    });
  });
});
