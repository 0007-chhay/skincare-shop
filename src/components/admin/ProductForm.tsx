"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteProduct, saveProduct } from "@/app/admin/actions";
import type { AdminProduct } from "@/lib/admin-products";
import { concerns } from "@/lib/concerns";

const input =
  "h-12 w-full rounded-xl border-[1.5px] border-[#C3D6CD] bg-white px-3.5 text-base text-ink placeholder:text-[#8AA197] focus:border-leaf focus:outline-none";
const label = "flex flex-col gap-1.5 text-sm font-medium";
const optional = <span className="font-normal text-muted">(មិនចាំបាច់)</span>;

// បង្រួមរូបពីកាមេរ៉ា (៣–៨MB) ឲ្យនៅប្រហែល ២០០–៥០០KB មុន upload
async function shrinkImage(file: File, maxSide = 1600): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch {
    return file; // browser មិនស្គាល់ទម្រង់នេះ — upload ដើមវិញ
  }
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>(product?.imageUrl);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreparing(true);
    const small = await shrinkImage(file);
    setPreparing(false);
    if (small.size > 4 * 1024 * 1024) {
      setError("រូបធំពេក សូមជ្រើសរូបផ្សេង");
      return;
    }
    setError(null);
    setImage(small);
    setPreview(URL.createObjectURL(small));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.delete("image_picker");
    if (image) form.set("image", image);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveProduct(form);
      if (!res.ok) {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!product) {
        router.replace("/admin/products");
      } else {
        setSaved(true);
        setImage(null);
        router.refresh();
      }
    });
  }

  function onDelete() {
    if (!product) return;
    const ok = window.confirm(
      `លុប "${product.name_km}" ជារៀងរហូតមែនទេ?\n\nមិនអាចយកមកវិញបានទេ។\nបើគ្រាន់តែចង់ឈប់លក់បណ្តោះអាសន្ន សូមបិទ "បង្ហាញលើហាង" ជំនួសវិញ។`,
    );
    if (!ok) return;
    startDelete(async () => {
      const res = await deleteProduct(product.id);
      if (res.ok) router.replace("/admin/products");
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      {error && <p role="alert" className="rounded-xl bg-[#FBE4E1] p-3 text-sm text-[#7A1D14]">{error}</p>}
      {saved && <p role="status" className="rounded-xl bg-[#D7EAE2] p-3 text-sm text-ink">បានរក្សាទុក ✓ ហាងនឹងបង្ហាញការផ្លាស់ប្តូរភ្លាមៗ</p>}

      {/* រូបភាព */}
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4">
        <h2 className="font-semibold">រូបភាព</h2>
        <div className="relative grid aspect-square w-full max-w-[280px] place-items-center self-center overflow-hidden rounded-2xl" style={{ backgroundColor: product?.tint ?? "#E3ECEA" }}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-sm text-muted">មិនទាន់មានរូប</span>
          )}
          {preparing && <span className="absolute inset-0 grid place-items-center bg-white/70 text-sm">កំពុងរៀបចំរូប...</span>}
        </div>
        <input ref={fileRef} name="image_picker" type="file" accept="image/*" onChange={onPickImage} className="sr-only" id="image-picker" />
        <label htmlFor="image-picker" className="flex h-12 cursor-pointer items-center justify-center rounded-2xl border-[1.5px] border-dashed border-leaf text-[15px] text-leaf">
          {preview ? "ប្តូររូប" : "ថតរូប ឬជ្រើសរូប"}
        </label>
      </section>

      {/* ព័ត៌មានមូលដ្ឋាន */}
      <section className="flex flex-col gap-3.5 rounded-2xl bg-white p-4">
        <label className={label}>
          ឈ្មោះខ្មែរ
          <input name="name_km" required maxLength={120} defaultValue={product?.name_km} className={input} />
        </label>
        <label className={label}>
          <span>ឈ្មោះអង់គ្លេស {optional}</span>
          <input name="name_en" maxLength={120} defaultValue={product?.name_en} placeholder="ឧ. Vitamin C Serum" className={input} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            តម្លៃ ($)
            <input name="price" required inputMode="decimal" defaultValue={product?.price} placeholder="12.50" className={input} />
          </label>
          <label className={label}>
            <span>ចំណុះ {optional}</span>
            <input name="size" maxLength={40} defaultValue={product?.size ?? ""} placeholder="30ml" className={input} />
          </label>
        </div>
        <label className={label}>
          <span>ស្លាកលើរូប {optional}</span>
          <input name="tag" maxLength={30} list="tag-options" defaultValue={product?.tag ?? ""} placeholder="ឧ. ថ្មី" className={input} />
          <datalist id="tag-options">
            <option value="ថ្មី" />
            <option value="លក់ដាច់" />
            <option value="ប្រើរាល់ថ្ងៃ" />
            <option value="បញ្ចុះតម្លៃ" />
          </datalist>
        </label>
      </section>

      {/* បញ្ហាស្បែក */}
      <fieldset className="rounded-2xl bg-white p-4">
        <legend className="float-left mb-2 w-full font-semibold">សមស្របសម្រាប់</legend>
        <div className="flex flex-wrap gap-2">
          {concerns.filter((c) => c.id !== "all").map((c) => (
            <label key={c.id} className="cursor-pointer">
              <input type="checkbox" name="concerns" value={c.id} defaultChecked={product?.concerns.includes(c.id as never)} className="peer sr-only" />
              <span className="flex h-11 items-center rounded-full border-[1.5px] border-[#C3D6CD] px-4 text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-leaf">
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ពិពណ៌នា */}
      <section className="flex flex-col gap-3.5 rounded-2xl bg-white p-4">
        <label className={label}>
          ប្រសិទ្ធភាព / ពិពណ៌នាខ្លី
          <textarea name="description" rows={2} maxLength={1000} defaultValue={product?.description} className={`${input} h-auto resize-none py-3`} />
        </label>
        <label className={label}>
          <span>របៀបប្រើ {optional}</span>
          <textarea name="how_to_use" rows={3} maxLength={1500} defaultValue={product?.how_to_use ?? ""} className={`${input} h-auto resize-none py-3`} />
        </label>
        <label className={label}>
          <span>គ្រឿងផ្សំសំខាន់ៗ {optional}</span>
          <textarea name="ingredients" rows={3} maxLength={1500} defaultValue={product?.ingredients ?? ""} className={`${input} h-auto resize-none py-3`} />
        </label>
      </section>

      {/* ការកំណត់ */}
      <section className="flex flex-col gap-1 rounded-2xl bg-white p-4">
        <label className={label}>
          <span>ចំនួនក្នុងស្តុក <span className="font-normal text-muted">(ទុកទទេ = មិនរាប់)</span></span>
          <input name="stock" inputMode="numeric" pattern="[0-9]*" defaultValue={product?.stock ?? ""} placeholder="ឧ. 20" className={input} />
        </label>
        <p className="mb-1 text-xs text-muted">ពេលមាន order ចំនួននឹងថយចុះដោយខ្លួនឯង · ដល់ 0 = អស់ស្តុក</p>
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3">
          <span>មានស្តុក <span className="text-xs text-muted">(សម្រាប់ផលិតផលដែលមិនរាប់ចំនួន)</span></span>
          <input type="checkbox" name="in_stock" defaultChecked={product?.in_stock ?? true} className="size-6 accent-leaf" />
        </label>
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3">
          <span>បង្ហាញលើហាង</span>
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="size-6 accent-leaf" />
        </label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label className={label}>
            លំដាប់បង្ហាញ
            <input name="sort_order" inputMode="numeric" defaultValue={product?.sort_order ?? 0} className={input} />
          </label>
          <label className={label}>
            ពណ៌ផ្ទៃក្រោយ
            <input name="tint" type="color" defaultValue={product?.tint ?? "#E3ECEA"} className="h-12 w-full cursor-pointer rounded-xl border-[1.5px] border-[#C3D6CD] bg-white p-1" />
          </label>
        </div>
        <p className="text-xs text-muted">លំដាប់: លេខតូចបង្ហាញមុនគេ</p>
      </section>

      {product && (
        <button type="button" onClick={onDelete} disabled={deleting} className="h-12 rounded-2xl text-sm text-[#A3261B] underline-offset-4 hover:underline disabled:opacity-60">
          {deleting ? "កំពុងលុប..." : "លុបផលិតផលនេះជារៀងរហូត"}
        </button>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 pt-3">
          <button type="button" onClick={() => router.back()} className="h-[50px] rounded-2xl border-[1.5px] border-ink px-5">
            បោះបង់
          </button>
          <button type="submit" disabled={pending || preparing} className="h-[50px] flex-1 rounded-2xl bg-leaf font-semibold text-white disabled:opacity-60">
            {pending ? "កំពុងរក្សាទុក..." : product ? "រក្សាទុក" : "បន្ថែមផលិតផល"}
          </button>
        </div>
      </div>
    </form>
  );
}
