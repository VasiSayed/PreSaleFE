// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
// import MasterLayout from "./layouts/MasterLayout";
// import ProjectsList from "./pages/Setup/ProjectsList";
// import SetupPage from "./pages/Setup/SetupPage";
// import LeadSetupPage from "./pages/LeadSetup/LeadSetupPage";
// import Auth from "./features/auth/Auth";
// import ChannelPartnerChat from "./pages/ChannelPartner/ChannelPartnerChat";
// import ChannelPartnerProfile from "./pages/ChannelPartner/ChannelPartnerProfile";
// import Dashboard from "./pages/Dashboard/Dashboard";
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
// import KycBlack from "./pages/Kycblack/Kycpage";
// import { Toaster } from "react-hot-toast";
// import ProfilePage from "./pages/Profile";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         {/* Existing Toaster */}
//         <Toaster position="top-right" reverseOrder={false} />

//         {/* ✅ ADD THIS NEW TOASTCONTAINER */}
//         <ToastContainer
//           position="top-right"
//           autoClose={3000}
//           hideProgressBar={false}
//           newestOnTop
//           closeOnClick
//           rtl={false}
//           pauseOnFocusLoss
//           draggable
//           pauseOnHover
//           theme="light"
//         />

//         <Routes>
//           {/* Public Route */}
//           <Route path="/login" element={<Auth />} />
//           <Route path="/booking/kyc-review" element={<KycReview />} />
//           <Route path="/onsite-registration" element={<OnsiteRegistration />} />
//           {/* Protected Routes with MasterLayout */}
//           <Route element={<ProtectedRoute />}>
//             <Route element={<MasterLayout />}>
//               {/* Dashboard */}
//               <Route path="/" element={<Dashboard />} />
//               <Route path="/dashboard" element={<Dashboard />} />

//               {/* Projects */}
//               <Route path="/sales/projects" element={<ProjectsList />} />
//               {/* 🔹 NEW: Project setup detail with projectId in URL */}
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
//               <Route path="/booking/form" element={<BookingForm />} />
//               {/* 🔹 NEW: Pending approvals (admin) */}
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
//               <Route path="/sales/opportunities/add" element={<LeadOpportunityCreate />} />
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

//               {/* Fallback */}
//               <Route path="*" element={<Navigate to="/" replace />} />
//             </Route>
//           </Route>
//         </Routes>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
import ChannelPartnerList from "./pages/Dashboard/ChannelPartnerList";
import ProjectSetupDetail from "./pages/Setup/ProjectSetupDetail";
import MyBookings from "./pages/Booking/MyBookings";
import BookingDetail from "./pages/Booking/BookingDetail";
import CostSheetTemplatesList from "./pages/CostSheet/CostSheetTemplatesList";
import LeadsList from "./pages/PreSalesCRM/Leads/LeadsList";
import LeadStaticPage from "./pages/PreSalesCRM/Leads/LeadStaticPage";
import SaleAddLead from "./pages/PreSalesCRM/Leads/SaleAddLead";
import KycReview from "./pages/Booking/KycReview";
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
import BookingForm from "./pages/Booking/BookingForm";
import LeadAdditionalInfoPage from "./pages/LeadSetup/LeadAdditionalInfoPage";
import OppurnityList from "./pages/Sales/OppurnityList";
import CostSheetTemplateCreate from "./pages/CostSheet/CostSheetTemplateCreate";
import CostSheetCreate from "./pages/CostSheet/CostSheetCreate";
import CostSheetList from "./pages/CostSheet/CostSheetList";
import QuotationPreview from "./pages/CostSheet/QuotationPreview";
import DocumentBrowser from "./pages/Documents/DocumentBrowser";
import OnsiteRegistration from "./pages/OnsiteRegistration";
import BookingApprovals from "./pages/Booking/BookingApprovals";
import LeadOpportunityCreate from "./pages/Sales/LeadOpportunityCreate";
import UpcommingEvent from "../src/pages/UpcomingActivities";
import KycBlack from "./pages/Kycblack/Kycpage";
import { Toaster } from "react-hot-toast";
import ProfilePage from "./pages/Profile";
import CreateUserWithProjectAccess from "./pages/CreateUserWithProjectAccess";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* react-hot-toast Toaster - Position remains "center" for utility toasts */}
        <Toaster position="center" reverseOrder={false} />

        {/* ✅ ToastContainer (react-toastify) - CHANGED POSITION to "top-center" */}
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
        />

        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/booking/kyc-review" element={<KycReview />} />
          <Route path="/onsite-registration" element={<OnsiteRegistration />} />
          {/* Protected Routes with MasterLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MasterLayout />}>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/channel-partners"
                element={<ChannelPartnerList />}
              />


              <Route path="/new/user" element={<CreateUserWithProjectAccess />} />

              {/* Projects */}
              <Route path="/sales/projects" element={<ProjectsList />} />
              {/* 🔹 NEW: Project setup detail with projectId in URL */}
              <Route
                path="/sales/projects/:projectId"
                element={<ProjectSetupDetail />}
              />

              {/* Master Setup */}
              <Route path="/setup" element={<SetupPage />} />
             

              {/* Lead Setup */}
              <Route path="/lead-setup" element={<LeadSetupPage />} />
              <Route path="/leads/:id" element={<LeadStaticPage />} />
              <Route path="/leads/new" element={<SaleAddLead />} />
              <Route path="/leads/new/:leadId" element={<SaleAddLead />} />
              <Route path="/leads" element={<LeadsList />} />
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

              {/* Channel */}
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
              <Route path="/booking/form" element={<BookingForm />} />
              {/* 🔹 NEW: Pending approvals (admin) */}
              <Route path="/booking/approvals" element={<BookingApprovals />} />

              {/* Cost Sheet */}

              <Route path="costsheet" element={<CostSheetList />} />
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
              <Route path="/sales/opportunities" element={<OppurnityList />} />
              <Route
                path="/sales/opportunities/add"
                element={<LeadOpportunityCreate />}
              />

              <Route
                path="/costsheet/templates/:id"
                element={<CostSheetTemplateCreate />}
              />

              {/* SiteVisit */}
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

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
