import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  adminAddBagItem,
  adminDeleteBagItem,
  adminListBags,
  adminUpdateBag,
  adminUpdateBagItem,
} from "@/lib/bags.functions";
import { BAG_STATUSES, money, parseMoney } from "@/lib/format";

export function BagManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListBags);
  const updateBag = useServerFn(adminUpdateBag);
  const addItem = useServerFn(adminAddBagItem);
  const updateItem = useServerFn(adminUpdateBagItem);
  const deleteItem = useServerFn(adminDeleteBagItem);

  const [openBag, setOpenBag] = useState<string | null>(null);
  const [edits, setEdits] = useState<
    Record<number, { paymentsReceived: string; dueDate: string; status: string }>
  >({});
  const [newItem, setNewItem] = useState({ companyName: "", item: "", price: "", qty: "1" });

  const bags = useQuery({ queryKey: ["admin", "bags"], queryFn: () => list() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "bags"] });

  const saveBag = useMutation({
    mutationFn: (vars: {
      rowNumber: number;
      paymentsReceived: string;
      dueDate: string;
      status: string;
    }) => updateBag({ data: vars }),
    onSuccess: () => {
      toast.success("Bag updated in the spreadsheet");
      refresh();
    },
    onError: () => toast.error("Could not update that bag."),
  });

  const createItem = useMutation({
    mutationFn: (vars: {
      bagNumber: string;
      companyName: string;
      item: string;
      price: string;
      qty: string;
    }) => addItem({ data: vars }),
    onSuccess: () => {
      toast.success("Item added");
      setNewItem({ companyName: "", item: "", price: "", qty: "1" });
      refresh();
    },
    onError: () => toast.error("Could not add that item."),
  });

  const editItem = useMutation({
    mutationFn: (vars: {
      rowNumber: number;
      bagNumber: string;
      companyName: string;
      item: string;
      price: string;
      qty: string;
    }) => updateItem({ data: vars }),
    onSuccess: () => {
      toast.success("Item updated");
      refresh();
    },
    onError: () => toast.error("Could not update that item."),
  });

  const removeItem = useMutation({
    mutationFn: (rowNumber: number) => deleteItem({ data: { rowNumber } }),
    onSuccess: () => {
      toast.success("Item removed");
      refresh();
    },
    onError: () => toast.error("Could not remove that item."),
  });

  if (bags.isLoading) return <p className="text-sm text-inksoft">Loading bags…</p>;
  if (bags.isError)
    return <p className="text-sm text-destructive">Could not reach the bag spreadsheet.</p>;

  const data = bags.data!;

  return (
    <div className="grid gap-3">
      <p className="rounded-2xl bg-butter px-4 py-3 text-xs text-inksoft">
        Bag total and remaining balance are calculated by the spreadsheet — only payments, due date
        and status can be changed here.
      </p>

      {data.bags.map((bag) => {
        const edit = edits[bag.rowNumber] ?? {
          paymentsReceived: bag.paymentsReceived,
          dueDate: bag.dueDate,
          status: bag.status,
        };
        const items = data.items.filter((i) => i.bagNumber === bag.bagNumber);
        const isOpen = openBag === bag.bagNumber;

        return (
          <section key={bag.rowNumber} className="rounded-3xl bg-surface p-4">
            <button
              type="button"
              onClick={() => setOpenBag(isOpen ? null : bag.bagNumber)}
              className="tap-target flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="min-w-0">
                <span className="block font-display text-base">Bag #{bag.bagNumber}</span>
                <span className="block truncate text-xs text-inksoft">
                  {bag.customerName} · {bag.tiktokHandle}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold">
                  {money(parseMoney(bag.balanceDue))}
                </span>
                <span className="block text-xs text-inksoft">{bag.status || "—"}</span>
              </span>
            </button>

            {isOpen && (
              <div className="mt-4 grid gap-4 border-t border-border pt-4">
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-blush px-3 py-2">
                    <dt className="text-xs text-inksoft">Bag total</dt>
                    <dd className="font-bold">{money(parseMoney(bag.bagTotal))}</dd>
                  </div>
                  <div className="rounded-2xl bg-mint px-3 py-2">
                    <dt className="text-xs text-inksoft">Remaining</dt>
                    <dd className="font-bold">{money(parseMoney(bag.balanceDue))}</dd>
                  </div>
                </dl>

                <div className="grid gap-3">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-bold">Payments received</span>
                    <input
                      inputMode="decimal"
                      value={edit.paymentsReceived}
                      onChange={(e) =>
                        setEdits({
                          ...edits,
                          [bag.rowNumber]: { ...edit, paymentsReceived: e.target.value },
                        })
                      }
                      className="tap-target rounded-2xl border border-input bg-cream px-4 text-base"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-bold">Due date</span>
                    <input
                      value={edit.dueDate}
                      placeholder="MM/DD/YYYY"
                      onChange={(e) =>
                        setEdits({
                          ...edits,
                          [bag.rowNumber]: { ...edit, dueDate: e.target.value },
                        })
                      }
                      className="tap-target rounded-2xl border border-input bg-cream px-4 text-base"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-bold">Status</span>
                    <select
                      value={edit.status}
                      onChange={(e) =>
                        setEdits({
                          ...edits,
                          [bag.rowNumber]: { ...edit, status: e.target.value },
                        })
                      }
                      className="tap-target rounded-2xl border border-input bg-cream px-4 text-base"
                    >
                      {[edit.status, ...BAG_STATUSES.filter((s) => s !== edit.status)]
                        .filter(Boolean)
                        .map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={saveBag.isPending}
                    onClick={() => saveBag.mutate({ rowNumber: bag.rowNumber, ...edit })}
                    className="tap-target flex items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground disabled:opacity-60"
                  >
                    Save bag
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold">Items ({items.length})</h3>
                  <ul className="mt-2 grid gap-2">
                    {items.map((item) => (
                      <li key={item.rowNumber} className="grid gap-2 rounded-2xl bg-cream p-3">
                        {item.companyName && (
                          <span className="text-xs font-semibold text-inksoft">
                            {item.companyName}
                          </span>
                        )}
                        <input
                          defaultValue={item.item}
                          aria-label="Item description"
                          onBlur={(e) =>
                            e.target.value !== item.item &&
                            editItem.mutate({
                              rowNumber: item.rowNumber,
                              bagNumber: item.bagNumber,
                              companyName: item.companyName,
                              item: e.target.value,
                              price: item.price,
                              qty: item.qty,
                            })
                          }
                          className="tap-target rounded-xl border border-input bg-surface px-3 text-sm"
                        />
                        <div className="flex gap-2">
                          <input
                            defaultValue={item.price}
                            inputMode="decimal"
                            aria-label="Item price"
                            onBlur={(e) =>
                              e.target.value !== item.price &&
                              editItem.mutate({
                                rowNumber: item.rowNumber,
                                bagNumber: item.bagNumber,
                                companyName: item.companyName,
                                item: item.item,
                                price: e.target.value,
                                qty: item.qty,
                              })
                            }
                            className="tap-target w-28 rounded-xl border border-input bg-surface px-3 text-sm"
                          />
                          <input
                            defaultValue={item.qty}
                            inputMode="numeric"
                            aria-label="Item quantity"
                            onBlur={(e) =>
                              e.target.value !== item.qty &&
                              editItem.mutate({
                                rowNumber: item.rowNumber,
                                bagNumber: item.bagNumber,
                                companyName: item.companyName,
                                item: item.item,
                                price: item.price,
                                qty: e.target.value,
                              })
                            }
                            className="tap-target w-16 rounded-xl border border-input bg-surface px-3 text-sm"
                          />
                          <button
                            type="button"
                            aria-label="Delete item"
                            onClick={() => removeItem.mutate(item.rowNumber)}
                            className="tap-target ml-auto flex items-center justify-center rounded-full text-inksoft"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 grid gap-2 rounded-2xl bg-lilac p-3">
                    <input
                      placeholder="Company name"
                      value={newItem.companyName}
                      onChange={(e) => setNewItem({ ...newItem, companyName: e.target.value })}
                      className="tap-target rounded-xl border border-input bg-surface px-3 text-sm"
                    />
                    <input
                      placeholder="New item description"
                      value={newItem.item}
                      onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                      className="tap-target rounded-xl border border-input bg-surface px-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        placeholder="Price"
                        inputMode="decimal"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                        className="tap-target w-24 rounded-xl border border-input bg-surface px-3 text-sm"
                      />
                      <input
                        placeholder="Qty"
                        inputMode="numeric"
                        value={newItem.qty}
                        onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
                        className="tap-target w-16 rounded-xl border border-input bg-surface px-3 text-sm"
                      />
                      <button
                        type="button"
                        disabled={!newItem.item || createItem.isPending}
                        onClick={() =>
                          createItem.mutate({ bagNumber: bag.bagNumber, ...newItem })
                        }
                        className="tap-target ml-auto rounded-full bg-brand px-5 text-sm font-bold text-brand-foreground disabled:opacity-60"
                      >
                        Add item
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
