// src/pages/LeadSetup/LeadSetupPage.jsx
import { useSearchParams } from "react-router-dom";
import LeadProjectsList from "./LeadProjectsList";
import LeadSetup from "./LeadSetup";

export default function LeadSetupPage() {
  const [searchParams] = useSearchParams();
  const openForm = searchParams.get("open"); // e.g. ?open=classification

  // If we have ?open=..., show forms page
  // Otherwise show project-selector + extra-info overview
  return openForm ? <LeadSetup /> : <LeadProjectsList />;
}
