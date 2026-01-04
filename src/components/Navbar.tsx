import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/WalletButton";
import { ArrowRight, Zap } from "lucide-react";

export function Navbar() {
  const navigate = useNavigate();
  
  const navItems = [
    { label: "Protocol", href: "#protocol" },
    { label: "Assets", href: "#assets" },
    { label: "Yield", href: "#yield" },
    { label: "Docs", href: "#docs" },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav className="flex items-center justify-between rounded-2xl border border-border/50 bg-card/60 px-6 py-3 backdrop-blur-xl">
          {/* Logo */}
          <motion.a
            href="/"
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              MERIDIAN
            </span>
          </motion.a>

          {/* Nav Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.label}
              </motion.a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex">
              <WalletButton variant="compact" />
            </div>
            <Button
              variant="hero"
              size="sm"
              onClick={() => navigate("/app")}
              className="group"
            >
              Launch App
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
