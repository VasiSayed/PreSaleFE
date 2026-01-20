import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import CommsCrudPage from "../components/CommsCrudPage";
import { EP, safeList, toTitleCase, fmtDT } from "../components/commsUtils";

export default function CommsEventsPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [etLoading, setEtLoading] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState("");

  const loadEventTypes = async (pid) => {
    if (!pid) {
      setEventTypes([]);
      return;
    }
    setEtLoading(true);
    try {
      const res = await axiosInstance.get(EP.eventTypes, {
        params: { project_id: pid, page_size: 200, ordering: "order" },
      });
      setEventTypes(safeList(res.data));
    } catch {
      setEventTypes([]);
    } finally {
      setEtLoading(false);
    }
  };

  // if project changes (form), reload types
  useEffect(() => {
    if (!currentProjectId) return;
    loadEventTypes(currentProjectId);
  }, [currentProjectId]);

  const eventTypeOptions = useMemo(() => {
    const base = [
      { value: "", label: etLoading ? "Loading..." : "Select type" },
    ];
    const items = eventTypes.map((t) => ({
      value: t.id,
      label: toTitleCase(t.name),
    }));
    return [...base, ...items];
  }, [eventTypes, etLoading]);

  return (
    <CommsCrudPage
      pageTitle="Events"
      endpoint={EP.events}
      orderingOptions={[
        { value: "-start_at", label: "Start DESC" },
        { value: "start_at", label: "Start ASC" },
        { value: "-created_at", label: "Created DESC" },
      ]}
      columns={[
        {
          key: "title",
          label: "Title",
          render: (r) => toTitleCase(r?.title || "-"),
          className: "dn-wrap",
        },
        {
          key: "event_type",
          label: "Type",
          render: (r) =>
            r?.event_type_name || r?.event_type_label || r?.event_type || "-",
        },
        { key: "start_at", label: "Start", render: (r) => fmtDT(r?.start_at) },
        { key: "end_at", label: "End", render: (r) => fmtDT(r?.end_at) },
        {
          key: "location_text",
          label: "Location",
          render: (r) => r?.location_text || "-",
          className: "dn-wrap",
        },
        {
          key: "requires_rsvp",
          label: "RSVP?",
          render: (r) => (r?.requires_rsvp ? "Yes" : "No"),
        },
      ]}
      withAudience={true}
      onFormOpen={({ projectId }) => {
        setCurrentProjectId(projectId || "");
        loadEventTypes(projectId || "");
      }}
      onFormProjectChange={({ projectId }) => {
        setCurrentProjectId(projectId || "");
      }}
      formFields={[
        {
          name: "event_type",
          label: "Event Type",
          type: "select",
          options: eventTypeOptions,
        },
        { name: "title", label: "Title", span3: true },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          rows: 5,
          span3: true,
        },
        { name: "start_at", label: "Start At", type: "datetime-local" },
        { name: "end_at", label: "End At", type: "datetime-local" },
        { name: "location_text", label: "Location", span3: true },
        { name: "requires_rsvp", label: "Requires RSVP", type: "checkbox" },
        {
          name: "requires_checkin",
          label: "Requires Check-in",
          type: "checkbox",
        },
      ]}
      buildCreatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        event_type: Number(form.event_type),
        title: form.title || "",
        description: form.description || "",
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        location_text: form.location_text || "",
        requires_rsvp: !!form.requires_rsvp,
        requires_checkin: !!form.requires_checkin,
        audience: audPayload || { all: true },
      })}
      buildUpdatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        event_type: form.event_type ? Number(form.event_type) : undefined,
        title: form.title,
        description: form.description,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        location_text: form.location_text,
        requires_rsvp: !!form.requires_rsvp,
        requires_checkin: !!form.requires_checkin,
        ...(audPayload ? { audience: audPayload } : {}),
      })}
    />
  );
}
