import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  adminDeleteProduct,
  adminListProducts,
  adminSaveProduct,
  adminUploadPhoto,
} from "@/lib/admin.functions";
import { money } from "@/lib/format";

type Draft = {
  id?: string;
  title: string;
  description: string;
  price: string;
  quantity: string;
  imageUrls: string[];
};

const emptyDraft: Draft = { title: "", description: "", price: "", quantity: "1", imageUrls: [] };

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function ProductManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListProducts);
  const save = useServerFn(adminSaveProduct);
  const remove = useServerFn(adminDeleteProduct);
  const upload = useServerFn(adminUploadPhoto);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [uploading, setUploading] = useState(false);

  const products = useQuery({ queryKey: ["admin", "products"], queryFn: () => list() });

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          ...(draft.id ? { id: draft.id } : {}),
          title: draft.title,
          description: draft.description,
          price: Number(draft.price) || 0,
          quantity: Number(draft.quantity) || 0,
          imageUrls: draft.imageUrls,
        },
      }),
    onSuccess: () => {
      toast.success(draft.id ? "Item updated" : "Item added");
      setDraft(emptyDraft);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Could not save that item."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Item deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Could not delete that item."),
  });

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 4)) {
        const dataUrl = await readFileAsDataUrl(file);
        const { url } = await upload({ data: { dataUrl, fileName: file.name } });
        setDraft((d) => ({ ...d, imageUrls: [...d.imageUrls, url] }));
      }
      toast.success("Photo uploaded");
    } catch {
      toast.error("Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="cozy-card bg-surface p-4">
        <h2 className="font-display text-lg">{draft.id ? "Edit item" : "Add an item"}</h2>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Title</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="tap-target rounded-2xl border border-input bg-cream px-4 text-base shadow-card"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Description</span>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="rounded-2xl border border-input bg-cream px-4 py-3 text-base shadow-card"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5">
              <span className="text-sm font-bold">Price</span>
              <input
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                className="tap-target rounded-2xl border border-input bg-cream px-4 text-base shadow-card"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-bold">Quantity</span>
              <input
                inputMode="numeric"
                value={draft.quantity}
                onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                className="tap-target rounded-2xl border border-input bg-cream px-4 text-base shadow-card"
              />
            </label>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-bold">Photos</span>
            {draft.imageUrls.length > 0 && (
              <ul className="flex gap-2 overflow-x-auto">
                {draft.imageUrls.map((url) => (
                  <li key={url} className="relative shrink-0">
                    <img
                      src={url}
                      alt=""
                      width={144}
                      height={144}
                      className="size-18 rounded-2xl object-cover shadow-card"
                    />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() =>
                        setDraft((d) => ({ ...d, imageUrls: d.imageUrls.filter((u) => u !== url) }))
                      }
                      className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-brand text-xs text-brand-foreground shadow-card"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="tap-target flex cursor-pointer items-center justify-center rounded-2xl bg-lilac text-sm font-bold shadow-card">
              {uploading ? "Uploading…" : "Upload photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onPickFiles(e.target.files)}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={saveMutation.isPending || !draft.title}
              onClick={() => saveMutation.mutate()}
              className="cozy-btn tap-target flex flex-1 items-center justify-center text-sm disabled:opacity-60"
            >
              {saveMutation.isPending ? "Saving…" : draft.id ? "Save changes" : "Add item"}
            </button>
            {draft.id && (
              <button
                type="button"
                onClick={() => setDraft(emptyDraft)}
                className="tap-target rounded-full bg-blush px-5 text-sm font-bold shadow-card"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg">Listed items</h2>
        {products.isLoading && <p className="mt-3 text-sm text-inksoft">Loading…</p>}
        <ul className="mt-3 grid gap-2">
          {(products.data ?? []).map((product) => (
            <li key={product.id} className="cozy-card flex items-center gap-3 bg-surface p-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-blush">
                {product.image_urls[0] ? (
                  <img
                    src={product.image_urls[0]}
                    alt=""
                    loading="lazy"
                    width={112}
                    height={112}
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{product.title}</p>
                <p className="text-xs text-inksoft">
                  {money(product.price)} · qty {product.quantity}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    id: product.id,
                    title: product.title,
                    description: product.description,
                    price: String(product.price),
                    quantity: String(product.quantity),
                    imageUrls: product.image_urls,
                  })
                }
                className="tap-target rounded-full bg-lilac px-4 text-sm font-bold shadow-card"
              >
                Edit
              </button>
              <button
                type="button"
                aria-label={`Delete ${product.title}`}
                onClick={() => deleteMutation.mutate(product.id)}
                className="tap-target flex items-center justify-center rounded-full text-inksoft"
              >
                <Trash2 className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
