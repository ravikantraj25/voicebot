const fs = require('fs');

// Fix index.css
let indexCss = fs.readFileSync('client/src/index.css', 'utf8');

const updatedVariables = `
:root {
  --surface-50: 248 250 252;
  --surface-100: 241 245 249;
  --surface-200: 226 232 240;
  --surface-300: 203 213 225;
  --surface-400: 148 163 184;
  --surface-500: 100 116 139;
  --surface-600: 71 85 105;
  --surface-700: 51 65 85;
  --surface-800: 30 41 59;
  --surface-900: 15 23 42;
  --surface-950: 2 6 23;
  
  --brand-500-glow: rgba(244, 63, 94, 0.25);
  --bg-app: rgb(2 6 23);
}

[data-theme='light'] {
  --surface-50: 2 6 23;
  --surface-100: 15 23 42;
  --surface-200: 30 41 59;
  --surface-300: 51 65 85;
  --surface-400: 71 85 105;
  --surface-500: 100 116 139;
  --surface-600: 148 163 184;
  --surface-700: 203 213 225;
  --surface-800: 226 232 240;
  --surface-900: 241 245 249;
  --surface-950: 248 250 252;
  
  --brand-500-glow: rgba(244, 63, 94, 0.1);
  --bg-app: rgb(248 250 252);
}
`;

indexCss = indexCss.replace(/:root \{[\s\S]*?--bg-app:[^\}]*\}/, updatedVariables.trim());
fs.writeFileSync('client/src/index.css', indexCss);

// Fix tailwind.config.js
let tailwindConfig = fs.readFileSync('client/tailwind.config.js', 'utf8');
tailwindConfig = tailwindConfig.replace(/50: 'var\(--surface-50\)'/, "50: 'rgb(var(--surface-50) / <alpha-value>)'")
  .replace(/100: 'var\(--surface-100\)'/, "100: 'rgb(var(--surface-100) / <alpha-value>)'")
  .replace(/200: 'var\(--surface-200\)'/, "200: 'rgb(var(--surface-200) / <alpha-value>)'")
  .replace(/300: 'var\(--surface-300\)'/, "300: 'rgb(var(--surface-300) / <alpha-value>)'")
  .replace(/400: 'var\(--surface-400\)'/, "400: 'rgb(var(--surface-400) / <alpha-value>)'")
  .replace(/500: 'var\(--surface-500\)'/, "500: 'rgb(var(--surface-500) / <alpha-value>)'")
  .replace(/600: 'var\(--surface-600\)'/, "600: 'rgb(var(--surface-600) / <alpha-value>)'")
  .replace(/700: 'var\(--surface-700\)'/, "700: 'rgb(var(--surface-700) / <alpha-value>)'")
  .replace(/800: 'var\(--surface-800\)'/, "800: 'rgb(var(--surface-800) / <alpha-value>)'")
  .replace(/900: 'var\(--surface-900\)'/, "900: 'rgb(var(--surface-900) / <alpha-value>)'")
  .replace(/950: 'var\(--surface-950\)'/, "950: 'rgb(var(--surface-950) / <alpha-value>)'");

fs.writeFileSync('client/tailwind.config.js', tailwindConfig);

console.log("Fixed tailwind opacity modifiers support");
