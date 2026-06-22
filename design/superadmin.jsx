// Super Admin (Relay platform operator) — fleet-level UI

const PLATFORM = {
  tenants: [
    { id: 'meridian', name: 'Meridian Health', plan: 'Growth', status: 'healthy', mark: 'M', color: '#0d6e6e', mrr: 399, users: 312, docs: 84, queries: 12840, qLimit: 25000, signedUp: '2025-09-12', region: 'us-east-1', lastActivity: '12 min ago' },
    { id: 'northwind', name: 'Northwind Legal', plan: 'Enterprise', status: 'healthy', mark: 'N', color: '#1e3a8a', mrr: 1499, users: 84, docs: 1240, queries: 48200, qLimit: 100000, signedUp: '2024-11-03', region: 'us-east-1', lastActivity: '4 min ago' },
    { id: 'atlas', name: 'Atlas Manufacturing', plan: 'Growth', status: 'warning', mark: 'A', color: '#7c2d12', mrr: 399, users: 142, docs: 320, queries: 22890, qLimit: 25000, signedUp: '2025-12-08', region: 'eu-west-1', lastActivity: '2 min ago' },
    { id: 'kinship', name: 'Kinship Education', plan: 'Starter', status: 'healthy', mark: 'K', color: '#7c3aed', mrr: 99, users: 38, docs: 24, queries: 1820, qLimit: 5000, signedUp: '2026-02-14', region: 'us-west-2', lastActivity: '1 hour ago' },
    { id: 'vela', name: 'Vela Bank', plan: 'Enterprise', status: 'incident', mark: 'V', color: '#0f766e', mrr: 2400, users: 240, docs: 4820, queries: 89200, qLimit: 250000, signedUp: '2024-06-21', region: 'eu-west-1', lastActivity: '8 min ago' },
    { id: 'fern', name: 'Fern & Co.', plan: 'Growth', status: 'healthy', mark: 'F', color: '#15803d', mrr: 399, users: 56, docs: 92, queries: 8420, qLimit: 25000, signedUp: '2025-08-30', region: 'us-east-1', lastActivity: '34 min ago' },
    { id: 'orca', name: 'Orca Logistics', plan: 'Growth', status: 'healthy', mark: 'O', color: '#0369a1', mrr: 399, users: 78, docs: 168, queries: 14820, qLimit: 25000, signedUp: '2025-10-19', region: 'us-east-1', lastActivity: '7 min ago' },
    { id: 'lumen', name: 'Lumen Studios', plan: 'Starter', status: 'churning', mark: 'L', color: '#a16207', mrr: 99, users: 12, docs: 18, queries: 240, qLimit: 5000, signedUp: '2026-03-22', region: 'us-west-2', lastActivity: '14 days ago' },
    { id: 'palmer', name: 'Palmer Insurance', plan: 'Enterprise', status: 'healthy', mark: 'P', color: '#9f1239', mrr: 1899, users: 198, docs: 2840, queries: 64200, qLimit: 100000, signedUp: '2025-01-08', region: 'us-east-1', lastActivity: '1 min ago' },
    { id: 'birch', name: 'Birch Foods', plan: 'Growth', status: 'pending', mark: 'B', color: '#65a30d', mrr: 0, users: 4, docs: 6, queries: 12, qLimit: 25000, signedUp: '2026-05-04', region: 'us-east-1', lastActivity: '3 days ago' },
  ],
  incidents: [
    { id: 'i1', tenant: 'vela', sev: 'P2', title: 'Elevated p95 latency on retrieval', who: 'auto-detected', when: '8 min ago', status: 'investigating' },
    { id: 'i2', tenant: 'atlas', sev: 'P3', title: 'Approaching query quota (91%)', who: 'auto-detected', when: '1 hour ago', status: 'open' },
    { id: 'i3', tenant: 'lumen', sev: 'P4', title: '14 days inactive', who: 'auto-detected', when: '2 days ago', status: 'open' },
  ],
  events: [
    { who: 'system', what: 'auto-scale', target: 'us-east-1 retrieval pool +2 nodes', when: '4 min ago' },
    { who: 'Pat Wei (ops)', what: 'impersonated', target: 'Vela Bank', when: '11 min ago' },
    { who: 'system', what: 'flagged', target: 'Atlas Manufacturing — quota 91%', when: '1 hour ago' },
    { who: 'Sam Lin (ops)', what: 'changed plan', target: 'Palmer Insurance → Enterprise+', when: '3 hours ago' },
    { who: 'system', what: 'provisioned', target: 'Birch Foods (new workspace)', when: '3 days ago' },
    { who: 'Pat Wei (ops)', what: 'released', target: 'retrieval-svc 2026.05.03', when: '3 days ago' },
  ],
};

const PlatformSidebar = ({ view, setView }) => {
  const items = [
    { id: 'overview', label: 'Fleet overview', icon: 'sparkle' },
    { id: 'tenants', label: 'Tenants', icon: 'users', badge: PLATFORM.tenants.length },
    { id: 'incidents', label: 'Incidents', icon: 'audit', badge: PLATFORM.incidents.length, urgent: true },
    { id: 'usage', label: 'Usage & billing', icon: 'billing' },
    { id: 'models', label: 'Models & infra', icon: 'chart' },
    { id: 'feature_flags', label: 'Feature flags', icon: 'settings' },
    { id: 'platform_audit', label: 'Audit log', icon: 'audit' },
  ];
  return (
    <aside className="sidebar" style={{background:'#0a0a0a',color:'#e4e4e7',borderRight:'1px solid #1f1f1f'}}>
      <div className="sb-brand" style={{borderBottom:'1px solid #1f1f1f'}}>
        <div className="sb-brand-mark" style={{background:'#fafaf9',color:'#0a0a0a'}}>RX</div>
        <div className="sb-brand-name" style={{color:'#fafaf9'}}>Relay</div>
        <div className="sb-tenant-pill" style={{background:'#1a1a1a',borderColor:'#2a2a2a',color:'#a1a1aa'}}>
          ops console
        </div>
      </div>
      <div className="sb-section">
        <div className="sb-section-label" style={{color:'#71717a'}}>Platform</div>
        {items.map(it => (
          <button key={it.id} className={`sb-nav-item ${view === it.id ? 'active' : ''}`} onClick={() => setView(it.id)}
            style={view === it.id
              ? {background:'#1f1f1f',color:'#fafaf9'}
              : {color:'#a1a1aa',background:'transparent'}}>
            <Icon name={it.icon} className="ico" />
            <span>{it.label}</span>
            {it.badge != null && (
              <span className="badge mono" style={{color: it.urgent ? 'oklch(0.72 0.15 25)' : '#71717a'}}>{it.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className="sb-section">
        <div className="sb-section-label" style={{color:'#71717a'}}>Operations</div>
        {[
          { id: 'releases', label: 'Releases', icon: 'sub' },
          { id: 'support', label: 'Support queue', icon: 'chat' },
        ].map(it => (
          <button key={it.id} className={`sb-nav-item ${view === it.id ? 'active' : ''}`} onClick={() => setView(it.id)}
            style={view === it.id
              ? {background:'#1f1f1f',color:'#fafaf9'}
              : {color:'#a1a1aa',background:'transparent'}}>
            <Icon name={it.icon} className="ico" />
            <span>{it.label}</span>
          </button>
        ))}
      </div>
      <div className="sb-foot" style={{borderTop:'1px solid #1f1f1f'}}>
        <div className="sb-avatar">PW</div>
        <div className="sb-foot-text">
          <div className="sb-foot-name" style={{color:'#fafaf9'}}>Pat Wei</div>
          <div className="sb-foot-email" style={{color:'#71717a'}}>Relay · platform ops</div>
        </div>
      </div>
    </aside>
  );
};

const StatusPill = ({ s }) => {
  const map = {
    healthy: { cls: 'ok', label: 'healthy' },
    warning: { cls: 'warn', label: 'warning' },
    incident: { cls: 'err', label: 'incident' },
    churning: { cls: 'warn', label: 'churning' },
    pending: { cls: '', label: 'pending' },
  };
  const m = map[s] || map.pending;
  return <span className={`pill ${m.cls}`}><span className="dot"></span>{m.label}</span>;
};

const FleetOverviewView = ({ setView, impersonate }) => {
  const totalMRR = PLATFORM.tenants.reduce((s,t)=>s+t.mrr,0);
  const totalQueries = PLATFORM.tenants.reduce((s,t)=>s+t.queries,0);
  const totalUsers = PLATFORM.tenants.reduce((s,t)=>s+t.users,0);
  const queryData = [4200, 4380, 4510, 4680, 4820, 5040, 5180, 5320, 5410, 5680, 5840, 6020, 6180, 6420];
  const mrrData = [4800, 4900, 5100, 5200, 5400, 5600, 5800, 6100, 6400, 6500, 6800, 7000, 7100, 7392];
  return (
    <div className="page view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet overview</h1>
          <p className="page-sub">All Relay workspaces · last 14 days</p>
        </div>
        <div className="row">
          <button className="btn btn-ghost"><Icon name="download" /> Export</button>
          <button className="btn btn-primary"><Icon name="plus" /> New tenant</button>
        </div>
      </div>
      <div className="stats">
        <div className="stat">
          <div className="stat-label">MRR <span className="mono" style={{color:'var(--ok)'}}>+9.4%</span></div>
          <div className="stat-val">${(totalMRR/1000).toFixed(1)}k</div>
          <div className="stat-spark"><Sparkline data={mrrData} /></div>
        </div>
        <div className="stat">
          <div className="stat-label">Active tenants</div>
          <div className="stat-val">{PLATFORM.tenants.filter(t=>t.status!=='churning').length}<span className="muted" style={{fontSize:14}}> / {PLATFORM.tenants.length}</span></div>
          <div className="stat-delta up">+3 this month</div>
        </div>
        <div className="stat">
          <div className="stat-label">Queries (14d)</div>
          <div className="stat-val">{(totalQueries/1000).toFixed(0)}k</div>
          <div className="stat-spark"><Sparkline data={queryData} /></div>
        </div>
        <div className="stat">
          <div className="stat-label">End users</div>
          <div className="stat-val">{totalUsers.toLocaleString()}</div>
          <div className="stat-delta up">+182 this month</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Active incidents</div><div className="card-sub">{PLATFORM.incidents.length} open across the fleet</div></div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setView('incidents')}>All <Icon name="chevron_right" size={11} /></button>
          </div>
          <div className="card-body flush">
            <table className="tbl">
              <tbody>
                {PLATFORM.incidents.map(i => {
                  const t = PLATFORM.tenants.find(x => x.id === i.tenant);
                  return (
                    <tr key={i.id} className="row-hover">
                      <td style={{width:48}}><span className="pill" style={{fontWeight:600}}>{i.sev}</span></td>
                      <td><div style={{fontWeight:500}}>{i.title}</div><div className="mono-sm muted">{t.name} · {i.when}</div></td>
                      <td style={{textAlign:'right'}}><span className={`pill ${i.status==='investigating'?'warn':''}`}><span className="dot"></span>{i.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Top tenants by query volume</div><div className="card-sub">Last 14 days</div></div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setView('tenants')}>All tenants <Icon name="chevron_right" size={11} /></button>
          </div>
          <div className="card-body flush">
            <table className="tbl">
              <tbody>
                {[...PLATFORM.tenants].sort((a,b)=>b.queries-a.queries).slice(0,5).map(t => (
                  <tr key={t.id} className="row-hover" onClick={()=>impersonate(t.id)}>
                    <td style={{width:32}}>
                      <div style={{width:24,height:24,background:t.color,color:'#fff',borderRadius:5,display:'grid',placeItems:'center',fontSize:11,fontWeight:700}}>{t.mark}</div>
                    </td>
                    <td><div style={{fontWeight:500}}>{t.name}</div><div className="mono-sm muted">{t.plan} · {t.region}</div></td>
                    <td className="mono" style={{textAlign:'right',color:'var(--text-2)'}}>{t.queries.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div style={{height:16}} />
      <div className="card">
        <div className="card-head"><div><div className="card-title">Recent platform activity</div></div></div>
        <div className="card-body flush">
          <table className="tbl">
            <tbody>
              {PLATFORM.events.map((e,i)=>(
                <tr key={i}>
                  <td className="mono-sm muted" style={{width:140}}>{e.when}</td>
                  <td>{e.who}</td>
                  <td><span className="pill">{e.what}</span></td>
                  <td className="mono-sm">{e.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TenantsView = ({ impersonate }) => {
  const [filter, setFilter] = React.useState('all');
  const [q, setQ] = React.useState('');
  const filtered = PLATFORM.tenants.filter(t =>
    (filter === 'all' || t.status === filter || t.plan.toLowerCase() === filter) &&
    (q === '' || t.name.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="page view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-sub">{PLATFORM.tenants.length} workspaces across 3 regions</p>
        </div>
        <button className="btn btn-primary"><Icon name="plus" /> New tenant</button>
      </div>
      <div className="toolbar">
        <div className="searchbar"><Icon name="search" size={13} /><input placeholder="Search tenants…" value={q} onChange={e=>setQ(e.target.value)} /></div>
        <div className="row" style={{gap:2}}>
          {['all','healthy','warning','incident','churning','pending'].map(f=>(
            <button key={f} className={`btn btn-sm ${filter===f?'':'btn-ghost'}`} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
        <span className="mono-sm muted" style={{marginLeft:'auto'}}>{filtered.length} shown</span>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th></th><th>Workspace</th><th>Plan</th><th>Status</th><th>Users</th><th>Docs</th><th>Quota</th><th>MRR</th><th>Last activity</th><th></th></tr></thead>
          <tbody>
            {filtered.map(t => {
              const pct = (t.queries / t.qLimit) * 100;
              return (
                <tr key={t.id} className="row-hover">
                  <td style={{width:40}}><div style={{width:26,height:26,background:t.color,color:'#fff',borderRadius:6,display:'grid',placeItems:'center',fontSize:12,fontWeight:700}}>{t.mark}</div></td>
                  <td><div style={{fontWeight:500}}>{t.name}</div><div className="mono-sm muted">{t.region} · since {t.signedUp}</div></td>
                  <td><span className="pill">{t.plan}</span></td>
                  <td><StatusPill s={t.status} /></td>
                  <td className="mono" style={{color:'var(--text-2)'}}>{t.users}</td>
                  <td className="mono" style={{color:'var(--text-2)'}}>{t.docs.toLocaleString()}</td>
                  <td style={{width:120}}>
                    <div className="mono-sm" style={{color: pct>85?'var(--err)':pct>70?'var(--warn)':'var(--text-2)'}}>{Math.round(pct)}%</div>
                    <div style={{height:3,background:'var(--bg-sunken)',borderRadius:2,marginTop:3}}>
                      <div style={{height:'100%',width:`${Math.min(pct,100)}%`,background: pct>85?'var(--err)':pct>70?'var(--warn)':'var(--text)',borderRadius:2}}></div>
                    </div>
                  </td>
                  <td className="mono" style={{color:'var(--text-2)'}}>${t.mrr}</td>
                  <td className="mono-sm muted">{t.lastActivity}</td>
                  <td style={{width:80,textAlign:'right'}}>
                    <button className="btn btn-ghost btn-sm" title="Impersonate" onClick={()=>impersonate(t.id)}><Icon name="eye" size={11} /> Open</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const IncidentsView = ({ impersonate }) => (
  <div className="page view">
    <div className="page-header">
      <div><h1 className="page-title">Incidents</h1><p className="page-sub">Auto-detected and operator-raised issues across all tenants</p></div>
      <button className="btn"><Icon name="plus" /> Raise incident</button>
    </div>
    <div className="stats">
      <div className="stat"><div className="stat-label">Open</div><div className="stat-val">{PLATFORM.incidents.length}</div><div className="stat-delta">2 in last 24h</div></div>
      <div className="stat"><div className="stat-label">P1 / P2</div><div className="stat-val">1</div><div className="stat-delta" style={{color:'var(--warn)'}}>investigate</div></div>
      <div className="stat"><div className="stat-label">MTTR (30d)</div><div className="stat-val">42<span className="muted" style={{fontSize:14}}> min</span></div><div className="stat-delta up">−18 min vs prev.</div></div>
      <div className="stat"><div className="stat-label">Auto-detected</div><div className="stat-val">94<span className="muted" style={{fontSize:14}}>%</span></div><div className="stat-delta">vs operator-raised</div></div>
    </div>
    <div className="card">
      <table className="tbl">
        <thead><tr><th>Sev</th><th>Title</th><th>Tenant</th><th>Status</th><th>Detected</th><th>Owner</th><th></th></tr></thead>
        <tbody>
          {PLATFORM.incidents.map(i => {
            const t = PLATFORM.tenants.find(x=>x.id===i.tenant);
            return (
              <tr key={i.id} className="row-hover">
                <td><span className="pill" style={{fontWeight:600,color: i.sev==='P2'?'var(--err)':'var(--warn)'}}>{i.sev}</span></td>
                <td><div style={{fontWeight:500}}>{i.title}</div><div className="mono-sm muted">{i.who}</div></td>
                <td><div className="row" style={{gap:6}}><div style={{width:18,height:18,background:t.color,color:'#fff',borderRadius:4,display:'grid',placeItems:'center',fontSize:9,fontWeight:700}}>{t.mark}</div>{t.name}</div></td>
                <td><span className={`pill ${i.status==='investigating'?'warn':''}`}><span className="dot"></span>{i.status}</span></td>
                <td className="mono-sm muted">{i.when}</td>
                <td className="mono-sm">—</td>
                <td style={{textAlign:'right'}}><button className="btn btn-ghost btn-sm" onClick={()=>impersonate(i.tenant)}><Icon name="eye" size={11} /> Inspect</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const UsageBillingView = () => {
  const planMix = [
    { plan: 'Starter', count: PLATFORM.tenants.filter(t=>t.plan==='Starter').length, mrr: PLATFORM.tenants.filter(t=>t.plan==='Starter').reduce((s,t)=>s+t.mrr,0) },
    { plan: 'Growth', count: PLATFORM.tenants.filter(t=>t.plan==='Growth').length, mrr: PLATFORM.tenants.filter(t=>t.plan==='Growth').reduce((s,t)=>s+t.mrr,0) },
    { plan: 'Enterprise', count: PLATFORM.tenants.filter(t=>t.plan==='Enterprise').length, mrr: PLATFORM.tenants.filter(t=>t.plan==='Enterprise').reduce((s,t)=>s+t.mrr,0) },
  ];
  const totalMRR = planMix.reduce((s,p)=>s+p.mrr,0);
  return (
    <div className="page view">
      <div className="page-header"><div><h1 className="page-title">Usage & billing</h1><p className="page-sub">Platform-wide revenue and quota burn</p></div></div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">Plan mix</div></div>
          <div className="card-body">
            {planMix.map(p => {
              const pct = (p.mrr/totalMRR)*100;
              return (
                <div key={p.plan} style={{marginBottom:14}}>
                  <div className="row" style={{justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontWeight:500}}>{p.plan}</span>
                    <span className="mono-sm muted">{p.count} tenants · ${p.mrr.toLocaleString()}/mo · {pct.toFixed(0)}%</span>
                  </div>
                  <div style={{height:8,background:'var(--bg-sunken)',borderRadius:4}}>
                    <div style={{height:'100%',width:`${pct}%`,background:'var(--text)',borderRadius:4}}></div>
                  </div>
                </div>
              );
            })}
            <div className="divider" />
            <div className="row" style={{justifyContent:'space-between'}}>
              <span style={{fontWeight:500}}>Total MRR</span>
              <span className="mono" style={{fontSize:18,fontWeight:600}}>${totalMRR.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Quota near-limit</div><div className="card-sub">Tenants over 70% of monthly query quota</div></div>
          <div className="card-body flush">
            <table className="tbl">
              <tbody>
                {PLATFORM.tenants.filter(t=>(t.queries/t.qLimit)>0.7).sort((a,b)=>(b.queries/b.qLimit)-(a.queries/a.qLimit)).map(t => {
                  const pct = (t.queries/t.qLimit)*100;
                  return (
                    <tr key={t.id}>
                      <td><div style={{width:22,height:22,background:t.color,color:'#fff',borderRadius:4,display:'grid',placeItems:'center',fontSize:10,fontWeight:700}}>{t.mark}</div></td>
                      <td><div style={{fontWeight:500}}>{t.name}</div><div className="mono-sm muted">{t.plan}</div></td>
                      <td className="mono" style={{textAlign:'right',color:pct>85?'var(--err)':'var(--warn)'}}>{Math.round(pct)}%</td>
                    </tr>
                  );
                })}
                {PLATFORM.tenants.filter(t=>(t.queries/t.qLimit)>0.7).length === 0 && (
                  <tr><td colSpan="3" style={{textAlign:'center',padding:20,color:'var(--text-3)'}}>All tenants under 70% — no action needed</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModelsInfraView = () => (
  <div className="page view">
    <div className="page-header"><div><h1 className="page-title">Models & infra</h1><p className="page-sub">What's running, where, and how it's behaving</p></div></div>
    <div className="grid-2">
      <div className="card">
        <div className="card-head"><div className="card-title">Models</div></div>
        <div className="card-body flush">
          <table className="tbl">
            <thead><tr><th>Model</th><th>Tenants</th><th>p95</th><th>Cost / 1K</th><th>Status</th></tr></thead>
            <tbody>
              {[
                {m:'frontier-2.1',t:6,p:'1.84s',c:'$0.014',s:'healthy'},
                {m:'frontier-2.1-mini',t:3,p:'0.62s',c:'$0.004',s:'healthy'},
                {m:'efficient-1.4',t:4,p:'0.41s',c:'$0.001',s:'healthy'},
                {m:'embed-large-v2',t:10,p:'48ms',c:'$0.0001',s:'healthy'},
              ].map(r=>(
                <tr key={r.m}><td className="mono">{r.m}</td><td className="mono">{r.t}</td><td className="mono">{r.p}</td><td className="mono">{r.c}</td><td><span className="pill ok"><span className="dot"></span>{r.s}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><div className="card-title">Regions</div></div>
        <div className="card-body flush">
          <table className="tbl">
            <thead><tr><th>Region</th><th>Tenants</th><th>Nodes</th><th>Util</th><th>Status</th></tr></thead>
            <tbody>
              {[
                {r:'us-east-1',t:6,n:'14',u:'62%',s:'healthy'},
                {r:'us-west-2',t:2,n:'4',u:'34%',s:'healthy'},
                {r:'eu-west-1',t:2,n:'8',u:'78%',s:'warning'},
              ].map(r=>(
                <tr key={r.r}><td className="mono">{r.r}</td><td className="mono">{r.t}</td><td className="mono">{r.n}</td><td className="mono">{r.u}</td><td><span className={`pill ${r.s==='warning'?'warn':'ok'}`}><span className="dot"></span>{r.s}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

const FeatureFlagsView = () => {
  const flags = [
    {key:'streaming.v2',desc:'Token-by-token streaming with new chunker',rollout:100,owner:'core'},
    {key:'cite.cards.default',desc:'Citation cards as default style for new tenants',rollout:25,owner:'design'},
    {key:'reranker.v3',desc:'Cross-encoder reranker',rollout:60,owner:'retrieval'},
    {key:'export.workspace',desc:'Self-serve workspace export to JSON+files',rollout:0,owner:'platform'},
    {key:'sso.saml',desc:'SAML 2.0 (Enterprise plan only)',rollout:100,owner:'security'},
    {key:'image.attach',desc:'Image inputs in end-user chat',rollout:5,owner:'core'},
  ];
  return (
    <div className="page view">
      <div className="page-header"><div><h1 className="page-title">Feature flags</h1><p className="page-sub">Per-tenant and global rollout</p></div><button className="btn"><Icon name="plus" /> New flag</button></div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Flag</th><th>Description</th><th>Rollout</th><th>Owner</th><th></th></tr></thead>
          <tbody>
            {flags.map(f => (
              <tr key={f.key} className="row-hover">
                <td className="mono" style={{fontWeight:500}}>{f.key}</td>
                <td>{f.desc}</td>
                <td style={{width:200}}>
                  <div className="row"><div style={{flex:1,height:4,background:'var(--bg-sunken)',borderRadius:2}}><div style={{height:'100%',width:`${f.rollout}%`,background: f.rollout===100?'var(--ok)':f.rollout===0?'var(--text-4)':'var(--text)',borderRadius:2}}></div></div><span className="mono-sm" style={{width:36,textAlign:'right'}}>{f.rollout}%</span></div>
                </td>
                <td><span className="pill">{f.owner}</span></td>
                <td style={{textAlign:'right',width:80}}><button className="btn btn-ghost btn-sm">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PlatformAuditView = () => (
  <div className="page view">
    <div className="page-header"><div><h1 className="page-title">Audit log</h1><p className="page-sub">Platform-operator activity · retained 7 years</p></div><button className="btn btn-ghost"><Icon name="download" /> Export</button></div>
    <div className="card">
      <table className="tbl">
        <thead><tr><th>When</th><th>Operator</th><th>Action</th><th>Target</th><th>IP</th></tr></thead>
        <tbody>
          {[...PLATFORM.events, ...PLATFORM.events].slice(0,10).map((e,i)=>(
            <tr key={i}>
              <td className="mono-sm muted" style={{width:140}}>{e.when}</td>
              <td>{e.who}</td>
              <td><span className="pill">{e.what}</span></td>
              <td className="mono-sm">{e.target}</td>
              <td className="mono-sm muted">10.0.{(i*7)%255}.{(i*13)%255}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ImpersonationBanner = ({ tenant, exit }) => (
  <div style={{position:'fixed',top:0,left:0,right:0,height:32,background:'oklch(0.62 0.20 25)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',gap:12,fontSize:12,zIndex:80,fontFamily:'var(--font-mono)'}}>
    <Icon name="eye" size={12} />
    <span>You are viewing <strong>{tenant.name}</strong> as the platform operator. All actions are audited.</span>
    <button onClick={exit} style={{background:'rgba(0,0,0,0.25)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'2px 10px',borderRadius:4,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Exit impersonation</button>
  </div>
);

window.PLATFORM_VIEWS = ['overview','tenants','incidents','usage','models','feature_flags','platform_audit','releases','support'];
window.PlatformSidebar = PlatformSidebar;
window.FleetOverviewView = FleetOverviewView;
window.TenantsView = TenantsView;
window.IncidentsView = IncidentsView;
window.UsageBillingView = UsageBillingView;
window.ModelsInfraView = ModelsInfraView;
window.FeatureFlagsView = FeatureFlagsView;
window.PlatformAuditView = PlatformAuditView;
window.ImpersonationBanner = ImpersonationBanner;
window.PLATFORM = PLATFORM;