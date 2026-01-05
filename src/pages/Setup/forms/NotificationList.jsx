import { useState, useEffect } from "react";
import { NotificationAPI } from "../../../api/endpoints";
import axiosInstance from "../../../api/axiosInstance";

export default function NotificationList({ setup, users, isOpen, onSuccess }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Notification slabs (for creating multiple notifications)
  const [notificationSlabs, setNotificationSlabs] = useState([
    {
      userid: "",
      notiftype: "",
      message: "",
      priority: "",
      deliverymethod: "",
      scheduledat: "",
      readstatus: "UNREAD",
      expireson: "",
      status: "ACTIVE",
    },
  ]);

  const addNotificationSlab = () => {
    setNotificationSlabs((s) => [
      ...s,
      {
        userid: "",
        notiftype: "",
        message: "",
        priority: "",
        deliverymethod: "",
        scheduledat: "",
        readstatus: "UNREAD",
        expireson: "",
        status: "ACTIVE",
      },
    ]);
  };

  const delNotificationSlab = (idx) => {
    if (notificationSlabs.length <= 1) return;
    setNotificationSlabs((s) => s.filter((_, i) => i !== idx));
  };

  const updateNotificationSlab = (idx, key, val) => {
    setNotificationSlabs((slabs) =>
      slabs.map((slab, i) => (i === idx ? { ...slab, [key]: val } : slab))
    );
  };

  const loadNotifications = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const data = await NotificationAPI.list();
      const items = Array.isArray(data) ? data : data.results || [];
      setNotifications(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSaveNotifications = async () => {
    try {
      for (const slab of notificationSlabs) {
        if (!slab.userid || !slab.message) continue;

        await NotificationAPI.create({
          userid: Number(slab.userid),
          notiftype: slab.notiftype || "SYSTEM",
          message: slab.message,
          priority: slab.priority || "NORMAL",
          deliverymethod: slab.deliverymethod || "EMAIL",
          scheduledat: slab.scheduledat || null,
          readstatus: slab.readstatus || "UNREAD",
          expireson: slab.expireson || null,
          status: slab.status || "ACTIVE",
        });
      }

      alert("Notifications saved successfully!");
      setNotificationSlabs([
        {
          userid: "",
          notiftype: "",
          message: "",
          priority: "",
          deliverymethod: "",
          scheduledat: "",
          readstatus: "UNREAD",
          expireson: "",
          status: "ACTIVE",
        },
      ]);
      await loadNotifications();
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to save notifications");
    }
  };

  // Safe defaults for dropdowns
  const notificationTypes = [
    { code: "SYSTEM", label: "System" },
    { code: "EMAIL", label: "Email" },
    { code: "SMS", label: "SMS" },
    { code: "PUSH", label: "Push" },
  ];

  const priorities = [
    { code: "HIGH", label: "High" },
    { code: "NORMAL", label: "Normal" },
    { code: "LOW", label: "Low" },
  ];

  const deliveryMethods = [
    { code: "EMAIL", label: "Email" },
    { code: "SMS", label: "SMS" },
    { code: "PUSH", label: "Push" },
    { code: "IN_APP", label: "In-App" },
  ];

  if (loading) {
    return (
      <div className="project-form-container">
        <div className="form-header">
          <h3>Notification / Alerts</h3>
        </div>
        <div className="notification-loading">Loading notifications...</div>
      </div>
    );
  }

  const userNotifications = notifications.filter(
  n => n.notiftype !== "SYSTEM"
);


  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Notification / Alerts</h3>
      </div>

      <div className="notification-content">
        {/* Existing Notifications Table */}
        {userNotifications.length > 0 && (
          <div className="table-wrapper" style={{ marginBottom: "24px" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Notification ID</th>
                  <th>User ID</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Priority</th>
                  <th>Delivery Method</th>
                  <th>Scheduled</th>
                  <th>Read Status</th>
                  <th>Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {userNotifications.map((n) => (
                  <tr key={n.id}>
                    <td>{n.code || n.id}</td>
                    <td>{n.userid || n.user}</td>
                    <td>{n.notiftype}</td>
                    <td>{n.message}</td>
                    <td>{n.priority}</td>
                    <td>{n.deliverymethod}</td>
                    <td>{n.scheduledat ? new Date(n.scheduledat).toLocaleString("en-IN") : "-"}</td>
                    <td>{n.readstatus || "-"}</td>
                    <td>{n.expireson ? new Date(n.expireson).toLocaleDateString("en-IN") : "-"}</td>
                    <td>
                      <span className={`status-badge status-${n.status?.toLowerCase()}`}>
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Notification Slabs */}
        <div className="notification-slabs">
          {notificationSlabs.map((slab, idx) => (
            <div key={idx} className="notification-slab-row">
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">User</label>
                  <select
                    className="field-input"
                    value={slab.userid}
                    onChange={(e) => updateNotificationSlab(idx, "userid", e.target.value)}
                  >
                    <option value="">Select User</option>
                    {users?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Type</label>
                  <select
                    className="field-input"
                    value={slab.notiftype}
                    onChange={(e) => updateNotificationSlab(idx, "notiftype", e.target.value)}
                  >
                    <option value="">Select</option>
                    {notificationTypes.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Priority</label>
                  <select
                    className="field-input"
                    value={slab.priority}
                    onChange={(e) => updateNotificationSlab(idx, "priority", e.target.value)}
                  >
                    <option value="">Select</option>
                    {priorities.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Delivery Method</label>
                  <select
                    className="field-input"
                    value={slab.deliverymethod}
                    onChange={(e) => updateNotificationSlab(idx, "deliverymethod", e.target.value)}
                  >
                    <option value="">Select</option>
                    {deliveryMethods.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Scheduled</label>
                  <input
                    className="field-input"
                    type="datetime-local"
                    value={slab.scheduledat}
                    onChange={(e) => updateNotificationSlab(idx, "scheduledat", e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Expiry</label>
                  <input
                    className="field-input"
                    type="date"
                    value={slab.expireson}
                    onChange={(e) => updateNotificationSlab(idx, "expireson", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Read Status</label>
                  <select
                    className="field-input"
                    value={slab.readstatus}
                    onChange={(e) => updateNotificationSlab(idx, "readstatus", e.target.value)}
                  >
                    <option value="UNREAD">Unread</option>
                    <option value="READ">Read</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Status</label>
                  <select
                    className="field-input"
                    value={slab.status}
                    onChange={(e) => updateNotificationSlab(idx, "status", e.target.value)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {notificationSlabs.length > 1 && (
                  <div className="form-field" style={{ display: "flex", alignItems: "flex-end" }}>
                    <button
                      type="button"
                      className="btn-danger-small"
                      onClick={() => delNotificationSlab(idx)}
                      style={{ width: "100%" }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="form-field-full">
                <label className="field-label">Message</label>
                <textarea
                  className="field-textarea"
                  rows={2}
                  value={slab.message}
                  onChange={(e) => updateNotificationSlab(idx, "message", e.target.value)}
                  placeholder="Enter notification message"
                />
              </div>

              {idx < notificationSlabs.length - 1 && <hr style={{ margin: "20px 0", border: "1px solid #e5e7eb" }} />}
            </div>
          ))}
        </div>

        {/* Add Notification Slabs Button */}
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <button type="button" className="btn-link" onClick={addNotificationSlab}>
            Add notification Slabs
          </button>
        </div>

        {/* Action Buttons */}
        <div className="form-actions-split">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => {
              setNotificationSlabs([
                {
                  userid: "",
                  notiftype: "",
                  message: "",
                  priority: "",
                  deliverymethod: "",
                  scheduledat: "",
                  readstatus: "UNREAD",
                  expireson: "",
                  status: "ACTIVE",
                },
              ]);
            }}
          >
            CANCEL
          </button>
          <button type="button" className="btn-secondary" onClick={() => setNotificationSlabs([...notificationSlabs])}>
            RESET
          </button>
          <button type="button" className="btn-add-project" onClick={handleSaveNotifications}>
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
