import { computeInitialPosition } from "./positioning";

describe("computeInitialPosition", () => {
  it("places first node at bottom center baseline", () => {
    expect(computeInitialPosition({})).toEqual({ x: 0, y: 600 });
  });
  it("places above parent when parent exists", () => {
    const pos = computeInitialPosition({ A: { x: 100, y: 300 } }, "A");
    expect(pos).toEqual({ x: 100, y: 160 });
  });
  it("places to the side when no parent provided", () => {
    const pos = computeInitialPosition({
      A: { x: 0, y: 0 },
      B: { x: 160, y: 0 },
    });
    expect(pos).toEqual({ x: 320, y: 600 });
  });
});
