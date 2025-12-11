// components/SellerOnboardingForm.js
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

/**
 * SellerOnboardingForm.js
 *
 * - HIGH-END UI (Tailwind) matching your site
 * - Removed document upload / verification step (disabled for now)
 * - Auto-saves draft before moving steps so sellers row exists
 * - Uses your existing `sellers` table schema and Supabase auth
 *
 * Usage:
 *   import SellerOnboardingForm from "../components/SellerOnboardingForm";
 *   <SellerOnboardingForm />
 *
 * Note: When you want KYC back, we'll add a secure server-side insert flow.
 */

export default function SellerOnboardingForm() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [seller, setSeller] = useState(null);
  const [form, setForm] = useState({
    user_id: null,
    business_name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    gstin: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    about: "",
    meta: {}
  });

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingUser(true);
      try {
        const { data, error: userErr } = await supabase.auth.getUser();
        if (userErr) console.warn("getUser error", userErr);
        const currentUser = data?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          setForm((f) => ({ ...f, user_id: currentUser.id, contact_email: currentUser.email || f.contact_email }));

          // fetch existing seller for this user if exists
          const { data: sellerRow, error: sellerErr } = await supabase
            .from("sellers")
            .select("*")
            .eq("user_id", currentUser.id)
            .limit(1)
            .maybeSingle();

          if (sellerErr) {
            console.error("fetch seller error", sellerErr);
          } else if (sellerRow) {
            setSeller(sellerRow);
            setForm((f) => ({
              ...f,
              business_name: sellerRow.business_name || "",
              contact_name: sellerRow.contact_name || "",
              contact_phone: sellerRow.contact_phone || "",
              contact_email: sellerRow.contact_email || currentUser.email || "",
              gstin: sellerRow.gstin || "",
              address_line1: sellerRow.address_line1 || "",
              address_line2: sellerRow.address_line2 || "",
              city: sellerRow.city || "",
              state: sellerRow.state || "",
              pincode: sellerRow.pincode || "",
              country: sellerRow.country || "India",
              about: sellerRow.about || "",
              meta: sellerRow.meta || {}
            }));
          }
        }
      } catch (err) {
        console.error("init error", err);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  const updateForm = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // create/update seller row and return row (or null on error)
  async function saveDraft() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (!user) throw new Error("Please sign in to continue.");

      if (!form.business_name || form.business_name.trim().length < 2) {
        throw new Error("Business name is required.");
      }

      const payload = {
        user_id: user.id,
        business_name: form.business_name || null,
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        gstin: form.gstin || null,
        address_line1: form.address_line1 || null,
        address_line2: form.address_line2 || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
        country: form.country || "India",
        about: form.about || null,
        meta: form.meta || {},
        seller_status: "draft",
        updated_at: new Date().toISOString()
      };

      if (seller?.id) {
        const { data, error } = await supabase
          .from("sellers")
          .update(payload)
          .eq("id", seller.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        setSeller(data);
        setSuccessMsg("Draft updated.");
        return data;
      } else {
        const { data, error } = await supabase
          .from("sellers")
          .insert(payload)
          .select()
          .maybeSingle();
        if (error) throw error;
        setSeller(data);
        setSuccessMsg("Draft saved.");
        return data;
      }
    } catch (err) {
      console.error("saveDraft error", err);
      setError(err.message || "Could not save draft");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function submitForReview() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (!user) throw new Error("Please sign in to continue.");

      let currentSeller = seller;
      if (!currentSeller?.id) {
        currentSeller = await saveDraft();
        if (!currentSeller?.id) throw new Error("Unable to create a seller record before submission.");
      }

      const { data, error } = await supabase
        .from("sellers")
        .update({ seller_status: "submitted", updated_at: new Date().toISOString() })
        .eq("id", currentSeller.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      setSeller(data);
      setSuccessMsg("Submitted for review. Admin will contact you.");
      setStep(4);
    } catch (err) {
      console.error("submitForReview error", err);
      setError(err.message || "Failed to submit for review.");
    } finally {
      setSaving(false);
    }
  }

  // navigation that ensures draft exists before entering step 3 or submitting
  async function goTo(next) {
    setError(null);
    setSuccessMsg(null);
    if (next === 3 && !seller?.id) {
      await saveDraft();
    }
    setStep(next);
  }

  if (loadingUser) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Become a seller</h2>
        <p className="mt-3 text-slate-600">Please sign in to create your seller account and list products.</p>
        <button onClick={() => router.push("/auth/signup")} className="mt-6 inline-flex items-center rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400">
          Go to login / signup
        </button>
      </div>
    );
  }

  // high-end UI layout
  return (
    <div className="mx-auto mt-6 max-w-4xl rounded-2xl bg-white p-6 shadow-[0_12px_40px_rgba(2,6,23,0.06)]">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="mb-4">
            <div className="text-xs font-medium text-slate-500">Seller onboarding</div>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Create your Haullcell seller account</h1>
            <p className="mt-2 text-sm text-slate-600">Add your business details and submit for verification. You can add catalog after approval.</p>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-slate-700">Business details</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputClass} placeholder="Business name" value={form.business_name} onChange={(e) => updateForm("business_name", e.target.value)} />
                <input className={inputClass} placeholder="Contact person" value={form.contact_name} onChange={(e) => updateForm("contact_name", e.target.value)} />
                <input className={inputClass} placeholder="Contact phone" value={form.contact_phone} onChange={(e) => updateForm("contact_phone", e.target.value)} />
                <input className={inputClass} placeholder="Contact email" value={form.contact_email} onChange={(e) => updateForm("contact_email", e.target.value)} />
                <input className={inputClass} placeholder="GSTIN (optional)" value={form.gstin} onChange={(e) => updateForm("gstin", e.target.value)} />
                <textarea className={`${inputClass} col-span-2 min-h-[90px]`} placeholder="Short description about your business" value={form.about} onChange={(e) => updateForm("about", e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-slate-700">Business address</div>
              <div className="grid gap-3">
                <input className={inputClass} placeholder="Address line 1" value={form.address_line1} onChange={(e) => updateForm("address_line1", e.target.value)} />
                <input className={inputClass} placeholder="Address line 2" value={form.address_line2} onChange={(e) => updateForm("address_line2", e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClass} placeholder="City" value={form.city} onChange={(e) => updateForm("city", e.target.value)} />
                  <input className={inputClass} placeholder="State" value={form.state} onChange={(e) => updateForm("state", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClass} placeholder="Pincode" value={form.pincode} onChange={(e) => updateForm("pincode", e.target.value)} />
                  <input className={inputClass} placeholder="Country" value={form.country} onChange={(e) => updateForm("country", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — KYC placeholder (disabled for now) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-slate-700">Documents (temporarily disabled)</div>
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Document uploads and verification are temporarily disabled to avoid RLS errors. You can still finish onboarding and submit — KYC can be added later from your dashboard.</p>
                <div className="mt-3 text-xs text-slate-500">We will request GST / PAN uploads after this step in a secure flow.</div>
              </div>
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-slate-700">Review & submit</div>
              <div className="grid gap-3">
                <SummaryRow label="Business" value={form.business_name} />
                <SummaryRow label="Contact" value={`${form.contact_name || "—"} • ${form.contact_phone || "—"}`} />
                <SummaryRow label="Email" value={form.contact_email || user?.email || "—"} />
                <SummaryRow label="GSTIN" value={form.gstin || "—"} />
                <SummaryRow label="Address" value={`${form.address_line1 || ""} ${form.address_line2 || ""}, ${form.city || ""}, ${form.state || ""} ${form.pincode || ""}`} />
                <div className="text-sm text-slate-600">Documents: <span className="font-medium">Not required at submission (will be requested later)</span></div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {step > 1 && <button disabled={saving} onClick={() => setStep(s => s - 1)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">Back</button>}
            {step < 4 && <button disabled={saving} onClick={() => goTo(step + 1)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">Continue</button>}
            {step < 4 && <button disabled={saving} onClick={saveDraft} className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm">{saving ? "Saving…" : "Save draft"}</button>}
            {step === 4 && <button disabled={saving} onClick={submitForReview} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400">{saving ? "Submitting…" : "Submit for approval"}</button>}
          </div>

          {error && <div className="mt-4 text-xs text-red-600">{error}</div>}
          {successMsg && <div className="mt-4 text-xs text-emerald-700">{successMsg}</div>}
        </div>

        <aside className="w-full lg:w-80 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-800">Onboarding progress</div>
          <ProgressIndicator step={step} />
          <div className="mt-4 text-sm"><span className="font-semibold">Status:</span> {seller ? seller.seller_status : "Not created yet"}</div>
          {seller?.status_note && <div className="mt-1 text-xs text-slate-500">Note: {seller.status_note}</div>}
          <div className="mt-4 text-xs text-slate-500">After approval you will be able to add products, manage inventory, and receive orders.</div>
        </aside>
      </div>
    </div>
  );
}

/* Small UI helpers */

const inputClass = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-0";

function ProgressIndicator({ step }) {
  const steps = [
    { id: 1, title: "Business" },
    { id: 2, title: "Address" },
    { id: 3, title: "Documents (disabled)" },
    { id: 4, title: "Submit" }
  ];
  return (
    <div className="mt-3 space-y-3">
      {steps.map(s => (
        <div key={s.id} className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-md font-semibold ${s.id <= step ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-400"}`}>{s.id}</div>
          <div>
            <div className="text-sm font-medium text-slate-800">{s.title}</div>
            <div className="text-xs text-slate-400">{s.id < step ? "Completed" : s.id === step ? "Current" : "Pending"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="max-w-[60%] text-right font-semibold text-slate-800">{value || "—"}</div>
    </div>
  );
}
