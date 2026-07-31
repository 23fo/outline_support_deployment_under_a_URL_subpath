// @vitest-environment jsdom

import { DOMParser, Schema } from "prosemirror-model";
import env from "../../env";
import Link from "./Link";

const originalBasePath = env?.BASE_PATH;

afterEach(() => {
  if (env) {
    env.BASE_PATH = originalBasePath;
  }
});

(env ? describe : describe.skip)("Link", () => {
  it("removes the deployment base path when parsing editor DOM", () => {
    env.BASE_PATH = "/apps/knowledge";
    const schema = new Schema({
      nodes: {
        doc: { content: "paragraph+" },
        paragraph: { content: "text*", parseDOM: [{ tag: "p" }] },
        text: {},
      },
      marks: { link: new Link().schema },
    });
    const container = document.createElement("div");
    container.innerHTML =
      '<p><a href="/apps/knowledge/doc/example">Example</a></p>';

    const doc = DOMParser.fromSchema(schema).parse(container);

    expect(doc.firstChild?.firstChild?.marks[0]?.attrs.href).toBe(
      "/doc/example"
    );
  });
});
