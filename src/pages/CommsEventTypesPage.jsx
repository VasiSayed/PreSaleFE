import React from "react";
import CommsCrudPage from "../components/CommsCrudPage";
import { EP, toTitleCase, fmtDT } from "../components/commsUtils";

export default function CommsEventTypesPage() {
  return (
    <CommsCrudPage
      pageTitle="Event Types"
      endpoint={EP.eventTypes}
      orderingOptions={[
        { value: "order", label: "Order ASC" },
        { value: "-order", label: "Order DESC" },
        { value: "name", label: "Name ASC" },
        { value: "-created_at", label: "Created DESC" },
      ]}
      columns={[
        {
          key: "name",
          label: "Name",
          render: (r) => toTitleCase(r?.name || "-"),
        },
        { key: "slug", label: "Slug", className: "dn-mono" },
        { key: "order", label: "Order" },
        {
          key: "created_at",
          label: "Created",
          render: (r) => fmtDT(r?.created_at),
        },
      ]}
      formFields={[
        { name: "name", label: "Name" },
        { name: "slug", label: "Slug", placeholder: "society-meeting" },
        { name: "order", label: "Order", type: "number" },
      ]}
      withAudience={false}
      buildCreatePayload={({ form, formProjectId }) => ({
        project: Number(formProjectId),
        name: form.name || "",
        slug: form.slug || "",
        order: form.order === "" || form.order == null ? 1 : Number(form.order),
      })}
      buildUpdatePayload={({ form, formProjectId }) => ({
        project: Number(formProjectId),
        name: form.name,
        slug: form.slug,
        order:
          form.order === "" || form.order == null ? null : Number(form.order),
      })}
    />
  );
}
