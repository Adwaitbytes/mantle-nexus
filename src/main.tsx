import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Web3Provider } from "./components/Web3Provider.tsx";
import "./index.css";

// Initialize web3 config (must be imported before usage)
import "./lib/web3Config";

createRoot(document.getElementById("root")!).render(
  <Web3Provider>
    <App />
  </Web3Provider>
);
