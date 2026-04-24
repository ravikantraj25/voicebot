const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'client/src/shop.css');
let css = fs.readFileSync(cssPath, 'utf8');

const themeVariables = `
:root {
  --bg-main: #0a0e1a;
  --bg-header: rgba(15, 20, 40, 0.95);
  --bg-card: rgba(255, 255, 255, 0.04);
  --bg-card-hover: rgba(255, 255, 255, 0.06);
  --bg-input: rgba(255, 255, 255, 0.06);
  --border-light: rgba(255, 255, 255, 0.06);
  --border-med: rgba(255, 255, 255, 0.1);
  --text-main: #e2e8f0;
  --text-heading: #ffffff;
  --text-muted: #94a3b8;
  --text-faint: #64748b;
  
  --accent-primary: #f43f5e;
  --accent-primary-hover: #e11d48;
  --accent-primary-glow: rgba(244, 63, 94, 0.4);
  --accent-primary-faint: rgba(244, 63, 94, 0.1);
  --accent-success: #10b981;
  --accent-warning: #fbbf24;
  --accent-danger: #ef4444;
  
  --shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.3);
  --hero-glow: radial-gradient(circle, rgba(244,63,94,0.3) 0%, rgba(10,14,26,0) 70%);
}

[data-theme='light'] {
  --bg-main: #f8fafc;
  --bg-header: rgba(255, 255, 255, 0.95);
  --bg-card: #ffffff;
  --bg-card-hover: #f1f5f9;
  --bg-input: #f1f5f9;
  --border-light: rgba(0, 0, 0, 0.06);
  --border-med: rgba(0, 0, 0, 0.1);
  --text-main: #334155;
  --text-heading: #0f172a;
  --text-muted: #64748b;
  --text-faint: #94a3b8;
  
  --accent-primary: #f43f5e;
  --accent-primary-hover: #e11d48;
  --accent-primary-glow: rgba(244, 63, 94, 0.2);
  --accent-primary-faint: rgba(244, 63, 94, 0.1);
  --accent-success: #10b981;
  --accent-warning: #f59e0b;
  --accent-danger: #ef4444;
  
  --shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.08);
  --hero-glow: radial-gradient(circle, rgba(244,63,94,0.15) 0%, rgba(255,255,255,0) 70%);
}
`;

// Replacements
css = css.replace(/#0a0e1a/g, 'var(--bg-main)');
css = css.replace(/rgba\(15, 20, 40, 0\.95\)/g, 'var(--bg-header)');
css = css.replace(/rgba\(255,255,255,0\.04\)/g, 'var(--bg-card)');
css = css.replace(/rgba\(255,255,255,0\.06\)/g, 'var(--border-light)');
css = css.replace(/rgba\(255,255,255,0\.1\)/g, 'var(--border-med)');
css = css.replace(/rgba\(255,255,255,0\.15\)/g, 'var(--border-med)');
css = css.replace(/rgba\(255,255,255,0\.2\)/g, 'var(--border-med)');
css = css.replace(/rgba\(255,255,255,0\.08\)/g, 'var(--border-light)');

css = css.replace(/#e2e8f0/g, 'var(--text-main)');
css = css.replace(/#fff/g, 'var(--text-heading)');
css = css.replace(/#ffffff/g, 'var(--text-heading)');
css = css.replace(/#94a3b8/g, 'var(--text-muted)');
css = css.replace(/#64748b/g, 'var(--text-faint)');
css = css.replace(/#cbd5e1/g, 'var(--text-main)');

css = css.replace(/#f43f5e/g, 'var(--accent-primary)');
css = css.replace(/#e11d48/g, 'var(--accent-primary-hover)');
css = css.replace(/rgba\(244,63,94,0\.4\)/g, 'var(--accent-primary-glow)');
css = css.replace(/rgba\(244,63,94,0\.3\)/g, 'var(--accent-primary-glow)');
css = css.replace(/rgba\(244,63,94,0\.2\)/g, 'var(--accent-primary-faint)');
css = css.replace(/rgba\(244,63,94,0\.15\)/g, 'var(--accent-primary-faint)');
css = css.replace(/rgba\(244,63,94,0\.1\)/g, 'var(--accent-primary-faint)');

css = css.replace(/#10b981/g, 'var(--accent-success)');
css = css.replace(/#fbbf24/g, 'var(--accent-warning)');
css = css.replace(/#ef4444/g, 'var(--accent-danger)');

css = css.replace(/0 12px 40px rgba\(0,0,0,0\.3\)/g, 'var(--shadow-hover)');
css = css.replace(/radial-gradient\(circle, rgba\(244,63,94,0\.3\) 0%, rgba\(10,14,26,0\) 70%\)/g, 'var(--hero-glow)');

// Special case for linear gradients
css = css.replace(/linear-gradient\(135deg, var\(--accent-primary\), var\(--accent-primary-hover\)\)/g, 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))');

const finalCss = themeVariables + '\n' + css;

fs.writeFileSync(cssPath, finalCss, 'utf8');
console.log('CSS refactored for themes!');
