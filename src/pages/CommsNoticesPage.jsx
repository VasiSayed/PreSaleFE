import React from "react";
import CommsCrudPage from "../components/CommsCrudPage";
import { EP, toTitleCase, fmtDT } from "../components/commsUtils";

export default function CommsNoticesPage() {
  return (
    <CommsCrudPage
      pageTitle="Notices"
      endpoint={EP.notices}
      orderingOptions={[
        { value: "-created_at", label: "Created DESC" },
        { value: "created_at", label: "Created ASC" },
        { value: "-priority", label: "Priority DESC" },
      ]}
      columns={[
        {
          key: "title",
          label: "Title",
          render: (r) => toTitleCase(r?.title || "-"),
          className: "dn-wrap",
        },
        { key: "priority", label: "Priority" },
        {
          key: "requires_ack",
          label: "Ack?",
          render: (r) => (r?.requires_ack ? "Yes" : "No"),
        },
        {
          key: "created_at",
          label: "Created",
          render: (r) => fmtDT(r?.created_at),
        },
        {
          key: "targets",
          label: "Targets",
          render: (r) => (Array.isArray(r?.targets) ? r.targets.length : "-"),
        },
      ]}
      withAudience={true}
      formFields={[
        { name: "title", label: "Title", span3: true },
        { name: "body", label: "Body", type: "textarea", rows: 6, span3: true },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: [
            { value: "LOW", label: "LOW" },
            { value: "MEDIUM", label: "MEDIUM" },
            { value: "HIGH", label: "HIGH" },
          ],
        },
        { name: "requires_ack", label: "Requires Ack", type: "checkbox" },
      ]}
      buildCreatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        title: form.title || "",
        body: form.body || "",
        priority: form.priority || "MEDIUM",
        requires_ack: !!form.requires_ack,
        audience: audPayload || { all: true },
      })}
      buildUpdatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        title: form.title,
        body: form.body,
        priority: form.priority,
        requires_ack: !!form.requires_ack,
        ...(audPayload ? { audience: audPayload } : {}),
      })}
    />
  );
}
