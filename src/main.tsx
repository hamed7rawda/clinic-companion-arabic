import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getInitialTheme } from "./components/ThemeToggle";

// Apply persisted theme before first paint to avoid flash
const t = getInitialTheme();
if (t === "dark") document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
