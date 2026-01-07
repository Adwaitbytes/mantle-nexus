import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Web3Provider } from "./components/Web3Provider.tsx";
import "./index.css";

// Initialize web3 config (must be imported before usage)
import "./lib/web3Config";

console.log("🚀 MERIDIAN - Starting application...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
} else {
  console.log("✅ Root element found, mounting React...");
  createRoot(rootElement).render(
    <Web3Provider>
      <App />
    </Web3Provider>
  );
  console.log("✅ React mounted successfully!");
}
