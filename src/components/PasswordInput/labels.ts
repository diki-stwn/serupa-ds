// PasswordInput's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface PasswordInputLabels {
  /** PasswordInput show/hide button. */
  showPassword: string;
  /** PasswordInput: shown in the field and read out while Caps Lock is on. */
  capsLockOn: string;
}
export const en: PasswordInputLabels = {
  showPassword: "Show password",
  capsLockOn: "Caps Lock is on",
};
export const id: PasswordInputLabels = {
  showPassword: "Tampilkan kata sandi",
  capsLockOn: "Caps Lock aktif",
};
