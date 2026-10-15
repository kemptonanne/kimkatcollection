type RequestedItem = { id: string; title: string; price: number; quantity: number };
type CatalogItem = { id: string; title: string; price: number; quantity: number };

/** Never trust browser prices, titles, or stock claims. Orders await manual confirmation. */
export function validateOrderItems(requested: RequestedItem[], catalog: CatalogItem[]) {
  const quantities = new Map<string, number>();
  for (const item of requested) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      throw new Error("Choose a valid quantity.");
    }
    quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
  }
  if (quantities.size === 0) throw new Error("Your cart is empty.");
  const items = [...quantities].map(([id, quantity]) => {
    const product = catalog.find((row) => row.id === id);
    if (!product) throw new Error("An item is no longer available. Please refresh your cart.");
    const price = Number(product.price);
    if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(Math.round(price * 100))) {
      throw new Error("An item price is unavailable. Please contact the shop.");
    }
    if (quantity > product.quantity) {
      throw new Error(
        `Only ${product.quantity} of ${product.title} available. Please update your cart.`,
      );
    }
    const submitted = requested.filter((item) => item.id === id);
    if (submitted.some((item) => Math.round(item.price * 100) !== Math.round(price * 100))) {
      throw new Error(
        "An item price has changed. Please remove it and add it again from the shop.",
      );
    }
    return { id, title: product.title, price, quantity };
  });
  const cents = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  if (!Number.isSafeInteger(cents)) throw new Error("Order total is too large.");
  return { items, total: cents / 100 };
}
