// src/components/Meter/labels.ts
var EN = { low: "low", medium: "medium", high: "high" };
var ID = { low: "rendah", medium: "sedang", high: "tinggi" };
var en = {
  meterZone: (value, zone) => value + ", " + EN[zone]
};
var id = {
  meterZone: (value, zone) => value + ", " + ID[zone]
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
