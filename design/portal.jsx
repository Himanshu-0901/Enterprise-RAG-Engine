// End-user chat portal — uses styles defined in styles.css
const portalSeed = (tenant) => ({
  msgs: [{ role: 'assistant', text: tenant.welcome, sub: tenant.welcomeSub, intro: true }],
  threads: [
    { id: 't1', title: 'Sick leave during probation', when: 'Today · 10:24' },
    { id: 't2', title: 'Carry over unused PTO', when: 'Yesterday' },
    { id: 't3', title: 'Work from home equipment', when: 'May 2' },
    { id: 't4', title: 'Bereavement leave policy', when: 'Apr 28' },
    { id: 't5', title: 'Medication side effects', when: 'Apr 24' },
  ],
});

const buildAssistantReply = (q, tenant) => {
  const ql = q.toLowerCase();
  const find = (m) => tenant.docs.find(d => m.some(k => d.name.toLowerCase().includes(k)) && d.status === 'ready') || tenant.docs.find(d=>d.status==='ready');
  if (ql.includes('diabet') || ql.includes('metformin') || ql.includes('blood sugar')) {
    const proto = find(['diabetes']); const med = find(['medication','interaction']);
    return {
      parts: [
        {type:'text', text:'Your plan starts at '},{type:'text', text:'metformin 500 mg twice daily',bold:true},{type:'text',text:', titrated weekly to 1000 mg twice daily as tolerated'},
        {type:'cite', n:1, doc:proto, page:4},
        {type:'text', text:'. Targets to expect:'},
        {type:'list', items:[
          'HbA1c rechecked at 12 weeks — goal generally below 7.0%',
          'Daily fingerstick glucose log for the first 30 days',
          'Nutrition consult booked automatically once you confirm the plan',
        ]},
        {type:'text', text:'Metformin has no clinically significant interaction with lisinopril or atorvastatin at standard doses'},
        {type:'cite', n:2, doc:med, page:118},
        {type:'text', text:'.'},
      ],
      sources: [
        {n:1, doc: proto, page: 4, snippet: proto.snippets?.[0]},
        {n:2, doc: med, page: 118, snippet: med.snippets?.[0]},
      ],
      searching: 'protocols & medications',
    };
  }
  if (ql.includes('cardio') || ql.includes('follow') || ql.includes('appointment')) {
    const card = find(['cardio']);
    return {
      parts: [
        {type:'text', text:'Your next cardiology follow-up is '},{type:'text',text:'June 4 at 2:30 PM',bold:true},
        {type:'text', text:' with Dr. Chen. Standard cadence after a cardiac event is 2 weeks, 6 weeks, then quarterly for the first year'},
        {type:'cite', n:1, doc:card, page:3},
        {type:'text', text:'.'},
      ],
      sources: [{n:1, doc:card, page:3, snippet: card.snippets?.[0]}],
      searching: 'cardiology pathway',
    };
  }
  if (ql.includes('side effect') || ql.includes('post-op') || ql.includes('surgery') || ql.includes('after')) {
    const handbook = find(['handbook']);
    return {
      parts: [
        {type:'text', text:'Most patients experience mild fatigue and bruising for 3-5 days. Call the on-call line if you notice:'},
        {type:'list', items:['Fever above 101°F (38.3°C)','Drainage that becomes thick or foul-smelling','Pain that\'s not relieved by prescribed medication','Shortness of breath or chest pain']},
        {type:'text', text:'Recovery milestones for most outpatient procedures are walking by day 2 and resuming light activity by week 2'},
        {type:'cite', n:1, doc:handbook, page:42},
        {type:'text', text:'.'},
      ],
      sources: [{n:1, doc:handbook, page:42, snippet: handbook.snippets?.[0]}],
      searching: 'recovery & handbook',
    };
  }
  if (ql.includes('insurance') || ql.includes('bill') || ql.includes('cost')) {
    const ins = find(['insurance','billing']);
    return {
      parts: [
        {type:'text', text:'In-network specialist visits run a $35 copay; out-of-pocket maximums depend on your plan year'},
        {type:'cite', n:1, doc:ins, page:2},
        {type:'text', text:'. I can\'t see your specific plan from here — call the billing line at extension 4500 to confirm coverage for a specific procedure.'},
      ],
      sources: [{n:1, doc:ins, page:2, snippet: ins.snippets?.[0]}],
      searching: 'insurance FAQ',
    };
  }
  const handbook = find(['handbook']);
  return {
    parts: [
      {type:'text', text:`Here's what I found about "${q}". `},
      {type:'text', text:'The handbook is the primary reference — section 2 covers admissions, section 4 covers visitor and family policies'},
      {type:'cite', n:1, doc:handbook, page:7},
      {type:'text', text:'. Want me to drill into a specific topic?'},
    ],
    sources: [{n:1, doc:handbook, page:7, snippet: handbook.snippets?.[0]}],
    searching: 'handbook',
  };
};

const PromptCard = ({ p, onPick }) => (
  <button className="welcome-prompt" onClick={()=>onPick(p)}>
    <div className="welcome-prompt-cat">{p.cat}</div>
    <div>{p.text}</div>
  </button>
);

const Message = ({ m, openDoc, citationStyle }) => {
  if (m.role === 'user') {
    return (
      <div className="msg user">
        <div className="msg-role"><div className="msg-role-mark">JL</div><span>You</span></div>
        <div className="msg-body">{m.text}</div>
      </div>
    );
  }
  if (m.intro) return null;
  const renderInline = (parts) => parts.map((p, i) => {
    if (p.type === 'text') return p.bold ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>;
    if (p.type === 'cite' && (citationStyle === 'inline' || citationStyle === 'footnotes' || citationStyle === 'sources')) {
      return <button key={i} className="cite" onClick={()=>openDoc(p.doc, p.page)}>{p.n}</button>;
    }
    if (p.type === 'list') return <ul key={i}>{p.items.map((it,j)=><li key={j}>{it}</li>)}</ul>;
    return null;
  });
  return (
    <div className="msg assistant">
      <div className="msg-role"><div className="msg-role-mark">AI</div><span>Assistant{m.searching ? ` · searched ${m.searching}` : ''}</span></div>
      <div className="msg-body">
        {m.streaming ? (
          <p><span className="muted">Searching {m.searching || 'library'}…</span><span className="caret"></span></p>
        ) : m.parts ? (
          <p>{renderInline(m.parts)}</p>
        ) : <p>{m.text}</p>}
        {!m.streaming && m.sources && citationStyle === 'cards' && (
          <div className="cite-cards">
            {m.sources.map(s => (
              <button key={s.n} className="cite-card" onClick={()=>openDoc(s.doc, s.page)}>
                <div className="cite-card-num">[{s.n}]</div>
                <div className="cite-card-title">{s.doc.shortName}</div>
                <div className="cite-card-page">page {s.page}</div>
              </button>
            ))}
          </div>
        )}
        {!m.streaming && m.sources && citationStyle === 'sources' && (
          <div className="sources-strip">
            <div className="sources-head"><Icon name="citation" size={11} /> Sources</div>
            <div className="sources-list">
              {m.sources.map(s => (
                <button key={s.n} className="source-chip" onClick={()=>openDoc(s.doc, s.page)}>
                  <span className="source-chip-num">{s.n}</span>
                  <span>{s.doc.shortName}</span>
                  <span className="muted">p{s.page}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {!m.streaming && m.sources && citationStyle === 'footnotes' && (
          <div className="footnotes">
            {m.sources.map(s => (
              <div key={s.n} className="footnote" onClick={()=>openDoc(s.doc, s.page)}>
                <span className="footnote-num">{s.n}.</span>
                <div>
                  <div><strong>{s.doc.shortName}</strong> · <span className="mono-sm muted">page {s.page}</span></div>
                  {s.snippet && <div className="muted" style={{marginTop:2,fontSize:11,fontStyle:'italic'}}>"{s.snippet}"</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        {!m.streaming && (
          <div className="msg-actions">
            <button className="msg-action" title="Copy"><Icon name="copy" size={12} /></button>
            <button className="msg-action" title="Helpful"><Icon name="thumbs_up" size={12} /></button>
            <button className="msg-action" title="Not helpful"><Icon name="thumbs_down" size={12} /></button>
            <button className="msg-action" title="Regenerate"><Icon name="refresh" size={12} /></button>
            <button className="msg-action" title="Share"><Icon name="share" size={12} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

const PortalView = ({ tenant, citationStyle, openDoc }) => {
  const [state, setState] = React.useState(() => portalSeed(tenant));
  const [draft, setDraft] = React.useState('');
  const [active, setActive] = React.useState(null);
  const scrollRef = React.useRef(null);

  React.useEffect(() => { setState(portalSeed(tenant)); }, [tenant.id]);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.msgs.length, state.msgs[state.msgs.length-1]?.streaming]);

  const send = (text) => {
    const q = text.trim(); if (!q) return;
    setDraft('');
    const userMsg = { role:'user', text:q };
    const placeholder = { role:'assistant', streaming:true, searching:'library' };
    setState(s => ({ ...s, msgs: [...s.msgs.filter(m=>!m.intro), userMsg, placeholder] }));
    setTimeout(() => {
      const reply = buildAssistantReply(q, tenant);
      setState(s => {
        const msgs = [...s.msgs];
        msgs[msgs.length - 1] = { role:'assistant', ...reply, streaming:false };
        return { ...s, msgs };
      });
    }, 1100);
  };

  return (
    <div className="portal" style={{position:'relative'}}>
      <aside className="portal-side">
        <div className="portal-brand">
          <div className="portal-logo">{tenant.mark}</div>
          <div>
            <div className="portal-name">{tenant.name}</div>
            <div className="portal-name-sub">{tenant.short}</div>
          </div>
        </div>
        <button className="portal-newchat" onClick={()=>setState(portalSeed(tenant))}>
          <Icon name="plus" size={12} /> New conversation
        </button>
        <div className="portal-conv-section">
          <div className="portal-conv-label">Recent</div>
          {state.threads.map(t => (
            <div key={t.id} className={`portal-conv ${active===t.id ? 'active' : ''}`} onClick={()=>setActive(t.id)} title={t.title}>
              {t.title}
            </div>
          ))}
        </div>
        <div className="portal-foot">
          <div className="sb-avatar" style={{background:'var(--tenant-primary)'}}>JL</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:500,color:'var(--text)'}}>Jordan Lee</div>
            <div style={{fontSize:11,color:'var(--text-3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>jordan.lee@example.com</div>
          </div>
        </div>
      </aside>
      <main className="portal-main" style={{position:'relative'}}>
        <div className="portal-top">
          <div className="portal-top-title">Ask {tenant.name}</div>
          <div className="portal-top-actions">
            <span className="pill mono"><span className="dot" style={{background:'var(--ok)'}}></span>{tenant.docs.filter(d=>d.status==='ready').length} sources indexed</span>
            <button className="btn btn-ghost btn-icon"><Icon name="search" /></button>
            <button className="btn btn-ghost btn-icon"><Icon name="more" /></button>
          </div>
        </div>
        <div className="portal-thread" ref={scrollRef}>
          <div className="thread-inner">
            {state.msgs.length === 1 && state.msgs[0].intro && (
              <div className="welcome">
                <div className="portal-logo" style={{margin:'0 auto',width:48,height:48,borderRadius:12,fontSize:22}}>{tenant.mark}</div>
                <h1 className="welcome-h">{tenant.welcome}</h1>
                <p className="welcome-sub">{tenant.welcomeSub}</p>
                <div className="welcome-prompts">
                  {tenant.prompts.map((p,i) => <PromptCard key={i} p={p} onPick={pp=>send(pp.text)} />)}
                </div>
              </div>
            )}
            {state.msgs.filter(m=>!m.intro).map((m, i) => (
              <Message key={i} m={m} openDoc={openDoc} citationStyle={citationStyle} />
            ))}
          </div>
        </div>
        <div className="composer-wrap">
          <div className="composer">
            <textarea
              placeholder={`Ask anything about ${tenant.name.toLowerCase()}…`}
              value={draft}
              onChange={e=>setDraft(e.target.value)}
              onKeyDown={e=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(draft); } }}
              rows={1}
            />
            <button className="composer-send" onClick={()=>send(draft)} disabled={!draft.trim()}>
              <Icon name="arrow_up" size={13} />
            </button>
          </div>
          <div className="composer-foot">
            Answers cite your library. Verify clinical or financial specifics with the source document.
          </div>
        </div>
      </main>
    </div>
  );
};

window.PortalView = PortalView;