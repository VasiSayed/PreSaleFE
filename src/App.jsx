// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
// import MasterLayout from "./layouts/MasterLayout";
// import ProjectsList from "./pages/Setup/ProjectsList";
// import SetupPage from "./pages/Setup/SetupPage";
// import LeadSetupPage from "./pages/LeadSetup/LeadSetupPage";
// import Auth from "./features/auth/Auth";
// import ForgotPassword from "./features/auth/ForgotPassword";
// import ChannelPartnerChat from "./pages/ChannelPartner/ChannelPartnerChat";
// import ChannelPartnerProfile from "./pages/ChannelPartner/ChannelPartnerProfile";
// import Dashboard from "./pages/Dashboard/Dashboard";
// import ChannelPartnerList from "./pages/Dashboard/ChannelPartnerList";
// import ProjectSetupDetail from "./pages/Setup/ProjectSetupDetail";
// import MyBookings from "./pages/Booking/MyBookings";
// import BookingDetail from "./pages/Booking/BookingDetail";
// import CostSheetTemplatesList from "./pages/CostSheet/CostSheetTemplatesList";
// import LeadsList from "./pages/PreSalesCRM/Leads/LeadsList";
// import LeadStaticPage from "./pages/PreSalesCRM/Leads/LeadStaticPage";
// import SaleAddLead from "./pages/PreSalesCRM/Leads/SaleAddLead";
// import KycReview from "./pages/Booking/KycReview";
// import SiteVisitList from "./pages/SiteVisit/SiteVisitList";
// import SiteVisitsByLead from "./pages/SiteVisit/SiteVisitsByLead";
// import SiteVisitCreate from "./pages/SiteVisit/SiteVisitCreate";
// import SiteVisitDetail from "./pages/SiteVisit/SiteVisitDetail";
// import SiteVisitEdit from "./pages/SiteVisit/SiteVisitEdit";
// import InventoryList from "./pages/Inventory/InventoryList";
// import InventoryCreate from "./pages/Inventory/InventoryCreate";
// import InventoryEdit from "./pages/Inventory/InventoryEdit";
// import InventoryPlanning from "./pages/Inventory/InventoryPlanning";
// import InventoryUnitDetail from "./pages/Inventory/InventoryUnitDetail";
// import ChannelPartnerPage from "./pages/ChannelPartner/ChannelPartnerPage";
// import ChannelPartnerRegistration from "./pages/ChannelPartner/ChannelPartnerRegistration";
// import BookingForm from "./pages/Booking/BookingForm";
// import LeadAdditionalInfoPage from "./pages/LeadSetup/LeadAdditionalInfoPage";
// import OppurnityList from "./pages/Sales/OppurnityList";
// import CostSheetTemplateCreate from "./pages/CostSheet/CostSheetTemplateCreate";
// import CostSheetCreate from "./pages/CostSheet/CostSheetCreate";
// import CostSheetList from "./pages/CostSheet/CostSheetList";
// import QuotationPreview from "./pages/CostSheet/QuotationPreview";
// import DocumentBrowser from "./pages/Documents/DocumentBrowser";
// import OnsiteRegistration from "./pages/OnsiteRegistration";
// import BookingApprovals from "./pages/Booking/BookingApprovals";
// import LeadOpportunityCreate from "./pages/Sales/LeadOpportunityCreate";
// import RegisteredBookings from "./pages/PostSales/RegisteredBookings/RegisteredBookings";
// import PaymentReceipts from "./pages/PostSales/Financial/PaymentReceipts";
// import DemandNotes from "./pages/PostSales/Financial/DemandNotes";
// import Interest from "./pages/PostSales/Financial/Interest";
// import UpcommingEvent from "../src/pages/UpcomingActivities";
// import KycBlack from "./pages/Kycblack/Kycpage";
// import { Toaster } from "react-hot-toast";
// import ProfilePage from "./pages/Profile";
// import CreateUserWithProjectAccess from "./pages/CreateUserWithProjectAccess";
// import { ToastContainer } from "react-toastify";
// import ArchitectureCertificates from "./pages/PostSales/Architecture/ArchitectureCertificateHub";
// import "react-toastify/dist/ReactToastify.css";
// import SirDashboard from "./pages/SirDashboard";

// // ✅✅✅ NEW V2 imports (alag, existing untouched)
// import ProjectCustomersList from "./pages/PostSales/Financial/ProjectCustomersList";
// import CustomerDetail from "./pages/PostSales/Financial/CustomerDetail";
// import DemandNoteDetail from "./pages/PostSales/Financial/DemandNoteDetail";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         {/* ✅ react-hot-toast */}
//         <Toaster
//           position="top-right"
//           reverseOrder={false}
//           gutter={10}
//           containerStyle={{
//             top: 16,
//             right: 16,
//             zIndex: 999999,
//           }}
//           toastOptions={{
//             style: { zIndex: 999999 },
//           }}
//         />

//         {/* ✅ react-toastify */}
//         <ToastContainer
//           position="top-center"
//           autoClose={6000}
//           hideProgressBar={false}
//           newestOnTop
//           closeOnClick
//           rtl={false}
//           pauseOnFocusLoss
//           draggable
//           pauseOnHover
//           theme="light"
//           style={{ zIndex: 999999 }}
//         />

//         <Routes>
//           {/* Public Route */}
//           <Route path="/login" element={<Auth />} />
//           <Route path="/forgot-password" element={<ForgotPassword />} />

//           {/* Public (you had these outside protected) */}
//           <Route path="/booking/kyc-review" element={<KycReview />} />
//           <Route path="/onsite-registration" element={<OnsiteRegistration />} />

//           <Route element={<ProtectedRoute />}>
//             <Route element={<MasterLayout />}>
//               {/* Dashboard */}
//               <Route path="/" element={<Dashboard />} />
//               <Route path="/dashboard" element={<Dashboard />} />
//               <Route
//                 path="/channel-partners"
//                 element={<ChannelPartnerList />}
//               />
//               <Route path="/sir-dashboard" element={<SirDashboard />} />

//               <Route
//                 path="/new/user"
//                 element={<CreateUserWithProjectAccess />}
//               />

//               {/* Projects */}
//               <Route path="/sales/projects" element={<ProjectsList />} />
//               <Route
//                 path="/sales/projects/:projectId"
//                 element={<ProjectSetupDetail />}
//               />

//               {/* Master Setup */}
//               <Route path="/setup" element={<SetupPage />} />

//               {/* Lead Setup */}
//               <Route path="/lead-setup" element={<LeadSetupPage />} />
//               <Route path="/leads/:id" element={<LeadStaticPage />} />
//               <Route path="/leads/new" element={<SaleAddLead />} />
//               <Route path="/leads/new/:leadId" element={<SaleAddLead />} />
//               <Route path="/leads" element={<LeadsList />} />
//               <Route path="/Kycblack" element={<KycBlack />} />
//               <Route path="/profile" element={<ProfilePage />} />
//               <Route path="/upcommingevent" element={<UpcommingEvent />} />

//               <Route
//                 path="/lead-setup/additional-info"
//                 element={<LeadAdditionalInfoPage />}
//               />
//               <Route
//                 path="/lead-setup/additional-info/:projectId"
//                 element={<LeadAdditionalInfoPage />}
//               />

//               {/* Inventory */}
//               <Route path="/sales/inventory" element={<InventoryList />} />
//               <Route
//                 path="/sales/inventory/new"
//                 element={<InventoryCreate />}
//               />
//               <Route
//                 path="/sales/inventory/:id/edit"
//                 element={<InventoryEdit />}
//               />
//               <Route
//                 path="/inventory-planning"
//                 element={<InventoryPlanning />}
//               />
//               <Route
//                 path="/inventory/unit/:unitId"
//                 element={<InventoryUnitDetail />}
//               />

//               {/* Channel */}
//               <Route
//                 path="/channel-partner-setup"
//                 element={<ChannelPartnerPage />}
//               />
//               <Route path="/documents" element={<DocumentBrowser />} />
//               <Route
//                 path="/channel-partners/chat"
//                 element={<ChannelPartnerChat />}
//               />
//               <Route
//                 path="/channel-partners/:partnerId/profile"
//                 element={<ChannelPartnerProfile />}
//               />
//               <Route
//                 path="/channel-partner-add"
//                 element={<ChannelPartnerRegistration />}
//               />

//               {/* Booking */}
//               <Route path="/booking/form" element={<BookingForm />} />
//               <Route path="/booking/list" element={<MyBookings />} />
//               <Route path="/booking/:id" element={<BookingDetail />} />
//               <Route path="/booking/approvals" element={<BookingApprovals />} />

//               {/* Cost Sheet */}
//               <Route path="costsheet" element={<CostSheetList />} />
//               <Route path="/costsheet/:id" element={<QuotationPreview />} />
//               <Route
//                 path="/cost-sheets/new/:leadId"
//                 element={<CostSheetCreate />}
//               />
//               <Route
//                 path="/costsheet/templates/new"
//                 element={<CostSheetTemplateCreate />}
//               />
//               <Route
//                 path="/costsheet/templates"
//                 element={<CostSheetTemplatesList />}
//               />
//               <Route path="/sales/opportunities" element={<OppurnityList />} />
//               <Route
//                 path="/sales/opportunities/add"
//                 element={<LeadOpportunityCreate />}
//               />
//               <Route
//                 path="/sales/opportunities/:id/edit"
//                 element={<LeadOpportunityCreate />}
//               />
//               <Route
//                 path="/costsheet/templates/:id"
//                 element={<CostSheetTemplateCreate />}
//               />

//               {/* SiteVisit */}
//               <Route
//                 path="/sales/lead/site-visit"
//                 element={<SiteVisitList />}
//               />
//               <Route
//                 path="/sales/lead/site-visit/by-lead/:leadId"
//                 element={<SiteVisitsByLead />}
//               />
//               <Route
//                 path="/sales/lead/site-visit/create"
//                 element={<SiteVisitCreate />}
//               />
//               <Route
//                 path="/sales/lead/site-visit/:id"
//                 element={<SiteVisitDetail />}
//               />
//               <Route
//                 path="/sales/lead/site-visit/:id/edit"
//                 element={<SiteVisitEdit />}
//               />

//               {/* ✅✅✅ POST-SALES ROUTES (existing untouched) ✅✅✅ */}
//               <Route
//                 path="/post-sales/registered-bookings"
//                 element={<RegisteredBookings />}
//               />
//               <Route
//                 path="/post-sales/financial/dashboard"
//                 element={<div>Financial Dashboard</div>}
//               />
//               <Route
//                 path="/post-sales/financial/demand-notes"
//                 element={<DemandNotes />}
//               />
//               <Route
//                 path="/post-sales/financial/payment-receipts"
//                 element={<PaymentReceipts />}
//               />
//               <Route
//                 path="/post-sales/financial/customer-ledger"
//                 element={<div>Customer Ledger</div>}
//               />
//               <Route
//                 path="/post-sales/financial/architecture-certificates"
//                 element={<ArchitectureCertificates />}
//               />
//               <Route
//                 path="/post-sales/financial/interest-ledger"
//                 element={<Interest />}
//               />

//               <Route
//                 path="/post-sales/financial/customer-demand-notes"
//                 element={<ProjectCustomersList />}
//               />

//               <Route
//                 path="/post-sales/financial/customer-demand-notes/customers/:customerId"
//                 element={<CustomerDetail />}
//               />

//               <Route
//                 path="/post-sales/financial/customer-demand-notes/dn/:dnId"
//                 element={<DemandNoteDetail />}
//               />

//               <Route
//                 path="/post-sales/communication/notices"
//                 element={<div>Notices</div>}
//               />
//               <Route
//                 path="/post-sales/communication/events"
//                 element={<div>Events</div>}
//               />
//               <Route
//                 path="/post-sales/communication/polls"
//                 element={<div>Polls</div>}
//               />
//               <Route
//                 path="/post-sales/communication/forums"
//                 element={<div>Forums</div>}
//               />

//               <Route
//                 path="/post-sales/helpdesk"
//                 element={<div>Help Desk</div>}
//               />

//               {/* Fallback */}
//               <Route path="*" element={<Navigate to="/" replace />} />
//             </Route>
//           </Route>
//         </Routes>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }

import React, { useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MasterLayout from "./layouts/MasterLayout";

import ProjectsList from "./pages/Setup/ProjectsList";
import SetupPage from "./pages/Setup/SetupPage";
import LeadSetupPage from "./pages/LeadSetup/LeadSetupPage";
import Auth from "./features/auth/Auth";
import ForgotPassword from "./features/auth/ForgotPassword";

import ChannelPartnerChat from "./pages/ChannelPartner/ChannelPartnerChat";
import ChannelPartnerProfile from "./pages/ChannelPartner/ChannelPartnerProfile";
import Dashboard from "./pages/Dashboard/Dashboard";
import SalesDashboard from "./pages/Dashboard/SalesDashboard";
import ChannelPartnerList from "./pages/Dashboard/ChannelPartnerList";
import ProjectSetupDetail from "./pages/Setup/ProjectSetupDetail";

import MyBookings from "./pages/Booking/MyBookings";
import BookingDetail from "./pages/Booking/BookingDetail";
import KycReview from "./pages/Booking/KycReview";
import BookingForm from "./pages/Booking/BookingForm";
import BookingApprovals from "./pages/Booking/BookingApprovals";

import CostSheetTemplatesList from "./pages/CostSheet/CostSheetTemplatesList";
import CostSheetTemplateCreate from "./pages/CostSheet/CostSheetTemplateCreate";
import CostSheetCreate from "./pages/CostSheet/CostSheetCreate";
import CostSheetList from "./pages/CostSheet/CostSheetList";
import QuotationPreview from "./pages/CostSheet/QuotationPreview";

import LeadsList from "./pages/PreSalesCRM/Leads/LeadsList";
import LeadStaticPage from "./pages/PreSalesCRM/Leads/LeadStaticPage";
import SaleAddLead from "./pages/PreSalesCRM/Leads/SaleAddLead";

import SiteVisitList from "./pages/SiteVisit/SiteVisitList";
import SiteVisitsByLead from "./pages/SiteVisit/SiteVisitsByLead";
import SiteVisitCreate from "./pages/SiteVisit/SiteVisitCreate";
import SiteVisitDetail from "./pages/SiteVisit/SiteVisitDetail";
import SiteVisitEdit from "./pages/SiteVisit/SiteVisitEdit";

import InventoryList from "./pages/Inventory/InventoryList";
import InventoryCreate from "./pages/Inventory/InventoryCreate";
import InventoryEdit from "./pages/Inventory/InventoryEdit";
import InventoryPlanning from "./pages/Inventory/InventoryPlanning";
import InventoryUnitDetail from "./pages/Inventory/InventoryUnitDetail";

import ChannelPartnerPage from "./pages/ChannelPartner/ChannelPartnerPage";
import ChannelPartnerRegistration from "./pages/ChannelPartner/ChannelPartnerRegistration";

import LeadAdditionalInfoPage from "./pages/LeadSetup/LeadAdditionalInfoPage";
import OppurnityList from "./pages/Sales/OppurnityList";
import LeadOpportunityCreate from "./pages/Sales/LeadOpportunityCreate";

import DocumentBrowser from "./pages/Documents/DocumentBrowser";
import OnsiteRegistration from "./pages/OnsiteRegistration";
import RegisteredBookings from "./pages/PostSales/RegisteredBookings/RegisteredBookings";
import PaymentReceipts from "./pages/PostSales/Financial/PaymentReceipts";
import DemandNotes from "./pages/PostSales/Financial/DemandNotes";
import Interest from "./pages/PostSales/Financial/Interest";
import ArchitectureCertificates from "./pages/PostSales/Architecture/ArchitectureCertificateHub";

// ✅✅✅ NEW V2 imports
import ProjectCustomersList from "./pages/PostSales/Financial/ProjectCustomersList";
import CustomerDetail from "./pages/PostSales/Financial/CustomerDetail";
import DemandNoteDetail from "./pages/PostSales/Financial/DemandNoteDetail";

import UpcommingEvent from "../src/pages/UpcomingActivities";
import KycBlack from "./pages/Kycblack/Kycpage";
import ProfilePage from "./pages/Profile";
import CreateUserWithProjectAccess from "./pages/CreateUserWithProjectAccess";
import SirDashboard from "./pages/SirDashboard";

import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getStoredUser, isAdminUser } from "./components/commsUtils";

/* =========================
   ✅ POST-SALES COMMUNICATION
========================= */

// Layouts
import AdminCommunityLayout from "./pages/PostSales/Communication/AdminCommunityLayout";
import CommunityLayout from "./pages/PostSales/Communication/CommunityLayout";

// Pages (Customer feed)
import {
  Notices,
  NoticeDetail,
  Events,
  EventDetail,
  Forum,
  Polls,
  Surveys,
  SurveyFill,
} from "./pages/PostSales/Communication/CommunityPages";

// Pages (Admin)
import { AdminNotices } from "./pages/PostSales/Communication/AdminCommunityPages";

import {
  CommsNoticesPage,
  CommsEventsPage,
  CommsPollsPage,
  CommsForumsPage,
  CommsSurveysPage,
  CommsGroupsPage,
  CommsEventTypesPage,
  CommsTemplatesPage,
  CommsBroadcastPage,
  CommsSavedItemPage,
  CommsTemplateCategoriesPage,
  CommsTemplateVariablesPage,
} from "./pages/PostSales/Communication/admin";


const getDashboardComponent = (user) => {
  const resolved = user || getStoredUser();
  if (!resolved) return Dashboard;

  const role = String(resolved.role || resolved.custom_role || "")
    .replace(/_/g, " ")
    .trim()
    .toUpperCase();

  const isAdminOrFull =
    isAdminUser(resolved) || role === "ADMIN" || role === "FULL CONTROL";

  return isAdminOrFull ? Dashboard : SalesDashboard;
};

function DashboardGate() {
  const { user } = useAuth();
  const DashboardHome = useMemo(
    () => getDashboardComponent(user),
    [user]
  );

  return <DashboardHome />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={10}
          containerStyle={{ top: 16, right: 16, zIndex: 999999 }}
          toastOptions={{ style: { zIndex: 999999 } }}
        />

        <ToastContainer
          position="top-center"
          autoClose={6000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 999999 }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/booking/kyc-review" element={<KycReview />} />
          <Route path="/onsite-registration" element={<OnsiteRegistration />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MasterLayout />}>
              {/* Dashboard */}
              <Route path="/" element={<DashboardGate />} />
              <Route path="/dashboard" element={<DashboardGate />} />
              <Route
                path="/channel-partners"
                element={<ChannelPartnerList />}
              />
              <Route path="/sir-dashboard" element={<SirDashboard />} />

              <Route
                path="/new/user"
                element={<CreateUserWithProjectAccess />}
              />

              {/* Projects */}
              <Route path="/sales/projects" element={<ProjectsList />} />
              <Route
                path="/sales/projects/:projectId"
                element={<ProjectSetupDetail />}
              />

              {/* Setup */}
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/lead-setup" element={<LeadSetupPage />} />

              {/* Leads */}
              <Route path="/leads" element={<LeadsList />} />
              <Route path="/leads/:id" element={<LeadStaticPage />} />
              <Route path="/leads/new" element={<SaleAddLead />} />
              <Route path="/leads/new/:leadId" element={<SaleAddLead />} />

              <Route path="/Kycblack" element={<KycBlack />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/upcommingevent" element={<UpcommingEvent />} />

              <Route
                path="/lead-setup/additional-info"
                element={<LeadAdditionalInfoPage />}
              />
              <Route
                path="/lead-setup/additional-info/:projectId"
                element={<LeadAdditionalInfoPage />}
              />

              {/* Inventory */}
              <Route path="/sales/inventory" element={<InventoryList />} />
              <Route
                path="/sales/inventory/new"
                element={<InventoryCreate />}
              />
              <Route
                path="/sales/inventory/:id/edit"
                element={<InventoryEdit />}
              />
              <Route
                path="/inventory-planning"
                element={<InventoryPlanning />}
              />
              <Route
                path="/inventory/unit/:unitId"
                element={<InventoryUnitDetail />}
              />

              {/* Channel Partner */}
              <Route
                path="/channel-partner-setup"
                element={<ChannelPartnerPage />}
              />
              <Route path="/documents" element={<DocumentBrowser />} />
              <Route
                path="/channel-partners/chat"
                element={<ChannelPartnerChat />}
              />
              <Route
                path="/channel-partners/:partnerId/profile"
                element={<ChannelPartnerProfile />}
              />
              <Route
                path="/channel-partner-add"
                element={<ChannelPartnerRegistration />}
              />

              {/* Booking */}
              <Route path="/booking/form" element={<BookingForm />} />
              <Route path="/booking/list" element={<MyBookings />} />
              <Route path="/booking/:id" element={<BookingDetail />} />
              <Route path="/booking/approvals" element={<BookingApprovals />} />

              {/* CostSheet */}
              <Route path="/costsheet" element={<CostSheetList />} />
              <Route path="/costsheet/:id" element={<QuotationPreview />} />
              <Route
                path="/cost-sheets/new/:leadId"
                element={<CostSheetCreate />}
              />
              <Route
                path="/costsheet/templates/new"
                element={<CostSheetTemplateCreate />}
              />
              <Route
                path="/costsheet/templates"
                element={<CostSheetTemplatesList />}
              />
              <Route
                path="/costsheet/templates/:id"
                element={<CostSheetTemplateCreate />}
              />

              {/* Opportunities */}
              <Route path="/sales/opportunities" element={<OppurnityList />} />
              <Route
                path="/sales/opportunities/add"
                element={<LeadOpportunityCreate />}
              />
              <Route
                path="/sales/opportunities/:id/edit"
                element={<LeadOpportunityCreate />}
              />

              {/* Site Visit */}
              <Route
                path="/sales/lead/site-visit"
                element={<SiteVisitList />}
              />
              <Route
                path="/sales/lead/site-visit/by-lead/:leadId"
                element={<SiteVisitsByLead />}
              />
              <Route
                path="/sales/lead/site-visit/create"
                element={<SiteVisitCreate />}
              />
              <Route
                path="/sales/lead/site-visit/:id"
                element={<SiteVisitDetail />}
              />
              <Route
                path="/sales/lead/site-visit/:id/edit"
                element={<SiteVisitEdit />}
              />

              {/* Post Sales */}
              <Route
                path="/post-sales/registered-bookings"
                element={<RegisteredBookings />}
              />
              <Route
                path="/post-sales/financial/dashboard"
                element={<div>Financial Dashboard</div>}
              />
              <Route
                path="/post-sales/financial/demand-notes"
                element={<DemandNotes />}
              />
              <Route
                path="/post-sales/financial/payment-receipts"
                element={<PaymentReceipts />}
              />
              <Route
                path="/post-sales/financial/customer-ledger"
                element={<div>Customer Ledger</div>}
              />
              <Route
                path="/post-sales/financial/architecture-certificates"
                element={<ArchitectureCertificates />}
              />
              <Route
                path="/post-sales/financial/interest-ledger"
                element={<Interest />}
              />

              <Route
                path="/post-sales/financial/customer-demand-notes"
                element={<ProjectCustomersList />}
              />
              <Route
                path="/post-sales/financial/customer-demand-notes/customers/:customerId"
                element={<CustomerDetail />}
              />
              <Route
                path="/post-sales/financial/customer-demand-notes/dn/:dnId"
                element={<DemandNoteDetail />}
              />

              <Route
                path="/post-sales/communication/admin/template-categories"
                element={<CommsTemplateCategoriesPage />}
              />
              <Route
                path="/post-sales/communication/admin/template-variables"
                element={<CommsTemplateVariablesPage />}
              />
              <Route
                path="/post-sales/communication/admin/templates"
                element={<CommsTemplatesPage />}
              />
              <Route
                path="/post-sales/communication/admin/notices"
                element={<CommsNoticesPage />}
              />
              <Route
                path="/post-sales/communication/admin/events"
                element={<CommsEventsPage />}
              />
              <Route
                path="/post-sales/communication/admin/broadcast"
                element={<CommsBroadcastPage />}
              />
              <Route
                path="/post-sales/communication/admin/forums"
                element={<CommsForumsPage />}
              />
              <Route
                path="/post-sales/communication/admin/polls"
                element={<CommsPollsPage />}
              />
              <Route
                path="/post-sales/communication/admin/surveys"
                element={<CommsSurveysPage />}
              />
              <Route
                path="/post-sales/communication/admin/saved-items"
                element={<CommsSavedItemPage />}
              />
              <Route
                path="/post-sales/communication/admin/groups"
                element={<CommsGroupsPage />}
              />
              <Route
                path="/post-sales/communication/admin/event-types"
                element={<CommsEventTypesPage />}
              />

              <Route
                path="/post-sales/communication/admin"
                element={
                  <Navigate
                    to="/post-sales/communication/admin/template-categories"
                    replace
                  />
                }
              />

              {/* ✅ Communication (Customer feed) */}
              <Route
                path="/post-sales/communication"
                element={<CommunityLayout />}
              >
                <Route index element={<Notices />} />

                <Route path="notices" element={<Notices />} />
                <Route path="notices/:id" element={<NoticeDetail />} />

                <Route path="events" element={<Events />} />
                <Route path="events/:id" element={<EventDetail />} />

                <Route path="polls" element={<Polls />} />
                <Route path="forums" element={<Forum />} />

                <Route path="surveys" element={<Surveys />} />
                <Route path="surveys/:id" element={<SurveyFill />} />
              </Route>

              {/* ✅ Communication (Admin) — ONLY Notices */}
              <Route
                path="/post-sales/communication/admin"
                element={<AdminCommunityLayout />}
              >
                <Route index element={<Navigate to="notices" replace />} />
                <Route path="notices" element={<AdminNotices />} />
              </Route>

              <Route
                path="/post-sales/helpdesk"
                element={<div>Help Desk</div>}
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
