import React from "react";
import CommsCrudPage from "../components/CommsCrudPage";
import { EP, toTitleCase, fmtDT } from "../components/commsUtils";

export default function CommsSurveysPage() {
  return (
    <CommsCrudPage
      pageTitle="Surveys"
      endpoint={EP.surveys}
      orderingOptions={[
        { value: "-created_at", label: "Created DESC" },
        { value: "created_at", label: "Created ASC" },
      ]}
      columns={[
        {
          key: "title",
          label: "Title",
          render: (r) => toTitleCase(r?.title || "-"),
          className: "dn-wrap",
        },
        {
          key: "is_anonymous",
          label: "Anonymous?",
          render: (r) => (r?.is_anonymous ? "Yes" : "No"),
        },
        {
          key: "created_at",
          label: "Created",
          render: (r) => fmtDT(r?.created_at),
        },
        { key: "status", label: "Status", render: (r) => r?.status || "-" },
      ]}
      withAudience={true}
      formFields={[
        { name: "title", label: "Title", span3: true },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          rows: 5,
          span3: true,
        },
        { name: "is_anonymous", label: "Anonymous", type: "checkbox" },
      ]}
      buildCreatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        title: form.title || "",
        description: form.description || "",
        is_anonymous: !!form.is_anonymous,
        audience: audPayload || { all: true },
      })}
      buildUpdatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        title: form.title,
        description: form.description,
        is_anonymous: !!form.is_anonymous,
        ...(audPayload ? { audience: audPayload } : {}),
      })}
    />
  );
}
