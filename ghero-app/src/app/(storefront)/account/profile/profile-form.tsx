"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/components/storefront/store-provider";
import { api, errorMessage, fieldErrors } from "@/lib/api-client";
import type { UserPublic } from "@/types/user";

const input =
  "w-full border border-gray-300 px-4 py-2.5 text-gray-700 bg-white disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine";

export function ProfileForm({ profile }: { profile: { name: string; phone: string; email: string } }) {
  const router = useRouter();
  const toast = useToast();
  const { setUser } = useStore();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ name: profile.name, phone: profile.phone });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const { user } = await api<{ user: UserPublic }>("/api/user/profile", {
        method: "PUT",
        body: { name: values.name, ...(values.phone ? { phone: values.phone } : {}) },
      });
      setUser(user);
      setValues({ name: user.name ?? "", phone: user.phone ?? "" });
      setEditing(false);
      toast("Profile updated");
      router.refresh();
    } catch (error) {
      setErrors(fieldErrors(error));
      toast(errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 border border-gold/10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl text-charcoal">My Profile</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-wine underline hover:text-wine/80">
            Edit
          </button>
        )}
      </div>

      <form onSubmit={save} className="space-y-6 max-w-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="p-name" className="block text-sm text-gray-700 mb-1">
              Full Name
            </label>
            <input id="p-name" required value={values.name} disabled={!editing} onChange={(e) => setValues({ ...values, name: e.target.value })} className={input} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="p-phone" className="block text-sm text-gray-700 mb-1">
              Mobile Number
            </label>
            <input id="p-phone" type="tel" inputMode="numeric" value={values.phone} disabled={!editing} onChange={(e) => setValues({ ...values, phone: e.target.value })} className={input} />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="p-email" className="block text-sm text-gray-700 mb-1">
              Email Address
            </label>
            <div className="flex gap-3 items-center">
              <input id="p-email" type="email" value={profile.email} disabled className={input} />
              <button type="button" onClick={() => setEmailOpen(true)} className="text-sm text-wine underline whitespace-nowrap">
                Change
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Changing your email requires verifying the new address.</p>
          </div>
        </div>

        {editing && (
          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={saving} size="lg">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => {
                setEditing(false);
                setValues({ name: profile.name, phone: profile.phone });
                setErrors({});
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </form>

      <ChangeEmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        onChanged={(user) => {
          setUser(user);
          setEmailOpen(false);
          toast("Email updated");
          router.refresh();
        }}
      />
    </div>
  );
}

function ChangeEmailModal({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: (u: UserPublic) => void }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setStep("email");
    setOtp("");
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Change email" dismissible={!busy}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            if (step === "email") {
              await api("/api/user/email", { body: { email } });
              setStep("code");
            } else {
              const { user } = await api<{ user: UserPublic }>("/api/user/email/verify", { body: { email, otp } });
              onChanged(user);
              setStep("email");
              setOtp("");
              setEmail("");
            }
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        {step === "email" ? (
          <div>
            <label htmlFor="new-email" className="block text-sm text-gray-700 mb-1">
              New email address
            </label>
            <input id="new-email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Enter the 6-digit code we sent to <b className="break-all">{email}</b>.
            </p>
            <input
              aria-label="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className={`${input} tracking-[0.5em] text-center text-xl`}
            />
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth size="lg" isLoading={busy}>
          {step === "email" ? "Send code" : "Verify & update"}
        </Button>
      </form>
    </Modal>
  );
}
