const fs = require('fs');

const configPath = 'client/tailwind.config.js';
let c = fs.readFileSync(configPath, 'utf8');

c = c.replace(/50: '#f8fafc'/, "50: 'var(--surface-50)'")
     .replace(/100: '#f1f5f9'/, "100: 'var(--surface-100)'")
     .replace(/200: '#e2e8f0'/, "200: 'var(--surface-200)'")
     .replace(/300: '#cbd5e1'/, "300: 'var(--surface-300)'")
     .replace(/400: '#94a3b8'/, "400: 'var(--surface-400)'")
     .replace(/500: '#64748b'/, "500: 'var(--surface-500)'")
     .replace(/600: '#475569'/, "600: 'var(--surface-600)'")
     .replace(/700: '#334155'/, "700: 'var(--surface-700)'")
     .replace(/800: '#1e293b'/, "800: 'var(--surface-800)'")
     .replace(/900: '#0f172a'/, "900: 'var(--surface-900)'")
     .replace(/950: '#020617'/, "950: 'var(--surface-950)'");

fs.writeFileSync(configPath, c);
console.log("Updated tailwind.config.js");
