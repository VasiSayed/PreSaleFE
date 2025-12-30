// import { useState, useMemo, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import "./SalesNavigation.css";

// export default function SalesNavigation() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user } = useAuth();

//   const [activeSection, setActiveSection] = useState("pre-sales");
//   const [activeTab, setActiveTab] = useState("");

//   const sections = [
//     { id: "pre-sales", label: "Pre Sales", route: "/dashboard" },
//     { id: "post-sales", label: "Post Sales", route: "/post-sales" }, // future
//   ];

//   const getNavigationItems = () => {
//     const userRole = user?.role || "SALES";

//     if (userRole === "ADMIN") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         {
//           id: "master-setup",
//           label: "Master Setup",
//           route: "/setup",
//           section: "pre-sales",
//         },
//         {
//           id: "inventory",
//           label: "Inventory Tracking",
//           route: "/sales/inventory",
//           section: "pre-sales",
//         },
//         {
//           id: "lead-setup",
//           label: "Lead Setup",
//           route: "/lead-setup",
//           section: "pre-sales",
//         },
//         {
//           id: "channel-partner",
//           label: "Channel Partner Setup",
//           route: "/channel-partner-setup",
//           section: "pre-sales",
//         },
//         {
//           id: "sales-executive",
//           label: "Sales Executive Setup",
//           route: "/sales/executives",
//           section: "pre-sales",
//         },
//         {
//           id: "cost-quotation",
//           label: "Cost Sheet Quotation Setup",
//           route: "/costsheet/templates",
//           section: "pre-sales",
//         },
//         {
//           id: "document-setup",
//           label: "Document Setup",
//           route: "/sales/documents",
//           section: "pre-sales",
//         },
//       ];
//     }

//     if (userRole === "SALES") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//         {
//           id: "site-visit",
//           label: "Site Visit",
//           route: "/sales/lead/site-visit",
//           section: "pre-sales",
//         },
//         {
//           id: "inventory",
//           label: "Inventory",
//           route: "/inventory-planning/",
//           section: "pre-sales",
//         },
//         {
//           id: "quotation",
//           label: "Quotation",
//           route: "/costsheet",
//           section: "pre-sales",
//         },
//         {
//           id: "booking",
//           label: "Booking",
//           route: "/booking/list",
//           section: "pre-sales",
//         },
//         {
//           id: "Documents",
//           label: "Documents",
//           route: "/documents",
//           section: "pre-sales",
//         },
//         // {
//         //   id: "Communication",
//         //   label: "Communication",
//         //   route: "/channel-partners/chat",
//         //   section: "pre-sales",
//         // },
//       ];
//     }

//     if (userRole === "RECEPTION") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//         {
//           id: "profile",
//           label: "Profile",
//           route: "/profile",
//           section: "pre-sales",
//         },
//       ];
//     }

//     if (userRole === "CHANNEL PATNER") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//         {
//           id: "profile",
//           label: "Profile",
//           route: "/profile",
//           section: "pre-sales",
//         },
//         {
//           id: "channel-partner",
//           label: "Channel Partner Setup",
//           route: "/channel-partner-setup",
//           section: "pre-sales",
//         },
//       ];
//     }

//     return [
//       {
//         id: "dashboard",
//         label: "Dashboard",
//         route: "/dashboard",
//         section: "pre-sales",
//       },
//       {
//         id: "profile",
//         label: "Profile",
//         route: "/profile",
//         section: "pre-sales",
//       },
//     ];
//   };

//   const navigationItems = useMemo(() => getNavigationItems(), [user?.role]);

//   const filteredItems = navigationItems.filter(
//     (item) => item.section === activeSection
//   );

//   const handleSectionClick = (sectionId, route) => {
//     setActiveSection(sectionId);
//     if (route) navigate(route);
//   };

//   const handleTabClick = (itemId, route) => {
//     setActiveTab(itemId);
//     navigate(route);
//   };

//   // 🔹 keep active tab in sync with current URL
//   useEffect(() => {
//     const path = location.pathname;

//     // right now everything you showed is in pre-sales
//     setActiveSection("pre-sales");

//     const match = navigationItems.find((item) => {
//       if (path === item.route) return true;

//       if (item.id === "leads" && path.startsWith("/leads")) return true;
//       if (item.id === "booking" && path.startsWith("/booking")) return true;
//       if (item.id === "inventory" && path.startsWith("/inventory-planning"))
//         return true;
//             if (item.id === "inventory" && path.startsWith("/inventory-planning"))
//         return true;
//       if (item.id === "quotation" && path.startsWith("/sales/inventory"))
//         return true;
//         if (item.id === "quotation" && path.startsWith("/sales/quotations"))
//           return true;

//       return false;
//     });

//     if (match) {
//       setActiveTab(match.id);
//     } else if (path === "/" || path.startsWith("/dashboard")) {
//       setActiveTab("dashboard");
//     } else {
//       setActiveTab("");
//     }
//   }, [location.pathname, navigationItems]);

//   return (
//     <nav className="sales-navigation">
//       {/* Primary: Pre / Post Sales */}
//       <div className="sales-navigation__primary">
//         {sections.map((section) => (
//           <button
//             key={section.id}
//             type="button"
//             className={`nav-section-btn ${
//               activeSection === section.id ? "active" : ""
//             }`}
//             onClick={() => handleSectionClick(section.id, section.route)}
//           >
//             {section.label}
//           </button>
//         ))}
//       </div>

//       {/* Secondary tabs */}
//       {activeSection === "pre-sales" && (
//         <div className="sales-navigation__secondary">
//           {filteredItems.map((item) => (
//             <button
//               key={item.id}
//               type="button"
//               className={`nav-tab-btn ${activeTab === item.id ? "active" : ""}`}
//               onClick={() => handleTabClick(item.id, item.route)}
//             >
//               {item.label}
//             </button>
//           ))}
//         </div>
//       )}
//     </nav>
//   );
// }

// // SalesNavigation.jsx
// import { useState, useMemo, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import "./SalesNavigation.css";

// export default function SalesNavigation() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user } = useAuth();

//   const [activeSection, setActiveSection] = useState("pre-sales");
//   const [activeTab, setActiveTab] = useState("");

//   const sections = [
//     { id: "pre-sales", label: "Pre Sales", route: "/dashboard" },
//     { id: "post-sales", label: "Post Sales", route: "/post-sales" }, // future
//   ];

//   const getNavigationItems = () => {
//     const userRole = user?.role || "SALES";

//     if (userRole === "ADMIN" || userRole=="FULL_CONTROL") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         {
//           id: "master-setup",
//           label: "Master Setup",
//           route: "/setup",
//           section: "pre-sales",
//         },
//         {
//           id: "inventory",
//           label: "Inventory Tracking",
//           route: "/sales/inventory",
//           section: "pre-sales",
//         },
//         {
//           id: "lead-setup",
//           label: "Lead Setup",
//           route: "/lead-setup",
//           section: "pre-sales",
//         },
//         {
//           id: "channel-partner",
//           label: "Channel Partner Setup",
//           route: "/channel-partner-setup",
//           section: "pre-sales",
//         },
//         // {
//         //   id: "sales-executive",
//         //   label: "Sales Executive Setup",
//         //   route: "/sales/executives",
//         //   section: "pre-sales",
//         // },
//         {
//           id: "cost-quotation",
//           label: "Cost Sheet Quotation Setup",
//           route: "/costsheet/templates",
//           section: "pre-sales",
//         },
//         // {
//         //   id: "document-setup",
//         //   label: "Document Setup",
//         //   route: "/sales/documents",
//         //   section: "pre-sales",
//         // },

//         // {
//         //   id: "document-setup",
//         //   label: "Document Setup",
//         //   route: "/sales/documents",
//         //   section: "pre-sales",
//         // },
//         {
//           id: "booking-Approval",
//           label: "Booking Approval",
//           route: "/booking/approvals",
//           section: "pre-sales",
//         },
//         {
//           id: "user-register",
//           label: "Sales Executive Setup",
//           route: "/new/user",
//           section: "pre-sales",
//         },
//       ];
//     }

//     if (userRole === "SALES") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         {
//           id: "upcomming",
//           label: "Upcomming Events",
//           route: "/upcommingevent",
//           section: "pre-sales",
//         },
//         {
//           id: "opportunities",
//           label: "Opportunities",
//           route: "/sales/opportunities",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },

//         {
//           id: "site-visit",
//           label: "Site Visit",
//           route: "/sales/lead/site-visit",
//           section: "pre-sales",
//         },
//         {
//           id: "inventory",
//           label: "Inventory",
//           route: "/inventory-planning/",
//           section: "pre-sales",
//         },
//         {
//           id: "quotation",
//           label: "Quotation",
//           route: "/costsheet",
//           section: "pre-sales",
//         },
//         {
//           id: "booking",
//           label: "Booking",
//           route: "/booking/list",
//           section: "pre-sales",
//         },
//         {
//           id: "Documents",
//           label: "Documents",
//           route: "/documents",
//           section: "pre-sales",
//         },
//         {
//           id: "on-site",
//           label: "Customer Registration Form ",
//           route: "/onsite-registration",
//           section: "pre-sales",
//         },
//       ];
//     }

//     if (userRole === "RECEPTION") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//         {
//           id: "profile",
//           label: "Profile",
//           route: "/profile",
//           section: "pre-sales",
//         },
//       ];
//     }

    
//     if (userRole === "CHANNEL PATNER") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//         {
//           id: "profile",
//           label: "Profile",
//           route: "/profile",
//           section: "pre-sales",
//         },
//         {
//           id: "channel-partner",
//           label: "Channel Partner Setup",
//           route: "/channel-partner-setup",
//           section: "pre-sales",
//         },
//       ];
//     }

//     return [
//       {
//         id: "dashboard",
//         label: "Dashboard",
//         route: "/dashboard",
//         section: "pre-sales",
//       },
//       {
//         id: "profile",
//         label: "Profile",
//         route: "/profile",
//         section: "pre-sales",
//       },
//     ];
//   };

//   const navigationItems = useMemo(() => getNavigationItems(), [user?.role]);

//   const filteredItems = navigationItems.filter(
//     (item) => item.section === activeSection
//   );

//   const handleSectionClick = (sectionId, route) => {
//     setActiveSection(sectionId);
//     if (route) navigate(route);
//   };

//   const handleTabClick = (itemId, route) => {
//     setActiveTab(itemId);
//     navigate(route);
//   };

//   useEffect(() => {
//     const path = location.pathname;
//     setActiveSection("pre-sales");

//     const match = navigationItems.find((item) => {
//       if (path === item.route) return true;

//       if (item.id === "leads" && path.startsWith("/leads")) return true;
//       if (item.id === "booking" && path.startsWith("/booking")) return true;
//       if (item.id === "inventory" && path.startsWith("/inventory-planning"))
//         return true;
//       if (item.id === "quotation" && path.startsWith("/costsheet")) return true;

//       // 👇 NEW: match opportunities URL
//       if (
//         item.id === "opportunities" &&
//         path.startsWith("/sales/opportunities")
//       )
//         return true;

//       return false;
//     });

//     if (match) {
//       setActiveTab(match.id);
//     } else if (path === "/" || path.startsWith("/dashboard")) {
//       setActiveTab("dashboard");
//     } else {
//       setActiveTab("");
//     }
//   }, [location.pathname, navigationItems]);

//   return (
//     <nav className="sales-navigation">
//       <div className="sales-navigation__primary">
//         {sections.map((section) => (
//           <button
//             key={section.id}
//             type="button"
//             className={`nav-section-btn ${
//               activeSection === section.id ? "active" : ""
//             }`}
//             onClick={() => handleSectionClick(section.id, section.route)}
//           >
//             {section.label}
//           </button>
//         ))}
//       </div>

//       {activeSection === "pre-sales" && (
//         <div className="sales-navigation__secondary">
//           {filteredItems.map((item) => (
//             <button
//               key={item.id}
//               type="button"
//               className={`nav-tab-btn ${activeTab === item.id ? "active" : ""}`}
//               onClick={() => handleTabClick(item.id, item.route)}
//             >
//               {item.label}
//             </button>
//           ))}
//         </div>
//       )}
//     </nav>
//   );
// }

// SalesNavigation.jsx


// import { useState, useMemo, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import "./SalesNavigation.css";

// export default function SalesNavigation() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user } = useAuth();

//   const [activeSection, setActiveSection] = useState("pre-sales");
//   const [activeTab, setActiveTab] = useState("");

//   const sections = [
//     { id: "pre-sales", label: "Pre Sales", route: "/dashboard" },
//     { id: "post-sales", label: "Post Sales", route: "/post-sales" }, // future
//   ];

//   const getNavigationItems = () => {
//     const userRole = user?.role || "SALES";

//     if (userRole === "ADMIN" || userRole === "FULL_CONTROL") {  // ← Groups FULL_CONTROL with ADMIN for admin panel GUI
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         {
//           id: "master-setup",
//           label: "Master Setup",
//           route: "/setup",
//           section: "pre-sales",
//         },
//         {
//           id: "inventory",
//           label: "Inventory Tracking",
//           route: "/sales/inventory",
//           section: "pre-sales",
//         },
//         {
//           id: "lead-setup",
//           label: "Lead Setup",
//           route: "/lead-setup",
//           section: "pre-sales",
//         },
//         {
//           id: "channel-partner",
//           label: "Channel Partner Setup",
//           route: "/channel-partner-setup",
//           section: "pre-sales",
//         },
//         // {
//         //   id: "sales-executive",
//         //   label: "Sales Executive Setup",
//         //   route: "/sales/executives",
//         //   section: "pre-sales",
//         // },
//         {
//           id: "cost-quotation",
//           label: "Cost Sheet Quotation Setup",
//           route: "/costsheet/templates",
//           section: "pre-sales",
//         },
//         // {
//         //   id: "document-setup",
//         //   label: "Document Setup",
//         //   route: "/sales/documents",
//         //   section: "pre-sales",
//         // },

//         // {
//         //   id: "document-setup",
//         //   label: "Document Setup",
//         //   route: "/sales/documents",
//         //   section: "pre-sales",
//         // },
//         {
//           id: "booking-Approval",
//           label: "Booking Approval",
//           route: "/booking/approvals",
//           section: "pre-sales",
//         },
//         {
//           id: "user-register",
//           label: "Sales Executive Setup",
//           route: "/new/user",
//           section: "pre-sales",
//         },
//          {
//           id: "opportunities",
//           label: "Opportunities",
//           route: "/sales/opportunities",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//       ];
//     }

//     if (userRole === "SALES" || "MANAGER") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         {
//           id: "upcomming",
//           label: "Upcomming Events",
//           route: "/upcommingevent",
//           section: "pre-sales",
//         },
//         {
//           id: "opportunities",
//           label: "Opportunities",
//           route: "/sales/opportunities",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },

//         {
//           id: "site-visit",
//           label: "Site Visit",
//           route: "/sales/lead/site-visit",
//           section: "pre-sales",
//         },
//         {
//           id: "inventory",
//           label: "Inventory",
//           route: "/inventory-planning/",
//           section: "pre-sales",
//         },
//         {
//           id: "quotation",
//           label: "Quotation",
//           route: "/costsheet",
//           section: "pre-sales",
//         },
//         {
//           id: "booking",
//           label: "Booking",
//           route: "/booking/list",
//           section: "pre-sales",
//         },
//         {
//           id: "Documents",
//           label: "Documents",
//           route: "/documents",
//           section: "pre-sales",
//         },
//         {
//           id: "on-site",
//           label: "Customer Registration Form ",
//           route: "/onsite-registration",
//           section: "pre-sales",
//         },
//       ];
//     }

//     if (userRole === "RECEPTION") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//         {
//           id: "profile",
//           label: "Profile",
//           route: "/profile",
//           section: "pre-sales",
//         },
//       ];
//     }

//     if (userRole === "CHANNEL_PARTNER") {  // ← Fixed typo: "CHANNEL PATNER" → "CHANNEL_PARTNER"
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//         {
//           id: "profile",
//           label: "Profile",
//           route: "/profile",
//           section: "pre-sales",
//         },
//         {
//           id: "channel-partner",
//           label: "Channel Partner Setup",
//           route: "/channel-partner-setup",
//           section: "pre-sales",
//         },
//       ];
//     }

//     return [
//       {
//         id: "dashboard",
//         label: "Dashboard",
//         route: "/dashboard",
//         section: "pre-sales",
//       },
//       {
//         id: "profile",
//         label: "Profile",
//         route: "/profile",
//         section: "pre-sales",
//       },
//     ];
//   };

//   const navigationItems = useMemo(() => getNavigationItems(), [user?.role]);

//   const filteredItems = navigationItems.filter(
//     (item) => item.section === activeSection
//   );

//   const handleSectionClick = (sectionId, route) => {
//     setActiveSection(sectionId);
//     if (route) navigate(route);
//   };

//   const handleTabClick = (itemId, route) => {
//     setActiveTab(itemId);
//     navigate(route);
//   };

//   useEffect(() => {
//     const path = location.pathname;
//     setActiveSection("pre-sales");

//     const match = navigationItems.find((item) => {
//       if (path === item.route) return true;

//       if (item.id === "leads" && path.startsWith("/leads")) return true;
//       if (item.id === "booking" && path.startsWith("/booking")) return true;
//       if (item.id === "inventory" && path.startsWith("/inventory-planning"))
//         return true;
//       if (item.id === "quotation" && path.startsWith("/costsheet")) return true;

//       // 👇 NEW: match opportunities URL
//       if (
//         item.id === "opportunities" &&
//         path.startsWith("/sales/opportunities")
//       )
//         return true;

//       return false;
//     });

//     if (match) {
//       setActiveTab(match.id);
//     } else if (path === "/" || path.startsWith("/dashboard")) {
//       setActiveTab("dashboard");
//     } else {
//       setActiveTab("");
//     }
//   }, [location.pathname, navigationItems]);

//   return (
//     <nav className="sales-navigation">
//       <div className="sales-navigation__primary">
//         {sections.map((section) => (
//           <button
//             key={section.id}
//             type="button"
//             className={`nav-section-btn ${
//               activeSection === section.id ? "active" : ""
//             }`}
//             onClick={() => handleSectionClick(section.id, section.route)}
//           >
//             {section.label}
//           </button>
//         ))}
//       </div>

//       {activeSection === "pre-sales" && (
//         <div className="sales-navigation__secondary">
//           {filteredItems.map((item) => (
//             <button
//               key={item.id}
//               type="button"
//               className={`nav-tab-btn ${activeTab === item.id ? "active" : ""}`}
//               onClick={() => handleTabClick(item.id, item.route)}
//             >
//               {item.label}
//             </button>
//           ))}
//         </div>
//       )}
//     </nav>
//   );
// }


import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./SalesNavigation.css";

export default function SalesNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState("pre-sales");
  const [activeTab, setActiveTab] = useState("");

  const sections = [
    { id: "pre-sales", label: "Pre Sales", route: "/dashboard" },
    { id: "post-sales", label: "Post Sales", route: "/post-sales" },
  ];

  const getNavigationItems = () => {
    const userRole = user?.role || "SALES";

    // 1. Logic for ADMIN and FULL_CONTROL
    if (userRole === "ADMIN" || userRole === "FULL_CONTROL") {
      const adminItems = [
        { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
        { id: "master-setup", label: "Master Setup", route: "/setup", section: "pre-sales" },
        { id: "inventory", label: "Inventory Tracking", route: "/sales/inventory", section: "pre-sales" },
        { id: "lead-setup", label: "Lead Setup", route: "/lead-setup", section: "pre-sales" },
        { id: "channel-partner", label: "Channel Partner Setup", route: "/channel-partner-setup", section: "pre-sales" },
       
        { id: "cost-quotation", label: "Cost Sheet Quotation Setup", route: "/costsheet/templates", section: "pre-sales" },
        { id: "booking-Approval", label: "Booking Approval", route: "/booking/approvals", section: "pre-sales" },
        { id: "user-register", label: "Sales Executive Setup", route: "/new/user", section: "pre-sales" },
        { id: "opportunities", label: "Opportunities", route: "/sales/opportunities", section: "pre-sales" },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        
        
      ];

      // If FULL_CONTROL, filter out Leads and Opportunities
      if (userRole === "FULL_CONTROL") {
        return adminItems.filter(item => item.id !== "leads" && item.id !== "opportunities");
      }

      return adminItems;
    }

    // 2. Logic for SALES or MANAGER (Fixed the comparison logic here)
    if (userRole === "SALES") {
      return [
        { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
        { id: "upcomming", label: "Upcomming Events", route: "/upcommingevent", section: "pre-sales" },
        { id: "opportunities", label: "Opportunities", route: "/sales/opportunities", section: "pre-sales" },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        { id: "site-visit", label: "Site Visit", route: "/sales/lead/site-visit", section: "pre-sales" },
        { id: "inventory", label: "Inventory", route: "/inventory-planning/", section: "pre-sales" },
        { id: "quotation", label: "Quotation", route: "/costsheet", section: "pre-sales" },
        { id: "booking", label: "Booking", route: "/booking/list", section: "pre-sales" },
        { id: "Documents", label: "Documents", route: "/documents", section: "pre-sales" },
        { id: "on-site", label: "Customer Registration Form ", route: "/onsite-registration", section: "pre-sales" },
        { id: "channel-partner", label: "Channel-Partner", route: "/channel-partners", section: "pre-sales" },
      ];
    }

    if (userRole === "MANAGER") {
    return [
    {
      id: "dashboard",
      label: "Dashboard",
      route: "/dashboard",
      section: "pre-sales",
    },
    {
      id: "opportunities",
      label: "Opportunities",
      route: "/sales/opportunities",
      section: "pre-sales",
    },
    {
      id: "leads",
      label: "Leads",
      route: "/leads",
      section: "pre-sales",
    },
    // {
    //   id: "booking-Approval",
    //   label: "Booking Approval",
    //   route: "/booking/approvals",
    //   section: "pre-sales",
    // },

     { id: "inventory", label: "Inventory", route: "/inventory-planning/", section: "pre-sales" },
  ];
}


    // 3. Logic for RECEPTION
    if (userRole === "RECEPTION") {
      return [
        { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        { id: "profile", label: "Profile", route: "/profile", section: "pre-sales" },
      ];
    }

    // 4. Logic for CHANNEL_PARTNER
    if (userRole === "CHANNEL_PARTNER") {
      return [
        { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        { id: "profile", label: "Profile", route: "/profile", section: "pre-sales" },
        { id: "channel-partner", label: "Channel Partner Setup", route: "/channel-partner-setup", section: "pre-sales" },
      ];
    }

    // Default Fallback
    return [
      { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
      { id: "profile", label: "Profile", route: "/profile", section: "pre-sales" },
    ];
  };

  const navigationItems = useMemo(() => getNavigationItems(), [user?.role]);

  const filteredItems = navigationItems.filter(
    (item) => item.section === activeSection
  );

  const handleSectionClick = (sectionId, route) => {
    setActiveSection(sectionId);
    if (route) navigate(route);
  };

  const handleTabClick = (itemId, route) => {
    setActiveTab(itemId);
    navigate(route);
  };

  useEffect(() => {
    const path = location.pathname;
    setActiveSection("pre-sales");

    const match = navigationItems.find((item) => {
      if (path === item.route) return true;
      if (item.id === "leads" && path.startsWith("/leads")) return true;
      if (item.id === "booking" && path.startsWith("/booking")) return true;
      if (item.id === "inventory" && (path.startsWith("/inventory-planning") || path.startsWith("/sales/inventory"))) return true;
      if (item.id === "quotation" && path.startsWith("/costsheet")) return true;
      if (item.id === "opportunities" && path.startsWith("/sales/opportunities")) return true;

      return false;
    });

    if (match) {
      setActiveTab(match.id);
    } else if (path === "/" || path.startsWith("/dashboard")) {
      setActiveTab("dashboard");
    } else {
      setActiveTab("");
    }
  }, [location.pathname, navigationItems]);

  return (
    <nav className="sales-navigation">
      <div className="sales-navigation__primary">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`nav-section-btn ${activeSection === section.id ? "active" : ""}`}
            onClick={() => handleSectionClick(section.id, section.route)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === "pre-sales" && (
        <div className="sales-navigation__secondary">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-tab-btn ${activeTab === item.id ? "active" : ""}`}
              onClick={() => handleTabClick(item.id, item.route)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}