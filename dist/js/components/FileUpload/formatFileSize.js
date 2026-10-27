// src/components/FileUpload/formatFileSize.ts
function formatFileSize(bytes) {
  if (!(bytes >= 0)) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return (i === 0 ? String(n) : n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10)) + " " + units[i];
}
export {
  formatFileSize
};
//# sourceMappingURL=formatFileSize.js.map
