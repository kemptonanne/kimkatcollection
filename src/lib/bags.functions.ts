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
