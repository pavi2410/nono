import { test, expect, describe } from "bun:test";
import { jsx, jsxs, Fragment } from "./jsx-runtime.ts";

describe("jsx-runtime", () => {
  describe("jsx", () => {
    test("creates node with string type", () => {
      const node = jsx("div", { id: "test" });
      expect(node.type).toBe("div");
      expect(node.props).toEqual({ id: "test" });
      expect(node.children).toEqual([]);
    });

    test("creates node with function type (uses function name)", () => {
      function MyComponent() {}
      const node = jsx(MyComponent, null);
      expect(node.type).toBe("MyComponent");
    });

    test("extracts children from props", () => {
      const child = jsx("span", null);
      const node = jsx("div", { children: child });
      expect(node.children).toEqual([child]);
      expect(node.props).toEqual({});
    });

    test("handles null props", () => {
      const node = jsx("div", null);
      expect(node.props).toEqual({});
      expect(node.children).toEqual([]);
    });

    test("filters null children", () => {
      const child = jsx("span", null);
      const node = jsx("div", { children: [child, null, undefined] });
      expect(node.children).toEqual([child]);
    });
  });

  describe("jsxs", () => {
    test("handles array children", () => {
      const child1 = jsx("span", null);
      const child2 = jsx("span", null);
      const node = jsxs("div", { children: [child1, child2] });
      expect(node.children).toEqual([child1, child2]);
    });
  });

  describe("Fragment", () => {
    test("creates fragment node", () => {
      const child = jsx("span", null);
      const node = Fragment({ children: [child] });
      expect(node.type).toBe("Fragment");
      expect(node.children).toEqual([child]);
    });

    test("handles undefined children", () => {
      const node = Fragment({});
      expect(node.children).toEqual([]);
    });
  });
});
