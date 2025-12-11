// components/SellerOnboardingForm.jsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

const BUCKET = "seller-kyc";

function StepHeader({ step, title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        Step {step}
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{title}</div>
      {subtitle && (
        <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      )}
    </div>
  );
}

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
    logo_path: null,
    meta: {}
  });

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // ✅ Correct way to get the logged-in user in Supabase JS v2
  useEffect(() => {
    (async () => {
      setLoadingUser(true);

      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("getUser error", error);
      }
      const currentUser = data?.user ?? null;
      setUser(currentUser);
      setLoadingUser(false);

      if (currentUser) {
        setForm((f) => ({ ...f, user_id: currentUser.id }));

        // fetch existing seller row for this user_id
        const { data: sellerRow, error: sellerErr } = await supabase
          .from("sellers")
          .select("*")
          .eq("user_id", currentUser.id)
          .limit(1)
          .maybeSingle();

        if (sellerErr) {
          console.error("fetch seller error", sellerErr);
        }

        if (sellerRow) {
          setSeller(sellerRow);
          setForm({
            user_id: sellerRow.user_id,
            business_name: sellerRow.business_name || "",
            contact_name: sellerRow.contact_name || "",
            contact_phone: sellerRow.contact_phone || "",
            contact_email: sellerRow.contact_email || "",
            gstin: sellerRow.gstin || "",
            address_line1: sellerRow.address_line1 || "",
            address_line2: sellerRow.address_line2 || "",
            city: sellerRow.city || "",
            state: sellerRow.state || "",
            pincode: sellerRow.pincode || "",
            country: sellerRow.country || "India",
            about: sellerRow.about || "",
            logo_path: sellerRow.logo_path || null,
            meta: sellerRow.meta || {}
          });

          const { data: docsList, error: docsErr } = await supabase
            .from("seller_documents")
            .select("*")
            .eq("seller_id", sellerRow.id);

          if (docsErr) console.error("docs error", docsErr);
          if (docsList) setDocs(docsList);
        }
      }
    })();
  }, []);

  const updateForm = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function saveDraft() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
  
    try {
      if (!user) throw new Error("Not authenticated");
      if (!form.business_name) throw new Error("Business name is required");
  
      const payload = {
        ...form,
        user_id: user.id,
        seller_status: "draft",
        updated_at: new Date().toISOString()
      };
  
      if (seller?.id) {
        // update existing
        const { data, error } = await supabase
          .from("sellers")
          .update(payload)
          .eq("id", seller.id)
          .select()
          .maybeSingle();
  
        if (error) throw error;
        setSeller(data);
        setSuccessMsg("Draft updated");
        return data;
      } else {
        // insert new
        const { data, error } = await supabase
          .from("sellers")
          .insert(payload)
          .select()
          .maybeSingle();
  
        if (error) throw error;
        setSeller(data);
        setSuccessMsg("Draft saved");
        return data;
      }
    } catch (err) {
      console.error("saveDraft error", err);
      setError(err.message || "Failed to save draft");
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
      if (!user) throw new Error("Not authenticated");
  
      // Ensure seller exists and get a valid id
      let currentSeller = seller;
      if (!currentSeller?.id) {
        // create or update draft and get result
        currentSeller = await saveDraft();
        if (!currentSeller?.id) {
          throw new Error("Unable to create seller record before submission");
        }
      }
  
      // Double-check by fetching by user_id (defensive)
      const { data: fetched, error: fetchErr } = await supabase
        .from("sellers")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
  
      if (fetchErr) {
        console.warn("Warning - could not fetch seller after save:", fetchErr);
      }
      if (fetched && fetched.id) currentSeller = fetched;
  
      if (!currentSeller?.id) {
        throw new Error("Seller id missing - cannot submit");
      }
  
      // Now update status safely
      const { data, error } = await supabase
        .from("sellers")
        .update({
          seller_status: "submitted",
          updated_at: new Date().toISOString()
        })
        .eq("id", currentSeller.id)
        .select()
        .maybeSingle();
  
      if (error) throw error;
      setSeller(data);
      setSuccessMsg("Submitted for review");
      setStep(4);
    } catch (err) {
      console.error("submitForReview error", err);
      setError(err.message || "Failed to submit");
    } finally {
      setSaving(false);
    }
  }


  async function handleUploadFile(file, docType) {
    setUploading(true);
    setError(null);
    setSuccessMsg(null);
  
    try {
      if (!user) throw new Error("Not authenticated");
  
      // Ensure seller exists
      let currentSeller = seller;
      if (!currentSeller?.id) {
        currentSeller = await saveDraft();
        if (!currentSeller?.id) throw new Error("Create seller draft first before uploading documents");
      }
  
      const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;
      const path = `${currentSeller.id}/${filename}`;
  
      // Attempt upload
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
  
      if (uploadErr) {
        // Nice error message if bucket doesn't exist
        if (uploadErr.message && uploadErr.message.toLowerCase().includes("bucket")) {
          throw new Error(`Storage error: ${uploadErr.message}. Did you create the storage bucket "${BUCKET}"?`);
        }
        throw uploadErr;
      }
  
      const storagePath = uploadData.path;
  
      // Insert metadata row in seller_documents
      const { data: docRow, error: docErr } = await supabase
        .from("seller_documents")
        .insert({
          seller_id: currentSeller.id,
          doc_type: docType,
          storage_path: storagePath,
          meta: {
            original_name: file.name,
            size: file.size,
            mime: file.type
          }
        })
        .select()
        .maybeSingle();
  
      if (docErr) throw docErr;
  
      setDocs(prev => [...prev.filter(d => d.doc_type !== docType), docRow]);
      setSuccessMsg(`Uploaded ${docType}`);
    } catch (err) {
      console.error("handleUploadFile error", err);
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }
  

  if (loadingUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
        Loading seller onboarding…
      </div>
    );
  }

  // 🔁 You already have auth + redirect; but just in case:
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Become a seller</h2>
        <p className="mt-2 text-sm text-slate-500">
          Please sign in to continue.
        </p>
        <button
          onClick={() => router.push("/auth/signup")}
          className="mt-4 inline-flex items-center rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400"
        >
          Go to login / signup
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 max-w-5xl rounded-2xl bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex-1">
          {step === 1 && (
            <>
              <StepHeader
                step={1}
                title="Business details"
                subtitle="Tell us about your business."
              />
              <div className="grid gap-3">
                <input
                  className={inputClass}
                  placeholder="Business name"
                  value={form.business_name}
                  onChange={(e) => updateForm("business_name", e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="Contact person"
                  value={form.contact_name}
                  onChange={(e) => updateForm("contact_name", e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="Contact phone"
                  value={form.contact_phone}
                  onChange={(e) => updateForm("contact_phone", e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="Contact email"
                  value={form.contact_email}
                  onChange={(e) => updateForm("contact_email", e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="GSTIN (optional)"
                  value={form.gstin}
                  onChange={(e) => updateForm("gstin", e.target.value)}
                />
                <textarea
                  className={`${inputClass} min-h-[100px]`}
                  placeholder="Brief about your business"
                  value={form.about}
                  onChange={(e) => updateForm("about", e.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <StepHeader
                step={2}
                title="Business address"
                subtitle="Where is your business located?"
              />
              <div className="grid gap-3">
                <input
                  className={inputClass}
                  placeholder="Address line 1"
                  value={form.address_line1}
                  onChange={(e) =>
                    updateForm("address_line1", e.target.value)
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Address line 2"
                  value={form.address_line2}
                  onChange={(e) =>
                    updateForm("address_line2", e.target.value)
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={inputClass}
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => updateForm("state", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={inputClass}
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={(e) => updateForm("pincode", e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="Country"
                    value={form.country}
                    onChange={(e) => updateForm("country", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <StepHeader
                step={3}
                title="Verification documents"
                subtitle="Upload GST, PAN and bank proof."
              />
              <div className="grid gap-4">
                <FileUpload
                  label="GST certificate"
                  docType="gst_photo"
                  onUpload={handleUploadFile}
                  existing={docs.find((d) => d.doc_type === "gst_photo")}
                />
                <FileUpload
                  label="PAN card"
                  docType="pan"
                  onUpload={handleUploadFile}
                  existing={docs.find((d) => d.doc_type === "pan")}
                />
                <FileUpload
                  label="Cancelled cheque / bank proof"
                  docType="bank_cancelled"
                  onUpload={handleUploadFile}
                  existing={docs.find((d) => d.doc_type === "bank_cancelled")}
                />
                <p className="text-xs text-slate-500">
                  Files are stored securely. Only Haullcell team can see them
                  for verification.
                </p>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <StepHeader
                step={4}
                title="Review & submit"
                subtitle="Confirm your details before sending for approval."
              />
              <div className="grid gap-3 text-sm">
                <SummaryRow
                  label="Business"
                  value={form.business_name || "—"}
                />
                <SummaryRow
                  label="Contact"
                  value={`${form.contact_name || "—"} • ${
                    form.contact_phone || "—"
                  }`}
                />
                <SummaryRow
                  label="Email"
                  value={form.contact_email || user.email || "—"}
                />
                <SummaryRow
                  label="GSTIN"
                  value={form.gstin || "—"}
                />
                <SummaryRow
                  label="Address"
                  value={`${form.address_line1 || ""} ${
                    form.address_line2 || ""
                  }, ${form.city || ""}, ${form.state || ""} ${
                    form.pincode || ""
                  }`}
                />
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600">
                    Documents
                  </div>
                  {docs.length === 0 && (
                    <div className="text-xs text-slate-500">
                      No documents uploaded yet.
                    </div>
                  )}
                  {docs.map((d) => (
                    <div
                      key={d.id}
                      className="mt-1 flex items-center justify-between rounded-md border border-slate-200 px-2 py-1 text-xs"
                    >
                      <div>
                        <div className="font-medium">{d.doc_type}</div>
                        <div className="text-[11px] text-slate-500">
                          {d.meta?.original_name || d.storage_path}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Back
              </button>
            )}
            {step < 4 && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Continue
              </button>
            )}
            {step < 4 && (
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {saving ? "Saving…" : "Save draft"}
              </button>
            )}
            {step === 4 && (
              <button
                type="button"
                onClick={submitForReview}
                disabled={saving}
                className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-amber-400"
              >
                {saving ? "Submitting…" : "Submit for approval"}
              </button>
            )}
          </div>

          {error && (
            <div className="mt-3 text-xs text-red-600">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mt-3 text-xs text-emerald-700">
              {successMsg}
            </div>
          )}
        </div>

        <div className="w-full rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-700 lg:w-80">
          <div className="text-[13px] font-semibold text-slate-800">
            Onboarding progress
          </div>
          <ProgressIndicator step={step} />
          <div className="mt-3 text-[13px]">
            <span className="font-semibold">Status: </span>
            {seller ? seller.seller_status : "Not created yet"}
          </div>
          {seller?.status_note && (
            <div className="mt-1 text-[11px] text-slate-500">
              Note: {seller.status_note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400 focus:ring-0";

function ProgressIndicator({ step }) {
  const steps = [
    { id: 1, title: "Business" },
    { id: 2, title: "Address" },
    { id: 3, title: "KYC" },
    { id: 4, title: "Submit" }
  ];
  return (
    <div className="mt-2 space-y-2">
      {steps.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <div
            className={
              "flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-semibold " +
              (s.id <= step
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-400")
            }
          >
            {s.id}
          </div>
          <div>
            <div className="text-[12px] font-semibold text-slate-800">
              {s.title}
            </div>
            <div className="text-[11px] text-slate-400">
              {s.id < step
                ? "Completed"
                : s.id === step
                ? "Current"
                : "Pending"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FileUpload({ label, docType, onUpload, existing }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-[11px] text-slate-500">
          {existing ? "Uploaded" : "Not uploaded"}
        </span>
      </div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file, docType);
        }}
        className="block w-full text-[11px] text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
      />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-xs">
      <div className="text-slate-500">{label}</div>
      <div className="max-w-[60%] text-right font-semibold text-slate-800">
        {value || "—"}
      </div>
    </div>
  );
}