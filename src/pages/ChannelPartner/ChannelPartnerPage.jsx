import { useSearchParams } from "react-router-dom";
import ChannelPartnerList from "./ChannelPartnerList";
import ChannelPartnerSetup from "./ChannelPartnerSetup";

export default function ChannelPartnerPage() {
  const [searchParams] = useSearchParams();
  const openForm = searchParams.get("open"); // e.g., ?open=identity

  // If there's an "open" query param, show forms
  // Otherwise, show the table/list view
  return openForm ? <ChannelPartnerSetup /> : <ChannelPartnerList />;
}