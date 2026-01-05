# Meridian Admin Panel Documentation

## Overview

The Meridian Admin Panel is a comprehensive control center providing administrators complete oversight and management capabilities for the entire platform. Built with security, efficiency, and real-time updates in mind.

## Access & Security

### Authentication
- **Access Control**: Whitelist-based authentication
- **Location**: Update `ADMIN_ADDRESSES` array in `src/pages/Admin.tsx` line 49
- **Format**: Lowercase Ethereum addresses without '0x' prefix or with it
- **Example**: `"0x3eff6d7c070c"` or `"3eff6d7c070c"`

### Accessing the Panel
1. Navigate to `/admin` route
2. Connect your wallet using WalletConnect/MetaMask
3. If your address is whitelisted, full admin panel appears
4. If not authorized, "Access Denied" message shown

## Features & Capabilities

### 1. Overview Tab 📊
**Real-time Analytics Dashboard**

#### Key Metrics Cards
- **Total Users**: Complete user count with growth trend
- **Pending KYC**: Documents awaiting review with quick action link
- **Total Volume**: Transaction volume in USD
- **Active Users**: Current session count

#### Recent Activity
- **Recent Users**: Last 5 registered users with join dates
- **Recent Transactions**: Latest 5 transactions with amounts and statuses
- **Real-time Updates**: Auto-refreshes via Supabase subscriptions

### 2. Users Tab 👥
**Complete User Management System**

#### Features
- **Search**: Find users by wallet address
- **Filter**: By verification status (All/Verified/Unverified)
- **User Table**: Shows wallet, KYC status, join date, actions
- **Pagination**: Handle large user bases efficiently

#### User Details Modal
Access via "View Details" button on each user:
- Full profile information
- KYC submission history
- Transaction history
- Portfolio snapshots
- Watchlist items

#### Quick Actions Per User
- ✅ **Verify KYC**: Instant KYC approval
- ❌ **Reject KYC**: Reject with custom reason
- 📧 **Send Notification**: Direct message to user
- 🔓 **Update Status**: Toggle account status
- 🔗 **View Transactions**: Filter transactions by user

### 3. KYC Review Tab 📋
**Document Review & Approval System**

#### Document Grid View
- Visual card layout for each pending KYC document
- Shows: User wallet, document type, submission date, status
- Quick preview of document metadata

#### Document Actions
1. **Approve**: Single-click approval
   - Updates `kyc_documents.status` to 'approved'
   - Updates `profiles.kyc_verified` to true
   - Timestamp recorded
   - Real-time notification sent

2. **Reject**: Opens rejection modal
   - Requires rejection reason
   - Updates status to 'rejected'
   - Stores reason in database
   - User can resubmit

#### Document Types Supported
- `passport`: International passports
- `national_id`: Government-issued ID cards
- `drivers_license`: Driving licenses
- `proof_of_address`: Utility bills, bank statements

#### Real-time Updates
- New submissions appear instantly
- Approved/rejected documents update live
- Counter updates automatically

### 4. Transactions Tab 💰
**Comprehensive Transaction Monitoring**

#### Transaction Table
- **Hash**: Full transaction hash with Mantle explorer link
- **From/To**: Wallet addresses with formatting
- **Amount**: USD value with token symbol
- **Type**: Deposit/Withdraw/Transfer/Trade
- **Status**: Pending/Completed/Failed with color coding
- **Timestamp**: Human-readable date/time

#### Filtering & Search
- Filter by status (All/Completed/Pending/Failed)
- Search by transaction hash
- Sort by date, amount, status

#### Analytics
- Total transaction volume displayed
- Transaction count per status
- Real-time updates on new transactions

#### Quick Actions
- 🔗 **View on Explorer**: Direct link to Mantle block explorer
- 📊 **View User**: Jump to user's full profile
- 📄 **Export**: Download transaction data as CSV

### 5. Notifications Tab 🔔
**Communication & Alert System**

#### Broadcast System
- **Send to All Users**: Mass notification capability
- **Custom Messages**: Title + detailed message body
- **Type Selection**: Info/Success/Warning/Error styling
- **Instant Delivery**: Real-time push to all connected users

#### Notification History
- View all sent notifications
- Filter by type and status
- See delivery status
- Track engagement metrics

#### Use Cases
- Platform announcements
- Maintenance notifications
- Security alerts
- Feature launches
- Emergency communications

### 6. Settings Tab ⚙️
**System Administration & Data Management**

#### Data Export
- **Export Users**: Download complete user database as CSV
  - Includes: wallet, email, KYC status, join date
  - Format: RFC 4180 compliant CSV

- **Export Transactions**: Download transaction history
  - Includes: hash, from, to, amount, type, status, timestamp
  - Format: Spreadsheet-ready CSV

#### System Information
- **Supabase Status**: Connection health indicator
- **Database Stats**: Table counts, storage usage
- **Version Info**: Platform version and build date
- **API Status**: External service health checks

#### Configuration Management
- Admin whitelist management
- System-wide settings
- Feature flags
- Rate limits

## Technical Architecture

### State Management
```typescript
const [activeTab, setActiveTab] = useState('overview');
const [users, setUsers] = useState<Profile[]>([]);
const [kycDocuments, setKYCDocuments] = useState<KYCDocument[]>([]);
const [transactions, setTransactions] = useState<Transaction[]>([]);
```

### Real-time Subscriptions
```typescript
// Transaction updates
const transactionChannel = supabase
  .channel('admin-transactions')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'transactions' 
  }, handleTransactionChange)
  .subscribe();

// KYC updates
const kycChannel = supabase
  .channel('admin-kyc')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'kyc_documents' 
  }, handleKYCChange)
  .subscribe();
```

### Database Operations

#### Approve KYC
```typescript
const approveKYCDocument = async (documentId: string, userId: string) => {
  // Update document status
  await supabase
    .from('kyc_documents')
    .update({ 
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: address 
    })
    .eq('id', documentId);

  // Update user profile
  await supabase
    .from('profiles')
    .update({ kyc_verified: true })
    .eq('id', userId);
};
```

#### Reject KYC
```typescript
const rejectKYCDocument = async (documentId: string, reason: string) => {
  await supabase
    .from('kyc_documents')
    .update({ 
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: address 
    })
    .eq('id', documentId);
};
```

#### Send Notification
```typescript
const sendNotification = async (userId: string, title: string, message: string) => {
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type: 'info',
      read: false,
      created_at: new Date().toISOString()
    });
};
```

#### Broadcast Notification
```typescript
const broadcastNotification = async (title: string, message: string, type: string) => {
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id');

  const notifications = allUsers.map(user => ({
    user_id: user.id,
    title,
    message,
    type,
    read: false
  }));

  await supabase
    .from('notifications')
    .insert(notifications);
};
```

## Setup Instructions

### 1. Configure Admin Access
Edit `src/pages/Admin.tsx`:

```typescript
const ADMIN_ADDRESSES = [
  "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Your wallet
  "0x...", // Additional admins
];
```

### 2. Access the Panel
1. Start development server: `npm run dev`
2. Connect wallet at `/admin`
3. Verify whitelist check passes

### 3. Test Features
1. **Overview**: Check all metrics load
2. **Users**: Search for test users
3. **KYC**: Review any pending documents
4. **Transactions**: Verify transaction table loads
5. **Notifications**: Send test notification
6. **Settings**: Export sample data

## Security Best Practices

### Production Deployment
1. **Replace Whitelist**: Implement role-based auth with Supabase
   ```sql
   ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
   CREATE INDEX idx_profiles_role ON profiles(role);
   ```

2. **Add Rate Limiting**: Prevent abuse
   ```typescript
   const rateLimiter = new RateLimiter({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit per window
   });
   ```

3. **Audit Logging**: Track all admin actions
   ```sql
   CREATE TABLE admin_audit_log (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     admin_address TEXT NOT NULL,
     action TEXT NOT NULL,
     target_user TEXT,
     metadata JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **Two-Factor Authentication**: Add 2FA requirement
5. **IP Whitelisting**: Restrict admin access by IP
6. **Session Management**: Implement session timeouts
7. **Data Encryption**: Encrypt sensitive admin communications

### Supabase Row-Level Security
Ensure RLS policies protect admin operations:

```sql
-- Only allow admins to update KYC status
CREATE POLICY "Admins can approve KYC"
ON kyc_documents FOR UPDATE
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));
```

## Monitoring & Analytics

### Key Metrics to Track
- KYC approval rate
- Average review time
- Transaction volume trends
- User growth rate
- Error rates
- Admin action frequency

### Performance Optimization
- Implement pagination (already built-in)
- Add database indexes for frequent queries
- Cache frequently accessed data
- Lazy load heavy components
- Use React.memo for static components

## Troubleshooting

### Common Issues

**Issue**: "Access Denied" message
- **Solution**: Verify wallet address in ADMIN_ADDRESSES (lowercase)

**Issue**: Real-time updates not working
- **Solution**: Check Supabase realtime is enabled in database settings

**Issue**: KYC approval fails
- **Solution**: Verify RLS policies allow admin updates

**Issue**: Export CSV empty
- **Solution**: Check data exists in respective tables

**Issue**: Notifications not sending
- **Solution**: Verify notifications table exists and RLS allows inserts

## API Integration

### External Services
- **Mantle Explorer**: Transaction links
- **IPFS**: Document storage (future)
- **Email Service**: Notification delivery (future)
- **SMS Service**: 2FA codes (future)

## Future Enhancements

### Planned Features
1. **Advanced Analytics**
   - Custom date range filtering
   - Exportable charts and graphs
   - User cohort analysis
   - Revenue tracking dashboard

2. **Bulk Operations**
   - Batch KYC approval
   - Mass notifications with segmentation
   - Bulk user status updates

3. **Enhanced Document Review**
   - Image viewer with zoom/rotate
   - OCR for automatic data extraction
   - AI-powered fraud detection
   - Side-by-side document comparison

4. **Role Management**
   - Multiple admin levels (super admin, moderator, support)
   - Granular permissions per role
   - Audit trail per admin

5. **Reporting System**
   - Scheduled report generation
   - Custom report builder
   - Email delivery of reports
   - PDF export capability

6. **Alert System**
   - Suspicious activity detection
   - Threshold alerts (volume, failed logins)
   - Webhook integration
   - Slack/Discord notifications

## Support

### Getting Help
- Check [KYC_FLOW.md](./KYC_FLOW.md) for KYC process
- Review [INTEGRATION_STATUS.md](./INTEGRATION_STATUS.md) for system status
- Submit issues on GitHub
- Contact dev team for emergency support

### Testing Checklist
- [ ] Admin whitelist configured
- [ ] Can access /admin route
- [ ] Overview metrics display correctly
- [ ] Can search/filter users
- [ ] KYC approval/rejection works
- [ ] Transaction table loads
- [ ] Notifications send successfully
- [ ] CSV export downloads
- [ ] Real-time updates functioning
- [ ] Access control prevents unauthorized access

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Meridian Dev Team
