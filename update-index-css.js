const fs = require('fs');

const cssPath = 'client/src/index.css';
let c = fs.readFileSync(cssPath, 'utf8');

const themeVariables = `
:root {
  --surface-50: #f8fafc;
  --surface-100: #f1f5f9;
  --surface-200: #e2e8f0;
  --surface-300: #cbd5e1;
  --surface-400: #94a3b8;
  --surface-500: #64748b;
  --surface-600: #475569;
  --surface-700: #334155;
  --surface-800: #1e293b;
  --surface-900: #0f172a;
  --surface-950: #020617;
  
  --brand-500-glow: rgba(244, 63, 94, 0.25);
  --bg-app: #020617;
}

[data-theme='light'] {
  --surface-50: #0f172a;
  --surface-100: #1e293b;
  --surface-200: #334155;
  --surface-300: #475569;
  --surface-400: #64748b;
  --surface-500: #94a3b8;
  --surface-600: #cbd5e1;
  --surface-700: #e2e8f0;
  --surface-800: #f1f5f9;
  --surface-900: #f8fafc;
  --surface-950: #ffffff;
  
  --brand-500-glow: rgba(244, 63, 94, 0.1);
  --bg-app: #f8fafc;
}
`;

// Insert variables after @tailwind utilities;
c = c.replace(/@tailwind utilities;/, "@tailwind utilities;\n" + themeVariables);
// Make the body background aware of the mode
c = c.replace(/@apply bg-surface-950 text-surface-100 font-sans antialiased;/, "@apply bg-[var(--bg-app)] text-surface-100 font-sans antialiased;");
c = c.replace(/rgba\(244, 63, 94, 0\.25\)/g, "var(--brand-500-glow)");

fs.writeFileSync(cssPath, c);
console.log("Updated index.css");
