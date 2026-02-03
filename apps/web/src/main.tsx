import { createRoot } from "react-dom/client";
import { registerSW } from 'virtual:pwa-register';
import App from "./App.tsx";
import "./index.css";

// Register Service Worker using vite-plugin-pwa's virtual module
// This handles auto-updates and provides proper lifecycle management
if (import.meta.env.PROD) {
    const updateSW = registerSW({
        onNeedRefresh() {
            // New content available, show update notification
            if (confirm('Nova versão disponível! Atualizar agora?')) {
                updateSW(true);
            }
        },
        onOfflineReady() {
            console.log('App pronto para uso offline');
        },
        onRegistered(registration) {
            console.log('SW registered:', registration?.scope);

            // Check for updates periodically (every hour)
            if (registration) {
                setInterval(() => {
                    registration.update();
                }, 1000 * 60 * 60);
            }
        },
        onRegisterError(error) {
            console.error('SW registration error:', error);
        },
    });
}

createRoot(document.getElementById("root")!).render(<App />);
