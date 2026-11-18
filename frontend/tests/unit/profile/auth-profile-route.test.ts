import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const setSessionCookieMock = vi.fn();
const updateWordPressUserProfileMock = vi.fn();
const getWordPressUserProfileMock = vi.fn();
const resolvePreferredProfilePhotoMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getServerSession: getServerSessionMock,
  setSessionCookie: setSessionCookieMock,
}));

vi.mock("@/lib/api/wordpress-internal", () => ({
  getWordPressUserProfile: getWordPressUserProfileMock,
  updateWordPressUserProfile: updateWordPressUserProfileMock,
}));

vi.mock("@/lib/auth/profile-photo", () => ({
  resolvePreferredProfilePhoto: resolvePreferredProfilePhotoMock,
}));

async function loadRoute() {
  const module = await import("@/app/api/auth/profile/route");
  return {
    GET: module.GET,
    PATCH: module.PATCH,
  };
}

describe("auth profile route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getServerSessionMock.mockReturnValue({
      wpUserId: 42,
      name: "Rija",
      username: "rija",
      picture: "https://cdn.2424.mg/old-avatar.jpg",
      authProvider: "google",
      firstName: "Rija",
      lastName: "Andrian",
      onboardingCompleted: false,
      onboardingIntent: "signup",
    });
    resolvePreferredProfilePhotoMock.mockReturnValue("https://cdn.2424.mg/new-avatar.jpg");
  });

  it("returns 401 when the user is not connected", async () => {
    getServerSessionMock.mockReturnValue(null);
    const { GET } = await loadRoute();

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Utilisateur non connecte.",
    });
  });

  it("normalizes business regions and cities to a single clean value during profile updates", async () => {
    updateWordPressUserProfileMock.mockResolvedValue({
      wpUserId: 42,
      displayName: "Rija Andrian",
      username: "rija-updated",
      firstName: "Rija",
      lastName: "Andrian",
      profilePhoto: "https://cdn.2424.mg/new-avatar.jpg",
      avatarUrl: "https://cdn.2424.mg/new-avatar.jpg",
      businessActivityCategory: "Informatique",
    });
    const { PATCH } = await loadRoute();

    const request = new Request("http://localhost/api/auth/profile", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        username: "rija-updated",
        firstName: "Rija",
        lastName: "Andrian",
        businessActivityCategory: "Informatique",
        businessRegions: [" Analamanga ", "", "Boeny"],
        businessCities: [" Antananarivo ", "Mahajanga"],
        notificationEmailsEnabled: true,
        completeOnboarding: true,
      }),
    });

    const response = await PATCH(request as never);

    expect(response.status).toBe(200);
    expect(updateWordPressUserProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wpUserId: 42,
        businessRegions: ["Analamanga"],
        businessCities: ["Antananarivo"],
        businessActivityCategory: "Informatique",
        notificationEmailsEnabled: true,
        completeOnboarding: true,
      }),
    );
    expect(setSessionCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        username: "rija-updated",
        businessActivityCategory: "Informatique",
        onboardingCompleted: true,
        onboardingIntent: undefined,
      }),
    );
  });

  it("keeps onboarding incomplete in GET when signup onboarding is still pending in session", async () => {
    getWordPressUserProfileMock.mockResolvedValue({
      wpUserId: 42,
      displayName: "Rija",
      onboardingCompleted: true,
    });
    const { GET } = await loadRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      profile: {
        wpUserId: 42,
        onboardingCompleted: false,
      },
    });
  });
});
