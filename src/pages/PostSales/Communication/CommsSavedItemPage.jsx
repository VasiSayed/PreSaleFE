import React from "react";
import StaticCommsPage from "../../../components/StaticCommsPage";

export default function CommsSavedItemPage() {
  const columns = [
    { key: "title", label: "Title", className: "dn-wrap" },
    { key: "type", label: "Type" },
    { key: "saved_at", label: "Saved On" },
    { key: "category", label: "Category" },
  ];

  const rows = [
    {
      title: "Water Supply Shutdown",
      type: "Notice",
      saved_at: "Jan 15, 2026 10:30",
      category: "Maintenance",
    },
    {
      title: "Society Meeting",
      type: "Event",
      saved_at: "Jan 20, 2026 18:00",
      category: "Community",
    },
    {
      title: "Should we add an EV charging station?",
      type: "Poll",
      saved_at: "Jan 10, 2026 14:00",
      category: "Facilities",
    },
    {
      title: "Annual Facilities Feedback",
      type: "Survey",
      saved_at: "Jan 05, 2026 09:00",
      category: "Feedback",
    },
    {
      title: "Basement Painting Schedule",
      type: "Forum Post",
      saved_at: "Jan 12, 2026 09:20",
      category: "Construction",
    },
  ];

  return (
    <StaticCommsPage title="Saved Items" columns={columns} rows={rows} />
  );
}

