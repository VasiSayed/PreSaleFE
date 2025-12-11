import { useState, useEffect } from 'react';
import './Footer.css'

function Footer() {
  const [primaryColor, setPrimaryColor] = useState('#102a54'); // Default color
  const [fontFamily, setFontFamily] = useState("'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"); // Default font

  useEffect(() => {
    // Load brand colors and font from localStorage MY_SCOPE
    try {
      const myScopeStr = localStorage.getItem('MY_SCOPE');
      if (myScopeStr) {
        const myScope = JSON.parse(myScopeStr);
        const brand = myScope?.brand || {};
        
        // Set primary color (fallback to default if not present)
        if (brand.primary_color) {
          setPrimaryColor(brand.primary_color);
        }
        
        // Set font family (fallback to default if not present)
        if (brand.font) {
          setFontFamily(brand.font);
        }
      }
    } catch (err) {
      console.error('Failed to load brand colors from MY_SCOPE', err);
    }
  }, []);

  return (
    <footer 
      className="footer"
      style={{
        backgroundColor: primaryColor,
        borderTop: `2px solid ${primaryColor}`,
        fontFamily: fontFamily,
      }}
    >
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-text" style={{ fontFamily: fontFamily }}>
            © 2025 SHREE RAM KRUSHNA DEVELOPERS. All rights reserved.
          </p>
        </div>

        <div className="footer-center">
          <a href="#" className="footer-link" style={{ fontFamily: fontFamily }}>
            Privacy Policy
          </a>
          <span className="footer-divider">|</span>
          <a href="#" className="footer-link" style={{ fontFamily: fontFamily }}>
            Terms of Service
          </a>
          <span className="footer-divider">|</span>
          <a href="#" className="footer-link" style={{ fontFamily: fontFamily }}>
            Support
          </a>
        </div>

        <div className="footer-right">
          <p className="footer-text" style={{ fontFamily: fontFamily }}>Version 1.0.0</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer