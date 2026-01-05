import { useSearchParams } from "react-router-dom";
import ProjectsList from "./ProjectsList";
import Setup from "./Setup";

export default function SetupPage() {
  const [searchParams] = useSearchParams();
  const openForm = searchParams.get("open"); // e.g., ?open=project

  // If there's an "open" query param, show forms
  // Otherwise, show the table/list view
  return openForm ? <Setup /> : <ProjectsList />;
}