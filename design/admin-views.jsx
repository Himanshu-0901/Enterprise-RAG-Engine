// Documents, Users, Branding, Analytics, Billing, Audit, Settings views

const DocumentsView = ({ tenant, openDoc }) => {
  const [folder, setFolder] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const folders = ['All', ...Array.from(new Set(tenant.docs.map(d => d.folder)))];
  const filtered = tenant.docs.filter(d =>
    (folder === 'All' || d.folder === folder) &&
    (query === '' || d.name.toLowerCase().includes(query.toLowerCase()))
  );
  return (
    <div className="page view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-sub">{tenant.docs.length} documents · {tenant.usage.storage} GB of {tenant.usage.storageLimit} GB used</p>
        </div>
        <div className="row">
          <button className="btn btn-ghost"><Icon name="folder" /> New folder</button>
          <button className="btn btn-primary"><Icon name="upload" /> Upload</button>
        </div>
      </div>
      <div className="toolbar">
        <div className="searchbar">
          <Icon name="search" size={13} />
          <input placeholder="Search library…" value={query} onChange={e=>setQuery(e.target.value)} />
          <span className="kbd">⌘K</span>
        </div>
        <div className="row" style={{gap:2}}>
          {folders.map(f => (
            <button key={f} className={`btn btn-sm ${folder === f ? '' : 'btn-ghost'}`} onClick={()=>setFolder(f)}>{f}</button>
          ))}
        </div>
        <div style={{marginLeft:'auto'}} className="row">
          <button className="btn btn-ghost btn-sm"><Icon name="filter" size={12} /> Filter</button>
          <span className="mono-sm muted">{filtered.length} shown</span>
        </div>
      </div>
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width:40}}></th>
              <th>Name</th>
              <th>Status</th>
              <th>Folder</th>
              <th>Pages</th>
              <th>Queries</th>
              <th>Uploaded</th>
              <th style={{width:40}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} className="row-hover" onClick={()=>d.status==='ready' && openDoc(d)}>
                <td><div className={`doc-ico ${d.type}`}>{d.type}</div></td>
                <td>
                  <div style={{fontWeight:500}}>{d.name}</div>
                  <div className="mono-sm muted">{d.tags.map(t=>'#'+t).join(' ')}</div>
                </td>
                <td>
                  {d.status === 'ready' && <span className="pill ok"><span className="dot"></span>ready</span>}
                  {d.status === 'indexing' && <span className="pill processing"><span className="dot"></span>indexing {d.progress}%</span>}
                  {d.status === 'queued' && <span className="pill"><span className="dot"></span>queued</span>}
                </td>
                <td><span className="mono-sm muted">{d.folder}</span></td>
                <td className="mono" style={{color:'var(--text-2)'}}>{d.pages}</td>
                <td className="mono" style={{color:'var(--text-2)'}}>{d.queries.toLocaleString()}</td>
                <td className="mono-sm muted">{d.uploaded}</td>
                <td><button className="btn btn-ghost btn-icon btn-sm" onClick={e=>e.stopPropagation()}><Icon name="more" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UsersView = ({ tenant }) => (
  <div className="page view">
    <div className="page-header">
      <div>
        <h1 className="page-title">Users</h1>
        <p className="page-sub">{tenant.users.filter(u=>u.status==='active').length} active · {tenant.users.filter(u=>u.status==='pending').length} pending invites</p>
      </div>
      <button className="btn btn-primary"><Icon name="invite" /> Invite users</button>
    </div>
    <div className="tabs">
      <button className="tab active">All ({tenant.users.length})</button>
      <button className="tab">Admins (1)</button>
      <button className="tab">Editors (1)</button>
      <button className="tab">End users ({tenant.users.filter(u=>u.role==='End User').length})</button>
      <button className="tab">Pending (1)</button>
    </div>
    <div className="card">
      <table className="tbl">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last active</th><th style={{width:40}}></th></tr></thead>
        <tbody>
          {tenant.users.map(u => (
            <tr key={u.id} className="row-hover">
              <td><div className="row"><div className="sb-avatar" style={{width:24,height:24,fontSize:10}}>{u.name.split(' ').map(p=>p[0]).join('').slice(0,2)}</div>{u.name}</div></td>
              <td className="mono-sm" style={{color:'var(--text-2)'}}>{u.email}</td>
              <td><span className="pill">{u.role}</span></td>
              <td>{u.status === 'active' && <span className="pill ok"><span className="dot"></span>active</span>}{u.status==='pending' && <span className="pill warn"><span className="dot"></span>pending</span>}{u.status==='inactive' && <span className="pill"><span className="dot"></span>inactive</span>}</td>
              <td className="mono-sm muted">{u.last}</td>
              <td><button className="btn btn-ghost btn-icon btn-sm"><Icon name="more" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const BrandingView = ({ tenant, brand, setBrand }) => {
  const colors = ['#0d6e6e', '#1e3a8a', '#9f1239', '#d97757', '#7c3aed', '#0f766e', '#0891b2', '#ca8a04'];
  return (
    <div className="page view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Branding</h1>
          <p className="page-sub">Customize how your portal looks to end users. Changes preview live.</p>
        </div>
        <div className="row">
          <button className="btn btn-ghost">Reset</button>
          <button className="btn btn-primary"><Icon name="check" /> Save changes</button>
        </div>
      </div>
      <div className="grid-2" style={{alignItems:'flex-start'}}>
        <div className="card">
          <div className="card-head"><div className="card-title">Identity</div></div>
          <div className="card-body" style={{display:'flex',flexDirection:'column',gap:18}}>
            <div>
              <label className="label">Portal name</label>
              <input className="input" defaultValue={tenant.name} />
            </div>
            <div>
              <label className="label">Logo</label>
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <div style={{width:56,height:56,background:brand.primary,color:'#fff',borderRadius:10,display:'grid',placeItems:'center',fontWeight:700,fontSize:22}}>{tenant.mark}</div>
                <button className="btn btn-ghost btn-sm"><Icon name="upload" size={12} /> Replace</button>
                <span className="mono-sm muted">PNG or SVG · max 2 MB</span>
              </div>
            </div>
            <div>
              <label className="label">Subdomain</label>
              <div style={{display:'flex',alignItems:'center',gap:0,border:'1px solid var(--border-strong)',borderRadius:'var(--r-sm)',background:'var(--bg-elev)',height:30,paddingLeft:10}}>
                <input style={{flex:1,border:'none',outline:'none',background:'transparent',fontSize:13,fontFamily:'var(--font-mono)'}} defaultValue="meridian" />
                <span className="mono-sm muted" style={{padding:'0 10px',borderLeft:'1px solid var(--border)',height:'100%',display:'flex',alignItems:'center'}}>.relay.app</span>
              </div>
            </div>
            <div>
              <label className="label">Custom domain <span className="pill" style={{marginLeft:6,padding:'1px 6px'}}>Growth+</span></label>
              <input className="input mono" placeholder="help.yourcompany.com" defaultValue={tenant.domain} />
              <div className="mono-sm muted" style={{marginTop:6}}>CNAME → relay.app verified · TLS auto-issued</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Theme</div></div>
          <div className="card-body" style={{display:'flex',flexDirection:'column',gap:18}}>
            <div>
              <label className="label">Primary color</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {colors.map(c => (
                  <button key={c} onClick={()=>setBrand({...brand,primary:c})} style={{width:30,height:30,borderRadius:8,background:c,border: brand.primary===c ? '2px solid var(--text)' : '1px solid var(--border)',cursor:'pointer',padding:0}} />
                ))}
                <div className="swatch"><div className="swatch-chip" style={{background:brand.primary}}></div>{brand.primary}</div>
              </div>
            </div>
            <div>
              <label className="label">Welcome message</label>
              <textarea className="input" style={{height:60,padding:8,resize:'vertical'}} defaultValue={tenant.welcome} />
            </div>
            <div>
              <label className="label">Suggested prompts</label>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {tenant.prompts.slice(0,3).map((p,i)=>(
                  <input key={i} className="input mono-sm" defaultValue={p.text} style={{fontSize:12}} />
                ))}
                <button className="btn btn-ghost btn-sm" style={{alignSelf:'flex-start'}}><Icon name="plus" size={11} /> Add prompt</button>
              </div>
            </div>
            <div>
              <label className="label">Contrast check</label>
              <div className="row" style={{gap:8}}>
                <span className="pill ok"><span className="dot"></span>WCAG AA passes</span>
                <span className="mono-sm muted">contrast ratio 7.2 : 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{height:16}} />
      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Live preview</div><div className="card-sub">How your portal looks to end users</div></div>
          <span className="pill mono"><span className="dot" style={{background:'var(--ok)'}}></span>{tenant.domain}</span>
        </div>
        <div style={{padding:24,background:'var(--bg-sunken)'}}>
          <div style={{maxWidth:680,margin:'0 auto',background:'var(--bg-elev)',border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',boxShadow:'var(--shadow-md)'}}>
            <div style={{height:48,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 16px',gap:10}}>
              <div style={{width:24,height:24,background:brand.primary,color:'#fff',borderRadius:6,display:'grid',placeItems:'center',fontWeight:700,fontSize:11}}>{tenant.mark}</div>
              <div style={{fontWeight:600,fontSize:13}}>{tenant.name}</div>
              <div style={{marginLeft:'auto'}} className="mono-sm muted">jordan.lee@example.com</div>
            </div>
            <div style={{padding:'40px 28px',textAlign:'center'}}>
              <div style={{fontSize:22,fontWeight:600,letterSpacing:'-0.02em',marginBottom:6}}>{tenant.welcome}</div>
              <div style={{color:'var(--text-2)',fontSize:13,marginBottom:20}}>{tenant.welcomeSub}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,maxWidth:480,margin:'0 auto'}}>
                {tenant.prompts.slice(0,4).map((p,i)=>(
                  <div key={i} style={{padding:'10px 12px',border:'1px solid var(--border)',borderRadius:6,textAlign:'left',fontSize:12,color:'var(--text-2)'}}>
                    <div style={{fontSize:9,color:brand.primary,textTransform:'uppercase',letterSpacing:'0.08em',fontFamily:'var(--font-mono)',marginBottom:3}}>{p.cat}</div>
                    {p.text}
                  </div>
                ))}
              </div>
              <div style={{marginTop:24,maxWidth:480,margin:'24px auto 0',border:'1px solid var(--border-strong)',borderRadius:10,padding:'8px 10px',display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,fontSize:13,color:'var(--text-3)',textAlign:'left'}}>Ask anything…</div>
                <div style={{width:24,height:24,background:brand.primary,borderRadius:5,display:'grid',placeItems:'center',color:'#fff'}}><Icon name="send" size={11} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsView = ({ tenant }) => {
  const days = Array.from({length: 28}, (_, i) => 80 + Math.sin(i/2.5) * 30 + Math.random() * 60 + i * 4);
  const max = Math.max(...days);
  return (
    <div className="page view">
      <div className="page-header">
        <div><h1 className="page-title">Analytics</h1><p className="page-sub">Last 28 days</p></div>
        <div className="row">
          <select className="input" style={{width:140}} defaultValue="28">
            <option value="7">Last 7 days</option>
            <option value="28">Last 28 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button className="btn btn-ghost"><Icon name="download" /> Export CSV</button>
        </div>
      </div>
      <div className="stats">
        <div className="stat"><div className="stat-label">Queries</div><div className="stat-val">12,840</div><div className="stat-delta up">+18% vs prev. period</div></div>
        <div className="stat"><div className="stat-label">Citation CTR</div><div className="stat-val">31.4%</div><div className="stat-delta up">▲ above 25% target</div></div>
        <div className="stat"><div className="stat-label">Refusal rate</div><div className="stat-val">5.2%</div><div className="stat-delta">within 8% target</div></div>
        <div className="stat"><div className="stat-label">Avg session</div><div className="stat-val">4.8<span className="muted" style={{fontSize:14}}> queries</span></div><div className="stat-delta">+0.3 vs prev.</div></div>
      </div>
      <div className="card">
        <div className="card-head"><div><div className="card-title">Queries per day</div><div className="card-sub">Hover bars to inspect</div></div></div>
        <div className="card-body">
          <div className="bars">
            {days.map((v,i)=>(
              <div key={i} className="bar" style={{height:`${(v/max)*100}%`}} title={`Day ${i+1}: ${Math.round(v)} queries`} />
            ))}
          </div>
          <div className="bar-axis">
            <span>Apr 8</span><span>Apr 15</span><span>Apr 22</span><span>Apr 29</span><span>May 6</span>
          </div>
        </div>
      </div>
      <div style={{height:16}} />
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">Thumbs-down reports</div><div className="card-sub">Needs review</div></div>
          <div className="card-body flush">
            <table className="tbl">
              <tbody>
                {[
                  {q:'how long do I take antibiotics for', r:'Vague answer; no specific protocol cited', when:'2h ago'},
                  {q:'can I drink alcohol on lisinopril', r:'Refused but had answer in handbook', when:'5h ago'},
                  {q:'is my insurance covering this scan', r:'Hallucinated coverage details', when:'1d ago'},
                  {q:'how to schedule MRI', r:'Outdated phone number', when:'2d ago'},
                ].map((r,i)=>(
                  <tr key={i} className="row-hover">
                    <td style={{width:24}}><Icon name="thumbs_down" /></td>
                    <td><div style={{fontWeight:500}}>"{r.q}"</div><div className="mono-sm muted">{r.r}</div></td>
                    <td className="mono-sm muted" style={{textAlign:'right'}}>{r.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Top questions</div></div>
          <div className="card-body flush">
            <table className="tbl">
              <tbody>
                {tenant.topQueries.map((q, i) => (
                  <tr key={i}><td style={{width:24,fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-3)'}}>{(i+1).toString().padStart(2,'0')}</td><td>{q.q}</td><td className="mono" style={{textAlign:'right',color:'var(--text-2)'}}>{q.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const BillingView = ({ tenant }) => (
  <div className="page view">
    <div className="page-header"><div><h1 className="page-title">Billing</h1><p className="page-sub">{tenant.plan} plan · billed monthly</p></div><button className="btn btn-primary">Upgrade plan</button></div>
    <div className="grid-3">
      {['Starter','Growth','Enterprise'].map(p => {
        const cur = p === tenant.plan;
        return (
          <div key={p} className="card" style={cur ? {borderColor:'var(--text)',boxShadow:'0 0 0 2px var(--text) inset'} : {}}>
            <div className="card-body">
              <div className="row" style={{justifyContent:'space-between'}}><div style={{fontWeight:600,fontSize:14}}>{p}</div>{cur && <span className="pill ok"><span className="dot"></span>current</span>}</div>
              <div style={{fontSize:28,fontWeight:600,marginTop:12,letterSpacing:'-0.02em'}}>${p==='Starter'?'99':p==='Growth'?'399':'1,499'}<span className="muted" style={{fontSize:13,fontWeight:400}}>/mo</span></div>
              <div className="divider" />
              <div className="col" style={{gap:6,fontSize:12,color:'var(--text-2)'}}>
                <div><Icon name="check" size={11} /> {p==='Starter'?'50':p==='Growth'?'250':'5,000'} documents</div>
                <div><Icon name="check" size={11} /> {p==='Starter'?'5K':p==='Growth'?'25K':'unlimited'} queries / mo</div>
                <div><Icon name="check" size={11} /> {p==='Starter'?'Cost-efficient':p==='Growth'?'Frontier':'Frontier + custom'} model</div>
                <div style={{color: p==='Starter' ? 'var(--text-4)' : 'var(--text-2)'}}>{p==='Starter'?'—':<><Icon name="check" size={11} /> Custom domain</>}</div>
                <div style={{color: p!=='Enterprise' ? 'var(--text-4)' : 'var(--text-2)'}}>{p==='Enterprise'?<><Icon name="check" size={11} /> SAML SSO + DPA</>:'—'}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    <div style={{height:16}} />
    <div className="card">
      <div className="card-head"><div className="card-title">Invoices</div></div>
      <div className="card-body flush">
        <table className="tbl">
          <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {[['2026-04-01','Growth plan · April','$399.00','Paid'],['2026-03-01','Growth plan · March','$399.00','Paid'],['2026-02-01','Growth plan · February','$399.00','Paid'],['2026-01-15','Plan upgrade Starter→Growth (prorated)','$214.00','Paid']].map((r,i)=>(
              <tr key={i}><td className="mono-sm">{r[0]}</td><td>{r[1]}</td><td className="mono">{r[2]}</td><td><span className="pill ok"><span className="dot"></span>{r[3]}</span></td><td style={{textAlign:'right'}}><button className="btn btn-ghost btn-sm"><Icon name="download" size={11} /></button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const AuditView = ({ tenant }) => (
  <div className="page view">
    <div className="page-header"><div><h1 className="page-title">Audit log</h1><p className="page-sub">Workspace activity · retained 365 days</p></div><button className="btn btn-ghost"><Icon name="download" /> Export</button></div>
    <div className="card">
      <div className="card-body flush">
        <table className="tbl">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>
            {tenant.audit.map((a,i)=>(
              <tr key={i}><td className="mono-sm muted">{a.when}</td><td>{a.who}</td><td><span className="pill">{a.what}</span></td><td className="mono-sm">{a.target}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const SettingsView = () => (
  <div className="page view">
    <div className="page-header"><div><h1 className="page-title">Settings</h1><p className="page-sub">Workspace preferences</p></div></div>
    <div className="card">
      <div className="card-head"><div className="card-title">Data & retention</div></div>
      <div className="card-body" style={{display:'flex',flexDirection:'column',gap:16}}>
        <div className="row" style={{justifyContent:'space-between'}}>
          <div><div style={{fontWeight:500}}>Conversation retention</div><div className="mono-sm muted">How long end-user conversations are kept</div></div>
          <select className="input" style={{width:160}} defaultValue="90"><option>30 days</option><option>90 days</option><option>1 year</option><option>Forever</option></select>
        </div>
        <div className="divider" />
        <div className="row" style={{justifyContent:'space-between'}}>
          <div><div style={{fontWeight:500}}>Allow source download</div><div className="mono-sm muted">End users can download cited PDFs</div></div>
          <button className="btn btn-ghost btn-sm"><Icon name="check" /> Enabled</button>
        </div>
        <div className="divider" />
        <div className="row" style={{justifyContent:'space-between'}}>
          <div><div style={{fontWeight:500}}>Export workspace data</div><div className="mono-sm muted">Download docs, conversations, users (JSON + originals)</div></div>
          <button className="btn"><Icon name="download" /> Request export</button>
        </div>
        <div className="divider" />
        <div className="row" style={{justifyContent:'space-between'}}>
          <div><div style={{fontWeight:500,color:'var(--err)'}}>Delete workspace</div><div className="mono-sm muted">Permanent. 30-day soft delete window.</div></div>
          <button className="btn" style={{borderColor:'var(--err)',color:'var(--err)'}}>Delete…</button>
        </div>
      </div>
    </div>
  </div>
);

window.DocumentsView = DocumentsView;
window.UsersView = UsersView;
window.BrandingView = BrandingView;
window.AnalyticsView = AnalyticsView;
window.BillingView = BillingView;
window.AuditView = AuditView;
window.SettingsView = SettingsView;