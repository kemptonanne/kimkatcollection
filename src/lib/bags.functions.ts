import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const lookupSchema = z.object({ query: z.string().min(1).max(60) });

/**
 * Public bag lookup. Returns ONLY what a customer needs to see; customer name,
 * TikTok handle, payments received and sheet row numbers are never sent to the
 * browser.
 */
export const lookupBag = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => lookupSchema.parse(input))
  .handler(async ({ data }) => {
    const { readBagWithItems } = await import("./sheets.server");
    const needle = data.query.trim().replace(/^#/, "");
    const found = await readBagWithItems(needle);
    if (!found) return { found: false as const };
    return {
      found: true as const,
      bag: {
        bagNumber: found.bag.bagNumber,
        bagTotal: found.bag.bagTotal,
        balanceDue: found.bag.balanceDue,
        dueDate: found.bag.dueDate,
        status: found.bag.status,
      },
      items: found.items.map((item, index) => ({
        id: index,
        item: item.item,
        qty: item.qty,
        total: item.total || item.price,
        dateClaimed: item.dateClaimed,
      })),
    };
  });

export const adminListBags = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./admin-session.server");
  await requireAdmin();
  const { readBags, readBagItems } = await import("./sheets.server");
  const [bags, items] = await Promise.all([readBags(), readBagItems()]);
  return { bags, items };
});

export const adminUpdateBag = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        rowNumber: z.number().int().min(2),
        paymentsReceived: z.string().max(40),
        dueDate: z.string().max(40),
        status: z.string().max(40),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    await requireAdmin();
    const { writeBagEditableFields } = await import("./sheets.server");
    await writeBagEditableFields(data.rowNumber, {
      paymentsReceived: data.paymentsReceived,
      dueDate: data.dueDate,
      status: data.status,
    });
    return { ok: true as const };
  });

const itemSchema = z.object({
  bagNumber: z.string().min(1).max(40),
  companyName: z.string().max(120),
  item: z.string().min(1).max(300),
  price: z.string().max(40),
  qty: z.string().max(10),
});

export const adminAddBagItem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => itemSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    await requireAdmin();
    const { appendBagItem } = await import("./sheets.server");
    await appendBagItem(data);
    return { ok: true as const };
  });

export const adminUpdateBagItem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    itemSchema.extend({ rowNumber: z.number().int().min(2) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    await requireAdmin();
    const { writeBagItem } = await import("./sheets.server");
    const { rowNumber, ...item } = data;
    await writeBagItem(rowNumber, item);
    return { ok: true as const };
  });

export const adminDeleteBagItem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ rowNumber: z.number().int().min(2) }).parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    await requireAdmin();
    const { deleteBagItemRow } = await import("./sheets.server");
    await deleteBagItemRow(data.rowNumber);
    return { ok: true as const };
  });
