const fs = require('fs');

const pages = ['CartPage.jsx', 'CheckoutPage.jsx', 'ProductDetail.jsx', 'TrackOrder.jsx'];

pages.forEach(p => {
  const filePath = 'client/src/pages/' + p;
  let c = fs.readFileSync(filePath, 'utf8');

  // Add imports
  c = c.replace(
    /import \{ Link \} from 'react-router-dom';/,
    "import { Link } from 'react-router-dom';\nimport { FiSun, FiMoon } from 'react-icons/fi';\nimport { useTheme } from '../context/ThemeContext';"
  );

  // Add hook inside component
  c = c.replace(
    /export default function \w+\(.*\) \{/,
    match => match + '\n  const { theme, toggleTheme } = useTheme();'
  );

  // Add button to header
  c = c.replace(
    /<div className="shop-header-actions">/,
    `<div className="shop-header-actions">\n            <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">\n              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}\n            </button>`
  );

  fs.writeFileSync(filePath, c);
});

console.log("Injected theme toggles");
