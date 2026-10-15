import { describe, expect, test } from "bun:test";
import { validateOrderItems } from "../src/lib/order-validation";

const catalog = [{ id: "a", title: "Necklace", price: 0.1, quantity: 3 }];
const item = { id: "a", title: "Untrusted title", price: 0.1, quantity: 3 };

describe("checkout catalog validation", () => {
  test("uses catalog titles and integer cents", () => {
    expect(validateOrderItems([item], catalog)).toEqual({
      items: [{ ...item, title: "Necklace" }],
      total: 0.3,
    });
  });
  test("rejects manipulated prices", () => {
    expect(() => validateOrderItems([{ ...item, price: 0 }], catalog)).toThrow("price has changed");
  });
  test("aggregates duplicate lines before checking stock", () => {
    expect(() =>
      validateOrderItems(
        [
          { ...item, quantity: 2 },
          { ...item, quantity: 2 },
        ],
        catalog,
      ),
    ).toThrow("Only 3");
  });
  test("rejects removed products and invalid quantities", () => {
    expect(() => validateOrderItems([item], [])).toThrow("no longer available");
    expect(() => validateOrderItems([{ ...item, quantity: -1 }], catalog)).toThrow(
      "valid quantity",
    );
  });
});
