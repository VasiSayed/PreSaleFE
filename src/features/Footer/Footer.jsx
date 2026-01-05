import { useState, useEffect } from 'react';
import './Footer.css';
import { getBrandTheme, getFontFamily, applyThemeToRoot } from '../../utils/theme';

function Footer() {
  const [theme, setTheme] = useState(() => getBrandTheme());

  useEffect(() => {
    // Load brand theme from localStorage BRAND_THEME
    const currentTheme = getBrandTheme();
    setTheme(currentTheme);
    
    // Apply CSS variables to root (if not already applied by Navbar)
    applyThemeToRoot(currentTheme);
  }, []);

  const fontFamilyStr = getFontFamily(theme.font_family);

  return (
    <footer 
      className="footer"
      style={{
        backgroundColor: theme.primary_color,
        borderTop: `2px solid ${theme.primary_color}`,
        fontFamily: fontFamilyStr,
        fontSize: `${theme.base_font_size}px`,
      }}
    >
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-text" style={{ fontFamily: fontFamilyStr, color: theme.secondary_color }}>
            © 2025 SHREE RAM KRUSHNA DEVELOPERS. All rights reserved.
          </p>
        </div>

        <div className="footer-center">
          <a href="#" className="footer-link" style={{ fontFamily: fontFamilyStr, color: theme.secondary_color }}>
            Privacy Policy
          </a>
          <span className="footer-divider" style={{ color: theme.secondary_color }}>|</span>
          <a href="#" className="footer-link" style={{ fontFamily: fontFamilyStr, color: theme.secondary_color }}>
            Terms of Service
          </a>
          <span className="footer-divider" style={{ color: theme.secondary_color }}>|</span>
          <a href="#" className="footer-link" style={{ fontFamily: fontFamilyStr, color: theme.secondary_color }}>
            Support
          </a>
        </div>

        <div className="footer-right">
          <p className="footer-text" style={{ fontFamily: fontFamilyStr, color: theme.secondary_color }}>Version 1.0.0</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer