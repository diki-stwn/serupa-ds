// What each Serupa component renders, for eslint-plugin-jsx-a11y-x's settings (eslint.config.mjs), so its rules
// read <Image> as an img, <Link> as an a and <Checkbox> as an input. Read from the component() calls in
// src/components/: component<HTMLAnchorElement, …>("Link", …) renders an a. A new component is covered with no edit
// here. Components on a plain div or span, or a section of a table, are left out: the plugin learns nothing from them.
import fs from 'node:fs';
import path from 'node:path';

const TAGS = {
  Anchor: 'a', Button: 'button', Data: 'data', Dialog: 'dialog', Image: 'img', Input: 'input', LI: 'li', OList: 'ol',
  Select: 'select', Table: 'table', TableCell: 'td', TableRow: 'tr', TextArea: 'textarea', Time: 'time', UList: 'ul',
};
// Where the element type doesn't say: Button is typed HTMLElement because it renders a button, or an a when given
// href (a control either way), and a table cell's type is the same for td and th.
const BY_NAME = { Button: 'button', TableHeaderCell: 'th' };

export function a11yComponents(root) {
  const dir = path.join(root, 'src', 'components');
  const map = {};
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name, name + '.tsx');
    if (!fs.existsSync(file)) continue;
    // The first element of a union (HTMLButtonElement | HTMLAnchorElement for IconButton) is the one it renders by default.
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/component<(?:\w+ \| )*?HTML(\w+)Element\b[^(]*\(\s*"(\w+)"/g)) {
      if (TAGS[m[1]]) map[m[2]] = TAGS[m[1]];
    }
    // A local alias: type IconButtonElement = HTMLButtonElement | HTMLAnchorElement.
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/component<(\w+), \w+>\(\s*"(\w+)"/g)) {
      const alias = new RegExp(`type ${m[1]} = HTML(\\w+)Element`).exec(src);
      if (alias && TAGS[alias[1]]) map[m[2]] = TAGS[alias[1]];
    }
  }
  return { ...map, ...BY_NAME };
}
