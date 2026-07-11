import { describe, it, expect } from "@jest/globals";
import { AdminService, MAX_BULK_PRS } from "../../src/services/admin.service.js";
describe("AdminService parsing helpers", () => {
  const admin = new AdminService();

  it("parseRepoUrl handles common formats", () => {
    expect(admin.parseRepoUrl("https://github.com/owner/repo")).toEqual({ owner: "owner", repo: "repo" });
    expect(admin.parseRepoUrl("owner/repo")).toEqual({ owner: "owner", repo: "repo" });
    expect(admin.parseRepoUrl("invalid")).toBeNull();
  });

  it("parsePrUrl extracts owner, repo, number", () => {
    expect(admin.parsePrUrl("https://github.com/foo/bar/pull/42")).toEqual({
      owner: "foo",
      repo: "bar",
      number: 42,
    });
    expect(admin.parsePrUrl("not-a-url")).toBeNull();
  });

  it("parsePrNumbers dedupes and filters invalid", () => {
    expect(admin.parsePrNumbers("42, 56, 42, abc, 101")).toEqual([42, 56, 101]);
    expect(admin.parsePrNumbers([1, 2, 2, 0])).toEqual([1, 2]);
  });

  it("parsePrUrlsList dedupes cross-line URLs", () => {
    const urls = [
      "https://github.com/a/b/pull/1",
      "https://github.com/a/b/pull/1",
      "https://github.com/c/d/pull/2",
    ].join("\n");
    const parsed = admin.parsePrUrlsList(urls);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].number).toBe(1);
    expect(parsed[1].number).toBe(2);
  });

  it("MAX_BULK_PRS is 50", () => {
    expect(MAX_BULK_PRS).toBe(50);
  });
});
