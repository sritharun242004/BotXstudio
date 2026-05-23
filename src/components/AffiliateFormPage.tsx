import { useState, useEffect, useRef } from "react";
import type { Affiliate, CreateAffiliateInput } from "../lib/affiliateAdmin";
import {
  affiliateAdminGet,
  affiliateAdminCreate,
  affiliateAdminUpdate,
  affiliateAdminGetProfileUploadUrl,
  uploadImageToS3,
} from "../lib/affiliateAdmin";

interface Props {
  affiliateId?: string;
  onSaved: (aff: Affiliate) => void;
  onCancel: () => void;
}

export default function AffiliateFormPage({ affiliateId, onSaved, onCancel }: Props) {
  const isEdit = !!affiliateId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [commission, setCommission] = useState("10");
  const [bonusCredits, setBonusCredits] = useState("50");
  const [status, setStatus] = useState("active");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [existingCode, setExistingCode] = useState<string | null>(null);

  useEffect(() => {
    if (!affiliateId) return;
    affiliateAdminGet(affiliateId)
      .then((aff) => {
        setName(aff.name);
        setEmail(aff.email);
        setPhone(aff.phone ?? "");
        setCommission(String(aff.commissionPercentage));
        setBonusCredits(String(aff.bonusCredits ?? 0));
        setStatus(aff.status);
        setInstagram(aff.instagram ?? "");
        setYoutube(aff.youtube ?? "");
        setLinkedin(aff.linkedin ?? "");
        setLocation(aff.location ?? "");
        setBio(aff.bio ?? "");
        setBankName(aff.bankName ?? "");
        setAccountNumber(aff.accountNumber ?? "");
        setUpiId(aff.upiId ?? "");
        setImagePreview(aff.profileImageUrl);
        setExistingCode(aff.affiliateCode);
      })
      .catch((e: any) => setError(e.message || "Failed to load affiliate"))
      .finally(() => setLoading(false));
  }, [affiliateId]);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    setSaving(true);
    setError("");
    try {
      const input: CreateAffiliateInput = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        commissionPercentage: parseFloat(commission) || 10,
        bonusCredits: parseInt(bonusCredits) || 0,
        instagram: instagram.trim() || undefined,
        youtube: youtube.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        upiId: upiId.trim() || undefined,
      };

      let saved: Affiliate;
      if (isEdit) {
        saved = await affiliateAdminUpdate(affiliateId, { ...input, status });
      } else {
        saved = await affiliateAdminCreate(input);
      }

      if (pendingFile) {
        setImageUploading(true);
        try {
          const { uploadUrl, publicUrl } = await affiliateAdminGetProfileUploadUrl(saved.id, pendingFile.type);
          await uploadImageToS3(uploadUrl, pendingFile);
          saved = await affiliateAdminUpdate(saved.id, { profileImageUrl: publicUrl });
        } finally {
          setImageUploading(false);
        }
      }

      onSaved(saved);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const namePart = name.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5).padEnd(5, "X");
  const codePreview = existingCode || `${namePart}001`;

  if (loading) return <div className="adPage"><div className="adEmpty">Loading…</div></div>;

  return (
    <form className="adPage" onSubmit={handleSubmit}>
      <div className="adPageHeader">
        <div>
          <h2 className="adPageTitle">{isEdit ? "Edit Affiliate" : "New Affiliate"}</h2>
          <p className="adPageSub">{isEdit ? "Update affiliate details" : "Create a new affiliate partner account"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="adActionBtn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="adPrimaryBtn" disabled={saving || imageUploading}>
            {saving || imageUploading ? "Saving…" : isEdit ? "Save Changes" : "Create Affiliate"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#DC2626", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="adAffFormLayout">
        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="adTableCard">
            <div className="adSectionLabel">Basic Information</div>
            <div className="adFormGrid">
              <div className="adFormField">
                <label className="adFormLabel">Full Name *</label>
                <input className="adFormInput" value={name} onChange={e => setName(e.target.value)} placeholder="Mohan Raj" required />
              </div>
              <div className="adFormField">
                <label className="adFormLabel">Email *</label>
                <input className="adFormInput" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="affiliate@example.com" required />
              </div>
              <div className="adFormField">
                <label className="adFormLabel">Phone</label>
                <input className="adFormInput" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9999999999" />
              </div>
              <div className="adFormField">
                <label className="adFormLabel">Location</label>
                <input className="adFormInput" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, State" />
              </div>
              <div className="adFormField" style={{ gridColumn: "1 / -1" }}>
                <label className="adFormLabel">Bio</label>
                <textarea className="adFormTextarea" value={bio} onChange={e => setBio(e.target.value)} placeholder="Short intro about the affiliate…" rows={3} />
              </div>
            </div>
          </div>

          <div className="adTableCard">
            <div className="adSectionLabel">Social Media</div>
            <div className="adFormGrid">
              <div className="adFormField">
                <label className="adFormLabel">Instagram</label>
                <input className="adFormInput" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle or profile URL" />
              </div>
              <div className="adFormField">
                <label className="adFormLabel">YouTube</label>
                <input className="adFormInput" value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="Channel URL" />
              </div>
              <div className="adFormField" style={{ gridColumn: "1 / -1" }}>
                <label className="adFormLabel">LinkedIn</label>
                <input className="adFormInput" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="Profile URL" />
              </div>
            </div>
          </div>

          <div className="adTableCard">
            <div className="adSectionLabel">Payment Details</div>
            <div className="adFormGrid">
              <div className="adFormField">
                <label className="adFormLabel">Bank Name</label>
                <input className="adFormInput" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="HDFC Bank" />
              </div>
              <div className="adFormField">
                <label className="adFormLabel">Account Number</label>
                <input className="adFormInput" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="XXXXXXXXXXXXXXXX" />
              </div>
              <div className="adFormField">
                <label className="adFormLabel">UPI ID</label>
                <input className="adFormInput" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@upi" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="adTableCard">
            <div className="adSectionLabel">Profile Image</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "3px solid #E2E8F0" }} />
              ) : (
                <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#8B5CF620", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800 }}>
                  {name[0]?.toUpperCase() || "?"}
                </div>
              )}
              <button type="button" className="adActionBtn adActionBtnEdit" style={{ width: "100%" }} onClick={() => fileRef.current?.click()}>
                Choose Image
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />
              <div style={{ fontSize: 11, color: "#94A3B8" }}>PNG · JPG · WEBP</div>
            </div>
          </div>

          <div className="adTableCard">
            <div className="adSectionLabel">Commission Settings</div>
            <div className="adFormField">
              <label className="adFormLabel">Commission Rate (%)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input className="adFormInput" type="number" min="0" max="100" step="0.5" value={commission} onChange={e => setCommission(e.target.value)} style={{ maxWidth: 100 }} />
                <span style={{ fontSize: 13, color: "#64748B" }}>% of purchase</span>
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
                ₹1000 purchase → ₹{((parseFloat(commission) || 0) * 10).toFixed(0)} commission
              </div>
            </div>

            <div className="adFormField" style={{ marginTop: 16 }}>
              <label className="adFormLabel">Signup Bonus Credits (₹)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input className="adFormInput" type="number" min="0" max="10000" step="10" value={bonusCredits} onChange={e => setBonusCredits(e.target.value)} style={{ maxWidth: 100 }} />
                <span style={{ fontSize: 13, color: "#64748B" }}>free credits on signup</span>
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
                New users who sign up via this link get ₹{parseInt(bonusCredits) || 0} added instantly
              </div>
            </div>

            {isEdit && (
              <div className="adFormField" style={{ marginTop: 16 }}>
                <label className="adFormLabel">Status</label>
                <select className="adFormInput" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div className="adTableCard">
            <div className="adSectionLabel">Affiliate Code</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 800, background: "#F1F5F9", padding: "12px 16px", borderRadius: 10, color: "#8B5CF6", letterSpacing: 2 }}>
                {codePreview}
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 8 }}>
                {existingCode ? "Permanent — cannot be changed" : "Auto-generated on creation"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid #F1F5F9" }}>
        <button type="button" className="adActionBtn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="adPrimaryBtn" disabled={saving || imageUploading}>
          {saving || imageUploading ? "Saving…" : isEdit ? "Save Changes" : "Create Affiliate"}
        </button>
      </div>
    </form>
  );
}
