import { beforeEach, describe, expect, it, vi } from "vitest";

const searchWordPressTypesenseMock = vi.fn();
const getServerSessionMock = vi.fn();

vi.mock("@/lib/api/wordpress-internal", () => ({
  searchWordPressTypesense: searchWordPressTypesenseMock,
}));

vi.mock("@/lib/auth/session", () => ({
  getServerSession: getServerSessionMock,
}));

async function loadRoute() {
  const module = await import("@/app/api/public/search/route");
  return module.GET;
}

function createRequest(query: string) {
  return new Request(`http://localhost/api/public/search?q=${encodeURIComponent(query)}`);
}

const groups = {
  article: [{ id: 1, title: "Actualité" }],
  classified: [{ id: 2, title: "Annonce" }],
  job: [{ id: 3, title: "Emploi" }],
  tender: [{ id: 4, title: "Appel d'offres" }],
  directory: [{ id: 5, title: "Entreprise" }],
};

describe("public Typesense search route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    searchWordPressTypesenseMock.mockResolvedValue({ groups });
    getServerSessionMock.mockReturnValue({ planId: "free" });
  });

  it("delegates a valid query to the internal Typesense route and hides tenders for Free", async () => {
    const GET = await loadRoute();

    const response = await GET(createRequest("emploi") as never);

    expect(searchWordPressTypesenseMock).toHaveBeenCalledWith("emploi");
    await expect(response.json()).resolves.toMatchObject({
      groups: {
        article: groups.article,
        classified: groups.classified,
        job: groups.job,
        tender: [],
        directory: groups.directory,
      },
    });
  });

  it("keeps tenders for Business users", async () => {
    getServerSessionMock.mockReturnValue({ planId: "business" });
    const GET = await loadRoute();

    const response = await GET(createRequest("emploi") as never);

    await expect(response.json()).resolves.toMatchObject({ groups });
  });

  it("does not contact Typesense before two characters", async () => {
    const GET = await loadRoute();

    const response = await GET(createRequest("e") as never);

    expect(searchWordPressTypesenseMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      groups: { article: [], classified: [], job: [], tender: [], directory: [] },
    });
  });

  it("returns a neutral unavailable response when the private index fails", async () => {
    searchWordPressTypesenseMock.mockRejectedValue(new Error("connection refused"));
    const GET = await loadRoute();

    const response = await GET(createRequest("emploi") as never);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Recherche indisponible." });
  });
});
