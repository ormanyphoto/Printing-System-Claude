import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import i18n from "./i18n";

// Check for lang query parameter (used in embed/Shopify mode)
const urlParams = new URLSearchParams(window.location.search);
const langParam = urlParams.get("lang");
if (langParam && ["en", "he"].includes(langParam)) {
  i18n.changeLanguage(langParam);
}

// Set initial direction based on detected language
const lang = i18n.language || "en";
document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
document.documentElement.lang = lang;

// Listen for language changes and update dir
i18n.on("languageChanged", (lng) => {
  document.documentElement.dir = lng === "he" ? "rtl" : "ltr";
  document.documentElement.lang = lng;
});

// Listen for language change messages from parent (Shopify embed)
window.addEventListener("message", (event) => {
  if (event.data?.type === "lovable:setLanguage") {
    const lng = event.data.language;
    if (["en", "he"].includes(lng)) {
      i18n.changeLanguage(lng);
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);
