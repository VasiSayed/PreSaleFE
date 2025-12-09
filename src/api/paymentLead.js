// src/api/paymentLead.js
import axiosInstance from "./axiosInstance"; // path adjust if needed

export async function createPaymentLead(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      // File object bhi allowed haib
      !(Array.isArray(value) && value.length === 0)
    ) {
      formData.append(key, value);
    }
  });

  const res = await axiosInstance.post("/sales/payment-leads/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}


export async function createKycPayment(bookingId, kycRequestId, payload) {
  const formData = new FormData();

  const finalPayload = {
    ...payload,
    kyc_request_id: kycRequestId,
  };

  Object.entries(finalPayload).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    formData.append(key, value);
  });

  const url = `/book/bookings/${bookingId}/kyc-payment/`;
  console.log("[API] createKycPayment ->", url, "payload:", finalPayload);

  const res = await axiosInstance.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}