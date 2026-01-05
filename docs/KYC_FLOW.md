# 🔐 KYC Verification Flow - MERIDIAN Protocol

## Complete Application Flow

### 🎯 Overview

MERIDIAN Protocol implements a hybrid KYC system combining:
- **Off-chain**: Document storage and verification in Supabase
- **On-chain**: Zero-knowledge proofs and compliance registry on Mantle Network
- **Privacy-first**: Selective disclosure using ZK proofs

---

## 📋 Step-by-Step Flow

### **1️⃣ User Initiates KYC**

**Location**: [ComplianceCenter.tsx](../src/pages/ComplianceCenter.tsx)

**Trigger**: User clicks "Start KYC Verification" button

**What Happens**:
```typescript
// Opens KYCVerificationWizard modal
setKycWizardOpen(true)
```

**UI**: Multi-step wizard with 3 steps:
1. Personal Information
2. Document Upload
3. Review & Submit

---

### **2️⃣ Personal Information Collection**

**Component**: [KYCVerificationWizard.tsx](../src/components/KYCVerificationWizard.tsx) - Step 1

**Data Collected**:
- Full Name
- Email Address
- Date of Birth
- Country & Jurisdiction
- Street Address & City
- Accreditation Status (0-3)

**Validation**: All fields marked with * are required

**Data Storage**: Stored in React state until submission

---

### **3️⃣ Document Upload**

**Component**: [KYCVerificationWizard.tsx](../src/components/KYCVerificationWizard.tsx) - Step 2

**Required Documents**:
1. **Identity Document** (Required)
   - Passport
   - Driver's License
   - National ID
   - Accepted formats: PDF, JPG, PNG

2. **Proof of Address** (Required)
   - Utility Bill (< 3 months old)
   - Bank Statement (< 3 months old)
   - Government letter
   - Accepted formats: PDF, JPG, PNG

3. **Accreditation Letter** (Optional)
   - Required for private offerings
   - CPA letter, attorney letter, or brokerage statement
   - Accepted format: PDF

**Current Implementation**:
```typescript
// Files stored in browser state
handleFileChange("identityDoc", file)
handleFileChange("addressDoc", file)
handleFileChange("accreditationDoc", file)
```

**Production Enhancement**:
```typescript
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('kyc-documents')
  .upload(`${walletAddress}/${fileName}`, file)

// Get public URL
const { publicURL } = supabase.storage
  .from('kyc-documents')
  .getPublicUrl(`${walletAddress}/${fileName}`)
```

---

### **4️⃣ Review & Submit**

**Component**: [KYCVerificationWizard.tsx](../src/components/KYCVerificationWizard.tsx) - Step 3

**User Reviews**:
- Personal information summary
- Accreditation status
- Document list with file names

**Submission Process**:
```typescript
const handleSubmit = async () => {
  // 1. Update user profile
  await updateProfile({
    display_name: formData.displayName,
    email: formData.email,
    jurisdiction: formData.jurisdiction,
    accreditation_type: formData.accreditationType,
    kyc_status: "pending",
  })

  // 2. Submit documents to Supabase
  await submitDocument({
    document_type: "identity",
    document_name: "passport.pdf",
    file_url: storageURL, // From Supabase Storage
  })

  // 3. Show success message
  setSubmitSuccess(true)
}
```

**Database Updates**:
- `profiles` table: KYC status → "pending"
- `kyc_documents` table: 2-3 new records created
- Notification sent to user

---

### **5️⃣ Admin Review (Simulated)**

**Current State**: Manual admin process (not implemented in UI)

**How It Works**:

**Option A: Supabase Dashboard (Current)**
1. Admin logs into Supabase
2. Views `kyc_documents` table
3. Reviews submitted documents
4. Updates `status` column:
   - `pending` → `approved`
   - `pending` → `rejected`
5. Updates `reviewed_at` timestamp
6. Adds `reviewer_notes` if rejected

**Option B: Admin Panel (To Be Built)**
```typescript
// Future admin UI component
<AdminKYCReview
  onApprove={async (docId) => {
    await supabase
      .from('kyc_documents')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', docId)
  }}
  onReject={async (docId, notes) => {
    await supabase
      .from('kyc_documents')
      .update({ 
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes
      })
      .eq('id', docId)
  }}
/>
```

**Integration with KYC Providers (Future)**:
- Onfido API
- Jumio API
- SumSub API

---

### **6️⃣ On-Chain Verification**

**Contracts**:
- `ZKKYCVerifier` - Issues credentials
- `ComplianceRegistry` - Tracks compliance status

**Manual Process (Current)**:

After admin approves in Supabase, manually call contracts:

```javascript
// scripts/issue-kyc.cjs
const { ethers } = require("hardhat")

async function issueKYC() {
  const zkKYC = await ethers.getContractAt(
    "ZKKYCVerifier",
    "0x9dfF21EAC0dc1D3C2a08Dc9168119fA8F2F3b56c"
  )
  
  const compliance = await ethers.getContractAt(
    "ComplianceRegistry",
    "0xe05626781cF3B9a477FDE0f2Ae02129F22779209"
  )

  const userAddress = "0x3Eff...070C"
  
  // 1. Issue ZK credential
  await zkKYC.issueCredential(
    userAddress,
    "US",           // jurisdiction
    1,              // accreditation type
    Date.now()      // expiry timestamp
  )
  
  // 2. Mark as compliant
  await compliance.setCompliance(userAddress, true)
  
  console.log("KYC issued for", userAddress)
}
```

**Automated Process (Future)**:

Create a backend service that:
1. Listens to Supabase realtime updates on `kyc_documents`
2. When status changes to "approved"
3. Automatically calls smart contracts
4. Updates user profile

```typescript
// backend/services/kyc-issuer.ts
supabase
  .channel('kyc-approvals')
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'kyc_documents',
      filter: 'status=eq.approved'
    }, 
    async (payload) => {
      const doc = payload.new
      
      // Issue on-chain credential
      await issueKYCCredential(
        doc.wallet_address,
        doc.jurisdiction,
        doc.accreditation_type
      )
    }
  )
  .subscribe()
```

---

### **7️⃣ Status Updates**

**Real-time Updates**:

User sees updates via:
1. **Supabase Realtime** - Instant updates when document status changes
2. **Contract Events** - Listen for `CredentialIssued` and `ComplianceUpdated` events
3. **Polling** - Periodic refresh of compliance status

**ComplianceCenter Display**:
```typescript
// Status badge updates automatically
{isVerified ? (
  <Badge variant="gain">
    <CheckCircle className="mr-1 h-3 w-3" />
    Verified
  </Badge>
) : profile?.kyc_status === 'pending' ? (
  <Badge variant="yield">
    <Clock className="mr-1 h-3 w-3" />
    Under Review
  </Badge>
) : (
  <Badge variant="outline">
    Not Verified
  </Badge>
)}
```

**Dashboard Updates**:
- Compliance status badge shows "Verified"
- Deposit button becomes enabled
- Access to restricted features unlocked

---

## 🔄 Data Flow Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1. Clicks "Start KYC"
       ▼
┌─────────────────────┐
│ KYCWizardModal      │
│ - Personal Info     │
│ - Document Upload   │
│ - Review & Submit   │
└──────┬──────────────┘
       │ 2. Submit
       ▼
┌─────────────────────┐
│   Supabase          │
│ ┌─────────────────┐ │
│ │ profiles        │ │ → kyc_status: "pending"
│ │ kyc_documents   │ │ → status: "pending"
│ └─────────────────┘ │
└──────┬──────────────┘
       │ 3. Real-time notification
       ▼
┌─────────────────────┐
│   Admin Review      │
│ - View documents    │
│ - Approve/Reject    │
└──────┬──────────────┘
       │ 4. Update status
       ▼
┌─────────────────────┐
│   Supabase          │
│ kyc_documents       │
│ status: "approved"  │
└──────┬──────────────┘
       │ 5. Trigger
       ▼
┌─────────────────────┐
│  Smart Contracts    │
│ ┌─────────────────┐ │
│ │ ZKKYCVerifier   │ │ → issueCredential()
│ │ ComplianceReg   │ │ → setCompliance()
│ └─────────────────┘ │
└──────┬──────────────┘
       │ 6. Event emitted
       ▼
┌─────────────────────┐
│  Frontend Updates   │
│ - isVerified: true  │
│ - isCompliant: true │
│ - UI unlocked       │
└─────────────────────┘
```

---

## 🚀 Testing the Flow

### **Prerequisites**:
```bash
# 1. Supabase configured
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key

# 2. Wallet connected to Mantle Sepolia
# 3. Have some test MNT for gas
```

### **Test Steps**:

**1. Start KYC**:
```
1. Navigate to /compliance
2. Click "Start KYC Verification"
3. Fill out form
4. Upload sample documents
5. Submit
```

**2. Verify Supabase**:
```sql
-- Check profile
SELECT * FROM profiles WHERE wallet_address = '0x...';

-- Check documents
SELECT * FROM kyc_documents WHERE wallet_address = '0x...';
```

**3. Simulate Admin Approval**:
```sql
-- Approve all documents
UPDATE kyc_documents 
SET status = 'approved', reviewed_at = NOW()
WHERE wallet_address = '0x...' AND status = 'pending';

-- Update profile
UPDATE profiles 
SET kyc_status = 'verified', kyc_verified_at = NOW()
WHERE wallet_address = '0x...';
```

**4. Issue On-Chain (Manual)**:
```bash
# Edit scripts/issue-kyc.cjs with user address
node scripts/issue-kyc.cjs

# Or via Hardhat console
npx hardhat console --network mantleTestnet

const zkKYC = await ethers.getContractAt("ZKKYCVerifier", "0x9dfF...")
await zkKYC.issueCredential("0x3Eff...070C", "US", 1, Date.now())
```

**5. Verify Frontend**:
```
1. Refresh /compliance page
2. Should see "Verified" badge
3. Try deposit on /dashboard
4. Should work without errors
```

---

## 🔧 What's Implemented

✅ **Frontend Components**:
- KYCVerificationWizard with 3-step flow
- Document upload UI
- Form validation
- Success/error handling

✅ **Supabase Integration**:
- Profile updates
- Document record creation
- Real-time subscriptions
- Status tracking

✅ **Smart Contracts**:
- ZKKYCVerifier deployed
- ComplianceRegistry deployed
- issueCredential() function
- setCompliance() function

✅ **Data Flow**:
- User submission → Supabase
- Real-time status updates
- Contract read hooks

---

## ⚠️ What's Missing/Manual

❌ **File Storage**:
- Currently: Files stored in browser memory only
- Need: Supabase Storage integration
- Files are NOT uploaded to cloud

❌ **Admin Panel**:
- Currently: Manual SQL updates required
- Need: Admin UI to review documents
- No visual document viewer

❌ **Automated On-Chain Issuance**:
- Currently: Manual contract calls via scripts
- Need: Backend service to auto-issue
- No trigger on approval

❌ **KYC Provider Integration**:
- Currently: Manual document review
- Need: Onfido/Jumio/SumSub API
- No automated ID verification

❌ **Email Notifications**:
- Currently: No email sent
- Need: SendGrid/AWS SES integration
- User not notified of status changes

---

## 🎯 Next Steps to Make it Production-Ready

### **Phase 1: Storage** (2 hours)
```typescript
// Implement Supabase Storage
const uploadDocument = async (file: File, walletAddress: string) => {
  const fileName = `${walletAddress}/${Date.now()}_${file.name}`
  
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .upload(fileName, file)
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('kyc-documents')
    .getPublicUrl(fileName)
  
  return publicUrl
}
```

### **Phase 2: Admin Panel** (8 hours)
- Create `/admin` route
- Document viewer component
- Approve/reject buttons
- Search and filter

### **Phase 3: Automation** (16 hours)
- Backend service (Node.js/Deno)
- Supabase webhook listener
- Auto-issue contracts
- Error handling & retries

### **Phase 4: KYC Provider** (24 hours)
- Onfido SDK integration
- Biometric face matching
- Document authenticity check
- Liveness detection

---

## 📚 Resources

**Smart Contracts**:
- ZKKYCVerifier: `0x9dfF21EAC0dc1D3C2a08Dc9168119fA8F2F3b56c`
- ComplianceRegistry: `0xe05626781cF3B9a477FDE0f2Ae02129F22779209`

**Supabase Tables**:
- `profiles` - User KYC status
- `kyc_documents` - Document submissions

**Frontend**:
- [ComplianceCenter.tsx](../src/pages/ComplianceCenter.tsx)
- [KYCVerificationWizard.tsx](../src/components/KYCVerificationWizard.tsx)
- [useSupabase.ts](../src/hooks/useSupabase.ts)

---

## ❓ FAQ

**Q: Why not use a third-party KYC provider directly?**
A: We want control over the verification logic and data. Integration with Onfido/Jumio can be added as a verification step, but final decision is ours.

**Q: Are documents encrypted?**
A: Supabase Storage supports encryption at rest. For end-to-end encryption, implement client-side encryption before upload.

**Q: How long does verification take?**
A: Currently manual (admin dependent). With automation: instant for basic checks, 24-48 hours for manual review.

**Q: What if documents are rejected?**
A: User can resubmit. Frontend should show rejection reason and allow re-upload.

**Q: Can I test without real documents?**
A: Yes! Use sample PDFs or images. The system accepts any file format currently.

---

Built with ❤️ by the MERIDIAN Protocol Team
