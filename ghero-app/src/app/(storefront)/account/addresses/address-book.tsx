"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import { AddressForm, emptyAddress, validateAddress, type AddressFields } from "@/components/storefront/address-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage, fieldErrors } from "@/lib/api-client";

type Address = AddressFields & { id: string; isDefault: boolean };

export function AddressBook({ initial }: { initial: Address[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [values, setValues] = useState<AddressFields>(emptyAddress);
  const [makeDefault, setMakeDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const open = (a: Address | "new") => {
    setEditing(a);
    setValues(a === "new" ? emptyAddress : a);
    setMakeDefault(a !== "new" && a.isDefault);
    setErrors({});
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, errors: errs } = validateAddress(values);
    setErrors(errs);
    if (!data || !editing) return;
    setBusy("save");
    try {
      const body = { ...data, isDefault: makeDefault };
      if (editing === "new") await api("/api/addresses", { body });
      else await api(`/api/addresses/${editing.id}`, { method: "PUT", body });
      setEditing(null);
      toast("Address saved");
      router.refresh();
    } catch (error) {
      setErrors(fieldErrors(error));
      toast(errorMessage(error), "error");
    } finally {
      setBusy(null);
    }
  };

  const act = async (id: string, fn: () => Promise<unknown>, message: string) => {
    setBusy(id);
    try {
      await fn();
      toast(message);
      router.refresh();
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-2xl text-charcoal">Saved Addresses</h2>
        <button onClick={() => open("new")} className="flex items-center gap-2 bg-wine text-white px-4 py-2 text-sm hover:bg-wine/90 transition-colors">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {initial.length === 0 ? (
        <div className="bg-white border border-gold/10">
          <EmptyState icon={<MapPin className="w-12 h-12" strokeWidth={1.25} />} title="No saved addresses" description="Addresses you use at checkout can be saved here for faster ordering." />
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {initial.map((a) => (
            <li key={a.id} className="bg-white p-6 border border-gold/10 relative flex flex-col">
              {a.isDefault && <span className="absolute top-4 right-4 bg-gray-100 text-gray-600 px-2 py-1 text-xs rounded-sm">Default</span>}
              <h3 className="font-heading text-lg text-charcoal mb-2 pr-16">{a.fullName}</h3>
              <address className="not-italic text-sm text-gray-600 space-y-1 mb-6 flex-1">
                <p>
                  {a.addressLine1}
                  {a.addressLine2 && `, ${a.addressLine2}`}
                </p>
                <p>{a.area}</p>
                <p>
                  {a.city}, {a.state} {a.pincode}
                </p>
                <p className="pt-2">Phone: {a.phone}</p>
              </address>
              <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-sm">
                <button onClick={() => open(a)} className="text-wine hover:underline">
                  Edit
                </button>
                {!a.isDefault && (
                  <button
                    disabled={busy === a.id}
                    onClick={() => act(a.id, () => api(`/api/addresses/${a.id}`, { method: "PUT", body: { isDefault: true } }), "Default address updated")}
                    className="text-charcoal hover:underline disabled:opacity-50"
                  >
                    Set as default
                  </button>
                )}
                <button
                  disabled={busy === a.id}
                  onClick={() => {
                    if (confirm("Delete this address?")) act(a.id, () => api(`/api/addresses/${a.id}`, { method: "DELETE" }), "Address deleted");
                  }}
                  className="text-red-600 hover:underline disabled:opacity-50 ml-auto"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add address" : "Edit address"} className="sm:max-w-2xl" dismissible={busy !== "save"}>
        <form onSubmit={save} className="space-y-6">
          <AddressForm idPrefix="book" values={values} onChange={setValues} errors={errors} />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="accent-wine" />
            Use as my default address
          </label>
          <Button type="submit" size="lg" fullWidth isLoading={busy === "save"}>
            Save address
          </Button>
        </form>
      </Modal>
    </div>
  );
}
