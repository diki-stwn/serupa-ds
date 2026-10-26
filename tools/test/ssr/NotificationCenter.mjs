// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  NotificationCenter: h(D.NotificationCenter, { open: true, onOpenChange() {}, items: [{ id: 'a', title: 'Payment failed', tone: 'danger' }, { id: 'b', title: 'Invoice sent', read: true }] }),
});
