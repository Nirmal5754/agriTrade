import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
   server: {
    port: 3000, 
    // Firebase Google sign-in popup can warn/fail under strict COOP.
    // This header keeps the opener relationship for popups.
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
}
})
