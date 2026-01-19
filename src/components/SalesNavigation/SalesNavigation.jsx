import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
  subTabs: [
    { id: "com-notice", label: "Notices", route: "/post-sales/communication/admin/notices" },
    { id: "com-events", label: "Events", route: "/post-sales/communication/admin/events" },
    { id: "com-polls", label: "Polls", route: "/post-sales/communication/admin/polls" },
    { id: "com-forums", label: "Forums", route: "/post-sales/communication/admin/forums" },
    { id: "com-surveys", label: "Surveys", route: "/post-sales/communication/admin/surveys" },
    { id: "com-groups", label: "Groups", route: "/post-sales/communication/admin/groups" },
    { id: "com-event-types", label: "Event Types", route: "/post-sales/communication/admin/event-types" },
  ],
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

  const postSalesSubTabs = useMemo(
    () => activePostCategoryObj?.subTabs || [],
    [activePostCategoryObj]
  );

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
    if (cat.route) navigate(cat.route);
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

      const catMatch =
        postSalesCategories.find((c) => path.startsWith(c.route)) ||
        postSalesCategories.find((c) =>
          c.subTabs?.some((s) => path.startsWith(s.route))
        ) ||
        null;

      const catId = catMatch?.id || "registered";
      setActivePostCategory(catId);

      const catObj = postSalesCategories.find((c) => c.id === catId);
      const subMatch = catObj?.subTabs?.find((s) => path.startsWith(s.route));
      setActivePostSubTab(subMatch?.id || "");

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

          {/* ✅ Post-sales Sub bar (NOW SAME STYLE: text + underline, NOT pill buttons) */}
          {postSalesSubTabs.length > 0 && (
            <div className="sales-navigation__tertiary">
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
          )}
        </>
      )}
    </nav>
  );
}
