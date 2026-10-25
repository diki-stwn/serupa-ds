// src/components/Pagination/paginationRange.ts
function paginationRange(page, count, siblings = 1, boundaries = 1) {
  const r = (a, b) => {
    const o = [];
    for (let i = a; i <= b; i++) o.push(i);
    return o;
  };
  const start = r(1, Math.min(boundaries, count));
  const end = r(Math.max(count - boundaries + 1, boundaries + 1), count);
  const sibStart = Math.max(Math.min(page - siblings, count - boundaries - siblings * 2 - 1), boundaries + 2);
  const sibEnd = Math.min(Math.max(page + siblings, boundaries + siblings * 2 + 2), end.length > 0 ? end[0] - 2 : count - 1);
  const out = start.slice();
  if (sibStart > boundaries + 2) out.push("start-ellipsis");
  else if (boundaries + 1 < count - boundaries) out.push(boundaries + 1);
  out.push(...r(sibStart, sibEnd));
  if (sibEnd < count - boundaries - 1) out.push("end-ellipsis");
  else if (count - boundaries > boundaries) out.push(count - boundaries);
  out.push(...end);
  return out.filter((e, i) => out.indexOf(e) === i);
}
export {
  paginationRange
};
//# sourceMappingURL=paginationRange.js.map
