// utils/toast.js
import { toast } from "react-hot-toast";

export function showToast(message, type = "success") {
  if (type === "error") {
    toast.error(message);
  } else if (type === "success") {
    toast.success(message);
  } else {
    toast(message);
  }
}
