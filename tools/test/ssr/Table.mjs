// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
    Table: h(D.Table, null, h(D.TableHead, null, h(D.TableRow, null, h(D.TableHeaderCell, null, 'Name'))), h(D.TableBody, null, h(D.TableRow, null, h(D.TableSelectCell, { label: 'Select Ada' }), h(D.TableCell, null, 'Ada'))), h(D.TableFoot, null, h(D.TableRow, null, h(D.TableCell, null, '1')))),
    TableActionBar: h(D.TableActionBar, { count: 2, onClear() {} }, h(D.Button, { size: 'sm' }, 'Export')),
});
