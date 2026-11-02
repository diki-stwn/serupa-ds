// src/components/SortableList/labels.ts
var en = {
  reorder: "Reorder",
  reorderInstructions: "Press Space to pick it up, the arrow keys to move it, Space again to drop it, or Escape to cancel.",
  reorderGrabbed: (item, p, n) => "Picked up " + item + ", position " + p + " of " + n + ".",
  reorderMoved: (item, p, n) => item + ", position " + p + " of " + n + ".",
  reorderDropped: (item, p, n) => "Dropped " + item + " at position " + p + " of " + n + ".",
  reorderCancelled: (item, p, n) => "Cancelled. " + item + " is back at position " + p + " of " + n + "."
};
var id = {
  reorder: "Ubah urutan",
  reorderInstructions: "Tekan Spasi untuk mengangkatnya, tombol panah untuk memindahkannya, Spasi lagi untuk meletakkannya, atau Escape untuk batal.",
  reorderGrabbed: (item, p, n) => item + " diangkat, posisi " + p + " dari " + n + ".",
  reorderMoved: (item, p, n) => item + ", posisi " + p + " dari " + n + ".",
  reorderDropped: (item, p, n) => item + " diletakkan di posisi " + p + " dari " + n + ".",
  reorderCancelled: (item, p, n) => "Batal. " + item + " kembali ke posisi " + p + " dari " + n + "."
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
