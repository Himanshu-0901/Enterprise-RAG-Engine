// Onboarding flow + Doc viewer drawer — using styles.css conventions

const DocViewer = ({ doc, page, viewerStyle, onClose }) => {
  if (!doc) return null;
  const open = !!doc;
  return (
    <>
      <div className={`drawer-backdrop ${open?'open':''}`} onClick={onClose}></div>
      <div className={`drawer ${open?'open':''}`}>
        <div className="drawer-head">
          <div className={`doc-ico ${doc.type}`}>{doc.type}</div>
          <div className="drawer-title">{doc.name}</div>
          <button className="btn btn-ghost btn-icon btn-sm"><Icon name="download" size={12} /></button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="close" size={12} /></button>
        </div>
        <div className="drawer-tools">
          <button className="btn btn-ghost btn-sm btn-icon"><Icon name="chevron_left" size={11} /></button>
          <span className="mono-sm">page</span>
          <input className="drawer-page-input mono" defaultValue={page} />
          <span className="mono-sm muted">of {doc.pages}</span>
          <button className="btn btn-ghost btn-sm btn-icon"><Icon name="chevron_right" size={11} /></button>
          <div className="searchbar" style={{marginLeft:'auto',height:24,width:180}}>
            <Icon name="search" size={11} />
            <input placeholder="Search in document" />
          </div>
        </div>
        <div className="drawer-body">
          {viewerStyle === 'snippets' ? (
            <div className="doc-snippets">
              {(doc.snippets || ['Excerpt unavailable for this document.']).map((s, i) => (
                <div key={i} className="doc-snippet">
                  <div className="doc-snippet-head">
                    <span className="mono-sm muted">page {page} · §{i+1}</span>
                    <span className="pill" style={{background:'color-mix(in srgb, var(--tenant-primary) 10%, transparent)',color:'var(--tenant-primary)',borderColor:'color-mix(in srgb, var(--tenant-primary) 30%, transparent)'}}>relevance 0.{94 - i*7}</span>
                  </div>
                  <p style={{margin:0}}>{s}</p>
                </div>
              ))}
              <div className="doc-empty">— end of relevant passages —</div>
            </div>
          ) : (
            <div className="doc-page">
              <h2>{doc.shortName}</h2>
              <h3>Section 4.{(page % 9) + 1}</h3>
              <p>The following sections describe the policies and procedures applicable to all patients receiving care under this provider. Please review carefully and contact your care team with any questions.</p>
              <p>Care plans are reviewed at admission and updated upon any change in clinical status. Patients should review their care plan with the assigned nurse navigator within seven (7) days of admission.</p>
              {doc.snippets && doc.snippets[0] && (
                <p><mark className="cite-hl">{doc.snippets[0]}</mark></p>
              )}
              <p>Subsequent reviews occur at intervals of two weeks, six weeks, and quarterly thereafter for the first year following the index event, unless clinical judgment dictates otherwise.</p>
              <h3>Documentation</h3>
              <p>All visits, communications, and clinical decisions are recorded in the patient's chart and are available to the patient via the portal. Requests for amendments to the record may be submitted in writing to the records department.</p>
              <p className="doc-page-num">— {page} —</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const OnboardingView = ({ setView, onCommit }) => {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState('Acme Co.');
  const [color, setColor] = React.useState('#0d6e6e');
  const [uploaded, setUploaded] = React.useState(false);

  const colors = ['#0d6e6e', '#1e3a8a', '#9f1239', '#d97757', '#7c3aed', '#0f766e', '#0891b2', '#dc2626'];
  const steps = [
    { title: 'Workspace', sub: 'Name and subdomain' },
    { title: 'Branding', sub: 'Logo and primary color' },
    { title: 'Documents', sub: 'Upload your knowledge' },
    { title: 'Invite team', sub: 'Roles and access' },
    { title: 'Launch', sub: 'You\'re ready' },
  ];

  return (
    <div className="onb">
      <aside className="onb-side">
        <div className="onb-side-brand">
          <div className="sb-brand-mark">RX</div>
          <div className="sb-brand-name">Relay</div>
        </div>
        {steps.map((s, i) => (
          <div key={i} className={`onb-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <div className="onb-step-num">{i < step ? <Icon name="check" size={11} /> : i+1}</div>
            <div className="onb-step-content">
              <div className="onb-step-title">{s.title}</div>
              <div className="onb-step-sub">{s.sub}</div>
            </div>
          </div>
        ))}
        <div style={{marginTop:'auto',fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)'}}>
          ⌘+K  shortcuts<br/>⌘+/  help
        </div>
      </aside>

      <div className="onb-main">
        {step === 0 && (
          <div className="onb-card">
            <div className="mono-sm muted" style={{marginBottom:8}}>STEP 01 OF 05</div>
            <h1 className="onb-h">Name your workspace</h1>
            <p className="onb-sub">This is how your team and end users will identify the workspace. Both can be changed later.</p>
            <div style={{display:'flex',flexDirection:'column',gap:18}}>
              <div>
                <label className="label">Workspace name</label>
                <input className="input" style={{height:38,fontSize:14}} value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Subdomain</label>
                <div style={{display:'flex',alignItems:'center',border:'1px solid var(--border-strong)',borderRadius:'var(--r-sm)',background:'var(--bg-elev)',height:38,paddingLeft:12}}>
                  <input style={{flex:1,border:'none',outline:'none',background:'transparent',fontSize:13,fontFamily:'var(--font-mono)',height:'100%'}} value={name.toLowerCase().replace(/[^a-z0-9]/g,'')} readOnly />
                  <span className="mono-sm muted" style={{padding:'0 12px',borderLeft:'1px solid var(--border)',height:'100%',display:'flex',alignItems:'center'}}>.relay.app</span>
                </div>
              </div>
              <div>
                <label className="label">Primary use case</label>
                <div className="row" style={{flexWrap:'wrap',gap:6}}>
                  {['HR & policies','Customer support','Sales enablement','Internal IT','Legal & compliance','Other'].map((u,i)=>(
                    <button key={u} className={`btn btn-sm ${i===0?'btn-primary':''}`}>{u}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="onb-foot">
              <button className="btn btn-ghost" onClick={()=>setView('dashboard')}>Skip setup</button>
              <button className="btn btn-primary" onClick={()=>setStep(1)}>Continue <Icon name="chevron_right" size={11} /></button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onb-card" style={{maxWidth:680}}>
            <div className="mono-sm muted" style={{marginBottom:8}}>STEP 02 OF 05</div>
            <h1 className="onb-h">Make it yours</h1>
            <p className="onb-sub">Choose a primary color and drop in a logo. End users will see this when they open the portal.</p>
            <div className="grid-2" style={{alignItems:'flex-start'}}>
              <div style={{display:'flex',flexDirection:'column',gap:18}}>
                <div>
                  <label className="label">Primary color</label>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {colors.map(c=>(
                      <button key={c} onClick={()=>setColor(c)} style={{width:32,height:32,borderRadius:8,background:c,border:color===c?'2px solid var(--text)':'1px solid var(--border)',cursor:'pointer',padding:0,boxShadow:color===c?'0 0 0 3px var(--bg)':'none',outline:color===c?'1px solid var(--text)':'none'}} />
                    ))}
                  </div>
                  <div className="mono-sm muted" style={{marginTop:8}}>{color}</div>
                </div>
                <div>
                  <label className="label">Logo</label>
                  <div className="dropzone">
                    <Icon name="upload" size={20} />
                    <div style={{fontWeight:500,marginTop:8,color:'var(--text)'}}>Drop a PNG or SVG</div>
                    <div className="mono-sm muted">max 2 MB · transparent background recommended</div>
                  </div>
                </div>
              </div>
              <div className="preview-card">
                <div className="preview-head">
                  <span className="preview-dot"></span><span className="preview-dot"></span><span className="preview-dot"></span>
                  <span style={{marginLeft:6}}>preview</span>
                </div>
                <div className="preview-body" style={{textAlign:'center',padding:'32px 24px'}}>
                  <div style={{width:44,height:44,background:color,color:'#fff',borderRadius:10,display:'grid',placeItems:'center',fontWeight:700,fontSize:18,margin:'0 auto'}}>{name[0] || 'A'}</div>
                  <div style={{fontSize:18,fontWeight:600,letterSpacing:'-0.02em',marginTop:14}}>Welcome to {name}</div>
                  <div style={{color:'var(--text-2)',fontSize:12,marginTop:4}}>Ask anything about our policies and procedures.</div>
                  <div style={{marginTop:18,padding:'8px 10px',border:'1px solid var(--border-strong)',borderRadius:8,display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,fontSize:12,color:'var(--text-3)',textAlign:'left'}}>Ask anything…</div>
                    <div style={{width:22,height:22,background:color,borderRadius:5,display:'grid',placeItems:'center',color:'#fff'}}><Icon name="arrow_up" size={10} /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="onb-foot">
              <button className="btn btn-ghost" onClick={()=>setStep(0)}><Icon name="chevron_left" size={11} /> Back</button>
              <button className="btn btn-primary" onClick={()=>setStep(2)}>Continue <Icon name="chevron_right" size={11} /></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onb-card" style={{maxWidth:680}}>
            <div className="mono-sm muted" style={{marginBottom:8}}>STEP 03 OF 05</div>
            <h1 className="onb-h">Upload your knowledge</h1>
            <p className="onb-sub">Drop in PDFs, Word docs, or paste a URL. We'll OCR, chunk, and index. Five docs is enough to get a feel — add more later.</p>
            <div className={`dropzone ${uploaded?'has-file':''}`} onClick={()=>setUploaded(true)} style={{padding:'40px 24px'}}>
              <Icon name="upload" size={26} />
              <div style={{fontWeight:500,marginTop:10,fontSize:14,color:'var(--text)'}}>{uploaded ? '4 files uploading' : 'Drop files or paste URLs'}</div>
              <div className="mono-sm muted">PDF, DOCX, MD, HTML · up to 50 MB each</div>
              {!uploaded && <button className="btn" style={{marginTop:14}}>Choose files</button>}
            </div>
            {uploaded && (
              <div className="card" style={{marginTop:16}}>
                <table className="tbl">
                  <tbody>
                    {[
                      {name:'Patient Handbook 2026.pdf',pages:84,status:'ready',type:'pdf'},
                      {name:'Diabetes Care Protocol v3.docx',pages:22,status:'ready',type:'docx'},
                      {name:'Medication Interactions.pdf',pages:246,status:'indexing',progress:62,type:'pdf'},
                      {name:'Cardiology Pathway.docx',pages:14,status:'indexing',progress:24,type:'docx'},
                    ].map((d,i)=>(
                      <tr key={i}>
                        <td style={{width:32}}><div className={`doc-ico ${d.type}`}>{d.type}</div></td>
                        <td><div style={{fontWeight:500}}>{d.name}</div><div className="mono-sm muted">{d.pages} pages</div></td>
                        <td>{d.status==='ready'?<span className="pill ok"><span className="dot"></span>indexed</span>:<span className="pill processing"><span className="dot"></span>{d.progress}%</span>}</td>
                        <td style={{textAlign:'right',width:40}}><button className="btn btn-ghost btn-icon btn-sm"><Icon name="more" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="onb-foot">
              <button className="btn btn-ghost" onClick={()=>setStep(1)}><Icon name="chevron_left" size={11} /> Back</button>
              <button className="btn btn-primary" onClick={()=>setStep(3)}>Continue <Icon name="chevron_right" size={11} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onb-card">
            <div className="mono-sm muted" style={{marginBottom:8}}>STEP 04 OF 05</div>
            <h1 className="onb-h">Invite your team</h1>
            <p className="onb-sub">Admins manage the workspace. Editors curate documents and prompts. End users just use the portal — no Relay account required.</p>
            <div style={{display:'flex',flexDirection:'column',gap:18}}>
              <div>
                <label className="label">Email addresses</label>
                <textarea className="input" style={{height:90,padding:10,resize:'vertical',fontFamily:'var(--font-mono)',fontSize:12}} placeholder={`taylor@example.com\nsam@example.com\n…`} />
                <div className="mono-sm muted" style={{marginTop:6}}>One per line, or paste comma-separated</div>
              </div>
              <div>
                <label className="label">Default role</label>
                <div className="row" style={{gap:0,border:'1px solid var(--border-strong)',borderRadius:'var(--r-sm)',padding:2,background:'var(--bg-elev)',width:'fit-content'}}>
                  {['End User','Editor','Admin'].map((r,i)=><button key={r} className={`btn btn-sm ${i===0?'btn-primary':'btn-ghost'}`} style={{borderRadius:3}}>{r}</button>)}
                </div>
              </div>
              <div className="card" style={{padding:14,background:'var(--bg-sunken)'}}>
                <div className="row" style={{justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontWeight:500,fontSize:13}}>Or share the portal link</div>
                    <div className="mono-sm" style={{color:'var(--text-2)',marginTop:2}}>https://{name.toLowerCase().replace(/[^a-z0-9]/g,'')}.relay.app</div>
                  </div>
                  <button className="btn btn-sm"><Icon name="copy" size={11} /> Copy link</button>
                </div>
              </div>
            </div>
            <div className="onb-foot">
              <button className="btn btn-ghost" onClick={()=>setStep(2)}><Icon name="chevron_left" size={11} /> Back</button>
              <button className="btn btn-primary" onClick={()=>setStep(4)}>Continue <Icon name="chevron_right" size={11} /></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onb-card" style={{textAlign:'center',maxWidth:560,margin:'0 auto',paddingTop:40}}>
            <div className="onb-launch-mark" style={{background:color}}>
              <Icon name="check" size={28} />
            </div>
            <div className="mono-sm muted" style={{marginTop:24}}>STEP 05 OF 05 · LIVE</div>
            <h1 className="onb-h" style={{marginTop:8}}>{name} is ready</h1>
            <p className="onb-sub">Your portal is at <span className="mono">{name.toLowerCase().replace(/[^a-z0-9]/g,'')}.relay.app</span>. Retrieval quality climbs over the first 24 hours as queries come in.</p>
            <div className="row" style={{justifyContent:'center'}}>
              <button className="btn" onClick={()=>setView('portal')}><Icon name="link" /> Open portal</button>
              <button className="btn btn-primary" onClick={()=>setView('dashboard')}>Go to admin <Icon name="chevron_right" size={11} /></button>
            </div>
            <div style={{marginTop:32,padding:'16px 20px',background:'var(--bg-sunken)',border:'1px solid var(--border)',borderRadius:8,textAlign:'left'}}>
              <div className="mono-sm muted" style={{marginBottom:10}}>WHAT TO DO NEXT</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:13}}>
                <div className="row"><Icon name="check" size={11} /> Workspace created</div>
                <div className="row"><Icon name="check" size={11} /> Branding configured</div>
                <div className="row" style={{color:'var(--text-2)'}}><span style={{width:14,textAlign:'center',color:'var(--text-3)'}}>○</span> Add 5+ more documents to improve answer quality</div>
                <div className="row" style={{color:'var(--text-2)'}}><span style={{width:14,textAlign:'center',color:'var(--text-3)'}}>○</span> Connect SSO (Google, Okta, or SAML)</div>
                <div className="row" style={{color:'var(--text-2)'}}><span style={{width:14,textAlign:'center',color:'var(--text-3)'}}>○</span> Customize suggested prompts</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.DocViewer = DocViewer;
window.OnboardingView = OnboardingView;