import { describe, expect, it } from "vitest";
import {
  getCompetitiveLevelLabel,
  localizeBadge,
  localizeLessonType,
  localizeListingType,
  localizeSportName,
  resolveAppLocale,
} from "@/lib/localized-ui";

describe("localized-ui", () => {
  it("unsupported locale values fallback to tr", () => {
    expect(resolveAppLocale("xx")).toBe("tr");
    expect(resolveAppLocale(undefined)).toBe("tr");
  });

  it("localizeListingType resolves translated labels", () => {
    expect(localizeListingType("RIVAL", "en")).toBe("Rival");
    expect(localizeListingType("RIVAL", "tr")).toBe("Rakip");
    expect(localizeListingType("UNKNOWN_TYPE", "en")).toBe("UNKNOWN_TYPE");
  });

  it("localizeLessonType resolves lesson labels and keeps unknown values", () => {
    expect(localizeLessonType("grup", "en")).toBe("Group");
    expect(localizeLessonType("birebir", "tr")).toBe("Birebir");
    expect(localizeLessonType("other", "en")).toBe("other");
  });

  it("localizeSportName translates DB aliases", () => {
    expect(localizeSportName("Futbol", "en")).toBe("Football");
    expect(localizeSportName("basketbol", "tr")).toBe("Basketbol");
    expect(localizeSportName("Unknown Sport", "en")).toBe("Unknown Sport");
  });

  it("localizeBadge keeps count placeholder semantics", () => {
    const badge = {
      id: "no_show_warning",
      label: "Gelmedi Uyarısı",
      icon: "⚠️",
      description: "3 kez belirtilen etkinliklere gelmedi",
      color: "amber",
    };

    const localized = localizeBadge(badge, "en");
    expect(localized.label).toBe("No-Show Warning");
    expect(localized.description).toContain("3");
  });

  it("competitive level labels are localized", () => {
    expect(getCompetitiveLevelLabel("BEGINNER", "tr")).toBe("Acemi");
    expect(getCompetitiveLevelLabel("BEGINNER", "en")).toBe("Rookie");
    expect(getCompetitiveLevelLabel("BEGINNER", "xx")).toBe("Acemi");
  });
});
