// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  Timeline: h(D.Timeline, { 'aria-label': 'Order history' },
    h(D.TimelineItem, { title: 'Order placed', time: '12 Mar', dateTime: '2026-03-12', status: 'success', icon: 'check' }, 'Two items.'),
    h(D.TimelineItem, { title: 'Out for delivery', time: '15 Mar' })),
  'Timeline alternate': h(D.Timeline, { align: 'alternate' }, h(D.TimelineItem, { title: 'One' }), h(D.TimelineItem, { title: 'Two' })),
});
