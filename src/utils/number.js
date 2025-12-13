// src/utils/number.js

// Comma separated Indian number format (lakhs / crores)
// 1234567.89 -> "12,34,567.89"
export const formatINR = (value, decimals = 0) => {
  if (value === null || value === undefined || value === "") return "";

  const numeric =
    typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);

  if (Number.isNaN(numeric)) return "";

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numeric);
};
