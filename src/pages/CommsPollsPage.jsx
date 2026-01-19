import React from "react";
import CommsCrudPage from "../components/CommsCrudPage";
import { EP, fmtDT } from "../components/commsUtils";

export default function CommsPollsPage() {
  return (
    <CommsCrudPage
      pageTitle="Polls"
      endpoint={EP.polls}
      orderingOptions={[
        { value: "-created_at", label: "Created DESC" },
        { value: "created_at", label: "Created ASC" },
      ]}
      columns={[
        {
          key: "question",
          label: "Question",
          render: (r) => r?.question || "-",
          className: "dn-wrap",
        },
        {
          key: "allow_multi_select",
          label: "Multi?",
          render: (r) => (r?.allow_multi_select ? "Yes" : "No"),
        },
        {
          key: "created_at",
          label: "Created",
          render: (r) => fmtDT(r?.created_at),
        },
        {
          key: "total_votes",
          label: "Votes",
          render: (r) => r?.total_votes ?? "-",
        },
      ]}
      withAudience={true}
      formFields={[
        { name: "question", label: "Question", span3: true },
        {
          name: "allow_multi_select",
          label: "Allow Multi Select",
          type: "checkbox",
        },
        {
          name: "options_text",
          label: "Options (one per line) (optional)",
          type: "textarea",
          rows: 6,
          span3: true,
        },
      ]}
      buildCreatePayload={({ form, formProjectId, audPayload }) => {
        const options = String(form.options_text || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        // If backend supports options in same payload, keep this.
        // If backend doesn't, it will ignore OR error. Then we remove it.
        const payload = {
          project: Number(formProjectId),
          question: form.question || "",
          allow_multi_select: !!form.allow_multi_select,
          audience: audPayload || { all: true },
        };
        if (options.length) payload.options = options;
        return payload;
      }}
      buildUpdatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        question: form.question,
        allow_multi_select: !!form.allow_multi_select,
        ...(audPayload ? { audience: audPayload } : {}),
      })}
    />
  );
}
