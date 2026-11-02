// src/material/parts.ts
var FIRST = ["10k", "add_call", "app_settings_alt", "avg_pace", "book_4", "call_log", "clock_arrow_up", "create_new_folder", "developer_board_off", "draw_collage", "event_list", "filter_list", "format_indent_decrease", "grade", "high_quality", "interests", "leaderboard", "lyrics", "money", "nest_tag", "open_run", "pets", "print_error", "repeat_one", "school", "settings_remote", "sms_failed", "stat_0", "tab_new_right", "title", "unpaved_road", "watch_vibration"];
var PARTS = [
  () => import("./part/00.js"),
  () => import("./part/01.js"),
  () => import("./part/02.js"),
  () => import("./part/03.js"),
  () => import("./part/04.js"),
  () => import("./part/05.js"),
  () => import("./part/06.js"),
  () => import("./part/07.js"),
  () => import("./part/08.js"),
  () => import("./part/09.js"),
  () => import("./part/10.js"),
  () => import("./part/11.js"),
  () => import("./part/12.js"),
  () => import("./part/13.js"),
  () => import("./part/14.js"),
  () => import("./part/15.js"),
  () => import("./part/16.js"),
  () => import("./part/17.js"),
  () => import("./part/18.js"),
  () => import("./part/19.js"),
  () => import("./part/20.js"),
  () => import("./part/21.js"),
  () => import("./part/22.js"),
  () => import("./part/23.js"),
  () => import("./part/24.js"),
  () => import("./part/25.js"),
  () => import("./part/26.js"),
  () => import("./part/27.js"),
  () => import("./part/28.js"),
  () => import("./part/29.js"),
  () => import("./part/30.js"),
  () => import("./part/31.js")
];
function partOf(name) {
  let i = 0;
  while (i + 1 < FIRST.length && FIRST[i + 1] <= name) i++;
  return i;
}
function loadPart(name) {
  return PARTS[partOf(name)]();
}
export {
  loadPart,
  partOf
};
//# sourceMappingURL=parts.js.map
