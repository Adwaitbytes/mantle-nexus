# MERIDIAN - Master Build Document
## Grand Prize Hackathon Strategy & Technical Architecture

---

## 🎯 Executive Summary

**MERIDIAN** is the world's first **institutional-grade, AI-powered, regulatory-ready RWA yield infrastructure** built natively on Mantle Network. It represents a paradigm shift in how real-world assets are tokenized, traded, and optimized for yield—designed to dominate the Mantle Global Hackathon 2025.

### Why MERIDIAN Wins Every Track

| Track | Coverage | How We Win |
|-------|----------|------------|
| **Grand Prize ($30K)** | Primary Target | Multi-track dominance, category-defining UX |
| **RWA/RealFi ($15K)** | Core Product | Full tokenization pipeline, compliance-first |
| **DeFi & Composability ($15K)** | Yield Engine | Composable vault strategies, auto-rebalancing |
| **AI & Oracles ($15K)** | Risk Engine | Real-time ML risk scoring, predictive alerts |
| **ZK & Privacy ($15K)** | Compliance | ZK-KYC, selective disclosure, proof verification |
| **Infrastructure ($15K)** | Developer Tools | SDK, monitoring dashboard, deployment pipeline |
| **Best Mantle Integration ($4K)** | L2 Optimization | Deep Mantle SDK usage, gas optimization |
| **Best UX/Demo ($5K)** | Product Polish | Apple-grade UX, institutional precision |

---

## 🏗 Architecture Overview

### System Design Philosophy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MERIDIAN PROTOCOL STACK                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 4: PRESENTATION                                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Landing   │ │  Dashboard  │ │  Compliance │ │   Bridge    │           │
│  │    Page     │ │    App      │ │   Center    │ │  Interface  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 3: APPLICATION LOGIC                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  React + TypeScript + TanStack Query + Framer Motion + Recharts     │   │
│  │  Real-time WebSocket connections, Optimistic updates, State machines │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 2: SMART CONTRACT LAYER (Conceptual/Mockable)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   ERC-4626  │ │   Yield     │ │   ZK-KYC    │ │   Oracle    │           │
│  │   Vaults    │ │  Aggregator │ │  Verifier   │ │   Bridge    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 1: MANTLE NETWORK                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Modular L2 | Low Fees | High Throughput | EVM Compatible | Mantle DA │  │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX Design System

### Visual Language

MERIDIAN's design sits at the intersection of:
- **Bloomberg Terminal** (data density, precision, real-time updates)
- **Apple Finance** (clarity, elegance, delightful interactions)
- **Linear App** (smooth animations, intentional micro-interactions)

### Color Psychology

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#0A0E14` | Deep slate - conveys security, trust |
| `--primary` | `#F59E0B` | Gold/Amber - represents yield, value, success |
| `--gain` | `#10B981` | Emerald - positive returns, growth |
| `--risk` | `#F43F5E` | Rose - warnings, alerts, attention |
| `--neutral` | `#6B7280` | Slate - supporting information |

### Animation Principles

1. **Meaningful Motion**: Every animation communicates state change
2. **60fps Always**: Performance is non-negotiable
3. **Staggered Reveals**: Create rhythm and hierarchy
4. **Spring Physics**: Natural, physical feel to interactions
5. **Number Tickers**: Real-time data feels alive

---

## 📱 Screen-by-Screen Specification

### 1. Landing Page (`/`)
**Purpose**: First 10-second hook. Establish credibility. Convert to app users.

**Key Elements**:
- Animated particle field (asset flow visualization)
- Live protocol stats (TVL, APY, transactions) with real-time tickers
- Hero section with gradient text and glass morphism
- Trust badges (audit, compliance, security)
- Asset showcase with live yield rates
- Feature grid with interactive hover states
- Mantle integration showcase
- Social proof / integrations section
- Clear CTA with wallet connect simulation

### 2. Dashboard App (`/app`)
**Purpose**: Portfolio management hub. Show institutional capability.

**Key Sections**:
- **Header**: Wallet status, network indicator, notifications
- **Portfolio Overview**: Total value with P&L, risk score, yield rate
- **Position Grid**: Active investments with real-time data
- **Strategy Builder**: Drag-and-drop yield optimization
- **Activity Feed**: Live transaction stream
- **Quick Actions**: Deposit, withdraw, rebalance

### 3. Asset Explorer (`/app/assets`)
**Purpose**: Browse and analyze tokenized RWAs.

**Key Features**:
- Filterable asset grid (by type, risk, APY, compliance)
- Detailed asset cards with live metrics
- Risk radar chart
- Historical performance graphs
- Compliance badge explanations
- One-click investment flow

### 4. Compliance Center (`/app/compliance`)
**Purpose**: Demonstrate regulatory-ready architecture.

**Key Features**:
- ZK-KYC verification status
- Jurisdiction selector with heat map
- Selective disclosure controls
- Proof verification history
- Compliance score with breakdown
- Document vault

### 5. Mantle Bridge (`/app/bridge`)
**Purpose**: Showcase deep Mantle integration.

**Key Features**:
- L1 ↔ L2 bridge interface
- Gas savings calculator
- Transaction status tracker
- Mantle ecosystem stats

### 6. AI Risk Center (`/app/risk`)
**Purpose**: Demonstrate AI/ML capabilities.

**Key Features**:
- Real-time risk scoring dashboard
- Predictive alerts panel
- Portfolio stress testing
- Risk factor breakdown
- AI recommendation engine
- Historical accuracy metrics

---

## 🔧 Technical Implementation

### Frontend Stack
```json
{
  "framework": "React 18 + TypeScript 5",
  "bundler": "Vite 5",
  "styling": "Tailwind CSS 3.4 + shadcn/ui",
  "animation": "Framer Motion 11",
  "charts": "Recharts + Custom D3",
  "state": "TanStack Query + Zustand",
  "routing": "React Router v6",
  "forms": "React Hook Form + Zod"
}
```

### Key Components to Build

#### Data Visualization
- `LiveChart` - Real-time updating charts
- `RiskRadar` - Hexagonal risk factor visualization
- `YieldCurve` - Historical yield performance
- `AllocationPie` - Animated portfolio allocation
- `HeatMap` - Jurisdiction/risk heat maps

#### Interactive Elements
- `StrategyBuilder` - Drag-and-drop yield strategy
- `TokenizationWizard` - Multi-step asset creation
- `BridgeInterface` - L1/L2 transfer flow
- `ProofVerifier` - ZK proof visualization

#### Real-Time Components
- `LiveTicker` - Streaming price/yield updates
- `TransactionFeed` - Live tx confirmations
- `AlertPanel` - AI-generated risk alerts
- `NetworkStatus` - Mantle network health

### Mock Data Architecture

Since this is a frontend demo, we use sophisticated mock data:

```typescript
// Simulated real-time data hooks
useRealTimeYield(assetId) // Updates every 5s with realistic fluctuation
usePortfolioValue()       // Live P&L calculation
useRiskScore()            // AI risk score updates
useTransactionStream()    // Fake but realistic tx feed
```

---

## 🎬 Demo Day Strategy

### The 10-Second Hook
- Hero animation plays immediately
- Live stats are already counting up
- "LIVE" badge pulses
- Institutional aesthetic signals seriousness

### Minute 0-1: The Problem
"Institutional capital wants RWA exposure, but current solutions are fragmented, non-compliant, and technically primitive."

### Minute 1-2: The Solution
Live walkthrough: Landing → Dashboard → Asset Investment → Risk Analysis

### Minute 2-3: Technical Depth
Show: Compliance center, ZK proofs, AI risk engine, Mantle integration

### Minute 3-5: Business & Vision
- Monetization model (0.5% yield fee)
- $500B+ TAM for RWA tokenization
- Roadmap: Testnet → Mainnet → Institutional partnerships
- Team credentials

### Closing
- Clear ask (if any)
- Live demo link
- GitHub with comprehensive README

---

## 📊 Success Metrics for Judges

### Technical Excellence
- [x] Clean TypeScript, zero any types
- [x] Component composition
- [x] Performance optimization
- [x] Accessibility (keyboard nav, ARIA)
- [x] Mobile responsive
- [x] Error boundaries
- [x] Loading states

### User Experience
- [x] 60fps animations
- [x] Meaningful micro-interactions
- [x] Clear visual hierarchy
- [x] Intuitive navigation
- [x] Real-time feedback
- [x] Zero tutorial needed

### Mantle Integration
- [x] Deep SDK understanding
- [x] Gas optimization showcase
- [x] L2 benefits articulated
- [x] Native tooling usage

### Business Viability
- [x] Clear problem statement
- [x] Defensible solution
- [x] Monetization model
- [x] Growth strategy
- [x] Team capability

---

## 🚀 Implementation Priority

### Phase 1: Core Structure (Hours 1-4)
1. ✅ Project setup with Vite + React + TypeScript
2. ✅ Design system tokens and base components
3. ✅ Landing page with hero animation
4. ⬜ Router setup for multi-page app
5. ⬜ Dashboard shell with navigation

### Phase 2: Dashboard (Hours 4-8)
1. ⬜ Portfolio overview component
2. ⬜ Position grid with live data
3. ⬜ Risk score visualization
4. ⬜ Transaction activity feed
5. ⬜ Quick action buttons

### Phase 3: Asset System (Hours 8-12)
1. ⬜ Asset explorer page
2. ⬜ Detailed asset modal
3. ⬜ Investment flow
4. ⬜ Tokenization wizard
5. ⬜ Risk radar charts

### Phase 4: Advanced Features (Hours 12-16)
1. ⬜ AI risk center
2. ⬜ ZK compliance center
3. ⬜ Mantle bridge interface
4. ⬜ Strategy builder
5. ⬜ Demo mode with guided tour

### Phase 5: Polish (Hours 16-20)
1. ⬜ Animation refinement
2. ⬜ Mobile optimization
3. ⬜ Error states
4. ⬜ Loading skeletons
5. ⬜ Final testing

---

## 🏆 Competitive Moat

1. **Multi-Track Dominance**: No other project covers RWA + AI + ZK + DeFi + Infrastructure
2. **UX Sophistication**: Institutional-grade that competitors can't match in hackathon time
3. **Mantle-Native**: Not a fork, built specifically for Mantle's modular architecture
4. **Compliance-First**: ZK-KYC isn't bolted on, it's foundational
5. **Technical Depth**: Every component demonstrates architectural sophistication

---

## 📝 Deliverables Checklist

- [ ] Working demo (hosted on Vercel/Netlify)
- [ ] GitHub repository with comprehensive README
- [ ] 3-5 minute demo video
- [ ] One-pager pitch document
- [ ] Team bios
- [ ] Compliance declaration

---

*MERIDIAN - Where Real-World Assets Meet Institutional-Grade DeFi*
*Built for Mantle Global Hackathon 2025*
*Target: Grand Prize ($30,000)*
