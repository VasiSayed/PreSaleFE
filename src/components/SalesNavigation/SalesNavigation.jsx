import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bookmark } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import "./SalesNavigation.css";

export default function SalesNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userRoleRaw = user?.role || "SALES";
  const userRole = String(userRoleRaw || "").toUpperCase();

  const isAdminLike = userRole === "ADMIN" || userRole === "FULL_CONTROL";
  const canSeePostSales = isAdminLike || userRole === "ARCHITECT"; // ✅ NEW

const sections = useMemo(() => {
  if (!canSeePostSales) {
    return [{ id: "pre-sales", label: "Pre Sales", route: "/dashboard" }];
  }
  return [
    { id: "pre-sales", label: "Pre Sales", route: "/dashboard" },
    {
      id: "post-sales",
      label: "Post Sales",
      route: "/post-sales/registered-bookings",
    },
  ];
}, [canSeePostSales]);


  const [activeSection, setActiveSection] = useState("pre-sales");
  const [activeTab, setActiveTab] = useState("");

  // ✅ Post-sales states
  const [activePostCategory, setActivePostCategory] = useState("registered");
  const [activePostSubTab, setActivePostSubTab] = useState("");
  const [activePostSubCategory, setActivePostSubCategory] = useState("");
  const [savedItemsCount, setSavedItemsCount] = useState(0);

  // ----------------------------
  // PRE-SALES NAV ITEMS (unchanged)
  // ----------------------------
  const getPreSalesItems = () => {
    if (isAdminLike) {
      const adminItems = [
        {
          id: "dashboard",
          label: "Dashboard",
          route: "/dashboard",
          section: "pre-sales",
        },
        {
          id: "master-setup",
          label: "Master Setup",
          route: "/setup",
          section: "pre-sales",
        },
        {
          id: "inventory",
          label: "Inventory Tracking",
          route: "/sales/inventory",
          section: "pre-sales",
        },
        {
          id: "lead-setup",
          label: "Lead Setup",
          route: "/lead-setup",
          section: "pre-sales",
        },
        {
          id: "channel-partner",
          label: "Channel Partner Setup",
          route: "/channel-partner-setup",
          section: "pre-sales",
        },
        {
          id: "cost-quotation",
          label: "Cost Sheet Quotation Setup",
          route: "/costsheet/templates",
          section: "pre-sales",
        },
        {
          id: "booking-Approval",
          label: "Booking Approval",
          route: "/booking/approvals",
          section: "pre-sales",
        },
        {
          id: "user-register",
          label: "Sales Executive Setup",
          route: "/new/user",
          section: "pre-sales",
        },
        {
          id: "opportunities",
          label: "Opportunities",
          route: "/sales/opportunities",
          section: "pre-sales",
        },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
      ];

      if (userRole === "FULL_CONTROL") {
        return adminItems.filter(
          (it) => it.id !== "leads" && it.id !== "opportunities"
        );
      }
      return adminItems;
    }

    if (userRole === "SALES") {
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
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        {
          id: "site-visit",
          label: "Site Visit",
          route: "/sales/lead/site-visit",
          section: "pre-sales",
        },
        {
          id: "inventory",
          label: "Inventory",
          route: "/inventory-planning/",
          section: "pre-sales",
        },
        {
          id: "quotation",
          label: "Quotation",
          route: "/costsheet",
          section: "pre-sales",
        },
        {
          id: "booking",
          label: "Booking",
          route: "/booking/list",
          section: "pre-sales",
        },
        {
          id: "documents",
          label: "Documents",
          route: "/documents",
          section: "pre-sales",
        },
        {
          id: "on-site",
          label: "Customer Registration Form",
          route: "/onsite-registration",
          section: "pre-sales",
        },
        {
          id: "channel-partner",
          label: "Channel-Partner",
          route: "/channel-partners",
          section: "pre-sales",
        },
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
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        {
          id: "inventory",
          label: "Inventory",
          route: "/inventory-planning/",
          section: "pre-sales",
        },
      ];
    }

    if (userRole === "RECEPTION") {
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          route: "/dashboard",
          section: "pre-sales",
        },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        {
          id: "profile",
          label: "Profile",
          route: "/profile",
          section: "pre-sales",
        },
      ];
    }

    if (userRole === "CHANNEL_PARTNER") {
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          route: "/dashboard",
          section: "pre-sales",
        },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        {
          id: "profile",
          label: "Profile",
          route: "/profile",
          section: "pre-sales",
        },
        {
          id: "channel-partner",
          label: "Channel Partner Setup",
          route: "/channel-partner-setup",
          section: "pre-sales",
        },
      ];
    }

    return [
      {
        id: "dashboard",
        label: "Dashboard",
        route: "/dashboard",
        section: "pre-sales",
      },
      {
        id: "profile",
        label: "Profile",
        route: "/profile",
        section: "pre-sales",
      },
    ];
  };

  const preSalesItems = useMemo(
    () => getPreSalesItems(),
    [userRole, isAdminLike]
  );

  // ----------------------------
  // POST-SALES NAV (Admin only)
  // ----------------------------
  const postSalesCategories = useMemo(() => {
    if (!canSeePostSales) return [];

    return [
      {
        id: "registered",
        label: "Registered Booking",
        route: "/post-sales/registered-bookings",
        subTabs: [],
      },
      {
        id: "financial",
        label: "Financial",
        route: "/post-sales/financial/dashboard",
        subTabs: [
          {
            id: "fin-dashboard",
            label: "Dashboard",
            route: "/post-sales/financial/dashboard",
          },
          {
            id: "fin-demand-note",
            label: "Demand Note",
            route: "/post-sales/financial/demand-notes",
          },

          {
            id: "fin-payment-receipts",
            label: "Payment Receipts",
            route: "/post-sales/financial/payment-receipts",
          },
          {
            id: "fin-milestone-plan",
            label: "Milestone Plan",
            route: "/post-sales/financial/architecture-certificates",
          },
          {
            id: "fin-customer-demand-notes",
            label: "Customer Ledger",
            route: "/post-sales/financial/customer-demand-notes",
          },

          // {
          //   id: "fin-customer-ledger",
          //   label: "Customer Ledger",
          //   route: "/post-sales/financial/customer-ledger",
          // },
          {
            id: "fin-interest-ledger",
            label: "Interest Ledger",
            route: "/post-sales/financial/interest-ledger",
          },
        ],
      },
{
  id: "communication",
  label: "Communication",
  route: "/post-sales/communication/admin/notices",
  subCategories: [
    {
      id: "communication-main",
      label: "Communication",
      route: "/post-sales/communication/admin/notices",
      subTabs: [
        { id: "com-notice", label: "Notice", route: "/post-sales/communication/admin/notices" },
        { id: "com-event", label: "Event", route: "/post-sales/communication/admin/events" },
        { id: "com-broadcast", label: "Broadcast", route: "/post-sales/communication/admin/broadcast" },
        { id: "com-forum-post", label: "ForumPost", route: "/post-sales/communication/admin/forums" },
        { id: "com-poll", label: "Poll", route: "/post-sales/communication/admin/polls" },
        { id: "com-survey", label: "Survey", route: "/post-sales/communication/admin/surveys" },
      ],
    },
    {
      id: "communication-setup",
      label: "Communication Setup",
      route: "/post-sales/communication/admin/template-categories",
      subTabs: [
        { id: "com-template-categories", label: "Template Categories", route: "/post-sales/communication/admin/template-categories" },
        { id: "com-template-variables", label: "Template Variables", route: "/post-sales/communication/admin/template-variables" },
        { id: "com-template", label: "Template", route: "/post-sales/communication/admin/templates" },
        { id: "com-group", label: "Group", route: "/post-sales/communication/admin/groups" },
        { id: "com-event-type", label: "Event Type", route: "/post-sales/communication/admin/event-types" },
      ],
    },
  ],
  subTabs: [], // Empty for communication since we use subCategories
  savedItemsRoute: "/post-sales/communication/admin/saved-items", // Route for saved items icon
},
      {
        id: "helpdesk",
        label: "Help Desk",
        route: "/post-sales/helpdesk",
        subTabs: [],
      },
    ];
  }, [isAdminLike]);

  const activePostCategoryObj = useMemo(() => {
    return (
      postSalesCategories.find((c) => c.id === activePostCategory) ||
      postSalesCategories[0] ||
      null
    );
  }, [postSalesCategories, activePostCategory]);

  // Get sub-categories if they exist (for Communication)
  const postSalesSubCategories = useMemo(
    () => activePostCategoryObj?.subCategories || [],
    [activePostCategoryObj]
  );

  // Get active sub-category object
  const activePostSubCategoryObj = useMemo(() => {
    if (postSalesSubCategories.length === 0) return null;
    return (
      postSalesSubCategories.find((sc) => sc.id === activePostSubCategory) ||
      postSalesSubCategories[0] ||
      null
    );
  }, [postSalesSubCategories, activePostSubCategory]);

  // Get sub-tabs from either sub-category or category
  const postSalesSubTabs = useMemo(() => {
    if (activePostSubCategoryObj) {
      return activePostSubCategoryObj.subTabs || [];
    }
    return activePostCategoryObj?.subTabs || [];
  }, [activePostCategoryObj, activePostSubCategoryObj]);

  // ----------------------------
  // Handlers
  // ----------------------------
  const handleSectionClick = (sectionId, route) => {
    setActiveSection(sectionId);

    if (sectionId === "pre-sales") {
      if (route) navigate(route);
      return;
    }
    if (!isAdminLike) return;
    navigate(route || "/post-sales/registered-bookings");
  };

  const handlePreSalesTabClick = (itemId, route) => {
    setActiveTab(itemId);
    navigate(route);
  };

  const handlePostCategoryClick = (cat) => {
    setActivePostCategory(cat.id);
    setActivePostSubTab("");
    // If category has subCategories, set first one as active
    if (cat.subCategories && cat.subCategories.length > 0) {
      setActivePostSubCategory(cat.subCategories[0].id);
      if (cat.subCategories[0].route) {
        navigate(cat.subCategories[0].route);
        return;
      }
    } else {
      setActivePostSubCategory("");
    }
    if (cat.route) navigate(cat.route);
  };

  const handlePostSubCategoryClick = (subCat) => {
    setActivePostSubCategory(subCat.id);
    setActivePostSubTab("");
    if (subCat.route) navigate(subCat.route);
  };

  const handlePostSubTabClick = (sub) => {
    setActivePostSubTab(sub.id);
    navigate(sub.route);
  };

  // ----------------------------
  // URL -> Active Sync
  // ----------------------------
  useEffect(() => {
    const path = location.pathname || "";

    if (path.startsWith("/post-sales")) {
      setActiveSection("post-sales");

      // Find matching category
      let catMatch = null;
      let subCatMatch = null;
      let subTabMatch = null;

      for (const cat of postSalesCategories) {
        // Check for saved items route first
        if (cat.savedItemsRoute && path.startsWith(cat.savedItemsRoute)) {
          catMatch = cat;
          // Find communication-main subcategory
          subCatMatch = cat.subCategories?.find(sc => sc.id === "communication-main");
          subTabMatch = { id: "com-saved-item", route: cat.savedItemsRoute };
          break;
        }
        // Check if category has subCategories (like Communication)
        if (cat.subCategories && cat.subCategories.length > 0) {
          for (const subCat of cat.subCategories) {
            const subTab = subCat.subTabs?.find((s) => path.startsWith(s.route));
            if (subTab) {
              catMatch = cat;
              subCatMatch = subCat;
              subTabMatch = subTab;
              break;
            }
            if (path.startsWith(subCat.route)) {
              catMatch = cat;
              subCatMatch = subCat;
              break;
            }
          }
        } else {
          // Regular category with subTabs
          const subTab = cat.subTabs?.find((s) => path.startsWith(s.route));
          if (subTab) {
            catMatch = cat;
            subTabMatch = subTab;
            break;
          }
          if (path.startsWith(cat.route)) {
            catMatch = cat;
            break;
          }
        }
        if (catMatch) break;
      }

      const catId = catMatch?.id || "registered";
      setActivePostCategory(catId);

      if (subCatMatch) {
        setActivePostSubCategory(subCatMatch.id);
        if (subTabMatch) {
          setActivePostSubTab(subTabMatch.id);
        } else {
          setActivePostSubTab("");
        }
      } else {
        setActivePostSubCategory("");
        const catObj = postSalesCategories.find((c) => c.id === catId);
        const subMatch = catObj?.subTabs?.find((s) => path.startsWith(s.route));
        setActivePostSubTab(subMatch?.id || "");
      }

      setActiveTab("");
      return;
    }

    setActiveSection("pre-sales");

    const match = preSalesItems.find((item) => {
      if (path === item.route) return true;
      if (item.id === "leads" && path.startsWith("/leads")) return true;
      if (item.id === "booking" && path.startsWith("/booking")) return true;
      if (
        item.id === "inventory" &&
        (path.startsWith("/inventory-planning") ||
          path.startsWith("/sales/inventory"))
      )
        return true;
      if (item.id === "quotation" && path.startsWith("/costsheet")) return true;
      if (
        item.id === "opportunities" &&
        path.startsWith("/sales/opportunities")
      )
        return true;
      return false;
    });

    if (match) setActiveTab(match.id);
    else if (path === "/" || path.startsWith("/dashboard"))
      setActiveTab("dashboard");
    else setActiveTab("");

    setActivePostSubTab("");
  }, [location.pathname, preSalesItems, postSalesCategories]);

  const preSalesFilteredItems = useMemo(() => {
    return preSalesItems.filter((item) => item.section === "pre-sales");
  }, [preSalesItems]);

  // Fetch saved items count when on communication section
  useEffect(() => {
    if (activeSection === "post-sales" && activePostCategory === "communication") {
      const fetchSavedItemsCount = async () => {
        try {
          // Try community endpoint first, fallback to communications
          let response;
          try {
            response = await axiosInstance.get("community/saved-items/");
          } catch {
            response = await axiosInstance.get("communications/saved-items/");
          }
          const items = response.data?.results || response.data || [];
          setSavedItemsCount(Array.isArray(items) ? items.length : 0);
        } catch (error) {
          console.error("Error fetching saved items count:", error);
          setSavedItemsCount(0);
        }
      };
      fetchSavedItemsCount();
    } else {
      setSavedItemsCount(0);
    }
  }, [activeSection, activePostCategory]);

  return (
    <nav className="sales-navigation">
      {/* Primary: Pre / Post Sales */}
      <div className="sales-navigation__primary">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`nav-section-btn ${
              activeSection === section.id ? "active" : ""
            }`}
            onClick={() => handleSectionClick(section.id, section.route)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* PRE-SALES SECONDARY */}
      {activeSection === "pre-sales" && (
        <div className="sales-navigation__secondary">
          {preSalesFilteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-tab-btn ${activeTab === item.id ? "active" : ""}`}
              onClick={() => handlePreSalesTabClick(item.id, item.route)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* POST-SALES */}
      {activeSection === "post-sales" && canSeePostSales && (
        <>
          {/* Post-sales Category bar */}
          <div className="sales-navigation__secondary">
            {postSalesCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`nav-tab-btn ${
                  activePostCategory === cat.id ? "active" : ""
                }`}
                onClick={() => handlePostCategoryClick(cat)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* ✅ Post-sales Sub Categories (for Communication) */}
          {postSalesSubCategories.length > 0 && (
            <div className="sales-navigation__tertiary">
              <div className="sales-navigation__tertiary-left">
                {postSalesSubCategories.map((subCat) => (
                  <button
                    key={subCat.id}
                    type="button"
                    className={`nav-tab-btn nav-subtab-btn ${
                      activePostSubCategory === subCat.id ? "active" : ""
                    }`}
                    onClick={() => handlePostSubCategoryClick(subCat)}
                  >
                    {subCat.label}
                  </button>
                ))}
              </div>
              {/* Saved Items Icon - Only show for Communication category */}
              {activePostCategory === "communication" && (
                <button
                  type="button"
                  className="nav-saved-items-btn"
                  onClick={() => {
                    const savedRoute = postSalesCategories.find(c => c.id === "communication")?.savedItemsRoute;
                    if (savedRoute) {
                      navigate(savedRoute);
                      // Set active tab to saved items
                      setActivePostSubCategory("communication-main");
                      setActivePostSubTab("com-saved-item");
                    }
                  }}
                  title="Saved Items"
                >
                  <Bookmark className="nav-saved-items-icon" />
                  {savedItemsCount > 0 && (
                    <span className="nav-saved-items-badge">{savedItemsCount}</span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* ✅ Post-sales Sub Tabs (regular sub-tabs or sub-tabs from sub-category) */}
          {postSalesSubTabs.length > 0 && (
            <div className="sales-navigation__tertiary">
              <div className="sales-navigation__tertiary-left">
                {postSalesSubTabs.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    className={`nav-tab-btn nav-subtab-btn ${
                      activePostSubTab === sub.id ? "active" : ""
                    }`}
                    onClick={() => handlePostSubTabClick(sub)}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </nav>
  );
}
