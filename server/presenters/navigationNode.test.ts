import env from "@server/env";
import { Team } from "@server/models";
import presentNavigationNode from "./navigationNode";

const originalUrl = env.URL;

afterEach(() => {
  env.URL = originalUrl;
});

describe("presentNavigationNode", () => {
  it("resolves recursive navigation URLs beneath the team subpath", () => {
    env.URL = "https://app.example.com/apps/knowledge";
    const team = Team.build({});

    expect(
      presentNavigationNode(team, {
        id: "parent",
        title: "Parent",
        url: "/doc/parent",
        children: [
          {
            id: "child",
            title: "Child",
            url: "/collection/child",
            children: [],
          },
        ],
      })
    ).toEqual({
      id: "parent",
      title: "Parent",
      url: "https://app.example.com/apps/knowledge/doc/parent",
      children: [
        {
          id: "child",
          title: "Child",
          url: "https://app.example.com/apps/knowledge/collection/child",
          children: [],
        },
      ],
    });
  });
});
