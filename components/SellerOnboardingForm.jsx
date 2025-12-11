// components/SellerOnboardingForm.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/*
  Usage:
    <SellerOnboardingForm />
  Requirements:
    - user must be signed in (supabase.auth.getUser / session)
    - bucket 'seller-kyc' exists in Supabase storage
*/

const BUCKET = "seller-kyc";

function StepHeader({ step, title, subtitle }) {
  return (
    <div style={{marginBottom:18}}>
      <div style={{fontSize:12,color:"#6b7280"}}>Step {step}</div>
      <div style={{fontSize:18,fontWeight:700}}>{title}</div>
      {subtitle && <div style={{color:"#6b7280",marginTop:6}}>{subtitle}</div>}
    </div>
  );
}

export default function SellerOnboardingForm() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // seller state maps EXACTLY to your sellers table columns (don't assume extras)
  const [seller, setSeller] = useState(null); // existing seller row if any
  const [form, setForm] = useState({
    user_id: null, // will be set to auth user id
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
  const [docs, setDocs] = useState([]); // local list of uploaded docs rows
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingUser(true);
      const { data: session } = await supabase.auth.getSession();
      const currentUser = session?.data?.user ?? null;
      setUser(currentUser);
      setLoadingUser(false);
      if (currentUser) {
        setForm(f => ({ ...f, user_id: currentUser.id }));
        // fetch existing seller for this profile (if any)
        const { data: sellers, error } = await supabase
          .from("sellers")
          .select("*")
          .eq("user_id", currentUser.id)
          .limit(1)
          .maybeSingle();
        if (error) console.error("fetch seller error", error);
        if (sellers) {
          setSeller(sellers);
          // populate form with existing seller values (only fields in schema)
          setForm({
            user_id: sellers.user_id,
            business_name: sellers.business_name || "",
            contact_name: sellers.contact_name || "",
            contact_phone: sellers.contact_phone || "",
            contact_email: sellers.contact_email || "",
            gstin: sellers.gstin || "",
            address_line1: sellers.address_line1 || "",
            address_line2: sellers.address_line2 || "",
            city: sellers.city || "",
            state: sellers.state || "",
            pincode: sellers.pincode || "",
            country: sellers.country || "India",
            about: sellers.about || "",
            logo_path: sellers.logo_path || null,
            meta: sellers.meta || {}
          });
          // fetch docs
          const { data: docsList } = await supabase
            .from("seller_documents")
            .select("*")
            .eq("seller_id", sellers.id);
          if (docsList) setDocs(docsList);
        }
      }
    })();
  }, []);

  // helpers
  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // create or update seller (save draft)
  async function saveDraft() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (!user) throw new Error("Not authenticated");
      // Ensure user_id in form equals user.id (RLS will enforce)
      const payload = {
        ...form,
        user_id: user.id,
        seller_status: "draft"
      };
      if (!form.business_name) throw new Error("Business name is required");
      if (seller && seller.id) {
        // update
        const { data, error } = await supabase
          .from("sellers")
          .update(payload)
          .eq("id", seller.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        setSeller(data);
        setSuccessMsg("Draft updated");
      } else {
        // insert
        const { data, error } = await supabase
          .from("sellers")
          .insert(payload)
          .select()
          .maybeSingle();
        if (error) throw error;
        setSeller(data);
        setSuccessMsg("Draft saved");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  }

  // submit for review
  async function submitForReview() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (!seller?.id) {
        // create draft first
        await saveDraft();
      }
      // set seller_status = 'submitted'
      const { data, error } = await supabase
        .from("sellers")
        .update({ seller_status: "submitted", updated_at: new Date().toISOString() })
        .eq("id", seller?.id || null)
        .select()
        .maybeSingle();
      if (error) throw error;
      setSeller(data);
      setSuccessMsg("Submitted for review. Admin will review and approve shortly.");
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit");
    } finally {
      setSaving(false);
    }
  }

  // upload doc file to Supabase Storage and create seller_documents row
  async function handleUploadFile(file, docType) {
    setUploading(true);
    setError(null);
    try {
      if (!user) throw new Error("Not authenticated");
      if (!seller?.id) {
        // must have a seller row first
        await saveDraft();
        // refresh seller
        const { data: s } = await supabase
          .from("sellers")
          .select("*")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        setSeller(s);
      }

      // create a safe path: seller_<sellerId>/timestamp_filename
      const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;
      const path = `${seller?.id || "temp"}/${filename}`;

      // upload to bucket
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadErr) {
        // if conflict because path contains "temp" or other, consider fallback
        throw uploadErr;
      }

      // get public URL or signed URL (we will store storage path)
      // NOTE: by default Supabase storage requires signed URL to serve; store path for record.
      const storagePath = uploadData.path;

      // insert metadata into seller_documents
      const { data: docRow, error: docErr } = await supabase
        .from("seller_documents")
        .insert({
          seller_id: seller.id,
          doc_type: docType,
          storage_path: storagePath,
          meta: { original_name: file.name, size: file.size, mime: file.type }
        })
        .select()
        .maybeSingle();

      if (docErr) throw docErr;

      setDocs(prev => [...prev.filter(d => d.doc_type !== docType), docRow]);
      setSuccessMsg("Uploaded " + docType);
    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // get a public / signed URL for display
  async function getPublicUrl(storagePath) {
    if (!storagePath) return null;
    // use createSignedUrl to get temporary url for preview (expiration 1 hour)
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
      if (error) return null;
      return data.signedUrl;
    } catch (err) {
      return null;
    }
  }

  // UI steps
  if (loadingUser) return <div style={{padding:20}}>Loading...</div>;
  if (!user) {
    return (
      <div style={{maxWidth:900,margin:"0 auto",padding:20}}>
        <h2>Become a seller</h2>
        <p>Please sign in to continue.</p>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth:980,
      margin:"16px auto",
      background:"#fff",
      borderRadius:12,
      boxShadow:"0 6px 30px rgba(0,0,0,0.06)",
      overflow:"hidden"
    }}>
      <div style={{display:"flex",padding:28,gap:24}}>
        <div style={{flex:"1 1 520px"}}>
          {step === 1 && (
            <>
              <StepHeader step={1} title="Business details" subtitle="Tell us about your business" />
              <div style={{display:"grid",gap:12}}>
                <input value={form.business_name} onChange={e=>updateForm("business_name", e.target.value)} placeholder="Business name" style={inputStyle} />
                <input value={form.contact_name} onChange={e=>updateForm("contact_name", e.target.value)} placeholder="Contact person" style={inputStyle} />
                <input value={form.contact_phone} onChange={e=>updateForm("contact_phone", e.target.value)} placeholder="Contact phone" style={inputStyle} />
                <input value={form.contact_email} onChange={e=>updateForm("contact_email", e.target.value)} placeholder="Contact email" style={inputStyle} />
                <input value={form.gstin} onChange={e=>updateForm("gstin", e.target.value)} placeholder="GSTIN (optional)" style={inputStyle} />
                <textarea value={form.about} onChange={e=>updateForm("about", e.target.value)} placeholder="Brief about your business" style={{...inputStyle,height:120}} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <StepHeader step={2} title="Business address" subtitle="Where is your business located?" />
              <div style={{display:"grid",gap:12}}>
                <input value={form.address_line1} onChange={e=>updateForm("address_line1", e.target.value)} placeholder="Address line 1" style={inputStyle} />
                <input value={form.address_line2} onChange={e=>updateForm("address_line2", e.target.value)} placeholder="Address line 2" style={inputStyle} />
                <div style={{display:"flex",gap:12}}>
                  <input value={form.city} onChange={e=>updateForm("city", e.target.value)} placeholder="City" style={{...inputStyle,flex:1}} />
                  <input value={form.state} onChange={e=>updateForm("state", e.target.value)} placeholder="State" style={{...inputStyle,flex:1}} />
                </div>
                <div style={{display:"flex",gap:12}}>
                  <input value={form.pincode} onChange={e=>updateForm("pincode", e.target.value)} placeholder="Pincode" style={{...inputStyle,flex:1}} />
                  <input value={form.country} onChange={e=>updateForm("country", e.target.value)} placeholder="Country" style={{...inputStyle,flex:1}} />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <StepHeader step={3} title="Verification documents" subtitle="Upload GST, PAN, bank proof or cancelled cheque" />
              <div style={{display:"grid",gap:12}}>
                <FileUpload label="GST certificate (image/pdf)" docType="gst_photo" onUpload={handleUploadFile} existing={docs.find(d=>d.doc_type==='gst_photo')} />
                <FileUpload label="PAN card (image/pdf)" docType="pan" onUpload={handleUploadFile} existing={docs.find(d=>d.doc_type==='pan')} />
                <FileUpload label="Cancelled cheque / bank proof (image/pdf)" docType="bank_cancelled" onUpload={handleUploadFile} existing={docs.find(d=>d.doc_type==='bank_cancelled')} />
                <div style={{color:"#6b7280",fontSize:13}}>Files are uploaded securely to storage and only your KYC reviewers can access them.</div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <StepHeader step={4} title="Review & Submit" subtitle="Review details and submit for admin approval" />
              <div style={{display:"grid",gap:12}}>
                <SummaryRow label="Business" value={form.business_name} />
                <SummaryRow label="Contact" value={`${form.contact_name} • ${form.contact_phone} • ${form.contact_email}`} />
                <SummaryRow label="Address" value={`${form.address_line1} ${form.address_line2}, ${form.city}, ${form.state} - ${form.pincode}`} />
                <SummaryRow label="GSTIN" value={form.gstin || "—"} />
                <div>
                  <div style={{fontWeight:700,marginBottom:8}}>Uploaded documents</div>
                  {docs.length === 0 && <div style={{color:"#6b7280"}}>No documents uploaded</div>}
                  {docs.map(d => (
                    <div key={d.id} style={{display:"flex",alignItems:"center",gap:12,padding:8,border:"1px solid #eee",borderRadius:8,marginTop:8}}>
                      <div style={{fontSize:13,fontWeight:600}}>{d.doc_type}</div>
                      <div style={{color:"#6b7280"}}>{d.meta?.original_name || d.storage_path}</div>
                      <a href="#" onClick={async (e)=>{ e.preventDefault(); const url = await supabase.storage.from(BUCKET).createSignedUrl(d.storage_path, 60*60); window.open(url.data.signedUrl, "_blank"); }}>Preview</a>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{marginTop:18,display:"flex",gap:8,alignItems:"center"}}>
            {step > 1 && <button onClick={()=>setStep(s=>s-1)} style={secondaryBtn}>Back</button>}
            {step < 4 && <button onClick={()=>setStep(s=>s+1)} style={primaryBtn}>Continue</button>}
            {step < 4 && <button onClick={saveDraft} disabled={saving} style={ghostBtn}>{saving ? "Saving..." : "Save draft"}</button>}
            {step === 4 && <button onClick={submitForReview} disabled={saving} style={primaryBtn}>{saving ? "Submitting..." : "Submit for review"}</button>}
          </div>

          {error && <div style={{marginTop:12,color:"#b91c1c"}}>{error}</div>}
          {successMsg && <div style={{marginTop:12,color:"#065f46"}}>{successMsg}</div>}
        </div>

        <div style={{width:340, padding:20, background:"#fafafa", borderLeft:"1px solid #f0f0f0"}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>Onboarding progress</div>
          <ProgressIndicator step={step} />
          <div style={{height:18}} />
          <div style={{fontSize:13,color:"#374151"}}><strong>Seller status:</strong> {seller ? seller.seller_status : "Not created"}</div>
          {seller?.status_note && <div style={{color:"#9ca3af",fontSize:13,marginTop:6}}>Note: {seller.status_note}</div>}
          <div style={{height:18}} />
          <div style={{fontSize:13,color:"#6b7280"}}>You will be contacted by admin on approval. After approval, your account will be enabled to add products and receive orders.</div>
        </div>
      </div>
    </div>
  );
}

/* small UI pieces */

const inputStyle = {
  padding: "10px 12px",
  borderRadius:8,
  border:"1px solid #e6e6e6",
  fontSize:14,
  outline:"none"
};

const primaryBtn = {
  padding:"10px 14px",
  background:"#111827",
  color:"#fff",
  borderRadius:8,
  border:"none",
  cursor:"pointer"
};

const secondaryBtn = {
  padding:"8px 12px",
  background:"#fff",
  color:"#111",
  borderRadius:8,
  border:"1px solid #e6e6e6",
  cursor:"pointer"
};

const ghostBtn = {
  padding:"8px 12px",
  background:"transparent",
  color:"#111",
  borderRadius:8,
  border:"1px dashed #e6e6e6",
  cursor:"pointer"
};

function ProgressIndicator({ step }) {
  const steps = [
    { id:1, title:"Business" },
    { id:2, title:"Address" },
    { id:3, title:"KYC" },
    { id:4, title:"Submit" }
  ];
  return (
    <div>
      {steps.map(s => (
        <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{
            width:34,height:34,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
            background: s.id <= step ? "#111827" : "#fff",
            color: s.id <= step ? "#fff" : "#9ca3af",
            border: "1px solid #e6e6e6",
            fontWeight:700
          }}>{s.id}</div>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>{s.title}</div>
            <div style={{fontSize:12,color:"#9ca3af"}}>{s.id < step ? "Completed" : s.id === step ? "Current" : "Pending"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FileUpload({ label, docType, onUpload, existing }) {
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{fontWeight:700}}>{label}</div>
        {existing ? (<div style={{fontSize:13,color:"#064e3b"}}>Uploaded</div>) : (<div style={{fontSize:13,color:"#6b7280"}}>Not uploaded</div>)}
      </div>
      <input type="file" onChange={(e)=>{ const f = e.target.files[0]; if (f) onUpload(f, docType); }} />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",border:"1px solid #f3f4f6",borderRadius:8}}>
      <div style={{color:"#6b7280"}}>{label}</div>
      <div style={{fontWeight:600}}>{value}</div>
    </div>
  );
}