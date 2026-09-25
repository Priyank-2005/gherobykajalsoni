"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Field, Pill, TableWrap, Toggle, inputCls, td, th } from "@/components/admin/ui";
import { api, errorMessage, fieldErrors } from "@/lib/api-client";
import { formatDate, formatPrice } from "@/lib/utils";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FLAT";
  applyOn: "CART_VALUE" | "MRP";
  discountValue: number;
  maxDiscount: number | null;
  minCartValue: number | null;
  maxUsage: number | null;
  perUserLimit: number | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  usageCount: number;
};

type Form = {
  code: string;
  type: "PERCENTAGE" | "FLAT";
  applyOn: "CART_VALUE" | "MRP";
  discountValue: string;
  maxDiscount: string;
  minCartValue: string;
  maxUsage: string;
  perUserLimit: string;
  isActive: boolean;
  startsAt: string; // datetime-local
  expiresAt: string;
};

const blank: Form = { code: "", type: "PERCENTAGE", applyOn: "CART_VALUE", discountValue: "", maxDiscount: "", minCartValue: "", maxUsage: "", perUserLimit: "1", isActive: true, startsAt: "", expiresAt: "" };

/** ISO → value for <input type="datetime-local"> in the browser's timezone. */
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

function status(c: Coupon) {
  const now = Date.now();
  if (!c.isActive) return <Pill>Inactive</Pill>;
  if (c.expiresAt && new Date(c.expiresAt).getTime() <= now) return <Pill tone="red">Expired</Pill>;
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return <Pill tone="amber">Scheduled</Pill>;
  if (c.maxUsage !== null && c.usageCount >= c.maxUsage) return <Pill tone="red">Used up</Pill>;
  return <Pill tone="green">Active</Pill>;
}

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [f, setF] = useState<Form>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const open = (c: Coupon | "new") => {
    setEditing(c);
    setErrors({});
    setF(
      c === "new"
        ? blank
        : {
            code: c.code,
            type: c.type,
            applyOn: c.applyOn,
            discountValue: String(c.discountValue),
            maxDiscount: c.maxDiscount?.toString() ?? "",
            minCartValue: c.minCartValue?.toString() ?? "",
            maxUsage: c.maxUsage?.toString() ?? "",
            perUserLimit: c.perUserLimit?.toString() ?? "",
            isActive: c.isActive,
            startsAt: toLocal(c.startsAt),
            expiresAt: toLocal(c.expiresAt),
          }
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const body = {
      code: f.code,
      type: f.type,
      applyOn: f.applyOn,
      discountValue: Number(f.discountValue),
      maxDiscount: f.type === "PERCENTAGE" ? numOrNull(f.maxDiscount) : null,
      minCartValue: numOrNull(f.minCartValue),
      maxUsage: numOrNull(f.maxUsage),
      perUserLimit: numOrNull(f.perUserLimit),
      isActive: f.isActive,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
    };
    try {
      if (editing === "new") await api("/api/admin/coupons", { body });
      else if (editing) await api(`/api/admin/coupons/${editing.id}`, { method: "PUT", body });
      toast("Coupon saved");
      setEditing(null);
      router.refresh();
    } catch (error) {
      setErrors(fieldErrors(error));
      toast(errorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Coupon) => {
    if (!confirm(c.usageCount > 0 ? `${c.code} has been used ${c.usageCount} time(s), so it will be deactivated (kept for records). Continue?` : `Delete ${c.code}?`)) return;
    try {
      const res = await api<{ deleted: boolean }>(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
      toast(res.deleted ? "Coupon deleted" : "Coupon deactivated");
      router.refresh();
    } catch (error) {
      toast(errorMessage(error), "error");
    }
  };

  const describe = (c: Coupon) =>
    `${c.type === "PERCENTAGE" ? `${c.discountValue}% off ${c.applyOn === "MRP" ? "MRP" : "cart"}` : `${formatPrice(c.discountValue)} off`}${c.maxDiscount ? `, up to ${formatPrice(c.maxDiscount)}` : ""}`;

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => open("new")} className="inline-flex items-center gap-2 bg-wine text-white rounded-md px-4 py-2 text-sm hover:bg-wine/90">
          <Plus className="w-4 h-4" /> New coupon
        </button>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <th className={th}>Code</th>
            <th className={th}>Discount</th>
            <th className={th}>Conditions</th>
            <th className={th}>Used</th>
            <th className={th}>Status</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {coupons.length === 0 && (
            <tr>
              <td colSpan={6} className={`${td} text-center text-gray-500 py-10`}>No coupons yet.</td>
            </tr>
          )}
          {coupons.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className={`${td} font-mono font-medium`}>{c.code}</td>
              <td className={td}>{describe(c)}</td>
              <td className={`${td} text-xs text-gray-500`}>
                {c.minCartValue ? <div>Min cart {formatPrice(c.minCartValue)}</div> : null}
                {c.perUserLimit ? <div>{c.perUserLimit}× per customer</div> : null}
                {c.expiresAt ? <div>Until {formatDate(c.expiresAt)}</div> : null}
              </td>
              <td className={`${td} tabular-nums`}>
                {c.usageCount}
                {c.maxUsage !== null && <span className="text-gray-400"> / {c.maxUsage}</span>}
              </td>
              <td className={td}>{status(c)}</td>
              <td className={`${td} text-right whitespace-nowrap`}>
                <button onClick={() => open(c)} className="text-sm text-wine hover:underline mr-3">Edit</button>
                <button onClick={() => remove(c)} className="text-sm text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New coupon" : `Edit ${editing?.code ?? ""}`} className="sm:max-w-xl" dismissible={!busy}>
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Code *" htmlFor="cp-code" error={errors.code} hint="Letters and numbers only" className="sm:col-span-2">
            <input id="cp-code" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Type" htmlFor="cp-type">
            <select id="cp-type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Form["type"] })} className={inputCls}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat amount (₹)</option>
            </select>
          </Field>
          <Field label={f.type === "PERCENTAGE" ? "Discount (%) *" : "Discount (₹) *"} htmlFor="cp-val" error={errors.discountValue}>
            <input id="cp-val" required type="number" min={f.type === "PERCENTAGE" ? 1 : 1} max={f.type === "PERCENTAGE" ? 100 : undefined} step="0.01" value={f.discountValue} onChange={(e) => setF({ ...f, discountValue: e.target.value })} className={inputCls} />
          </Field>
          {f.type === "PERCENTAGE" && (
            <>
              <Field label="Apply % on" htmlFor="cp-on">
                <select id="cp-on" value={f.applyOn} onChange={(e) => setF({ ...f, applyOn: e.target.value as Form["applyOn"] })} className={inputCls}>
                  <option value="CART_VALUE">Cart value (selling price)</option>
                  <option value="MRP">MRP total</option>
                </select>
              </Field>
              <Field label="Max discount (₹)" htmlFor="cp-max" hint="Cap for percentage coupons">
                <input id="cp-max" type="number" min={1} value={f.maxDiscount} onChange={(e) => setF({ ...f, maxDiscount: e.target.value })} className={inputCls} />
              </Field>
            </>
          )}
          <Field label="Minimum cart value (₹)" htmlFor="cp-min">
            <input id="cp-min" type="number" min={0} value={f.minCartValue} onChange={(e) => setF({ ...f, minCartValue: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Total uses allowed" htmlFor="cp-uses" hint="Empty = unlimited">
            <input id="cp-uses" type="number" min={1} value={f.maxUsage} onChange={(e) => setF({ ...f, maxUsage: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Uses per customer" htmlFor="cp-per" hint="Empty = unlimited">
            <input id="cp-per" type="number" min={1} value={f.perUserLimit} onChange={(e) => setF({ ...f, perUserLimit: e.target.value })} className={inputCls} />
          </Field>
          <div />
          <Field label="Starts" htmlFor="cp-start">
            <input id="cp-start" type="datetime-local" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Expires" htmlFor="cp-end" error={errors.expiresAt}>
            <input id="cp-end" type="datetime-local" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Toggle checked={f.isActive} onChange={(x) => setF({ ...f, isActive: x })} label="Active" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" fullWidth size="lg" isLoading={busy}>Save coupon</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
