import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/WalletButton";
import { useWallet } from "@/hooks/useWalletConnect";
import { useNotifications } from "@/hooks/useSupabase";
import {
  Zap,
  LayoutDashboard,
  Wallet,
  PieChart,
  Shield,
  ArrowLeftRight,
  Brain,
  Settings,
  Bell,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
  { icon: PieChart, label: "Assets", path: "/app/assets" },
  { icon: Brain, label: "AI Risk", path: "/app/risk" },
  { icon: Shield, label: "Compliance", path: "/app/compliance" },
  { icon: ArrowLeftRight, label: "Bridge", path: "/app/bridge" },
];

export function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isConnected, networkName, isCorrectNetwork, address } = useWallet();
  const { unreadCount } = useNotifications(address);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl lg:flex",
          sidebarOpen ? "flex" : "hidden"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-gold">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            MERIDIAN
          </span>
          <Badge variant="outline" className="ml-auto text-[10px]">
            BETA
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                  {item.label === "AI Risk" && (
                    <Badge variant="live" className="ml-auto text-[10px]">
                      AI
                    </Badge>
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Network Status */}
        <div className="border-t border-border/50 p-4">
          <div className="rounded-xl bg-secondary/30 p-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full animate-pulse",
                isConnected && isCorrectNetwork ? "bg-gain" : "bg-muted-foreground"
              )} />
              <span className="text-xs font-medium text-foreground">
                {isConnected ? networkName : 'Not Connected'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{isConnected ? 'Connected' : 'Connect wallet to start'}</span>
              <span className="text-gain">~$0.001 gas</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-border/50 p-4 space-y-2">
          <Link to="/admin">
            <Button variant="ghost" className="w-full justify-start gap-3 text-primary hover:bg-primary/10">
              <Shield className="h-4 w-4" />
              Admin Panel
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl">
          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Dashboard</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">Overview</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-risk text-xs text-white font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Wallet */}
            <WalletButton variant="compact" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
