import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import CommsCrudPage from "../components/CommsCrudPage";
import { EP, safeList, toTitleCase, fmtDT } from "../components/commsUtils";

export default function CommsForumsPage() {
  const [tab, setTab] = useState("categories"); // categories | posts

  // categories list for dropdown in posts
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  // list filter for posts
  const [filterCategoryId, setFilterCategoryId] = useState("");

  const loadCategories = async (projectId) => {
    if (!projectId) {
      setCategories([]);
      return;
    }
    setCatLoading(true);
    try {
      const res = await axiosInstance.get(EP.forumCategories, {
        params: { project_id: projectId, page_size: 200, ordering: "order" },
      });
      setCategories(safeList(res.data));
    } catch {
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

  const categoryOptions = useMemo(() => {
    const base = [
      { value: "", label: catLoading ? "Loading..." : "Select category" },
    ];
    const items = categories.map((c) => ({
      value: c.id,
      label: `${toTitleCase(c.name)} (${c.slug || "-"})`,
    }));
    return [...base, ...items];
  }, [categories, catLoading]);

  return (
    <div>
      {/* local tab switch */}
      <div className="dn-filters pr-outside-bar" style={{ marginBottom: 10 }}>
        <div className="dn-filters-grid pr-outside-grid">
          <div className="dn-field">
            <label>Forums Section</label>
            <select
              className="dn-select"
              value={tab}
              onChange={(e) => setTab(e.target.value)}
            >
              <option value="categories">Categories</option>
              <option value="posts">Posts</option>
            </select>
          </div>
        </div>
      </div>

      {tab === "categories" ? (
        <CommsCrudPage
          pageTitle="Forum Categories"
          endpoint={EP.forumCategories}
          orderingOptions={[
            { value: "order", label: "Order ASC" },
            { value: "-order", label: "Order DESC" },
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
          withAudience={false}
          formFields={[
            { name: "name", label: "Name" },
            {
              name: "slug",
              label: "Slug",
              placeholder: "construction-updates",
            },
            { name: "order", label: "Order", type: "number" },
          ]}
          buildCreatePayload={({ form, formProjectId }) => ({
            project: Number(formProjectId),
            name: form.name || "",
            slug: form.slug || "",
            order:
              form.order === "" || form.order == null ? 1 : Number(form.order),
          })}
          buildUpdatePayload={({ form, formProjectId }) => ({
            project: Number(formProjectId),
            name: form.name,
            slug: form.slug,
            order:
              form.order === "" || form.order == null
                ? null
                : Number(form.order),
          })}
        />
      ) : (
        <CommsCrudPage
          pageTitle="Forum Posts"
          endpoint={EP.forumPosts}
          orderingOptions={[
            { value: "-created_at", label: "Created DESC" },
            { value: "created_at", label: "Created ASC" },
          ]}
          getExtraListParams={() =>
            filterCategoryId ? { category_id: filterCategoryId } : {}
          }
          renderTopBarExtra={() => (
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}
            >
              <label style={{ fontWeight: 700 }}>Category filter (Posts)</label>
              <select
                className="dn-select"
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {toTitleCase(c.name)}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                (Optional) Category choose karke Apply karo.
              </div>
            </div>
          )}
          columns={[
            {
              key: "title",
              label: "Title",
              render: (r) => toTitleCase(r?.title || "-"),
              className: "dn-wrap",
            },
            {
              key: "category",
              label: "Category",
              render: (r) =>
                r?.category_name || r?.category_label || r?.category || "-",
            },
            {
              key: "created_at",
              label: "Created",
              render: (r) => fmtDT(r?.created_at),
            },
            {
              key: "targets",
              label: "Targets",
              render: (r) =>
                Array.isArray(r?.targets) ? r.targets.length : "-",
            },
          ]}
          withAudience={true}
          onFormOpen={({ projectId }) => loadCategories(projectId)}
          onFormProjectChange={({ projectId }) => loadCategories(projectId)}
          formFields={[
            {
              name: "category",
              label: "Category",
              type: "select",
              options: categoryOptions,
              span3: true,
            },
            { name: "title", label: "Title", span3: true },
            {
              name: "content",
              label: "Content",
              type: "textarea",
              rows: 6,
              span3: true,
            },
          ]}
          buildCreatePayload={({ form, formProjectId, audPayload }) => ({
            project: Number(formProjectId),
            category: Number(form.category),
            title: form.title || "",
            content: form.content || "",
            audience: audPayload || { all: true },
          })}
          buildUpdatePayload={({ form, formProjectId, audPayload }) => ({
            project: Number(formProjectId),
            category: form.category ? Number(form.category) : undefined,
            title: form.title,
            content: form.content,
            ...(audPayload ? { audience: audPayload } : {}),
          })}
        />
      )}
    </div>
  );
}
