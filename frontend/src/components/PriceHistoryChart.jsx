const PriceHistoryChart = ({ startingBid, bids }) => {
  const history = [
    { amount: Number(startingBid || 0), createdAt: bids.at(-1)?.createdAt || new Date().toISOString() },
    ...[...bids].reverse().map(bid => ({ amount: Number(bid.amount), createdAt: bid.createdAt }))
  ].filter(point => Number.isFinite(point.amount));

  if (history.length < 2) {
    return (
      <div className="chart-empty">
        <span className="eyebrow">Price history</span>
        <p>Price movement will appear here after the first bid.</p>
        <div className="chart-baseline" />
      </div>
    );
  }

  const width = 640;
  const height = 190;
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const values = history.map(point => point.amount);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || Math.max(max * 0.1, 1);
  const points = history.map((point, index) => ({
    ...point,
    x: padding.left + index / (history.length - 1) * (width - padding.left - padding.right),
    y: padding.top + (1 - (point.amount - min) / spread) * (height - padding.top - padding.bottom)
  }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points.at(-1).x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
  const dateLabel = point => new Date(point.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="price-chart">
      <div className="chart-heading">
        <div><span className="eyebrow">Bid movement</span><h2 className="chart-title">Price history</h2></div>
        <span className="chart-count">{history.length - 1} {history.length === 2 ? 'bid' : 'bids'}</span>
      </div>
      <div className="chart-current">
        <strong>${Number(history.at(-1).amount).toLocaleString()}</strong>
        <span>Current price</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Chart showing auction price increasing with accepted bids">
        <defs>
          <linearGradient id="price-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#e87524" stopOpacity=".2" />
            <stop offset="100%" stopColor="#e87524" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map(row => {
          const y = padding.top + row * (height - padding.top - padding.bottom) / 2;
          return <line key={row} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e4e4e4" strokeDasharray="3 6" />;
        })}
        <path d={area} fill="url(#price-fill)" />
        <path d={line} fill="none" stroke="#e87524" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <circle key={`${point.createdAt}-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#fff" stroke="#e87524" strokeWidth="2">
            <title>${point.amount.toLocaleString()} · {new Date(point.createdAt).toLocaleString()}</title>
          </circle>
        ))}
      </svg>
      <div className="chart-dates"><span>{dateLabel(points[0])}</span><span>{dateLabel(points.at(-1))}</span></div>
    </div>
  );
};

export default PriceHistoryChart;
