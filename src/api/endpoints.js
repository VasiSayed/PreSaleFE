//endpoint.js
import api, { BASE_URL } from "./axiosInstance";
// Keep URLs centralized
import axiosInstance from "./axiosInstance";
const CLIENT_BOOKINGS_PREFIX = "book/bookings";
export const URLS = {
  // auth
  login: "accounts/login/",
  refresh: "accounts/token/refresh/",

  salesExtraInfo: "sales/extra-info/",

  // setup bundle + scope
  setupBundle: "client/setup-bundle/",
  myScope: "client/my-scope/",
  projectTree: "client/projects/tree/",

  // CRUD
  projects: "client/projects/",
  towers: "client/towers/",
  floors: "client/floors/",
  units: "client/units/",
  floorDocs: "client/floor-docs/",
  paymentPlans: "client/payment-plans/",
  paymentSlabs: "client/payment-slabs/",
  milestonePlans: "client/milestone-plans/",
  milestonePlansBulkCreate: "client/milestone-plans/bulk-create/",
  milestoneSlabs: "client/milestone-slabs/",

  // bank
  banks: "client/banks/",
  bankBranches: "client/bank-branches/",
  projectBanks: "client/project-banks/",
  bankAllInOne: "client/bank-setup/create-all/",

  // notifications
  notifications: "client/notifications/",
  notifMarkRead: (id) => `client/notifications/${id}/mark_read/`,

  // Lead Setup APIs
  leadMasters: "leadManagement/v2/leads/masters/",
  leadSetup: "leadManagement/v2/leads/setup/",

  // Lead Classifications & Sources (ViewSets)
  leadClassifications: "leadManagement/classifications/",
  leadSources: "leadManagement/sources/",

  // Sales Leads (NEW)
  salesLeads: "sales/sales-leads/",
  salesLeadBundleCreate: "sales/sales-leads/bundle-create/",

  channelPartnersBySource: "channel/partners/by-source/",
  channelAdminPartners: "channel/admin-project-channel-partners/",
  adminProjectChannelPartners: "channel/admin-project-channel-partners/",

  channelSetupBundle: "channel/setup-bundle/",
  channelPartners: "channel/partners/",
  channelAgentTypes: "channel/agent-types/",
  channelPartnerTiers: "channel/partner-tiers/",
  channelCrmIntegrations: "channel/crm-integrations/",
  channelPartnerDetail: (id) => `channel/partners/${id}/`,
  channelPartnerUpdateSection: (id) => `channel/partners/${id}/update_section/`,

  visitingHalf: "leadManagement/visiting-half/",
  familySize: "leadManagement/family-size/",
  residencyOwnership: "leadManagement/residency-ownership/",
  possessionDesigned: "leadManagement/possession-designed/",
  occupations: "leadManagement/occupations/",
  designations: "leadManagement/designations/",
  leadStages: "leadManagement/stages/",

  leadSetupByProject: "/leadManagement/lead-setup-by-project/",

  leadVisitingHalf: "/leadManagement/visiting-half/",
  leadFamilySize: "/leadManagement/family-size/",
  leadResidencyOwnership: "/leadManagement/residency-ownership/",
  leadPossessionDesigned: "/leadManagement/possession-designed/",
  leadOccupations: "/leadManagement/occupations/",
  leadDesignations: "/leadManagement/designations/",
};

export const AuthAPI = {
  login: (username, password) =>
    api
      .post("/accounts/login/", { username, password })
      .then((res) => res.data),

  // 🔹 New: OTP verify -> returns { refresh, access, user }
  loginWithOtp: (email, otp) =>
    api
      .post("/accounts/login/otp/verify/", { email, otp })
      .then((res) => res.data),

  // (if you want a helper for start, optional)
  startLoginOtp: (email) =>
    api.post("/accounts/login/otp/start/", { email }).then((res) => res.data),
};

export const SetupAPI = {
  getBundle: () => api.get(URLS.setupBundle).then((r) => r.data),

  // role-aware scope
  myScope: (params = {}) =>
    api.get(URLS.myScope, { params }).then((r) => r.data),

  // project tree with ?project_id & ?include_units
  projectTree: (project_id, include_units = false) =>
    api
      .get(URLS.projectTree, { params: { project_id, include_units } })
      .then((r) => r.data),
};

export const ProjectAPI = {
  create: (payload) => api.post(URLS.projects, payload).then((r) => r.data),
  list: (params = {}) => api.get(URLS.projects, { params }).then((r) => r.data),
};

export const TowerAPI = {
  create: (payload) => api.post(URLS.towers, payload).then((r) => r.data),
};

export const FloorAPI = {
  create: (payload) => api.post(URLS.floors, payload).then((r) => r.data),
};

export const UnitAPI = {
  create: (payload) => api.post(URLS.units, payload).then((r) => r.data),
};

export const PaymentAPI = {
  createPlan: (payload) =>
    api.post(URLS.paymentPlans, payload).then((r) => r.data),
  createSlab: (payload) =>
    api.post(URLS.paymentSlabs, payload).then((r) => r.data),
};

export const MilestoneAPI = {
  list: (params = {}) =>
    api.get(URLS.milestonePlans, { params }).then((r) => r.data),
  createPlan: (payload) =>
    api.post(URLS.milestonePlans, payload).then((r) => r.data),
  createSlab: (payload) =>
    api.post(URLS.milestoneSlabs, payload).then((r) => r.data),
  bulkCreate: (payload) =>
    api.post(URLS.milestonePlansBulkCreate, payload).then((r) => r.data),
};

export const BankAPI = {
  createAll: (payload) =>
    api.post(URLS.bankAllInOne, payload).then((r) => r.data),
};

export const NotificationAPI = {
  list: (params = {}) =>
    api.get(URLS.notifications, { params }).then((r) => r.data),
  markRead: (id) => api.post(URLS.notifMarkRead(id)).then((r) => r.data),
};

export const LeadSetupAPI = {
  // GET lead masters
  getMasters: (params = {}) =>
    api.get(URLS.leadMasters, { params }).then((r) => r.data),

  // POST lead setup
  saveSetup: (formData) =>
    api.post(URLS.leadSetup, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  // Classifications CRUD
  getClassifications: (params = {}) =>
    api.get(URLS.leadClassifications, { params }).then((r) => r.data),
  
  createClassification: (payload) =>
    api.post(URLS.leadClassifications, payload).then((r) => r.data),
  
  deleteClassification: (id) =>
    api.delete(`${URLS.leadClassifications}${id}/`).then((r) => r.data),

  // Sources CRUD
  getSources: (params = {}) =>
    api.get(URLS.leadSources, { params }).then((r) => r.data),
  
  createSource: (payload) =>
    api.post(URLS.leadSources, payload).then((r) => r.data),
  
  deleteSource: (id) =>
    api.delete(`${URLS.leadSources}${id}/`).then((r) => r.data),
};

export const ChannelAPI = {
  getSetupBundle: () => api.get(URLS.channelSetupBundle).then((r) => r.data),

  listAdminPartners: (params = {}) =>
    api.get(URLS.channelAdminPartners, { params }).then((r) => r.data),

  listPartners: (params = {}) =>
    api.get(URLS.channelPartners, { params }).then((r) => r.data),

  getPartner: (id) =>
    api.get(URLS.channelPartnerDetail(id)).then((r) => r.data),

  createPartner: (payload) =>
    api.post(URLS.channelPartners, payload).then((r) => r.data),

  updateSection: (id, section, data) =>
    api
      .patch(URLS.channelPartnerUpdateSection(id), { section, data })
      .then((r) => r.data),

  // masters
  listAgentTypes: (params = {}) =>
    api.get(URLS.channelAgentTypes, { params }).then((r) => r.data),

  listPartnerTiers: (params = {}) =>
    api.get(URLS.channelPartnerTiers, { params }).then((r) => r.data),

  listCrmIntegrations: (params = {}) =>
    api.get(URLS.channelCrmIntegrations, { params }).then((r) => r.data),
};

export const ChannelAPII = {
  // already exists
  listAdminProjectPartners: () =>
    api.get("/channel/admin-project-channel-partners/").then(r => r.data),

  // already exists (dashboard)
  getAdminDashboard: () =>
    api.get("/dashboard/admin/").then(r => r.data),
};

export const PaymentLeadAPI = {
  listPending(params = {}) {
    return axiosInstance
      .get("/sales/payment-leads/pending/", { params })
      .then((res) => res.data);
  },

  approve(id, body = {}) {
    return axiosInstance
      .post(`/sales/payment-leads/${id}/approve/`, body)
      .then((res) => res.data);
  },

  reject(id, body = {}) {
    return axiosInstance
      .post(`/sales/payment-leads/${id}/reject/`, body)
      .then((res) => res.data);
  },
};
// NEW: Sales Leads API
export const LeadAPI = {
  list: (params = {}) =>
    api.get(URLS.salesLeads, { params }).then((r) => r.data),

  get: (id) => api.get(`${URLS.salesLeads}${id}/`).then((r) => r.data),

  importExcel(projectId, formData) {
    return api
      .post(`${URLS.salesLeads}import-excel/`, formData, {
        params: {
          project_id: projectId,
          // repair_only: 1, 
        },
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  createBundle: (payload) =>
    api.post(URLS.salesLeadBundleCreate, payload).then((r) => r.data),

  update: (id, payload) =>
    api.put(`${URLS.salesLeads}${id}/`, payload).then((r) => r.data),

  delete: (id) => api.delete(`${URLS.salesLeads}${id}/`).then((r) => r.data),
};

export const BookingAPI = {
  // 🔹 Pending approvals list
  listPending(params = {}) {
    return api
      .get(`${CLIENT_BOOKINGS_PREFIX}/pending-approvals/`, { params })
      .then((res) => res.data);
  },

  // 🔹 Below limit price drafts list
  listBelowLimitPrice(params = {}) {
    return api
      .get(`${CLIENT_BOOKINGS_PREFIX}/drafts-below-limit-price/`, { params })
      .then((res) => res.data);
  },

  // 🔹 Confirm booking
  confirm(id, body = {}) {
    return api
      .post(`${CLIENT_BOOKINGS_PREFIX}/${id}/confirm/`, body)
      .then((res) => res.data);
  },

  // 🔹 Reject booking
  reject(id, body = {}) {
    return api
      .post(`${CLIENT_BOOKINGS_PREFIX}/${id}/reject/`, body)
      .then((res) => res.data);
  },
};


export const AdditionalInfoAPI = {
  // Visiting Half
  getVisitingHalf: (params = {}) =>
    api.get(URLS.visitingHalf, { params }).then((r) => r.data),
  createVisitingHalf: (payload) =>
    api.post(URLS.visitingHalf, payload).then((r) => r.data),
  deleteVisitingHalf: (id) =>
    api.delete(`${URLS.visitingHalf}${id}/`).then((r) => r.data),

  // Family Size
  getFamilySize: (params = {}) =>
    api.get(URLS.familySize, { params }).then((r) => r.data),
  createFamilySize: (payload) =>
    api.post(URLS.familySize, payload).then((r) => r.data),
  deleteFamilySize: (id) =>
    api.delete(`${URLS.familySize}${id}/`).then((r) => r.data),

  // Residency Ownership
  getResidencyOwnership: (params = {}) =>
    api.get(URLS.residencyOwnership, { params }).then((r) => r.data),
  createResidencyOwnership: (payload) =>
    api.post(URLS.residencyOwnership, payload).then((r) => r.data),
  deleteResidencyOwnership: (id) =>
    api.delete(`${URLS.residencyOwnership}${id}/`).then((r) => r.data),

  // Possession Designed
  getPossessionDesigned: (params = {}) =>
    api.get(URLS.possessionDesigned, { params }).then((r) => r.data),
  createPossessionDesigned: (payload) =>
    api.post(URLS.possessionDesigned, payload).then((r) => r.data),
  deletePossessionDesigned: (id) =>
    api.delete(`${URLS.possessionDesigned}${id}/`).then((r) => r.data),

  // Occupations
  getOccupations: (params = {}) =>
    api.get(URLS.occupations, { params }).then((r) => r.data),
  createOccupation: (payload) =>
    api.post(URLS.occupations, payload).then((r) => r.data),
  deleteOccupation: (id) =>
    api.delete(`${URLS.occupations}${id}/`).then((r) => r.data),

  // Designations
  getDesignations: (params = {}) =>
    api.get(URLS.designations, { params }).then((r) => r.data),
  createDesignation: (payload) =>
    api.post(URLS.designations, payload).then((r) => r.data),
  deleteDesignation: (id) =>
    api.delete(`${URLS.designations}${id}/`).then((r) => r.data),

  getBulkExtraInfo(params = {}) {
    // GET /api/sales/extra-info/?project_id=...
    return api.get(URLS.salesExtraInfo, { params }).then((res) => res.data);
  },
};

export const LeadStageAPI = {
  getStages: (params = {}) =>
    api.get(URLS.leadStages, { params }).then((r) => r.data),
  
  createStage: (payload) =>
    api.post(URLS.leadStages, payload).then((r) => r.data),
  
  updateStage: (id, payload) =>
    api.put(`${URLS.leadStages}${id}/`, payload).then((r) => r.data),
  
  deleteStage: (id) =>
    api.delete(`${URLS.leadStages}${id}/`).then((r) => r.data),
};
// Optional: export BASE_URL to build absolute links if needed elsewhere
export { BASE_URL };