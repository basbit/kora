describe("NodeCard date formatting", () => {
  function formatDates(birth?: string, death?: string): string {
    if (!birth && !death) return "";
    const birthYear = birth ? birth.split("-")[0] : "";
    const deathYear = death ? death.split("-")[0] : "";

    if (birthYear && deathYear) return `${birthYear} — ${deathYear}`;
    if (birthYear) return birthYear;
    return `† ${deathYear}`;
  }

  it("should format both birth and death years", () => {
    expect(formatDates("1980-01-15", "2020-12-31")).toBe("1980 — 2020");
  });

  it("should format only birth year if no death date", () => {
    expect(formatDates("1980-01-15", undefined)).toBe("1980");
  });

  it("should format death year with cross if no birth date", () => {
    expect(formatDates(undefined, "2020-12-31")).toBe("† 2020");
  });

  it("should return empty string if both dates are missing", () => {
    expect(formatDates(undefined, undefined)).toBe("");
  });

  it("should extract year from full ISO date", () => {
    expect(formatDates("1980-06-15", "2020-03-22")).toBe("1980 — 2020");
  });
});
