// // export default MyBookings;

// import React, { useEffect, useState, useMemo, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import axiosInstance from "../../api/axiosInstance";
// import SearchBar from "../../common/SearchBar";
// import PaymentLeadCreateModal from "../../components/Payments/PaymentLeadCreateModal";
// import "./MyBookings.css";
// import "../PreSalesCRM/Leads/LeadsList.css";
// import toast from "react-hot-toast";
// import RegistrationTimelineModal from "../../components/Registration/RegistrationTimelineModal";
// import { RegistrationAPI, BookingAPI } from "../../api/endpoints";


// // Helper: Convert text to title case (first letter of every word capitalized)
// function toTitleCase(text) {
//   if (!text || typeof text !== "string") return text;
//   // Split by spaces and capitalize first letter of each word
//   return text
//     .trim()
//     .split(/\s+/)
//     .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//     .join(" ");
// }

// function debounce(fn, delay) {
//   let timeoutId;
//   return (...args) => {
//     if (timeoutId) clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => fn(...args), delay);
//   };
// }

// const MyBookings = () => {
//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");

//   // 🔹 upload related
//   const fileInputRef = useRef(null);
//   const [uploadBookingId, setUploadBookingId] = useState(null);
//   const [uploadingId, setUploadingId] = useState(null);


//   const [regOpen, setRegOpen] = useState(false);
//   const [regBooking, setRegBooking] = useState(null);
//   const [regTimeline, setRegTimeline] = useState(null);
//   const [regLoading, setRegLoading] = useState(false);


//   // 🔹 payment related
//   const [paymentModalOpen, setPaymentModalOpen] = useState(false);
//   const [selectedBookingLeadId, setSelectedBookingLeadId] = useState(null);
//   const [selectedBookingId, setSelectedBookingId] = useState(null);

//   const navigate = useNavigate();

//   useEffect(() => {
//     setLoading(true);
//     setError("");

//     axiosInstance
//       .get("/book/bookings/my-bookings/")
//       .then((res) => {
//         // in case backend is paginated: { results: [...] }
//         const data = Array.isArray(res.data)
//           ? res.data
//           : res.data.results || [];
//         setBookings(data || []);
//       })
//       .catch((err) => {
//         console.error("Failed to load bookings", err);
//         setError("Failed to load bookings. Please try again.");
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const handleAddClick = () => {
//     navigate("/booking/form");
//   };

//   const debouncedSearch = useMemo(
//     () =>
//       debounce((val) => {
//         // Search is handled by filtered useMemo, no API call needed
//       }, 300),
//     []
//   );

//   const handleSearchChange = (value) => {
//     setSearch(value);
//     debouncedSearch(value);
//   };

//   const fetchRegTimeline = async (bookingObj) => {
//     try {
//       setRegLoading(true);
//       const data = await RegistrationAPI.timelineByBooking(bookingObj.id);
//       setRegTimeline(data);
//     } catch (err) {
//       console.error("Failed to load registration timeline", err);
//       toast.error("Failed to load registration timeline");
//       setRegTimeline(null);
//     } finally {
//       setRegLoading(false);
//     }
//   };

//   const openRegModal = (bookingObj) => {
//     setRegBooking(bookingObj);
//     setRegOpen(true);
//     fetchRegTimeline(bookingObj);
//   };

//   const closeRegModal = () => {
//     setRegOpen(false);
//     setRegBooking(null);
//     setRegTimeline(null);
//   };


//   const handleShiftBooking = async (bookingObj) => {
//     if (bookingObj.is_shifted) {
//       toast("Already shifted");
//       return;
//     }
//     const ok = window.confirm("Mark this booking as SHIFTED?");
//     if (!ok) return;

//     try {
//       await BookingAPI.markShifted(bookingObj.id, {
//         note: "Shifted from MyBookings list",
//       });
//       toast.success("Booking shifted");

//       // update row locally
//       setBookings((prev) =>
//         prev.map((x) =>
//           x.id === bookingObj.id ? { ...x, is_shifted: true } : x
//         )
//       );
//     } catch (err) {
//       const msg = err?.response?.data?.detail || "Failed to mark shifted";
//       toast.error(msg);
//     }
//   };


//   const formatAmount = (value) => {
//     if (value === null || value === undefined) return "";
//     const num = Number(value);
//     if (Number.isNaN(num)) return value;
//     return num.toLocaleString("en-IN");
//   };

//   const getStatusLabel = (status) => {
//     if (!status) return "-";
//     return status
//       .toString()
//       .replace(/_/g, " ")
//       .toLowerCase()
//       .replace(/\b\w/g, (c) => c.toUpperCase());
//   };

//   const getStatusColor = (status) => {
//     if (!status) return {};
//     const statusLower = status.toString().toLowerCase().replace(/_/g, "");

//     if (statusLower === "booked" || statusLower === "confirmed") {
//       return {
//         backgroundColor: "#dcfce7", // green-100
//         color: "#166534", // green-800
//       };
//     } else if (statusLower === "draft") {
//       return {
//         backgroundColor: "#fef3c7", // yellow-100
//         color: "#92400e", // yellow-800
//       };
//     } else if (
//       statusLower === "cancelled" ||
//       statusLower === "canceled" ||
//       statusLower === "rejected"
//     ) {
//       return {
//         backgroundColor: "#fee2e2", // red-100
//         color: "#991b1b", // red-800
//       };
//     }

//     // Default styling
//     return {
//       backgroundColor: "#f3f4f6", // gray-100
//       color: "#374151", // gray-700
//     };
//   };

//   const filtered = useMemo(() => {
//     const term = search.trim().toLowerCase();
//     if (!term) return bookings;

//     return bookings.filter((b) => {
//       const text = [
//         b.booking_code,
//         b.form_ref_no,
//         b.customer_name,
//         b.primary_full_name,
//         b.project_name,
//         b.project,
//         b.unit_no,
//         b.unit,
//         b.tower_name,
//         b.status,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return text.includes(term);
//     });
//   }, [bookings, search]);

//   const rangeLabel =
//     bookings.length === 0
//       ? "0 of 0"
//       : `1-${filtered.length} of ${bookings.length}`;

//   // 🔹 User clicked upload icon for a row
//   const handleUploadClick = (bookingId) => {
//     setUploadBookingId(bookingId);
//     setError("");
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ""; // reset old file
//       fileInputRef.current.click();
//     }
//   };

//   // 🔹 Handle payment click
//   const handlePaymentClick = (booking) => {
//     // Get lead_id from booking (sales_id is the field in booking object)
//     const leadId = booking.sales_id || booking.sales_lead || booking.lead_id || booking.lead || null;
//     if (leadId) {
//       setSelectedBookingLeadId(leadId);
//       setSelectedBookingId(booking.id); // Store booking ID
//       setPaymentModalOpen(true);
//     }
//   };

//   // 🔹 File selected
//   const handleFileChange = async (e) => {
//     const file = e.target.files && e.target.files[0];
//     if (!file || !uploadBookingId) return;

//     setUploadingId(uploadBookingId);

//     const formData = new FormData();
//     formData.append("signed_booking_file", file);

//     try {
//       const res = await axiosInstance.post(
//         `/book/bookings/${uploadBookingId}/upload-signed-form/`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       const updated = res.data;
//       // replace the row locally
//       setBookings((prev) =>
//         prev.map((b) => (b.id === updated.id ? updated : b))
//       );
//     } catch (err) {
//       console.error("Failed to upload signed form", err);
//       setError("Failed to upload signed form. Please try again.");
//     } finally {
//       setUploadingId(null);
//       setUploadBookingId(null);
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }
//     }
//   };

//   return (
//     <div className="my-bookings-page">
//       <div className="my-bookings-container">
//         {/* hidden file input for uploads */}
//         <input
//           type="file"
//           ref={fileInputRef}
//           style={{ display: "none" }}
//           accept="application/pdf,image/*"
//           onChange={handleFileChange}
//         />

//         {/* ---------- Header ---------- */}
//         <div className="list-header">
//           {/* LEFT: Search */}
//           <div className="list-header-left">
//             <SearchBar
//               value={search}
//               onChange={handleSearchChange}
//               placeholder="Search by customer, project, unit, status..."
//               wrapperClassName="search-box"
//             />
//           </div>

//           {/* RIGHT: Buttons */}
//           <div className="list-header-right">
//             <button
//               type="button"
//               className="filter-btn"
//               onClick={handleAddClick}
//             >
//               <i className="fa fa-plus" style={{ marginRight: "6px" }} />
//               New Booking
//             </button>
//           </div>
//         </div>

//         {/* ---------- Body ---------- */}
//         {loading ? (
//           <div className="booking-list-body">
//             <div className="booking-list-message">Loading bookings...</div>
//           </div>
//         ) : error ? (
//           <div className="booking-list-body">
//             <div className="booking-list-message booking-error">{error}</div>
//           </div>
//         ) : (
//           <div className="booking-list-body">
//             <div className="booking-table-wrapper">
//               <table className="booking-table">
//                 <thead>
//                   <tr>
//                     <th style={{ width: 110 }}>Action</th>
//                     <th>Booking ID</th>
//                     <th>Customer Name</th>
//                     <th>Project</th>
//                     <th>Unit</th>
//                     <th>Advance Amount</th>
//                     <th>Signed Form</th>
//                     <th>Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filtered.length === 0 ? (
//                     <tr>
//                       <td colSpan={8} className="booking-empty-row">
//                         No bookings found.
//                       </td>
//                     </tr>
//                   ) : (
//                     filtered.map((b) => {
//                       const bookingId = b.booking_code || b.form_ref_no || b.id;

//                       const unitLabel =
//                         b.unit_no ||
//                         (b.unit && b.unit.unit_no) ||
//                         (b.unit && b.unit.name) ||
//                         b.unit ||
//                         "-";

//                       const isUploading = uploadingId === b.id;

//                       return (
//                         <tr key={b.id}>
//                           <td className="booking-actions-cell">
//                             <button
//                               type="button"
//                               className="booking-icon-btn"
//                               title="Edit booking"
//                               onClick={() =>
//                                 navigate(`/booking/form?booking_id=${b.id}`)
//                               }
//                             >
//                               ✏️
//                             </button>

//                             <button
//                               type="button"
//                               className="booking-icon-btn"
//                               title="View details"
//                               onClick={() => navigate(`/booking/${b.id}`)}
//                             >
//                               👁
//                             </button>

//                             {/* Payment button - only show if booking has a lead */}
//                             {(b.sales_id ||
//                               b.sales_lead ||
//                               b.lead_id ||
//                               b.lead) && (
//                               <button
//                                 type="button"
//                                 className="booking-icon-btn"
//                                 title="Make payment"
//                                 onClick={() => handlePaymentClick(b)}
//                               >
//                                 💳
//                               </button>
//                             )}

//                             <button
//                               type="button"
//                               className="booking-icon-btn"
//                               title="Registration stages & history"
//                               onClick={() => openRegModal(b)}
//                             >
//                               🧭
//                             </button>

//                             <button
//                               type="button"
//                               className="booking-icon-btn"
//                               title={
//                                 b.is_shifted
//                                   ? "Already shifted"
//                                   : "Mark shifted"
//                               }
//                               onClick={() => handleShiftBooking(b)}
//                               disabled={!!b.is_shifted}
//                             >
//                               🚚
//                             </button>
//                           </td>

//                           <td>{bookingId}</td>
//                           <td>
//                             {b.primary_full_name
//                               ? toTitleCase(b.primary_full_name)
//                               : "-"}
//                           </td>
//                           <td>
//                             {b.project_name || b.project
//                               ? toTitleCase(b.project_name || b.project)
//                               : "-"}
//                           </td>
//                           <td>
//                             {unitLabel !== "-" ? toTitleCase(unitLabel) : "-"}
//                           </td>

//                           <td className="booking-amount-cell">
//                             {b.total_advance != null &&
//                             b.total_advance !== "" ? (
//                               <>
//                                 <span className="rupee-symbol">₹</span>{" "}
//                                 {formatAmount(b.total_advance)}
//                               </>
//                             ) : (
//                               "-"
//                             )}
//                           </td>

//                           {/* 🔹 Signed form column */}
//                           <td className="booking-actions-cell">
//                             {/* Upload button */}
//                             <button
//                               type="button"
//                               className="booking-icon-btn"
//                               title={
//                                 isUploading
//                                   ? "Uploading..."
//                                   : "Upload signed booking form"
//                               }
//                               onClick={() => handleUploadClick(b.id)}
//                               disabled={isUploading}
//                             >
//                               {isUploading ? "⏳" : "📤"}
//                             </button>

//                             {/* View/download if already uploaded */}
//                             {b.signed_booking_file_url && (
//                               <a
//                                 href={b.signed_booking_file_url}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 className="booking-icon-btn booking-link-btn"
//                                 title="View signed form"
//                               >
//                                 📄
//                               </a>
//                             )}
//                           </td>

//                           <td>
//                             <span
//                               className="booking-status-pill"
//                               style={getStatusColor(b.status)}
//                             >
//                               {getStatusLabel(b.status)}
//                             </span>
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Pagination Info */}
//         <div className="pagination-info">{rangeLabel}</div>
//       </div>

//       {/* Payment Modal */}
//       {paymentModalOpen && selectedBookingLeadId && (
//         <PaymentLeadCreateModal
//           isOpen={paymentModalOpen}
//           onClose={() => {
//             setPaymentModalOpen(false);
//             setSelectedBookingLeadId(null);
//             setSelectedBookingId(null);
//           }}
//           leadId={parseInt(selectedBookingLeadId, 10)}
//           bookingId={selectedBookingId ? parseInt(selectedBookingId, 10) : null}
//           defaultPaymentType="BOOKING"
//           onCreated={() => {
//             // Payment created successfully
//           }}
//         />
//       )}

//       <RegistrationTimelineModal
//         open={regOpen}
//         onClose={closeRegModal}
//         booking={regBooking}
//         timeline={regTimeline}
//         loading={regLoading}
//         onRefresh={() => regBooking && fetchRegTimeline(regBooking)}
//       />

//     </div>
//   );
// };

// export default MyBookings;


import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import SearchBar from "../../common/SearchBar";
import PaymentLeadCreateModal from "../../components/Payments/PaymentLeadCreateModal";
import RegistrationTimelineModal from "../../components/Registration/RegistrationTimelineModal";
import { RegistrationAPI, BookingAPI } from "../../api/endpoints";

import "./MyBookings.css";
import "../PreSalesCRM/Leads/LeadsList.css";

// Helper: Convert text to title case (first letter of every word capitalized)
function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  // ✅ Hide Columns state
  const DEFAULT_VISIBLE = {
    booking_id: true,
    customer_name: true,
    project: true,
    unit: true,
    advance_amount: true,
    signed_form: true,
    status: true,
  };
  const [colVis, setColVis] = useState(DEFAULT_VISIBLE);
  const [colsModalOpen, setColsModalOpen] = useState(false);
  const [tempColVis, setTempColVis] = useState(DEFAULT_VISIBLE);

  // 🔹 upload related
  const fileInputRef = useRef(null);
  const [uploadBookingId, setUploadBookingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  // 🔹 payment related
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBookingLeadId, setSelectedBookingLeadId] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  // 🔹 registration modal
  const [regOpen, setRegOpen] = useState(false);
  const [regBooking, setRegBooking] = useState(null);
  const [regTimeline, setRegTimeline] = useState(null);
  const [regLoading, setRegLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError("");

    axiosInstance
      .get("/book/bookings/my-bookings/")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setBookings(data || []);
      })
      .catch((err) => {
        console.error("Failed to load bookings", err);
        setError("Failed to load bookings. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddClick = () => {
    navigate("/booking/form");
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        // Search is handled by filtered useMemo, no API call needed
      }, 300),
    []
  );

  const COLS = useMemo(
    () => [
      { id: "booking_id", label: "Booking ID" },
      { id: "customer_name", label: "Customer Name" },
      { id: "project", label: "Project" },
      { id: "unit", label: "Unit" },
      { id: "advance_amount", label: "Advance Amount" },
      { id: "signed_form", label: "Signed Form" },
      { id: "status", label: "Status" },
    ],
    []
  );

  const visibleColCount = useMemo(() => {
    const visible = COLS.filter((c) => colVis[c.id]).length;
    return 1 + visible; // + Actions
  }, [COLS, colVis]);

  const handleSearchChange = (value) => {
    setSearch(value);
    debouncedSearch(value);
  };

  // ---------- Hide columns modal helpers ----------
  const openColsModal = () => {
    setTempColVis(colVis);
    setColsModalOpen(true);
  };

  const applyCols = () => {
    setColVis(tempColVis);
    setColsModalOpen(false);
  };

  const selectAllCols = () => {
    const all = {};
    COLS.forEach((c) => (all[c.id] = true));
    setTempColVis(all);
  };

  const clearAllCols = () => {
    const none = {};
    COLS.forEach((c) => (none[c.id] = false));
    setTempColVis(none);
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined) return "";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString("en-IN");
  };

  const getStatusLabel = (status) => {
    if (!status) return "-";
    return status
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusColor = (status) => {
    if (!status) return {};
    const statusLower = status.toString().toLowerCase().replace(/_/g, "");

    if (statusLower === "booked" || statusLower === "confirmed") {
      return { backgroundColor: "#dcfce7", color: "#166534" };
    } else if (statusLower === "draft") {
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    } else if (
      statusLower === "cancelled" ||
      statusLower === "canceled" ||
      statusLower === "rejected"
    ) {
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    }

    return { backgroundColor: "#f3f4f6", color: "#374151" };
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookings;

    return bookings.filter((b) => {
      const text = [
        b.booking_code,
        b.form_ref_no,
        b.customer_name,
        b.primary_full_name,
        b.project_name,
        b.project,
        b.unit_no,
        b.unit,
        b.tower_name,
        b.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [bookings, search]);

  const rangeLabel =
    bookings.length === 0 ? "0 of 0" : `1-${filtered.length} of ${bookings.length}`;

  // 🔹 User clicked upload icon for a row
  const handleUploadClick = (bookingId) => {
    setUploadBookingId(bookingId);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // 🔹 Handle payment click
  const handlePaymentClick = (booking) => {
    const leadId = booking.sales_id || booking.sales_lead || booking.lead_id || booking.lead || null;
    if (leadId) {
      setSelectedBookingLeadId(leadId);
      setSelectedBookingId(booking.id);
      setPaymentModalOpen(true);
    }
  };

  // 🔹 File selected
  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !uploadBookingId) return;

    setUploadingId(uploadBookingId);

    const formData = new FormData();
    formData.append("signed_booking_file", file);

    try {
      const res = await axiosInstance.post(
        `/book/bookings/${uploadBookingId}/upload-signed-form/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updated = res.data;
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      console.error("Failed to upload signed form", err);
      setError("Failed to upload signed form. Please try again.");
    } finally {
      setUploadingId(null);
      setUploadBookingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ Registration timeline modal handlers
  const fetchRegTimeline = async (bookingObj) => {
    try {
      setRegLoading(true);
      const data = await RegistrationAPI.timelineByBooking(bookingObj.id);
      setRegTimeline(data);
    } catch (err) {
      console.error("Failed to load registration timeline", err);
      toast.error("Failed to load registration timeline");
      setRegTimeline(null);
    } finally {
      setRegLoading(false);
    }
  };

  const openRegModal = (bookingObj) => {
    setRegBooking(bookingObj);
    setRegOpen(true);
    fetchRegTimeline(bookingObj);
  };

  const closeRegModal = () => {
    setRegOpen(false);
    setRegBooking(null);
    setRegTimeline(null);
  };

  // ✅ Shift button only on list (as you asked)
  const handleShiftBooking = async (bookingObj) => {
    if (bookingObj.is_shifted) {
      toast("Already shifted");
      return;
    }

    try {
      const res = await BookingAPI.markShifted(bookingObj.id, {
        note: "Shifted from MyBookings list",
      });

      toast.success("Booking shifted");

      // patch row locally
      setBookings((prev) =>
        prev.map((x) => (x.id === bookingObj.id ? { ...x, is_shifted: true } : x))
      );

      // if modal open for same booking, refresh timeline
      if (regOpen && regBooking?.id === bookingObj.id) {
        fetchRegTimeline(bookingObj);
      }

      return res;
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to mark shifted";
      toast.error(msg);
    }
  };

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-container">
        {/* hidden file input for uploads */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="application/pdf,image/*"
          onChange={handleFileChange}
        />

        {/* ---------- Header ---------- */}
        <div className="list-header">
          {/* LEFT: Search */}
          <div className="list-header-left">
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by customer, project, unit, status..."
              wrapperClassName="search-box"
            />
          </div>

          {/* RIGHT: Buttons */}
          <div className="list-header-right">
            <button
              type="button"
              className="filter-btn"
              onClick={openColsModal}
              title="Show/Hide table columns"
            >
              👁️ Columns
            </button>
            <button type="button" className="filter-btn" onClick={handleAddClick}>
              <i className="fa fa-plus" style={{ marginRight: "6px" }} />
              New Booking
            </button>
          </div>
        </div>

        {/* ---------- Body ---------- */}
        {loading ? (
          <div className="booking-list-body">
            <div className="booking-list-message">Loading bookings...</div>
          </div>
        ) : error ? (
          <div className="booking-list-body">
            <div className="booking-list-message booking-error">{error}</div>
          </div>
        ) : (
          <div className="booking-list-body">
            <div className="booking-table-wrapper">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th style={{ width: 130 }}>Action</th>
                    {colVis.booking_id && <th>Booking ID</th>}
                    {colVis.customer_name && <th>Customer Name</th>}
                    {colVis.project && <th>Project</th>}
                    {colVis.unit && <th>Unit</th>}
                    {colVis.advance_amount && <th>Advance Amount</th>}
                    {colVis.signed_form && <th>Signed Form</th>}
                    {colVis.status && <th>Status</th>}
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColCount} className="booking-empty-row">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => {
                      const bookingId = b.booking_code || b.form_ref_no || b.id;

                      const unitLabel =
                        b.unit_no ||
                        (b.unit && b.unit.unit_no) ||
                        (b.unit && b.unit.name) ||
                        b.unit ||
                        "-";

                      const isUploading = uploadingId === b.id;

                      return (
                        <tr key={b.id}>
                          <td className="booking-actions-cell">
                            <button
                              type="button"
                              className="booking-icon-btn"
                              title="Edit booking"
                              onClick={() => navigate(`/booking/form?booking_id=${b.id}`)}
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="booking-icon-btn"
                              title="View details"
                              onClick={() => navigate(`/booking/${b.id}`)}
                            >
                              👁
                            </button>

                            {/* ✅ Registration stages + history modal */}
                            <button
                              type="button"
                              className="booking-icon-btn"
                              title="Registration stages & history"
                              onClick={() => openRegModal(b)}
                            >
                              🧭
                            </button>

                            {/* ✅ Shift button ONLY on list */}
                            <button
                              type="button"
                              className="booking-icon-btn"
                              title={b.is_shifted ? "Already shifted" : "Mark shifted"}
                              onClick={() => handleShiftBooking(b)}
                              disabled={!!b.is_shifted}
                            >
                              🚚
                            </button>

                            {/* Payment button - only show if booking has a lead */}
                            {(b.sales_id || b.sales_lead || b.lead_id || b.lead) && (
                              <button
                                type="button"
                                className="booking-icon-btn"
                                title="Make payment"
                                onClick={() => handlePaymentClick(b)}
                              >
                                💳
                              </button>
                            )}
                          </td>

                          {colVis.booking_id && <td>{bookingId}</td>}

                          {colVis.customer_name && (
                            <td>
                              {b.primary_full_name ? toTitleCase(b.primary_full_name) : "-"}
                            </td>
                          )}

                          {colVis.project && (
                            <td>
                              {b.project_name || b.project
                                ? toTitleCase(b.project_name || b.project)
                                : "-"}
                            </td>
                          )}

                          {colVis.unit && (
                            <td>{unitLabel !== "-" ? toTitleCase(unitLabel) : "-"}</td>
                          )}

                          {colVis.advance_amount && (
                            <td className="booking-amount-cell">
                              {b.total_advance != null && b.total_advance !== "" ? (
                                <>
                                  <span className="rupee-symbol">₹</span>{" "}
                                  {formatAmount(b.total_advance)}
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                          )}

                          {/* Signed form column */}
                          {colVis.signed_form && (
                            <td className="booking-actions-cell">
                              <button
                                type="button"
                                className="booking-icon-btn"
                                title={
                                  isUploading ? "Uploading..." : "Upload signed booking form"
                                }
                                onClick={() => handleUploadClick(b.id)}
                                disabled={isUploading}
                              >
                                {isUploading ? "⏳" : "📤"}
                              </button>

                              {b.signed_booking_file_url && (
                                <a
                                  href={b.signed_booking_file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="booking-icon-btn booking-link-btn"
                                  title="View signed form"
                                >
                                  📄
                                </a>
                              )}
                            </td>
                          )}

                          {colVis.status && (
                            <td>
                              <span
                                className="booking-status-pill"
                                style={getStatusColor(b.status)}
                              >
                                {getStatusLabel(b.status)}
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Info */}
        <div className="pagination-info">{rangeLabel}</div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && selectedBookingLeadId && (
        <PaymentLeadCreateModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedBookingLeadId(null);
            setSelectedBookingId(null);
          }}
          leadId={parseInt(selectedBookingLeadId, 10)}
          bookingId={selectedBookingId ? parseInt(selectedBookingId, 10) : null}
          defaultPaymentType="BOOKING"
          onCreated={() => {}}
        />
      )}

      {/* ✅ Registration Timeline Modal */}
      <RegistrationTimelineModal
        open={regOpen}
        onClose={closeRegModal}
        booking={regBooking}
        timeline={regTimeline}
        loading={regLoading}
        onRefresh={() => regBooking && fetchRegTimeline(regBooking)}
      />

      {/* ✅ Columns Modal */}
      {colsModalOpen && (
        <div className="filter-modal-overlay">
          <div className="filter-modal">
            <div className="filter-modal-header">
              <h3>👁️ Columns</h3>
              <button
                className="filter-close"
                onClick={() => setColsModalOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="filter-body">
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={selectAllCols}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={clearAllCols}
                >
                  Clear All
                </button>
              </div>

              <div className="cols-grid">
                {COLS.map((c) => (
                  <label key={c.id} className="col-check">
                    <input
                      type="checkbox"
                      checked={!!tempColVis[c.id]}
                      onChange={(e) =>
                        setTempColVis((prev) => ({
                          ...prev,
                          [c.id]: e.target.checked,
                        }))
                      }
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setColsModalOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={applyCols}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;


