// Admin dashboard views

const SidebarNav = ({ view, setView, tenant }) => {
  const items = [
    { id: 'dashboard', label: 'Overview', icon: 'sparkle' },
    { id: 'documents', label: 'Documents', icon: 'docs', badge: tenant.docs?.length },
    { id: 'users', label: 'Users', icon: 'users', badge: tenant.users?.length },
    { id: 'analytics', label: 'Analytics', icon: 'chart' },
    { id: 'branding', label: 'Branding', icon: 'branding' },
    { id: 'billing', label: 'Billing', icon: 'billing' },
    { id: 'audit', label: 'Audit log', icon: 'audit' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  const product = [
    { id: 'portal', label: 'Open portal', icon: 'link' },
    { id: 'onboarding', label: 'Onboarding flow', icon: 'sparkle' },
  ];
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-brand-mark">RX</div>
        <div className="sb-brand-name">Relay</div>
        <div className="sb-tenant-pill" title="Switch workspace">
          {tenant.name.split(' ')[0]}
          <Icon name="chevron_down" size={10} />
        </div>
      </div>
      <div className="sb-section">
        <div className="sb-section-label">Workspace</div>
        {items.map(it => (
          <button key={it.id} className={`sb-nav-item ${view === it.id ? 'active' : ''}`} onClick={() => setView(it.id)}>
            <Icon name={it.icon} className="ico" />
            <span>{it.label}</span>
            {it.badge != null && <span className="badge mono">{it.badge}</span>}
          </button>
        ))}
      </div>
      <div className="sb-section">
        <div className="sb-section-label">Product</div>
        {product.map(it => (
          <button key={it.id} className={`sb-nav-item ${view === it.id ? 'active' : ''}`} onClick={() => setView(it.id)}>
            <Icon name={it.icon} className="ico" />
            <span>{it.label}</span>
          </button>
        ))}
      </div>
      <div className="sb-foot">
        <div className="sb-avatar">DR</div>
        <div className="sb-foot-text">
          <div className="sb-foot-name">Dana Reyes</div>
          <div className="sb-foot-email">{tenant.name} · Admin</div>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ crumbs, actions }) => (
  <div className="topbar">
    <div className="crumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          <span className={i === crumbs.length - 1 ? 'cur' : ''}>{c}</span>
        </React.Fragment>
      ))}
    </div>
    <div className="topbar-actions">{actions}</div>
  </div>
);

const Sparkline = ({ data, color }) => {
  const w = 100, h = 32;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / (max - min || 1)) * h]);
  const line = 'M' + pts.map(p => p.join(',')).join(' L');
  const fill = line + ` L${w},${h} L0,${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path className="fill" d={fill} style={color ? { fill: color } : null} />
      <path className="line" d={line} style={color ? { stroke: color } : null} />
    </svg>
  );
};

const DashboardView = ({ tenant, setView }) => {
  const queryData = [120, 134, 142, 138, 156, 162, 158, 174, 192, 188, 210, 224, 218, 246];
  const userData = [180, 192, 198, 205, 218, 224, 232, 248, 256, 268, 284, 296, 308, 312];
  return (
    <div className="page view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">{tenant.name} · last 14 days</p>
        </div>
        <div className="row">
          <button className="btn btn-ghost"><Icon name="download" /> Export</button>
          <button className="btn btn-primary" onClick={() => setView('documents')}><Icon name="upload" /> Upload documents</button>
        </div>
      </div>
      <div className="stats">
        <div className="stat">
          <div className="stat-label">Queries (14d) <span className="mono" style={{color:'var(--ok)'}}>+18%</span></div>
          <div className="stat-val">12,840</div>
          <div className="stat-spark"><Sparkline data={queryData} /></div>
        </div>
        <div className="stat">
          <div className="stat-label">Active end users <span className="mono" style={{color:'var(--ok)'}}>+4%</span></div>
          <div className="stat-val">312</div>
          <div className="stat-spark"><Sparkline data={userData} /></div>
        </div>
        <div className="stat">
          <div className="stat-label">Avg response <span className="mono" style={{color:'var(--text-3)'}}>p95</span></div>
          <div className="stat-val">1.84<span className="muted" style={{fontSize:14}}>s</span></div>
          <div className="stat-delta">−240ms vs last week</div>
        </div>
        <div className="stat">
          <div className="stat-label">Thumbs-up rate</div>
          <div className="stat-val">82.4<span className="muted" style={{fontSize:14}}>%</span></div>
          <div className="stat-delta up">▲ above 80% target</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Most cited documents</div><div className="card-sub">Last 30 days</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('documents')}>View all <Icon name="chevron_right" size={11} /></button>
          </div>
          <div className="card-body flush">
            <table className="tbl">
              <tbody>
                {tenant.docs.filter(d => d.queries > 0).slice(0, 5).map(d => (
                  <tr key={d.id}>
                    <td style={{width:32}}><div className={`doc-ico ${d.type}`}>{d.type}</div></td>
                    <td><div style={{fontWeight:500}}>{d.name}</div><div className="mono-sm muted">{d.folder} · {d.pages}p</div></td>
                    <td className="mono" style={{textAlign:'right',color:'var(--text-2)'}}>{d.queries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Top questions asked</div><div className="card-sub">Last 30 days</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('analytics')}>Analytics <Icon name="chevron_right" size={11} /></button>
          </div>
          <div className="card-body flush">
            <table className="tbl">
              <tbody>
                {tenant.topQueries.map((q, i) => (
                  <tr key={i}>
                    <td style={{width:24,color:'var(--text-3)',fontFamily:'var(--font-mono)',fontSize:11}}>{(i+1).toString().padStart(2,'0')}</td>
                    <td>{q.q}</td>
                    <td className="mono" style={{textAlign:'right',color:'var(--text-2)'}}>{q.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div style={{height:16}} />
      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Plan usage</div><div className="card-sub">{tenant.plan} plan · resets May 31</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => setView('billing')}>Billing <Icon name="chevron_right" size={11} /></button>
        </div>
        <div className="card-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24}}>
            {[
              { label: 'Documents', cur: tenant.usage.docs, max: tenant.usage.docsLimit, unit: '' },
              { label: 'Queries / mo', cur: tenant.usage.queries, max: tenant.usage.queriesLimit, unit: '' },
              { label: 'End users', cur: tenant.usage.users, max: tenant.usage.usersLimit, unit: '' },
              { label: 'Storage', cur: tenant.usage.storage, max: tenant.usage.storageLimit, unit: ' GB' },
            ].map(m => {
              const pct = (m.cur / m.max) * 100;
              return (
                <div key={m.label}>
                  <div className="label">{m.label}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
                    <span className="mono" style={{fontSize:14,fontWeight:600}}>{m.cur.toLocaleString()}{m.unit}</span>
                    <span className="mono-sm muted">/ {m.max.toLocaleString()}{m.unit}</span>
                  </div>
                  <div style={{height:4,background:'var(--bg-sunken)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background: pct > 80 ? 'var(--warn)' : 'var(--text)',borderRadius:2}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

window.SidebarNav = SidebarNav;
window.Topbar = Topbar;
window.Sparkline = Sparkline;
window.DashboardView = DashboardView;