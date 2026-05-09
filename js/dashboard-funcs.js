// SPARKLINE
function sparkline(el) {
    const d = D.get();
    // Sparkline usa apenas despesas reais (sem teto)
    const pts = []; for (let i = -5; i <= 0; i++) { const m = am(App.curM, i), si = saldoIni(m), c = calc(m); pts.push({ m, v: si + c.ent - c.fix - c.car - c.proj - c.vari }) }
    if (pts.every(p => p.v === 0)) { el.innerHTML = `<div class="text-center py-4" style="color:var(--sub)"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 6px;opacity:.4"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg><p class="text-xs">Dados insuficientes</p><p style="font-size:10px;margin-top:2px">Preencha ao menos 2 meses</p></div>`; return }
    const vals = pts.map(p => p.v), mn = Math.min(...vals), mx = Math.max(...vals), rg = mx - mn || 1;
    const W = 360, H = 60, pd = 14;
    const points = vals.map((v, i) => { const x = pd + i * (W - 2 * pd) / (vals.length - 1); const y = H - pd - (v - mn) / rg * (H - 2 * pd - 12) - 10; return { x, y } });

    let crv = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length; i++) {
        if (i === 0) continue;
        const p0 = points[i - 1 === 0 ? 0 : i - 1];
        const p1 = points[i];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        crv += ` C${cp1x},${p0.y} ${cp2x},${p1.y} ${p1.x},${p1.y}`;
    }

    const areaData = `${crv} L${points[points.length - 1].x},${H - pd} L${points[0].x},${H - pd} Z`;
    const gridLines = [0.25, 0.5, 0.75].map(pct => { const y = H - pd - pct * (H - 2 * pd - 12) - 10; return `<line x1="${pd}" y1="${y}" x2="${W - pd}" y2="${y}" stroke="var(--border)" stroke-dasharray="2 4" stroke-width="1" opacity="0.5"/>` }).join('');

    const htmlLabs = `<div style="position:relative;height:18px;margin-top:6px;width:100%">` + pts.map((p, i) => { const x = pd + i * (W - 2 * pd) / (vals.length - 1); return `<span style="position:absolute;left:${(x / W) * 100}%;transform:translateX(-50%);font-size:11px;font-weight:600;color:var(--sub)">${MS[pm(p.m).m - 1]}</span>` }).join('') + `</div>`;
    const dots = points.map((p, i) => { return `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="var(--card)" stroke="var(--accent)" stroke-width="2.5" style="filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3))"><title>${ml(pts[i].m)}: ${fmt(pts[i].v)}</title></circle>` }).join('');

    el.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <span class="sl">Resumo da Tendência</span>
            <div class="ic ic-sm" style="background:rgba(52,211,153,0.1)"><span style="color:var(--green)"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg></span></div>
        </div>
        <div style="margin-top:-6px;position:relative;margin-bottom:8px;width:100%;overflow:visible">
            <svg viewBox="0 0 ${W} ${H - 2}" style="width:100%;height:auto;display:block;overflow:visible">
                <defs>
                    <linearGradient id="glowG" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35"/>
                        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.0"/>
                    </linearGradient>
                    <filter id="ds2" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="var(--accent)" flood-opacity="0.5"/>
                    </filter>
                </defs>
                ${gridLines}
                <path d="${areaData}" fill="url(#glowG)" />
                <path d="${crv}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#ds2)" />
                ${dots}
            </svg>
            ${htmlLabs}
        </div>`.replace(/>\s+</g, '><').trim();
}