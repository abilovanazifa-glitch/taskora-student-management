import { describe, expect, it } from "vitest";
import { getHomePath } from "@/lib/navigation/home-path";

describe("getHomePath", () => {
  it("returns dashboard for authenticated users", () => {
    expect(getHomePath(true)).toBe("/dashboard");
  });

  it("returns login for signed-out users", () => {
    expect(getHomePath(false)).toBe("/login");
  });
});
