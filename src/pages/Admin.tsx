import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/useWalletConnect";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Shield,
  Users,
  FileText,
  Activity,
  Bell,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Check,
  X,
  Clock,
  TrendingUp,
  AlertTriangle,
  Eye,
  ChevronRight,
  BarChart3,
  DollarSign,
  Wallet as WalletIcon,
  RefreshCw,
  Send,
  Lock,
  Unlock,
  Ban,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Database,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile, KYCDocument, Transaction, Notification } from "@/types/database";

// Admin whitelist from environment variable
const ADMIN_ADDRESSES = import.meta.env.VITE_ADMIN_ADDRESSES 
  ? import.meta.env.VITE_ADMIN_ADDRESSES.split(',').map((addr: string) => addr.trim().toLowerCase())
  : [];

type AdminTab = "overview" | "users" | "kyc" | "transactions" | "notifications" | "settings";

interface AnalyticsData {
  totalUsers: number;
  verifiedUsers: number;
  pendingKYC: number;
  totalTransactions: number;
  totalVolume: number;
  activeUsers24h: number;
}

export function Admin() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingKYC: 0,
    totalTransactions: 0,
    totalVolume: 0,
    activeUsers24h: 0,
  });

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [txFilter, setTxFilter] = useState<"all" | "pending" | "confirmed" | "failed">("all");

  // Admin check: can be disabled via VITE_ADMIN_DISABLED=true for development
  const ADMIN_DISABLED = import.meta.env.VITE_ADMIN_DISABLED === "true";
  const isAdmin = useMemo(() => {
    if (ADMIN_DISABLED) return Boolean(isConnected);
    if (!address) return false;
    const userAddress = address.toLowerCase();
    const match = ADMIN_ADDRESSES.some(admin => userAddress === admin);
    // debug in console for troubleshooting
    try {
      // eslint-disable-next-line no-console
      console.debug("Admin check:", { userAddress, ADMIN_ADDRESSES, match });
    } catch (e) {}
    return match;
  }, [address, isConnected]);

  // Fetch all data
  const fetchData = async () => {
    if (!isSupabaseConfigured()) return;
    
    setIsLoading(true);
    try {
      // Fetch profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      // Fetch KYC documents
      const { data: kycData } = await supabase
        .from("kyc_documents")
        .select("*")
        .order("submitted_at", { ascending: false });
      
      // Fetch transactions
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      // Fetch notifications
      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setProfiles(profilesData || []);
      setKycDocuments(kycData || []);
      setTransactions(txData || []);
      setNotifications(notifData || []);

      // Calculate analytics
      const verifiedCount = profilesData?.filter(p => p.kyc_status === "verified").length || 0;
      const pendingKYC = kycData?.filter(d => d.status === "pending").length || 0;
      const totalVolume = txData?.reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0) || 0;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const activeUsers = txData?.filter(tx => new Date(tx.created_at) > yesterday).length || 0;

      setAnalytics({
        totalUsers: profilesData?.length || 0,
        verifiedUsers: verifiedCount,
        pendingKYC,
        totalTransactions: txData?.length || 0,
        totalVolume,
        activeUsers24h: activeUsers,
      });
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      
      // Set up realtime subscriptions
      const txChannel = supabase
        .channel("admin-transactions")
        .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, fetchData)
        .subscribe();
      
      const kycChannel = supabase
        .channel("admin-kyc")
        .on("postgres_changes", { event: "*", schema: "public", table: "kyc_documents" }, fetchData)
        .subscribe();

      return () => {
        txChannel.unsubscribe();
        kycChannel.unsubscribe();
      };
    }
  }, [isAdmin]);

  // Admin actions
  const approveKYCDocument = async (docId: string, walletAddress: string) => {
    try {
      await supabase
        .from("kyc_documents")
        .update({ 
          status: "approved", 
          reviewed_at: new Date().toISOString(),
          reviewer_notes: "Approved by admin"
        })
        .eq("id", docId);

      // Update profile status
      const userDocs = kycDocuments.filter(d => d.wallet_address === walletAddress);
      const allApproved = userDocs.every(d => d.id === docId || d.status === "approved");
      
      if (allApproved) {
        await supabase
          .from("profiles")
          .update({ 
            kyc_status: "verified", 
            kyc_verified_at: new Date().toISOString() 
          })
          .eq("wallet_address", walletAddress);
        
        // Send notification
        await sendNotification(walletAddress, {
          type: "kyc",
          title: "KYC Verified!",
          message: "Your KYC documents have been approved. You can now access all features.",
        });
      }

      await fetchData();
    } catch (error) {
      console.error("Failed to approve document:", error);
    }
  };

  const rejectKYCDocument = async (docId: string, walletAddress: string, reason: string) => {
    try {
      await supabase
        .from("kyc_documents")
        .update({ 
          status: "rejected", 
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reason
        })
        .eq("id", docId);

      await supabase
        .from("profiles")
        .update({ kyc_status: "rejected" })
        .eq("wallet_address", walletAddress);

      await sendNotification(walletAddress, {
        type: "kyc",
        title: "KYC Rejected",
        message: `Your KYC submission was rejected. Reason: ${reason}`,
      });

      await fetchData();
    } catch (error) {
      console.error("Failed to reject document:", error);
    }
  };

  const sendNotification = async (walletAddress: string, notif: { type: string; title: string; message: string }) => {
    try {
      await supabase
        .from("notifications")
        .insert({
          wallet_address: walletAddress,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          read: false,
        });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const broadcastNotification = async (notif: { type: string; title: string; message: string }) => {
    try {
      const notificationBatch = profiles.map(profile => ({
        wallet_address: profile.wallet_address,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: false,
      }));

      await supabase.from("notifications").insert(notificationBatch);
      await fetchData();
    } catch (error) {
      console.error("Failed to broadcast notification:", error);
    }
  };

  const updateUserStatus = async (walletAddress: string, status: string) => {
    try {
      await supabase
        .from("profiles")
        .update({ kyc_status: status })
        .eq("wallet_address", walletAddress);
      
      await fetchData();
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  // Access control
  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card variant="elevated" className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-bold">Admin Access Required</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Connect your admin wallet to access the control panel
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card variant="elevated" className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Ban className="mx-auto mb-4 h-12 w-12 text-loss" />
            <h2 className="mb-2 text-xl font-bold">Access Denied</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Your wallet address is not authorized for admin access
            </p>
            <Badge variant="outline" className="font-mono text-xs">
              {address}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter data
  const filteredProfiles = profiles.filter(p => 
    searchQuery === "" || 
    p.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredKYC = kycDocuments.filter(d => 
    (kycFilter === "all" || d.status === kycFilter) &&
    (searchQuery === "" || d.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTransactions = transactions.filter(tx =>
    (txFilter === "all" || tx.status === txFilter) &&
    (searchQuery === "" || tx.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) || tx.tx_hash.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              Admin Control Panel
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage users, KYC, transactions, and system settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="gain" className="gap-2">
              <Database className="h-3 w-3" />
              {isSupabaseConfigured() ? "Connected" : "Offline"}
            </Badge>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "kyc", label: "KYC Review", icon: FileText },
            { id: "transactions", label: "Transactions", icon: Activity },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className="gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <OverviewTab analytics={analytics} transactions={transactions} profiles={profiles} />
          )}
          {activeTab === "users" && (
            <UsersTab 
              profiles={filteredProfiles} 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              updateUserStatus={updateUserStatus}
              sendNotification={sendNotification}
            />
          )}
          {activeTab === "kyc" && (
            <KYCTab
              documents={filteredKYC}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              kycFilter={kycFilter}
              setKycFilter={setKycFilter}
              approveDocument={approveKYCDocument}
              rejectDocument={rejectKYCDocument}
            />
          )}
          {activeTab === "transactions" && (
            <TransactionsTab
              transactions={filteredTransactions}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              txFilter={txFilter}
              setTxFilter={setTxFilter}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab
              notifications={notifications}
              profiles={profiles}
              sendNotification={sendNotification}
              broadcastNotification={broadcastNotification}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab profiles={profiles} transactions={transactions} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ analytics, transactions, profiles }: { 
  analytics: AnalyticsData; 
  transactions: Transaction[];
  profiles: Profile[];
}) {
  const recentTransactions = transactions.slice(0, 5);
  const recentUsers = profiles.slice(0, 5);

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{analytics.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.verifiedUsers} verified
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending KYC</p>
                <p className="text-3xl font-bold text-yellow-500">{analytics.pendingKYC}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-3xl font-bold text-foreground">
                  {analytics.totalVolume.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.totalTransactions} transactions
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gain/20">
                <DollarSign className="h-6 w-6 text-gain" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    {tx.tx_type === "deposit" ? (
                      <ArrowUpRight className="h-4 w-4 text-gain" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-loss" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{tx.tx_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.wallet_address.slice(0, 6)}...{tx.wallet_address.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">{parseFloat(tx.amount).toFixed(2)}</p>
                    <Badge variant={tx.status === "confirmed" ? "gain" : "yield"} className="text-xs">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.display_name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      user.kyc_status === "verified" ? "gain" : 
                      user.kyc_status === "pending" ? "yield" : 
                      "outline"
                    }
                  >
                    {user.kyc_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// Users Tab Component
function UsersTab({ 
  profiles, 
  searchQuery, 
  setSearchQuery,
  updateUserStatus,
  sendNotification
}: { 
  profiles: Profile[]; 
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  updateUserStatus: (address: string, status: string) => Promise<void>;
  sendNotification: (address: string, notif: any) => Promise<void>;
}) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  return (
    <motion.div
      key="users"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card variant="elevated">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-4">User</th>
                  <th className="p-4">Wallet</th>
                  <th className="p-4">KYC Status</th>
                  <th className="p-4">Jurisdiction</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((user, idx) => (
                  <tr 
                    key={user.id} 
                    className={cn(
                      "border-b border-border/50 transition-colors hover:bg-secondary/50",
                      idx === profiles.length - 1 && "border-b-0"
                    )}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{user.display_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-xs">
                        {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                      </code>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={
                          user.kyc_status === "verified" ? "gain" : 
                          user.kyc_status === "pending" ? "yield" : 
                          "outline"
                        }
                      >
                        {user.kyc_status}
                      </Badge>
                    </td>
                    <td className="p-4">{user.jurisdiction || "N/A"}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          updateUserStatus={updateUserStatus}
          sendNotification={sendNotification}
        />
      )}
    </motion.div>
  );
}

// User Detail Modal Component
function UserDetailModal({ 
  user, 
  onClose,
  updateUserStatus,
  sendNotification
}: { 
  user: Profile;
  onClose: () => void;
  updateUserStatus: (address: string, status: string) => Promise<void>;
  sendNotification: (address: string, notif: any) => Promise<void>;
}) {
  const [notifMessage, setNotifMessage] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card variant="elevated" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Details</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Wallet Address</Label>
              <code className="text-xs break-all">{user.wallet_address}</code>
            </div>
            <div>
              <Label>Display Name</Label>
              <p>{user.display_name || "Not set"}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p>{user.email || "Not set"}</p>
            </div>
            <div>
              <Label>Jurisdiction</Label>
              <p>{user.jurisdiction || "Not set"}</p>
            </div>
            <div>
              <Label>KYC Status</Label>
              <Badge variant={user.kyc_status === "verified" ? "gain" : "yield"}>
                {user.kyc_status}
              </Badge>
            </div>
            <div>
              <Label>Accreditation Type</Label>
              <p>{user.accreditation_type}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Quick Actions</Label>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateUserStatus(user.wallet_address, "verified")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verify KYC
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateUserStatus(user.wallet_address, "rejected")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject KYC
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateUserStatus(user.wallet_address, "pending")}
              >
                <Clock className="h-4 w-4 mr-2" />
                Set Pending
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Send Notification</Label>
            <Input 
              placeholder="Message..."
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
            />
            <Button 
              variant="hero" 
              size="sm"
              onClick={async () => {
                await sendNotification(user.wallet_address, {
                  type: "system",
                  title: "Message from Admin",
                  message: notifMessage,
                });
                setNotifMessage("");
                onClose();
              }}
              disabled={!notifMessage}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// KYC Tab Component
function KYCTab({
  documents,
  searchQuery,
  setSearchQuery,
  kycFilter,
  setKycFilter,
  approveDocument,
  rejectDocument,
}: {
  documents: KYCDocument[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  kycFilter: "all" | "pending" | "approved" | "rejected";
  setKycFilter: (f: "all" | "pending" | "approved" | "rejected") => void;
  approveDocument: (id: string, address: string) => Promise<void>;
  rejectDocument: (id: string, address: string, reason: string) => Promise<void>;
}) {
  const [selectedDoc, setSelectedDoc] = useState<KYCDocument | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <motion.div
      key="kyc"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by wallet address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value as any)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Documents</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card key={doc.id} variant="elevated" className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium capitalize">{doc.document_type}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {doc.wallet_address.slice(0, 6)}...{doc.wallet_address.slice(-4)}
                  </p>
                </div>
                <Badge 
                  variant={
                    doc.status === "approved" ? "gain" :
                    doc.status === "pending" ? "yield" :
                    "outline"
                  }
                >
                  {doc.status}
                </Badge>
              </div>

              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">{doc.document_name}</p>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(doc.submitted_at).toLocaleDateString()}
                </p>
              </div>

              {doc.status === "pending" && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => approveDocument(doc.id, doc.wallet_address)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedDoc(doc);
                      setRejectReason("");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {doc.reviewer_notes && (
                <p className="text-xs text-muted-foreground border-t border-border pt-2">
                  {doc.reviewer_notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card variant="elevated" className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Reject Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Rejection Reason</Label>
                <Input
                  placeholder="Enter reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedDoc(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={async () => {
                    await rejectDocument(selectedDoc.id, selectedDoc.wallet_address, rejectReason);
                    setSelectedDoc(null);
                  }}
                  disabled={!rejectReason}
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}

// Transactions Tab Component  
function TransactionsTab({
  transactions,
  searchQuery,
  setSearchQuery,
  txFilter,
  setTxFilter,
}: {
  transactions: Transaction[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  txFilter: "all" | "pending" | "confirmed" | "failed";
  setTxFilter: (f: "all" | "pending" | "confirmed" | "failed") => void;
}) {
  const totalVolume = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  return (
    <motion.div
      key="transactions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address or tx hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={txFilter}
          onChange={(e) => setTxFilter(e.target.value as any)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
        </select>
        <Badge variant="glass" className="gap-2">
          <DollarSign className="h-3 w-3" />
          {totalVolume.toFixed(2)} Total
        </Badge>
      </div>

      <Card variant="elevated">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-4">Type</th>
                  <th className="p-4">Wallet</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Asset</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr 
                    key={tx.id}
                    className={cn(
                      "border-b border-border/50 transition-colors hover:bg-secondary/50",
                      idx === transactions.length - 1 && "border-b-0"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {tx.tx_type === "deposit" ? (
                          <ArrowUpRight className="h-4 w-4 text-gain" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-loss" />
                        )}
                        <span className="capitalize">{tx.tx_type}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-xs">
                        {tx.wallet_address.slice(0, 6)}...{tx.wallet_address.slice(-4)}
                      </code>
                    </td>
                    <td className="p-4 font-mono">{parseFloat(tx.amount).toFixed(4)}</td>
                    <td className="p-4">{tx.asset_symbol}</td>
                    <td className="p-4">
                      <Badge 
                        variant={
                          tx.status === "confirmed" ? "gain" :
                          tx.status === "pending" ? "yield" :
                          "outline"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <a
                        href={`https://sepolia.mantlescan.xyz/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {tx.tx_hash.slice(0, 6)}...
                        <ChevronRight className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Notifications Tab Component
function NotificationsTab({
  notifications,
  profiles,
  sendNotification,
  broadcastNotification,
}: {
  notifications: Notification[];
  profiles: Profile[];
  sendNotification: (address: string, notif: any) => Promise<void>;
  broadcastNotification: (notif: any) => Promise<void>;
}) {
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("system");
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async () => {
    setIsSending(true);
    try {
      await broadcastNotification({
        type: broadcastType,
        title: broadcastTitle,
        message: broadcastMessage,
      });
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (error) {
      console.error("Failed to broadcast:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      key="notifications"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Broadcast Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Important Update"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={broadcastType}
                onChange={(e) => setBroadcastType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="system">System</option>
                <option value="alert">Alert</option>
                <option value="kyc">KYC</option>
                <option value="transaction">Transaction</option>
                <option value="price">Price Update</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Message</Label>
            <Input
              placeholder="Enter notification message..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
            />
          </div>
          <Button 
            variant="hero" 
            onClick={handleBroadcast}
            disabled={!broadcastTitle || !broadcastMessage || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending to {profiles.length} users...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Broadcast to All Users ({profiles.length})
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.slice(0, 20).map((notif) => (
              <div key={notif.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <Badge variant="outline" className="text-xs">{notif.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="font-mono">
                      {notif.wallet_address.slice(0, 6)}...{notif.wallet_address.slice(-4)}
                    </span>
                    <span>•</span>
                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                    <span>•</span>
                    <span>{notif.read ? "Read" : "Unread"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Settings Tab Component
function SettingsTab({ profiles, transactions }: { profiles: Profile[]; transactions: Transaction[] }) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = (type: "profiles" | "transactions") => {
    setIsExporting(true);
    const data = type === "profiles" ? profiles : transactions;
    const csv = [
      Object.keys(data[0] || {}).join(","),
      ...data.map(row => Object.values(row).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-${Date.now()}.csv`;
    a.click();
    setIsExporting(false);
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Data Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => exportData("profiles")}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All Users ({profiles.length})
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => exportData("transactions")}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All Transactions ({transactions.length})
          </Button>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">System Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Supabase Status</span>
            <Badge variant="gain">Connected</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network</span>
            <span>Mantle Sepolia</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Admin Address</span>
            <code className="text-xs">Connected</code>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
