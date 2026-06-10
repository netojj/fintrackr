const App = {
    curM: curMonth(),
    soConfirmados: false,
    selRecs: [],
    selectionMode: false,
    toggleSelectionMode() {
        this.selectionMode = !this.selectionMode;
        if (!this.selectionMode) { this.selRecs = []; this.updBulkBar(); }
        this.renderRec();
        const btn = document.getElementById('selModeBtn');
        if (btn) btn.classList.toggle('active', this.selectionMode);
    },
    setRealized(v) {
        this.soConfirmados = v;
        this.renderAll();
    },
    togPaid(id, mes = null) {
        const d = D.get();
        const key = mes ? `${id}_${mes}` : id;
        if (d.pagamentos[key]) delete d.pagamentos[key];
        else d.pagamentos[key] = true;
        D.save();
        this.renderAll();
    },
    togPaidCar(id, mes) {
        const d = D.get(), key = `${id}_${mes}`;
        if (d.faturasPagas[key]) delete d.faturasPagas[key];
        else d.faturasPagas[key] = true;
        D.save(); this.renderCar(); this.renderDash();
    },
    togPaidProj(id, mes) {
        const d = D.get(), key = `${id}_${mes}`;
        if (d.projetosPagos[key]) delete d.projetosPagos[key];
        else d.projetosPagos[key] = true;
        D.save(); this.renderProj(); this.renderDash();
    },
    bulkPayCard(cardName, mes) {
        const d = D.get();
        const active = d.cartoes.filter(c => {
            if (c.cartao !== cardName) return false;
            const ant = c.antecipacoes || [], len = c.qtdParcelas - ant.length;
            const last = am(c.dataPrimeiraParcela, len - 1);
            return mes >= c.dataPrimeiraParcela && mes <= last;
        });
        if (!active.length) return;
        const allPaid = active.every(c => d.faturasPagas[`${c.id}_${mes}`]);
        active.forEach(c => {
            const key = `${c.id}_${mes}`;
            if (allPaid) delete d.faturasPagas[key];
            else d.faturasPagas[key] = true;
        });
        D.save(); this.renderCar(); this.renderDash();
    },
    _openDD: new Set(),
    togDD(id) {
        if (this._openDD.has(id)) this._openDD.delete(id);
        else this._openDD.add(id);
    },
    togBulk(id, c) {
        if (c) { if (!this.selRecs.includes(id)) this.selRecs.push(id) }
        else this.selRecs = this.selRecs.filter(x => x !== id);
        this.updBulkBar();
    },
    clearBulk() { this.selRecs = []; this.renderRec(); this.updBulkBar(); },
    updBulkBar() {
        const b = document.getElementById('bulkBar'), c = document.getElementById('bulkCount');
        if (this.selRecs.length > 0) {
            b.classList.add('active');
            c.textContent = `${this.selRecs.length} selecionado${this.selRecs.length > 1 ? 's' : ''}`;
        } else b.classList.remove('active');
    },
    async bulkDel() {
        if (!this.selRecs.length) return;
        if (!await cfm2(`Excluir ${this.selRecs.length} itens?`, 'Ação irreversível.', 'Cancelar', 'Excluir', true)) return;
        const d = D.get(); d.receitas = d.receitas.filter(r => !this.selRecs.includes(r.id));
        D.save(); this.selRecs = []; this.renderAll(); this.updBulkBar(); toast('Excluídos!');
    },
    bulkCat() {
        if (!this.selRecs.length) return;
        const cat = prompt('Nova categoria para os itens selecionados:');
        if (!cat) return;
        const d = D.get(); d.receitas.forEach(r => { if (this.selRecs.includes(r.id)) r.cat = cat });
        D.save(); this.selRecs = []; this.renderAll(); this.updBulkBar(); toast('Categorias atualizadas!');
    },
    init() {
        D.load(); this.togglePrivacy(false);
        const catOpts = '<option value="">Sem categoria</option>' + Categ.map(c => `<option value="${c}">${c}</option>`).join('');
        document.getElementById('rCat').innerHTML = catOpts; document.getElementById('cCat').innerHTML = catOpts;
        document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => this.nav(b.dataset.tab)));
        mpRec = new MonthPicker('mpRec', this.curM);
        mpRecI = new MonthPicker('mpRecI', this.curM);
        mpCar = new MonthPicker('mpCar', this.curM);
        mpProjI = new MonthPicker('mpProjI', this.curM);
        mpProjE = new MonthPicker('mpProjE', this.curM);
        mpDiv = new MonthPicker('mpDiv', this.curM);
        mpAporte = new MonthPicker('mpAporte', this.curM);
        mpRendimento = new MonthPicker('mpRendimento', this.curM);
        mpProjAlvo = new MonthPicker('mpProjAlvo', this.curM);
        document.getElementById('secTitle').textContent = 'Dashboard';
        this.renderAll();

        // Auto-categorização
        document.getElementById('rNome').oninput = (e) => {
            const val = e.target.value.toLowerCase(), d = D.get();
            if (!d.automacoesCategoria) return;
            for (const kw in d.automacoesCategoria) {
                if (val.includes(kw)) { document.getElementById('rCat').value = d.automacoesCategoria[kw]; break; }
            }
        };

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
            const am = document.querySelector('.modal-bg.active,.cfm-bg.active');
            if (e.key === 'Escape' && am) { am.classList.remove('active'); return }
            if (am) return;
            if (e.key === '1') this.nav('dashboard');
            else if (e.key === '2') this.nav('receitas');
            else if (e.key === '3') this.nav('cartoes');
            else if (e.key === '4') this.nav('projetos');
            else if (e.key.toLowerCase() === 'n') { const a = document.querySelector('.nav-item.active'); if (!a) return; const t = a.dataset.tab; if (t === 'receitas') this.openRecModal(); else if (t === 'cartoes') this.openCarModal(); else if (t === 'projetos') this.openProjModal() }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); this.chgMonth(-1); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); this.chgMonth(1); }
        });

        // Touch swipe for month navigation (mobile)
        let _sx = 0, _sy = 0, _el = null;
        const main = document.getElementById('mainArea');
        main.addEventListener('touchstart', e => {
            _sx = e.touches[0].clientX; _sy = e.touches[0].clientY; _el = e.target;
        }, { passive: true });
        main.addEventListener('touchend', e => {
            // Ignorar swipe dentro de carrosséis, listas scrolláveis e cards interativos
            let node = _el;
            while (node && node !== main) {
                const s = getComputedStyle(node);
                if (s.overflowX === 'auto' || s.overflowX === 'scroll' || node.classList.contains('lr') || node.classList.contains('card-h')) return;
                node = node.parentElement;
            }
            const dx = e.changedTouches[0].clientX - _sx, dy = e.changedTouches[0].clientY - _sy;
            if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) {
                if (dx > 0) this.chgMonth(-1); else this.chgMonth(1);
            }
        }, { passive: true });

        // Sidebar toggle
        document.querySelector('.sidebar-header').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('collapsed'); document.getElementById('mainArea').classList.toggle('expanded') });

        // PWA Shortcuts & URL Params
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab')) this.nav(params.get('tab'));
        if (params.get('action') === 'new-transaction') setTimeout(() => this.openRecModal(), 100);
    },
    nav(tab) {
        const titles = { dashboard: 'Início', receitas: 'Transações', cartoes: 'Cartões', projetos: 'Caixinhas' };
        document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const sec = document.getElementById('sec-' + tab);
        if (sec) sec.classList.add('active');
        document.getElementById('secTitle').textContent = titles[tab] || '';

        const fab = document.getElementById('mainFab');
        if (fab) {
            // Revert to original plus icon for all tabs as requested
            fab.innerHTML = '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" /></svg>';

            if (tab === 'dashboard') {
                fab.onclick = () => document.getElementById('mFabMenu').classList.add('active');
            } else if (tab === 'receitas') {
                fab.onclick = () => document.getElementById('mFabTransacoes').classList.add('active');
            } else if (tab === 'cartoes') {
                fab.onclick = () => App.openCarModal();
            } else if (tab === 'projetos') {
                fab.onclick = () => App.openProjModal();
            }
        }
    },
    chgMonth(n) { this.curM = am(this.curM, n); this.renderAll(); this.updateTodayBtn() },
    goToday() { this.curM = curMonth(); this.renderAll(); this.updateTodayBtn() },
    updateTodayBtn() { document.getElementById('todayBtn').classList.toggle('visible', this.curM !== curMonth()) },
    openSettings() {
        this.renderContas();
        this.renderOrcCat();
        document.getElementById('mSettings').classList.add('active');
    },
    renderOrcCat() {
        const d = D.get(), el = document.getElementById('orcCatList'); if (!el) return;
        el.innerHTML = Categ.map(cat => {
            const lim = d.orcamentoCategorias[cat] || 0;
            return `<div class="flex items-center justify-between py-1"><span class="text-xs font-medium">${cat}</span><div class="flex items-center gap-2"><span class="text-xs" style="color:var(--sub)">${lim > 0 ? fmt(lim, true) : 'Sem limite'}</span><button class="bi bi-sm" onclick="App.editOrcCat('${cat}')">${IC.edit}</button></div></div>`;
        }).join('');
    },
    editOrcCat(cat) {
        const d = D.get();
        const v = prompt(`Limite mensal para ${cat}:`, d.orcamentoCategorias[cat] || '');
        if (v === null) return;
        d.orcamentoCategorias[cat] = +v || 0;
        D.save(); this.renderOrcCat(); this.renderAll();
    },
    setOrcVar() {
        const d = D.get();
        const val = prompt('Defina o teto mensal para gastos avulsos (R$):', d.orcamentoVariavel || '');
        if (val === null) return;
        d.orcamentoVariavel = +val || 0;
        d.save(); this.renderAll(); toast(+val > 0 ? 'Teto definido: ' + fmt(+val, true) : 'Teto removido');
    },
    getWealthProjection() {
        const now = curMonth(); let totalS = 0, count = 0;
        for (let i = 1; i <= 4; i++) {
            const m = am(now, -i), c = calc(m);
            if (c.ent > 0) { totalS += (c.ent - (c.fix + c.car + c.proj + c.vari)); count++; }
        }
        const avg = count > 0 ? totalS / count : 0;
        const c = calc(now), curBal = (saldoIni(now) || 0) + c.ent - (c.fix + c.car + c.proj + c.vari);
        return { avg, p6: curBal + avg * 6, p12: curBal + avg * 12, p24: curBal + avg * 24 };
    },
    renderAll() {
        const d = D.get();
        // Detectar órfãs com múltiplas contas
        if (d.contas.length > 1) {
            const orfas = d.receitas.filter(r => !r.contaId || !d.contas.find(c => c.id === r.contaId)).length;
            const banner = document.getElementById('orphanBanner');
            if (banner) {
                if (orfas > 0) {
                    banner.style.display = 'flex';
                    banner.innerHTML = `<svg width="16" height="16" fill="none" stroke="#fbbf24" stroke-width="2" viewBox="0 0 24 24" class="shrink-0"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>${orfas} transaç${orfas > 1 ? 'ões' : 'ão'} sem conta vinculada</span><button class="btn btn-sm" style="padding:4px 10px;font-size:10px;background:var(--accent);color:#fff;border:none;margin-left:auto" onclick="App.fixOrphans()">Vincular</button>`;
                } else { banner.style.display = 'none'; }
            }
        }
        this.renderDash(); this.renderRec(); this.renderCar(); this.renderProj(); this.renderContas();
    },
    closeM(id) { document.getElementById(id).classList.remove('active') },
    async fixOrphans() {
        const d = D.get();
        const orfas = d.receitas.filter(r => !r.contaId || !d.contas.find(c => c.id === r.contaId));
        if (!orfas.length) return;
        // Montar seletor de conta destino
        const opts = d.contas.map(c => `"${c.nome}"`).join(', ');
        const destino = d.contas[0];
        if (!await cfm2(`Vincular ${orfas.length} transaç${orfas.length > 1 ? 'ões' : 'ão'}?`, `Ser${orfas.length > 1 ? 'ão' : 'á'} vinculada${orfas.length > 1 ? 's' : ''} a "${destino.nome}".`, 'Cancelar', 'Vincular', false)) return;
        orfas.forEach(r => { r.contaId = destino.id });
        D.save();
        this.renderAll();
        toast(`${orfas.length} transaç${orfas.length > 1 ? 'ões vinculadas' : 'ão vinculada'}!`);
    },

    renderDash() {
        const d = D.get();
        document.getElementById('mLabel').textContent = ml(this.curM);
        this.updateTodayBtn();

        // Always calculate BOTH projected and confirmed
        const c = calc(this.curM, false);
        const cConf = calc(this.curM, true);
        const si = saldoIni(this.curM, false);

        const isCurOrFuture = this.curM >= curMonth();
        // Despesas reais (SEM teto fantasma)
        const ts = c.fix + c.car + c.proj + c.vari;
        const sf = si + c.ent - ts;
        const hc = sf >= 0 ? 'var(--green)' : 'var(--red)';

        // ─── Saldo Atual (confirmado) ───
        const siConf = saldoIni(this.curM, true);
        const tsConf = cConf.fix + cConf.car + cConf.proj + cConf.vari;
        const saldoAtual = siConf + cConf.ent - tsConf;
        const saColor = saldoAtual >= 0 ? 'var(--green)' : 'var(--red)';

        // ─── Disponibilidade (Saldo Atual − pendentes) ───
        const faturasPendentes = c.car - cConf.car;
        const despPendentes = (c.fix - cConf.fix) + faturasPendentes + (c.proj - cConf.proj) + (c.vari - cConf.vari);
        const dinheiroLivre = saldoAtual - despPendentes;
        const dlColor = dinheiroLivre >= 0 ? 'var(--green)' : 'var(--red)';

        // ─── Orçamento Avulsos (referência visual apenas) ───
        const tetoVal = d.orcamentoVariavel || 0;
        const tetoPct = tetoVal > 0 ? Math.min(100, (c.vari / tetoVal) * 100) : 0;
        const tetoRestante = tetoVal > 0 ? Math.max(0, tetoVal - c.vari) : 0;
        const tetoColor = tetoPct > 90 ? 'var(--red)' : tetoPct > 70 ? '#fbbf24' : '#22d3ee';

        // Semáforo saúde financeira (SVG)
        const svgCircle = (cor) => `<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="${cor}"/></svg>`;
        let semaforoIcon = svgCircle('#34d399'), semaforoLabel = 'Saudável', semaforoCor = 'var(--green)', semaforoTip = 'Despesas dentro do orçamento';
        if (c.ent <= 0) {
            semaforoIcon = svgCircle('#f87171'); semaforoLabel = 'Sem renda'; semaforoCor = 'var(--red)'; semaforoTip = 'Nenhuma receita registrada neste mês';
        } else if (ts > c.ent) {
            semaforoIcon = svgCircle('#f87171'); semaforoLabel = 'Cuidado'; semaforoCor = 'var(--red)'; semaforoTip = 'Despesas (' + fmt(ts, true) + ') superam a renda (' + fmt(c.ent, true) + ')';
        } else if (ts / c.ent > 0.8) {
            semaforoIcon = svgCircle('#fbbf24'); semaforoLabel = 'Atenção'; semaforoCor = '#fbbf24'; semaforoTip = 'Despesas consomem mais de 80% da renda';
        }
        // Projeção de emergência
        const avgDesp3m = (() => {
            let total = 0, count = 0;
            for (let i = 1; i <= 3; i++) {
                const pm_ = am(this.curM, -i), cm = calc(pm_);
                const t = cm.fix + cm.car + cm.proj + cm.vari;
                if (t > 0) { total += t; count++; }
            }
            return count > 0 ? total / count : ts;
        })();
        const mesesReserva = avgDesp3m > 0 ? Math.floor(sf / avgDesp3m) : (sf > 0 ? 99 : 0);
        const reservaText = mesesReserva >= 99 ? '∞' : mesesReserva.toString();
        const reservaCor = mesesReserva >= 6 ? 'var(--green)' : mesesReserva >= 3 ? '#fbbf24' : 'var(--red)';
        const shieldSvg = `<svg width="12" height="12" fill="none" stroke="${reservaCor}" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

        // ─── Adaptive Hero ───
        const isCurrent = this.curM === curMonth();
        const isPast = this.curM < curMonth();
        const isFuture = this.curM > curMonth();

        let heroLabel, heroValue, heroColor, heroSubtext, heroIconBg, heroIcon;
        let subCardHtml;

        if (isCurrent) {
            // ── MÊS ATUAL: Saldo Atual (confirmado) + Ainda a Pagar / Sobra ──
            heroLabel = 'Saldo Atual';
            heroValue = saldoAtual;
            heroColor = saColor;
            heroSubtext = `Receitas pagas ${fmt(cConf.ent, true)} − Despesas pagas ${fmt(tsConf, true)}`;
            heroIconBg = saldoAtual >= 0 ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)';
            heroIcon = saldoAtual >= 0 ? IC.chk : IC.warn;
            subCardHtml = `
<div style="min-width:0;text-align:center;flex:1">
  <p style="font-size:9px;font-weight:600;color:var(--sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Ainda a Pagar</p>
  <p style="font-size:16px;font-weight:800;color:#fbbf24">${fmt(despPendentes)}</p>
</div>
<div style="width:1px;height:32px;background:rgba(255,255,255,0.06);flex-shrink:0"></div>
<div style="min-width:0;text-align:center;flex:1">
  <p style="font-size:9px;font-weight:600;color:var(--sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Sobra do Mês</p>
  <p style="font-size:16px;font-weight:800;color:${dlColor}">${fmt(dinheiroLivre)}</p>
</div>
${tetoVal > 0 ? `<div style="width:100%;margin-top:12px;padding-top:12px;border-top:1px dashed rgba(255,255,255,0.06)">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
    <span style="font-size:9px;font-weight:600;color:var(--sub);text-transform:uppercase;letter-spacing:1px">Orçamento Avulso</span>
    <span style="font-size:11px;font-weight:700;color:${tetoColor}">${fmt(c.vari, true)} / ${fmt(tetoVal, true)}</span>
  </div>
  <div class="pbar" style="height:5px"><div class="pfill anim-pbar" data-width="${tetoPct}%" style="width:0%;background:${tetoColor}"></div></div>
</div>` : ''}`;
        } else if (isFuture) {
            // ── MÊS FUTURO: Saldo Projetado (sem teto) ──
            heroLabel = 'Saldo Projetado';
            heroValue = sf;
            heroColor = hc;
            heroSubtext = `Receitas ${fmt(c.ent, true)} − Despesas ${fmt(ts, true)}`;
            heroIconBg = 'rgba(139,92,246,.12)';
            heroIcon = `<svg width="18" height="18" fill="none" stroke="var(--purple)" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
            // Extrato de transição: explica de onde vem o saldo
            const siPrev = saldoIni(this.curM, false);
            subCardHtml = `
<div style="min-width:0;text-align:center;flex:1">
  <p style="font-size:9px;font-weight:600;color:var(--sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Receitas</p>
  <p style="font-size:16px;font-weight:800;color:var(--green)">${fmt(c.ent)}</p>
</div>
<div style="width:1px;height:32px;background:rgba(255,255,255,0.06);flex-shrink:0"></div>
<div style="min-width:0;text-align:center;flex:1">
  <p style="font-size:9px;font-weight:600;color:var(--sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Despesas</p>
  <p style="font-size:16px;font-weight:800;color:var(--red)">${fmt(ts)}</p>
</div>
<div style="width:100%;margin-top:12px;padding-top:12px;border-top:1px dashed rgba(255,255,255,0.06)">
  <details style="cursor:pointer">
    <summary style="font-size:9px;font-weight:600;color:var(--accent2);text-transform:uppercase;letter-spacing:1px;list-style:none;display:flex;align-items:center;justify-content:center;gap:4px"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>Ver Resumo Projetado</summary>
    <div style="margin-top:10px;font-size:11px;color:var(--sub);line-height:2;text-align:left;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:10px">
      <div style="display:flex;justify-content:space-between"><span>Saldo anterior</span><b style="color:var(--text)">${fmt(siPrev, true)}</b></div>
      <div style="display:flex;justify-content:space-between"><span>+ Receitas</span><b style="color:var(--green)">${fmt(c.ent, true)}</b></div>
      <div style="display:flex;justify-content:space-between"><span>− Contas Fixas</span><b style="color:var(--red)">-${fmt(c.fix, true)}</b></div>
      <div style="display:flex;justify-content:space-between"><span>− Cartões</span><b style="color:var(--orange)">-${fmt(c.car, true)}</b></div>
      ${c.vari > 0 ? `<div style="display:flex;justify-content:space-between"><span>− Dia-a-dia</span><b style="color:#22d3ee">-${fmt(c.vari, true)}</b></div>` : ''}
      ${c.proj > 0 ? `<div style="display:flex;justify-content:space-between"><span>− Caixinhas</span><b style="color:var(--purple)">-${fmt(c.proj, true)}</b></div>` : ''}
      <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.06);padding-top:6px;margin-top:6px"><b>= Saldo Projetado</b><b style="color:${hc}">${fmt(sf, true)}</b></div>
    </div>
  </details>
</div>`;
        } else {
            // ── MÊS PASSADO: Saldo Final ──
            heroLabel = 'Saldo Final';
            heroValue = sf;
            heroColor = hc;
            heroSubtext = `Receitas ${fmt(c.ent, true)} − Despesas ${fmt(ts, true)}`;
            heroIconBg = 'rgba(139,92,246,.06)';
            heroIcon = `<svg width="18" height="18" fill="none" stroke="var(--sub)" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
            subCardHtml = `
<div style="min-width:0;text-align:center;flex:1">
  <p style="font-size:9px;font-weight:600;color:var(--sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Receitas</p>
  <p style="font-size:16px;font-weight:800;color:var(--green)">${fmt(c.ent)}</p>
</div>
<div style="width:1px;height:32px;background:rgba(255,255,255,0.06);flex-shrink:0"></div>
<div style="min-width:0;text-align:center;flex:1">
  <p style="font-size:9px;font-weight:600;color:var(--sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Despesas</p>
  <p style="font-size:16px;font-weight:800;color:var(--red)">${fmt(ts)}</p>
</div>`;
        }

        // Saldo por conta (dinâmico — confirmado p/ atual, projetado p/ futuro)
        const contaPills = (d.contas && d.contas.length > 0) ? d.contas.map(ct => {
            const cor = ct.cor || 'var(--accent)';
            const saldo = isFuture ? saldoConta(ct.id, this.curM, false) : saldoConta(ct.id, this.curM, true);
            const sColor = saldo >= 0 ? cor : 'var(--red)';
            return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${cor}15;color:${sColor};white-space:nowrap"><span style="width:6px;height:6px;border-radius:50%;background:${cor};flex-shrink:0"></span>${ct.nome} ${fmt(saldo)}</span>`;
        }).join('') : '';
        const contaRow = contaPills ? `<div class="accounts-scroll mt-2">${contaPills}</div>` : '';

        document.getElementById('dHero').innerHTML = `<div class="hero card" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px 20px">
      <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:24px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.04);margin-bottom:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.02)">
        <span style="display:flex;align-items:center;color:${semaforoCor}">${semaforoIcon}</span>
        <span style="font-size:10px;font-weight:700;color:var(--text);letter-spacing:0.5px;text-transform:uppercase">${semaforoLabel}</span>
      </div>
      <p class="sl" style="font-size:11px;letter-spacing:1px;margin-bottom:4px">${heroLabel}</p>
      <p class="sv animate-val" data-val="${heroValue}" style="font-size:44px;font-weight:800;letter-spacing:-1.5px;color:${heroColor};margin-bottom:4px">${fmt(heroValue)}</p>
      <p style="font-size:12px;color:var(--sub);font-weight:500;margin-bottom:28px">${heroSubtext}</p>
      <div style="width:100%;max-width:380px;padding:16px 20px;border-radius:16px;background:rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.03);display:flex;flex-wrap:wrap;align-items:center;gap:16px;justify-content:space-between">
        ${subCardHtml}
      </div>
      <div style="margin-top:24px;display:flex;flex-direction:column;align-items:center;gap:10px">
        ${contaRow}
        <div class="flex items-center gap-2" style="font-size:10px;color:var(--sub);margin-top:2px"><span style="color:${reservaCor};font-weight:600;display:inline-flex;align-items:center;gap:4px">${shieldSvg} Colchão de emergência: ${reservaText} ${mesesReserva === 1 ? 'mês' : 'meses'}</span></div>
      </div>
</div>`;
        const orcElDash = d.orcamentoVariavel > 0 ? `<button class="bi" title="Editar teto" onclick="App.setOrcVar()" style="width:auto;padding:2px 6px;font-size:9px;gap:2px;height:auto;${(c.vari > d.orcamentoVariavel) ? 'color:var(--red)' : ''}">teto: ${fmt(d.orcamentoVariavel, true)}</button>` : `<button class="bi" title="Definir teto" onclick="App.setOrcVar()" style="width:auto;padding:2px 6px;font-size:9px;gap:2px;height:auto"><svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Teto</button>`;
        const cards = [
            { l: 'Resultado do Mês', v: c.ent - ts, vc: cConf.ent - (cConf.fix + cConf.car + cConf.proj + cConf.vari), cls: (c.ent - ts >= 0) ? 'color:var(--green)' : 'color:var(--red)', bg: 'rgba(107,107,128,.1)', ic: '<svg width="16" height="16" fill="none" stroke="var(--sub)" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' },
            { l: 'Receitas', v: c.ent, vc: cConf.ent, cls: 'color:var(--text)', bg: 'rgba(52,211,153,.1)', ic: '<svg width="16" height="16" fill="none" stroke="var(--green)" stroke-width="1.8" viewBox="0 0 24 24"><path d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>' },
            { l: 'Contas Fixas', v: c.fix, vc: cConf.fix, cls: 'color:var(--text)', bg: 'rgba(248,113,113,.1)', ic: '<svg width="16" height="16" fill="none" stroke="var(--red)" stroke-width="1.8" viewBox="0 0 24 24"><path d="M7 13l5 5m0 0l5-5m-5 5V6" /></svg>' },
            { l: 'Dia-a-dia', v: c.vari, vc: cConf.vari, cls: 'color:var(--text)', bg: 'rgba(6,182,212,.1)', ic: '<svg width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.8" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>', extra: orcElDash },
            { l: 'Cartões', v: c.car, vc: cConf.car, cls: 'color:var(--text)', bg: 'rgba(251,191,36,.1)', ic: '<svg width="16" height="16" fill="none" stroke="var(--orange)" stroke-width="1.8" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>' },
            { l: 'Caixinhas', v: c.proj, vc: cConf.proj, cls: 'color:var(--text)', bg: 'rgba(167,139,250,.1)', ic: '<svg width="16" height="16" fill="none" stroke="var(--purple)" stroke-width="1.8" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" /></svg>' }
        ];
        // Comparativo com mês anterior
        const prevM = am(this.curM, -1), cPrev = calc(prevM), tsPrev = cPrev.fix + cPrev.car + cPrev.proj + cPrev.vari;
        const balNow = c.ent - ts, balPrev = cPrev.ent - tsPrev;
        let compHtml = '';
        if (balPrev !== 0) {
            const pctChange = ((balNow - balPrev) / Math.abs(balPrev)) * 100;
            const arrow = pctChange >= 0 ? '▲' : '▼';
            const compCor = pctChange >= 0 ? 'var(--green)' : 'var(--red)';
            compHtml = `<span style="font-size:9px;font-weight:600;color:${compCor};margin-left:4px">${arrow} ${Math.abs(pctChange).toFixed(0)}%</span>`;
        } else if (balNow !== 0) {
            compHtml = `<span style="font-size:9px;font-weight:600;color:var(--green);margin-left:4px">● novo</span>`;
        }
        
        const wp = this.getWealthProjection();
        const wpCard = `<div class="flex items-center justify-between mb-2"><span class="sl">Futuro Financeiro</span><div class="ic ic-sm" style="background:rgba(139,92,246,0.1);color:var(--purple)"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div></div>
        <div class="flex flex-col gap-1">
            <div class="flex justify-between items-center"><span class="text-[10px]" style="color:var(--sub)">Em 6 meses</span><b class="text-xs" style="color:var(--purple)">${fmt(wp.p6)}</b></div>
            <div class="flex justify-between items-center"><span class="text-[10px]" style="color:var(--sub)">Em 1 ano</span><b class="text-xs" style="color:var(--accent2)">${fmt(wp.p12)}</b></div>
            <div class="flex justify-between items-center"><span class="text-[10px]" style="color:var(--sub)">Em 2 anos</span><b class="text-xs" style="color:var(--green)">${fmt(wp.p24)}</b></div>
        </div>
        <p class="text-[8px] mt-1.5" style="color:var(--sub);line-height:1.2">Com base na média de sobras dos últimos 4 meses (${fmt(wp.avg, true)}/mês)</p>`;

        document.getElementById('dCards').innerHTML = cards.map((x, i) => {
            const comp = x.l === 'Resultado do Mês' ? compHtml : '';
            const confLine = (x.vc !== x.v) ? `<p style="font-size:9px;color:var(--green);margin-top:2px">✓ ${fmt(x.vc, true)} confirmado</p>` : '';
            const extraBtn = x.extra || '';
            return `<div class="card card-sm card-h stagger"><div class="flex items-center justify-between mb-1"><span class="sl" style="font-size:10px">${x.l}</span><div class="flex items-center gap-2">${extraBtn}<div class="ic ic-sm" style="background:${x.bg}">${x.ic}</div></div></div><p class="sv text-lg animate-val" data-val="${x.v}" style="${x.cls}">${fmt(x.v, true)}${comp}</p>${confLine}</div>`;
        }).join('');

        const dW = document.getElementById('dWealth');
        if (dW) dW.innerHTML = wpCard;

        // Futuro Financeiro (sidebar)
           // Uso da renda
        const pct = c.ent > 0 ? (ts / c.ent) * 100 : 0;
        const rHc = pct > 100 ? 'var(--red)' : pct > 90 ? '#fbbf24' : 'var(--accent)';
        const sobra = c.ent - ts;
        const resumoMsg = pct > 100 ? `Você gastou <b style="color:var(--red)">${fmt(ts, true)}</b> — isso é <b style="color:var(--red)">${fmt(Math.abs(sobra), true)} a mais</b> do que ganhou.`
            : pct > 90 ? `Você usou <b style="color:#fbbf24">${pct.toFixed(0)}%</b> da renda. Só sobram <b style="color:#fbbf24">${fmt(sobra, true)}</b>.`
            : `Você usou <b style="color:var(--accent)">${pct.toFixed(0)}%</b> da renda. Sobram <b style="color:var(--green)">${fmt(sobra, true)}</b> este mês.`;
        document.getElementById('dResumo').innerHTML = `
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 shrink-0">
                <div class="ic ic-sm" style="background:rgba(99,102,241,0.1);color:var(--accent)"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
                <div>
                    <span class="sl" style="margin-bottom:0">Resumo da Renda</span>
                    <p style="font-size:12px;color:var(--text);line-height:1.4;margin-top:2px">${resumoMsg}</p>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="pbar" style="height:6px;border-radius:3px;background:var(--bg3)">
                    <div class="pfill anim-pbar" data-width="${Math.min(pct, 100)}%" style="width:0%;border-radius:3px;background:${pct > 100 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : pct > 90 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,var(--accent),var(--purple))'}"></div>
                </div>
                <div class="flex justify-between mt-1" style="font-size:10px;color:var(--sub)">
                    <span>Saídas: <b style="color:var(--text)">${fmt(ts)}</b></span>
                    <span>Renda: <b style="color:var(--text)">${fmt(c.ent)}</b></span>
                </div>
            </div>
        </div>`;

        // Donut (usa despesas reais, sem teto)
        donut(document.getElementById('dBreak'), [{ l: 'Contas Fixas', v: c.fix, c: 'var(--red)' }, { l: 'Dia-a-dia', v: c.vari, c: 'var(--cyan)' }, { l: 'Cartões', v: c.car, c: 'var(--orange)' }, { l: 'Caixinhas', v: c.proj, c: 'var(--purple)' }], ts);
        // Sparkline
        sparkline(document.getElementById('dSparkline'));
        // Annual (compact in-card)
        this.renderAnnual();
        // Transações recentes
        this.renderRecent();
        this.render5030();
        this.renderCatBudget();
        this.renderOrcBars();

        // ─── Micro-Animations Trigger ───
        setTimeout(() => {
            // Animate Progress Bars
            document.querySelectorAll('.anim-pbar').forEach(el => {
                if (el.dataset.width) el.style.width = el.dataset.width;
            });
            // Animate Numbers
            if (!document.body.classList.contains('priv-mode')) {
                document.querySelectorAll('.animate-val').forEach(el => {
                    const target = parseFloat(el.dataset.val);
                    if (isNaN(target) || target === 0) return;
                    const duration = 800; // ms
                    const startTime = performance.now();
                    const origHTML = el.innerHTML;
                    
                    const step = (now) => {
                        const progress = Math.min((now - startTime) / duration, 1);
                        const current = progress * target;
                        const formatted = current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        
                        // We preserve the original HTML structure (like .pv tags or sub-spans) if needed,
                        // but for simplicity during animation we just set the text, then restore original structure at 100%
                        const pvVal = el.querySelector('.pv-val');
                        if (pvVal) {
                            pvVal.textContent = formatted;
                        } else {
                            // If there's an inner compHtml span, save it
                            const spanNode = el.querySelector('span[style*="margin-left"]');
                            el.textContent = formatted;
                            if (spanNode) el.appendChild(spanNode);
                        }
                        
                        if (progress < 1) {
                            requestAnimationFrame(step);
                        } else {
                            el.innerHTML = origHTML;
                        }
                    };
                    requestAnimationFrame(step);
                    el.classList.remove('animate-val'); // prevent re-animating
                });
            }
        }, 50);
    },
    renderOrcBars() {
        const d = D.get(), el = document.getElementById('recOrcBars'), now = this.curM;
        if (!el) return;
        const cats = calcByCategory(now);
        const items = Object.entries(d.orcamentoCategorias || {}).filter(([_, lim]) => lim > 0);
        if (!items.length) { el.innerHTML = ''; return; }
        el.innerHTML = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">' + items.map(([cat, lim]) => {
            const spent = cats[cat] || 0;
            const pct = Math.min(100, (spent / lim) * 100);
            const color = pct > 90 ? 'var(--red)' : 'var(--accent)';
            return `<div class="card card-sm p-3 stagger"><div class="flex justify-between mb-1"><span class="text-xs font-bold">${cat}</span><span class="text-xs" style="color:${color}">${fmt(spent, true)} / ${fmt(lim, true)}</span></div><div class="pbar" style="height:6px;background:var(--bg3)"><div class="pfill anim-pbar" data-width="${pct}%" style="width:0%;background:${color}"></div></div></div>`;
        }).join('') + '</div>';
    },
    renderAnnual() {
        const { y } = pm(this.curM); const rows = [];
        // Atualiza o label do toggle no mobile com o ano
        const toggleLbl = document.getElementById('annualToggleLabel');
        if (toggleLbl) toggleLbl.textContent = `Visão Anual ${y}`;
        const curStr = curMonth(); const d = D.get();
        for (let m = 1; m <= 12; m++) {
            const k = mk(y, m), si = saldoIni(k), c = calc(k);
            // Visão anual usa despesas reais (sem teto)
            const tsAnual = c.fix + c.car + c.proj + c.vari;
            const sf = si + c.ent - tsAnual; const isCur = k === this.curM;
            rows.push(`<tr style="border-bottom:1px solid rgba(255,255,255,0.03);${isCur ? 'background:rgba(99,102,241,.15);border-left:3px solid var(--accent)' : ''}"><td style="padding:6px 6px;font-size:10.5px;font-weight:${isCur ? '700' : '500'};color:${isCur ? 'var(--accent2)' : 'var(--text)'}">${MS[m - 1]}</td><td style="padding:6px 6px;font-size:10.5px;color:var(--text);text-align:right">${fmt(c.ent, true)}</td><td style="padding:6px 6px;font-size:10.5px;color:var(--text);text-align:right">${fmt(tsAnual, true)}</td><td style="padding:6px 6px;font-size:10.5px;font-weight:700;color:${sf >= 0 ? 'var(--green)' : 'var(--red)'};text-align:right">${fmt(sf)}</td></tr>`)
        }
        document.getElementById('dAnnual').innerHTML = `<p class="text-xs font-bold mb-3">${y} — Visão Anual</p><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid var(--border)"><th style="padding:6px 6px;font-size:9px;font-weight:700;text-transform:uppercase;color:var(--sub);text-align:left">Mês</th><th style="padding:6px 6px;font-size:9px;font-weight:700;text-transform:uppercase;color:var(--sub);text-align:right">Entradas</th><th style="padding:6px 6px;font-size:9px;font-weight:700;text-transform:uppercase;color:var(--sub);text-align:right">Saídas</th><th style="padding:6px 6px;font-size:9px;font-weight:700;text-transform:uppercase;color:var(--sub);text-align:right">Saldo Caixa</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
    },
    renderRecent() {
        const d = D.get(), now = this.curM, el = document.getElementById('dRecent');
        if (!el) return;
        // Pegar todas as transações ativas no mês atual
        const isActive = r => {
            if (r.repeticao === 'mensal') return !(r.mesInicio && now < r.mesInicio);
            if (r.repeticao === 'parcelado') return r.mesInicio && now >= r.mesInicio && now <= am(r.mesInicio, (r.qtdMeses || 1) - 1);
            return r.mesUnico === now;
        };
        const active = d.receitas.filter(isActive).slice(-5);
        if (!active.length) {
            el.style.display = 'block';
            el.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="sl">Movimentações do Mês</span>
            </div>
            <div class="text-center py-8" style="color:var(--sub)">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto 6px; opacity: 0.4;"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 5v2m12-2v2m-12 10v2m12-2v2"/></svg>
                <p class="font-bold text-xs" style="color:var(--text)">Nenhuma movimentação</p>
                <p style="font-size:10px;margin-top:2px;color:var(--sub)">Suas transações do mês selecionado aparecerão listadas aqui.</p>
            </div>`;
            return;
        }
        el.style.display = 'block';
        const items = active.map(r => {
            const isEnt = r.tipo === 'entrada';
            const cor = isEnt ? 'var(--green)' : 'var(--red)';
            const icon = isEnt ? '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>' : '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M7 13l5 5m0 0l5-5m-5 5V6" /></svg>';
            const conta = d.contas.find(c => c.id === r.contaId);
            const contaName = conta ? conta.nome : '';
            return `<div class="flex items-center gap-2 py-2" style="border-bottom:1px solid rgba(255,255,255,.04)"><div class="ic ic-sm shrink-0" style="background:${isEnt ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)'}"><span style="color:${cor};display:flex;align-items:center;justify-content:center">${icon}</span></div><div class="min-w-0 flex-1"><p class="font-semibold text-xs truncate">${r.nome}</p>${contaName ? `<p style="font-size:9px;color:var(--sub)">${contaName}</p>` : ''}</div><span class="font-bold text-xs shrink-0" style="color:${cor}">${isEnt ? '+' : '-'}${fmt(r.valor, true)}</span></div>`;
        }).join('');
        el.innerHTML = `<div class="flex items-center justify-between mb-2"><span class="sl">Movimentações do Mês</span><span style="font-size:9px;color:var(--sub)">${active.length} iten${active.length > 1 ? 's' : ''}</span></div>${items}`;
    },
    render5030() {
        const el = document.getElementById('d5030');
        if (!el) return;
        const cats = calcByCategory(this.curM), c = calc(this.curM);
        const ts = c.fix + c.car + c.proj + c.vari;
        if (ts <= 0) {
            el.innerHTML = `
            <p class="sl mb-2">Saúde Financeira</p>
            <div class="text-center py-6" style="color:var(--sub)">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto 6px; opacity: 0.4;"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <p class="font-bold text-xs" style="color:var(--text)">Análise de Saúde Financeira</p>
                <p style="font-size:10px;margin-top:2px;color:var(--sub)">Lançamentos de despesas classificarão seus gastos na regra 50-30-20.</p>
            </div>`;
            return;
        }
        let nec = 0, des = 0, inv = 0;
        Object.entries(cats).forEach(([cat, val]) => {
            const cls = CatClass[cat] || 'D';
            if (cls === 'N') nec += val; else if (cls === 'I') inv += val; else des += val;
        });
        // Caixinhas contam como investimento
        inv += c.proj;
        const total = nec + des + inv;
        const pN = total > 0 ? (nec / total * 100) : 0, pD = total > 0 ? (des / total * 100) : 0, pI = total > 0 ? (inv / total * 100) : 0;
        const bar = (pct, ideal, cor, label) => {
            const over = pct > ideal;
            return `<div class="mb-3"><div class="flex justify-between items-baseline mb-1"><span class="text-xs font-semibold">${label}</span><span class="text-xs font-bold" style="color:${over ? 'var(--red)' : cor}">${pct.toFixed(0)}% <span style="font-size:9px;color:var(--sub);font-weight:400">/ ${ideal}%</span></span></div><div class="pbar" style="height:6px;border-radius:3px;background:var(--bg3)"><div class="pfill anim-pbar" data-width="${Math.min(pct, 100)}%" style="width:0%;border-radius:3px;background:${over ? 'linear-gradient(90deg,' + cor + ',var(--red))' : cor}"></div></div></div>`;
        };
        el.innerHTML = `<p class="sl mb-3">Saúde Financeira</p>${bar(pN, 50, 'var(--green)', 'Necessidades')}\n${bar(pD, 30, 'var(--orange)', 'Desejos')}\n${bar(pI, 20, 'var(--accent)', 'Investimentos')}<div class="text-xs mt-1" style="color:var(--sub)">Base: ${fmt(total)} em despesas</div>`;
    },
    togglePrivacy(toggle = true) {
        let isPriv = localStorage.getItem('priv-mode') === 'true';
        if (toggle) {
            isPriv = !isPriv;
            localStorage.setItem('priv-mode', isPriv);
        }
        document.body.classList.toggle('priv-mode', isPriv);
        const btn = document.getElementById('privIcon');
        if (btn) {
            btn.innerHTML = isPriv
                ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
                : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        }
        if (toggle) toast(isPriv ? 'Modo Privado Ativado' : 'Modo Privado Desativado');
    },

    renderCatBudget() {
        const el = document.getElementById('dCatBudget');
        if (!el) return;
        const cats = calcByCategory(this.curM), d = D.get();
        const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
        if (!entries.length) {
            el.innerHTML = `
            <p class="sl mb-2">Gastos por Categoria</p>
            <div class="text-center py-6" style="color:var(--sub)">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto 6px; opacity: 0.4;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01"/></svg>
                <p class="font-bold text-xs" style="color:var(--text)">Gastos por Categoria</p>
                <p style="font-size:10px;margin-top:2px;color:var(--sub)">Suas despesas categorizadas aparecerão detalhadas aqui.</p>
            </div>`;
            return;
        }
        const maxVal = entries[0][1];
        const catColors = { 'Alimentação': '#f59e0b', 'Moradia': '#ef4444', 'Transporte': '#3b82f6', 'Saúde': '#10b981', 'Educação': '#8b5cf6', 'Lazer': '#ec4899', 'Assinaturas': '#6366f1', 'Serviços': '#14b8a6', 'Compras': '#f97316', 'Outros': '#6b7280', 'Sem categoria': '#6b7280', 'Cartões': '#fbbf24' };
        const orcCat = d.orcamentoCategorias || {};
        const rows = entries.map(([cat, val]) => {
            const pct = maxVal > 0 ? (val / maxVal * 100) : 0;
            const cor = catColors[cat] || '#6b7280';
            const orc = orcCat[cat];
            const overBudget = orc && val > orc;
            const budgetPct = orc ? Math.min(val / orc * 100, 100) : 0;
            return `<div class="mb-2"><div class="flex justify-between items-baseline"><span class="text-xs font-medium truncate" style="max-width:120px">${cat}</span><span class="text-xs font-bold" style="color:${overBudget ? 'var(--red)' : 'var(--text)'}">${fmt(val)}${orc ? `<span style="font-size:8px;color:var(--sub);font-weight:400"> / ${fmt(orc)}</span>` : ''}</span></div><div class="pbar mt-1" style="height:4px;border-radius:2px;background:var(--bg3)"><div class="pfill anim-pbar" data-width="${orc ? budgetPct : pct}%" style="width:0%;border-radius:2px;background:${overBudget ? 'var(--red)' : cor}"></div></div></div>`;
        }).join('');
        el.innerHTML = `<p class="sl mb-3">Gastos por Categoria</p>${rows}`;
    },

    // RECEITAS
    togRecFields() {
        const v = document.getElementById('rRep').value, t = document.getElementById('rTipo').value;
        document.getElementById('rMesW').style.display = v === 'unico' ? 'block' : 'none';
        document.getElementById('rIniW').style.display = (v === 'mensal' || v === 'parcelado') ? 'block' : 'none';
        document.getElementById('rQtdW').style.display = v === 'parcelado' ? 'block' : 'none';
        document.getElementById('rCatW').style.display = t !== 'entrada' ? 'block' : 'none';
    },
    openRecModal(id, tipoPredefinido = null) {
        const m = document.getElementById('mRec'), d = D.get();
        const sel = document.getElementById('rConta');
        sel.innerHTML = d.contas.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
        if (!d.contas.length) sel.innerHTML = '<option value="" disabled selected>Nenhuma conta criada</option>';

        if (id) {
            const r = d.receitas.find(x => x.id === id); if (!r) return;
            document.getElementById('rId').value = r.id; document.getElementById('rNome').value = r.nome; document.getElementById('rValor').value = r.valor;
            document.getElementById('rTipo').value = r.tipo; document.getElementById('rRep').value = r.repeticao;
            document.getElementById('rCat').value = r.cat || '';
            document.getElementById('rConta').value = r.contaId || (d.contas.length ? d.contas[0].id : '');
            document.getElementById('rQtdMeses').value = r.qtdMeses || '';
            mpRec.setVal(r.mesUnico || this.curM);
            mpRecI.setVal(r.mesInicio || this.curM);
            this.togRecFields();
            document.getElementById('mRecTitle').textContent = 'Editar Item'; document.getElementById('mRecIc').style.background = 'linear-gradient(135deg,var(--accent),var(--purple2))';
            document.getElementById('mRecTitle').nextElementSibling.textContent = 'Modificar detalhes de pagamento';
        } else {
            document.getElementById('rId').value = ''; document.getElementById('fRec').reset(); document.getElementById('rCat').value = '';
            document.getElementById('rConta').value = d.contas.length ? d.contas[0].id : '';
            document.getElementById('rQtdMeses').value = '';
            mpRec.setVal(this.curM); mpRecI.setVal(this.curM);

            if (tipoPredefinido) document.getElementById('rTipo').value = tipoPredefinido;
            document.getElementById('rRep').value = document.getElementById('rTipo').value === 'variavel' ? 'unico' : 'mensal';
            this.togRecFields();

            let title = 'Adicionar Item', gIcon = 'linear-gradient(135deg,var(--green),var(--green2))', tText = 'Receita ou despesa';
            const sTipo = document.getElementById('rTipo').value;
            if (sTipo === 'entrada') { title = 'Nova Receita'; tText = 'Ganhos mensais ou pontuais'; gIcon = 'linear-gradient(135deg,var(--green),var(--green2))'; }
            if (sTipo === 'saida') { title = 'Nova Despesa Fixa'; tText = 'Despesas mensais ou parceladas'; gIcon = 'linear-gradient(135deg,var(--red),var(--red2))'; }
            if (sTipo === 'variavel') { title = 'Novo Gasto Avulso'; tText = 'Compras do dia a dia'; gIcon = 'linear-gradient(135deg,var(--cyan,#22d3ee),#06b6d4)'; }

            document.getElementById('mRecTitle').textContent = title;
            document.getElementById('mRecTitle').nextElementSibling.textContent = tText;
            document.getElementById('mRecIc').style.background = gIcon;
        }
        m.classList.add('active');
    },
    saveRec(e) {
        e.preventDefault(); const d = D.get(), id = document.getElementById('rId').value;
        const rep = document.getElementById('rRep').value;
        const obj = { id: id || uid(), nome: document.getElementById('rNome').value, valor: +document.getElementById('rValor').value, tipo: document.getElementById('rTipo').value, repeticao: rep, mesUnico: rep === 'unico' ? mpRec.getVal() : null, mesInicio: (rep === 'mensal' || rep === 'parcelado') ? mpRecI.getVal() : null, qtdMeses: rep === 'parcelado' ? (+document.getElementById('rQtdMeses').value || 2) : undefined, cat: document.getElementById('rTipo').value !== 'entrada' ? document.getElementById('rCat').value : '', contaId: document.getElementById('rConta').value };
        if (id) { const i = d.receitas.findIndex(x => x.id === id); if (i >= 0) d.receitas[i] = obj } else d.receitas.push(obj);
        D.save(); this.closeM('mRec'); this.renderAll(); toast(id ? 'Atualizado!' : 'Adicionado!');
    },
    dupRec(id) { const d = D.get(), r = d.receitas.find(x => x.id === id); if (!r) return; const n = { ...r, id: uid(), nome: r.nome + ' (cópia)' }; d.receitas.push(n); D.save(); this.renderAll(); toast('Duplicado!') },
    async delRec(id) { const d = D.get(), item = d.receitas.find(x => x.id === id); if (!await cfm2('Excluir "' + ((item && item.nome) || 'item') + '"?', 'Ação irreversível.', 'Cancelar', 'Excluir', true)) return; d.receitas = d.receitas.filter(x => x.id !== id); D.save(); this.renderAll(); toast('Excluído', '#f87171', 'error') },
    renderRec() {
        const d = D.get();
        const ent = d.receitas.filter(r => r.tipo === 'entrada').sort((a, b) => b.valor - a.valor);
        const sai = d.receitas.filter(r => r.tipo === 'saida').sort((a, b) => b.valor - a.valor);
        const vari = d.receitas.filter(r => r.tipo === 'variavel').sort((a, b) => b.valor - a.valor);
        const now = this.curM;
        const rl = (items, tipo) => {
            if (items.length === 0) return `<div class="text-center py-6" style="color:var(--sub)"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 6px;opacity:.4"><path d="M12 2v20M2 12h20"/></svg><p class="text-sm">Nenhum item cadastrado</p><p style="font-size:11px;margin-top:4px">Pressione <b>N</b> para adicionar</p></div>`;
            const renderArr = (arr, off = 0) => arr.map((r, i) => {
                const tipoColor = tipo === 'entrada' ? 'var(--green)' : (tipo === 'variavel' ? 'var(--cyan,#22d3ee)' : 'var(--red)');
                const tipoBg = tipo === 'entrada' ? 'rgba(52,211,153,.1)' : (tipo === 'variavel' ? 'rgba(34,211,238,.1)' : 'rgba(248,113,113,.1)');
                let subtext = '';
                if (r.repeticao === 'mensal') subtext = 'Todo mês' + (r.mesInicio ? ' (desde ' + ml(r.mesInicio) + ')' : '');
                else if (r.repeticao === 'parcelado') { const p = (pm(now).y - pm(r.mesInicio).y) * 12 + (pm(now).m - pm(r.mesInicio).m) + 1; subtext = `Parcelado: ${p}/${r.qtdMeses}`; }
                else subtext = 'Mês: ' + ml(r.mesUnico || now);
                let iconSvg = '';
                if (tipo === 'entrada') iconSvg = '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>';
                else if (tipo === 'variavel') iconSvg = '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>';
                else iconSvg = '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M7 13l5 5m0 0l5-5m-5 5V6" /></svg>';

                const pid = r.repeticao === 'mensal' || r.repeticao === 'parcelado' ? `${r.id}_${now}` : r.id;
                const isPaid = d.pagamentos && d.pagamentos[pid];

                const leftEl = App.selectionMode
                    ? `<div class="chk-wrap"><input type="checkbox" class="chk-input" onchange="App.togBulk('${r.id}', this.checked)" ${App.selRecs.includes(r.id) ? 'checked' : ''}></div>`
                    : `<button class="paid-toggle ${isPaid ? 'is-paid' : ''}" onclick="event.stopPropagation();App.togPaid('${r.id}', ${r.repeticao !== 'unico' ? "'" + now + "'" : 'null'})" title="${isPaid ? 'Desmarcar pago' : 'Marcar como pago'}"><svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></button>`;

                return `<div class="lr stagger" style="animation-delay:${(i + off) * .04}s">
                    <div class="lr-content">
                        ${leftEl}
                        <div class="lr-text flex items-center gap-3 min-w-0">
                            <div class="ic ic-sm shrink-0" style="background:${tipoBg}15; color:${tipoColor}">
                                ${iconSvg}
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="font-semibold text-xs truncate flex items-center gap-1" style="${isPaid ? 'text-decoration:line-through;opacity:0.5' : ''}">
                                    ${r.nome}
                                    ${r.cat ? `<span style="font-size:9px;padding:1px 4px;border-radius:4px;background:var(--bg3);color:var(--sub);font-weight:500">${r.cat}</span>` : ''}
                                </p>
                                <p class="text-[10px] truncate" style="color:var(--sub)">${subtext}</p>
                            </div>
                        </div>
                        <div class="lr-value flex items-center gap-2 shrink-0 ml-auto mr-1">
                            ${isPaid ? `<span class="badge-paid">PAGO</span>` : ''}
                            <span class="font-bold text-xs" style="color:${isPaid ? 'var(--green)' : tipoColor}">${fmt(r.valor, true)}</span>
                        </div>
                    </div>
                    <div class="lr-actions">
                        <button class="bi shrink-0" title="Editar" onclick="App.openRecModal('${r.id}')">${IC.edit}</button>
                        <button class="bi shrink-0" title="Duplicar" onclick="App.dupRec('${r.id}')">${IC.dup}</button>
                        <button class="bi shrink-0" title="Excluir" onclick="App.delRec('${r.id}')">${IC.trash}</button>
                    </div>
                </div>`;
            }).join('');
            return renderArr(items);
        };
        const isActive = r => { if (r.repeticao === 'mensal') return !(r.mesInicio && now < r.mesInicio); if (r.repeticao === 'parcelado') return r.mesInicio && now >= r.mesInicio && now <= am(r.mesInicio, (r.qtdMeses || 1) - 1); return r.mesUnico === now };
        const entM = ent.filter(isActive), saiM = sai.filter(isActive), variM = vari.filter(isActive);
        const totalMes = items => items.reduce((s, r) => s + +r.valor, 0);
        const orcEl = d.orcamentoVariavel > 0 ? `<button class="bi" title="Editar teto" onclick="App.setOrcVar()" style="width:auto;padding:2px 6px;font-size:9px;gap:2px;height:auto">teto: ${fmt(d.orcamentoVariavel)}</button>` : `<button class="bi" title="Definir teto" onclick="App.setOrcVar()" style="width:auto;padding:2px 6px;font-size:9px;gap:2px;height:auto"><svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Teto</button>`;
        document.getElementById('recList').innerHTML = `
      <div class="card"><div class="flex items-center justify-between pb-2 mb-1" style="border-bottom:1px solid var(--border)"><div class="flex items-center gap-2"><span class="badge badge-green">Receitas</span><span style="font-size:10px;color:var(--sub)">${entM.length}</span></div><span class="font-bold text-xs" style="color:var(--green)">${fmt(totalMes(entM))}</span></div>${rl(entM, 'entrada')}</div>
      <div class="card"><div class="flex items-center justify-between pb-2 mb-1" style="border-bottom:1px solid var(--border)"><div class="flex items-center gap-2"><span class="badge badge-red">Contas Fixas</span><span style="font-size:10px;color:var(--sub)">${saiM.length}</span></div><span class="font-bold text-xs" style="color:var(--red)">${fmt(totalMes(saiM))}</span></div>${rl(saiM, 'saida')}</div>
      <div class="card"><div class="flex items-center justify-between pb-2 mb-1" style="border-bottom:1px solid var(--border)"><div class="flex items-center gap-2"><span class="badge" style="background:rgba(34,211,238,.12);color:#22d3ee">Gastos do Dia-a-dia</span><span style="font-size:10px;color:var(--sub)">${variM.length}</span>${orcEl}</div><span class="font-bold text-xs" style="color:#22d3ee">${fmt(totalMes(variM))}</span></div>${rl(variM, 'variavel')}</div>`;
    },
    setOrcVar() {
        const d = D.get();
        let val = prompt('Defina o teto mensal para gastos do dia-a-dia (R$):', d.orcamentoVariavel || '');
        if (val === null) return;
        val = +val;
        if (!isNaN(val) && val >= 0) {
            d.orcamentoVariavel = val;
            D.save();
            this.renderAll();
        } else if (val === 0) {
            d.orcamentoVariavel = 0;
            D.save();
            this.renderAll();
        }
    },

    // CARTOES
    setValMode(mode) {
        document.getElementById('cValMode').value = mode;
        document.getElementById('cValLabel').textContent = mode === 'total' ? 'Valor Total (R$)' : 'Valor da Parcela (R$)';
        const totalBtn = document.getElementById('cModeTotal'), parcBtn = document.getElementById('cModeParcela');
        if (mode === 'total') { totalBtn.style.background = 'var(--accent)'; totalBtn.style.color = '#fff'; parcBtn.style.background = 'transparent'; parcBtn.style.color = 'var(--sub)'; }
        else { parcBtn.style.background = 'var(--accent)'; parcBtn.style.color = '#fff'; totalBtn.style.background = 'transparent'; totalBtn.style.color = 'var(--sub)'; }
        this.calcParcela();
    },
    calcParcela() {
        const v = +document.getElementById('cTotal').value || 0;
        const p = +document.getElementById('cParcelas').value || 1;
        const mode = document.getElementById('cValMode').value;
        const prev = document.getElementById('cPreview');
        if (v > 0 && p > 1) {
            prev.style.display = 'block';
            if (mode === 'total') prev.textContent = `${p}x de ${fmt(v / p)}`;
            else prev.textContent = `Total: ${fmt(v * p)}`;
        } else { prev.style.display = 'none' }
    },
    populateCardSelect(sel) {
        const d = D.get(), s = document.getElementById('cCartao');
        s.innerHTML = '<option value="" disabled>Selecione</option>' + d.meusCartoes.map(c => `<option value="${c}"${c === sel ? ' selected' : ''}>${c}</option>`).join('');
        if (!d.meusCartoes.length) s.innerHTML = '<option value="" disabled selected>Cadastre primeiro</option>';
    },
    openCarModal(id) {
        const m = document.getElementById('mCar'), d = D.get();
        if (!d.meusCartoes.length) { this.openCardMgmt(); toast('Cadastre um cartão', '#fbbf24', 'warn'); return }
        if (id) {
            const c = d.cartoes.find(x => x.id === id); if (!c) return;
            this.populateCardSelect(c.cartao); document.getElementById('cId').value = c.id; document.getElementById('cDesc').value = c.estabelecimento;
            document.getElementById('cCat').value = c.cat || '';
            this.setValMode('total');
            document.getElementById('cTotal').value = c.valorParcela * c.qtdParcelas; document.getElementById('cParcelas').value = c.qtdParcelas;
            mpCar.setVal(c.dataPrimeiraParcela); document.getElementById('mCarTitle').textContent = 'Editar Compra'; this.calcParcela();
        } else {
            this.populateCardSelect(''); document.getElementById('cId').value = ''; document.getElementById('fCar').reset(); document.getElementById('cCat').value = '';
            this.setValMode('total');
            mpCar.setVal(this.curM); document.getElementById('cParcelas').value = '1';
            document.getElementById('cPreview').style.display = 'none'; document.getElementById('mCarTitle').textContent = 'Nova Compra'; this.populateCardSelect('')
        }
        m.classList.add('active');
    },
    openCardMgmt() { this.renderCardMgmt(); document.getElementById('mCardMgmt').classList.add('active') },
    addCard() { const inp = document.getElementById('newCardName'), name = inp.value.trim(); if (!name) return; const d = D.get(); if (d.meusCartoes.includes(name)) { toast('Já existe', '#fbbf24', 'warn'); return } d.meusCartoes.push(name); D.save(); inp.value = ''; this.renderCardMgmt(); toast('Adicionado!') },
    async delCard(name) {
        const d = D.get(), now = this.curM;
        const hasActive = d.cartoes.some(c => c.cartao === name && am(c.dataPrimeiraParcela, c.qtdParcelas - 1) >= now);
        if (hasActive) { toast('Cartão possui faturas ativas!', '#f87171', 'error'); return; }
        if (!await cfm2('Excluir "' + name + '"?', 'Compras finalizadas mantidas.', 'Cancelar', 'Excluir', true)) return;
        d.meusCartoes = d.meusCartoes.filter(c => c !== name); D.save(); this.renderCardMgmt(); toast('Removido', '#f87171', 'error')
    },
    renderCardMgmt() {
        const d = D.get();
        document.getElementById('cardMgmtList').innerHTML = d.meusCartoes.length ? d.meusCartoes.map(c => {
            const n = d.cartoes.filter(x => x.cartao === c).length; const col = ccol(c);
            return `<div class="flex items-center justify-between py-3 border-b border-white/5 last:border-0"><div class="flex items-center gap-3"><div class="ic ic-sm flex-shrink-0" style="background:${col}"><span style="color:#fff">${IC.card}</span></div><div class="flex flex-col justify-center"><p class="font-semibold text-xs leading-none mb-1">${c}</p><p class="leading-none" style="font-size:10px;color:var(--sub)">${n} compra${n !== 1 ? 's' : ''}</p></div></div><button class="bi flex-shrink-0" onclick="App.delCard('${c}')">${IC.trash}</button></div>`
        }).join('') : '<div class="text-center py-4" style="color:var(--sub)"><p class="text-sm">Nenhum cartão</p></div>';
    },
    saveCar(e) {
        e.preventDefault(); const d = D.get(), id = document.getElementById('cId').value;
        const val = +document.getElementById('cTotal').value, parc = +document.getElementById('cParcelas').value || 1;
        const mode = document.getElementById('cValMode').value;
        const valorParcela = mode === 'parcela' ? +val.toFixed(2) : +(val / parc).toFixed(2);
        const obj = { id: id || uid(), cartao: document.getElementById('cCartao').value, estabelecimento: document.getElementById('cDesc').value, valorParcela, qtdParcelas: parc, dataPrimeiraParcela: mpCar.getVal(), cat: document.getElementById('cCat').value };
        if (id) { const i = d.cartoes.findIndex(x => x.id === id); if (i >= 0) d.cartoes[i] = obj } else d.cartoes.push(obj);
        D.save(); this.closeM('mCar'); this.renderAll(); toast(id ? 'Atualizado!' : 'Adicionada!');
    },
    dupCar(id) { const d = D.get(), c = d.cartoes.find(x => x.id === id); if (!c) return; d.cartoes.push({ ...c, id: uid(), estabelecimento: c.estabelecimento + ' (cópia)' }); D.save(); this.renderAll(); toast('Duplicado!') },
    async delCar(id) { const d = D.get(), item = d.cartoes.find(x => x.id === id); if (!await cfm2('Excluir "' + ((item && item.estabelecimento) || 'compra') + '"?', 'Será removida.', 'Cancelar', 'Excluir', true)) return; d.cartoes = d.cartoes.filter(x => x.id !== id); D.save(); this.renderAll(); toast('Excluída', '#f87171', 'error') },
    async anteciparParcela(id) {
        const d = D.get(), item = d.cartoes.find(x => x.id === id); if (!item) return;
        if (!await cfm2('Antecipar última parcela?', `Cobrará +${fmt(item.valorParcela, true)} neste mês.`, 'Voltar', 'Antecipar', false)) return;
        if (!item.antecipacoes) item.antecipacoes = [];
        item.antecipacoes.push(this.curM);
        D.save(); this.renderAll(); toast('Parcela antecipada!');
    },
    renderCar() {
        const d = D.get(), now = this.curM, g = {};
        const tc = s => s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
        d.cartoes.forEach(c => { const k = c.cartao || 'Sem Cartão'; if (!g[k]) g[k] = []; g[k].push(c) });
        if (!Object.keys(g).length) { document.getElementById('carList').innerHTML = `<div class="card text-center py-8 col-span-3" style="color:var(--sub)"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 6px;opacity:.4"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg><p class="text-sm font-medium">Nenhuma compra cadastrada</p><p style="font-size:11px;margin-top:4px">Pressione <b>N</b> para adicionar</p></div>`; return }
        const isFinished = c => { const ant = c.antecipacoes || []; const last = am(c.dataPrimeiraParcela, c.qtdParcelas - ant.length - 1); return now > last };
        const renderItem = (c, i) => {
            const ant = c.antecipacoes || []; const antMes = ant.filter(a => a === now).length; const len = c.qtdParcelas - ant.length;
            const last = am(c.dataPrimeiraParcela, len - 1), act = now >= c.dataPrimeiraParcela && now <= last;
            let cur = 0; for (let j = 0; j < len; j++) { if (am(c.dataPrimeiraParcela, j) === now) { cur = j + 1; break } }
            const pct = ((cur || 0) / len) * 100; const iv = c.qtdParcelas === 1; const fin = now > last;
            const valMes = c.valorParcela * ((cur ? 1 : 0) + antMes);
            const canAnticipate = !fin && !iv && now >= c.dataPrimeiraParcela && last > now;
            const isCr = c.valorParcela < 0;
            const isPaidC = d.faturasPagas && d.faturasPagas[`${c.id}_${now}`];
            const showToggle = (act || antMes > 0 || (iv && !fin));
            const isOverdue = showToggle && !isPaidC && now < curMonth();
            const toggleBtn = showToggle
                ? `<button class="paid-toggle ${isPaidC ? 'is-paid' : ''}" onclick="event.stopPropagation();App.togPaidCar('${c.id}', '${now}')" title="${isPaidC ? 'Desmarcar pago' : 'Marcar como pago'}"><svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></button>`
                : '';
            return `<div class="lr stagger" style="animation-delay:${i * .04}s${fin ? ';opacity:.5' : ''}${isOverdue ? ';border-left:3px solid var(--red)' : ''}">
                <div class="lr-content">
                    ${toggleBtn}
                    <div class="lr-text flex items-center gap-3 min-w-0">
                        <div class="ic ic-sm shrink-0" style="background:${isCr ? 'rgba(52,211,153,.1)' : 'rgba(251,191,36,.1)'}15; color:${isCr ? 'var(--green)' : 'var(--orange)'}">
                            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="font-semibold text-xs truncate flex items-center gap-1" style="${isPaidC ? 'text-decoration:line-through;opacity:0.6' : ''}${isCr ? 'color:var(--green)' : ''}">
                                ${tc(c.estabelecimento)}
                                ${c.cat ? `<span class="shrink-0" style="font-size:9px;padding:2px 4px;border-radius:4px;background:var(--bg3);color:var(--sub);font-weight:500">${c.cat}</span>` : ''}
                                ${isOverdue ? `<span class="shrink-0" style="font-size:8px;padding:1px 4px;border-radius:4px;background:rgba(248,113,113,.15);color:var(--red);font-weight:600">ATRASADO</span>` : ''}
                            </p>
                            <p class="text-[10px] truncate" style="color:var(--sub)">${iv ? (isCr ? 'Estorno à vista' : 'À vista') + ' — ' + fmt(c.valorParcela, true) : c.qtdParcelas + (isCr ? 'x (Estorno parcelado) de ' : 'x de ') + fmt(c.valorParcela, true) + ' — Total: ' + fmt(c.valorParcela * c.qtdParcelas, true)}</p>
                            ${!iv ? `<p class="truncate" style="font-size:9px;color:${(act || antMes > 0) ? (isCr ? 'var(--green)' : 'var(--accent2)') : 'var(--sub)'}">${act ? 'Parcela ' + cur + '/' + len : (fin ? 'Finalizado' : 'Inicia ' + ml(c.dataPrimeiraParcela))}${antMes > 0 ? ` (+${antMes} antecipadas)` : ''}</p>` : ''}
                            ${(act || antMes > 0) && !iv ? `<div class="pbar mt-1" style="width:100px;max-width:100%"><div class="pfill" style="width:${pct}%;${isCr ? 'background:var(--green)' : ''}"></div></div>` : ''}
                        </div>
                    </div>
                    <div class="lr-value flex items-center gap-2 shrink-0 ml-auto mr-1">
                        ${isPaidC ? `<span class="badge-paid">PAGO</span>` : ''}
                        ${isOverdue ? `<span class="badge badge-red shrink-0" style="font-size:9px">${fmt(valMes, true)}</span>` : `<span class="badge ${isCr ? 'badge-green' : ((act || antMes > 0) || (iv && !fin) ? 'badge-orange' : (fin ? 'badge-green' : 'badge-gray'))} shrink-0" style="font-size:9px">
                            ${isCr ? 'CRÉDITO' : (iv ? (fin ? 'Pago' : fmt(valMes, true)) : ((act || antMes > 0) ? fmt(valMes, true) : (fin ? 'Pago' : 'Pendente')))}
                        </span>`}
                    </div>
                </div>
                <div class="lr-actions">
                    ${canAnticipate ? `<button class="bi shrink-0" title="Antecipar Última Parcela" onclick="App.anteciparParcela('${c.id}')"><svg width="14" height="14" fill="none" stroke="var(--cyan,#22d3ee)" stroke-width="2" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>` : ''}
                    <button class="bi shrink-0" title="Editar" onclick="App.openCarModal('${c.id}')">${IC.edit}</button>
                    <button class="bi shrink-0" title="Duplicar" onclick="App.dupCar('${c.id}')">${IC.dup}</button>
                    <button class="bi shrink-0" title="Excluir" onclick="App.delCar('${c.id}')">${IC.trash}</button>
                </div>
            </div>`;
        };
        // Calculate grand total for the month
        let grandTotal = 0;
        for (const compras of Object.values(g)) { compras.forEach(c => { const ant = c.antecipacoes || []; let antMes = 0; ant.forEach(a => { if (a === now) antMes++ }); for (let i = 0; i < c.qtdParcelas - ant.length; i++) { if (am(c.dataPrimeiraParcela, i) === now) { grandTotal += c.valorParcela; break } }; grandTotal += c.valorParcela * antMes; }) }
        // Separate cards with/without activity this month
        const activeCards = [], inactiveCards = [];
        for (const [cartao, compras] of Object.entries(g)) {
            const tm = compras.reduce((s, c) => { const ant = c.antecipacoes || []; let antMes = 0; ant.forEach(a => { if (a === now) antMes++ }); let val = c.valorParcela * antMes; for (let i = 0; i < c.qtdParcelas - ant.length; i++) { if (am(c.dataPrimeiraParcela, i) === now) { val += c.valorParcela; break } } return s + val }, 0);
            const hasActivity = compras.some(c => { const ant = c.antecipacoes || []; const last = am(c.dataPrimeiraParcela, c.qtdParcelas - ant.length - 1); return now >= c.dataPrimeiraParcela && now <= last });
            if (hasActivity || tm > 0) activeCards.push([cartao, compras]);
            else inactiveCards.push([cartao, compras]);
        }
        let h = '';
        if (grandTotal > 0) {
            h += `<div class="card mb-3 flex items-center justify-between" style="background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(251,191,36,.03));border:1px solid rgba(251,191,36,.15)"><div class="flex items-center gap-2"><div class="ic" style="background:rgba(251,191,36,.15);border-radius:10px"><span style="color:var(--orange);display:flex"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg></span></div><div><p class="text-xs font-semibold" style="color:var(--sub)">Total Cartões em ${MS[pm(now).m - 1]}</p><p class="font-bold text-lg" style="color:var(--orange)">${fmt(grandTotal)}</p></div></div></div>`;
        } else {
            h += `<div class="card mb-3 flex items-center gap-2" style="padding:14px 18px"><div class="ic" style="background:rgba(52,211,153,.1);border-radius:10px"><span style="color:var(--green)">${IC.chk}</span></div><div><p class="text-sm font-semibold">Nenhuma fatura ativa em ${MS[pm(now).m - 1]}</p><p class="text-xs" style="color:var(--sub)">${Object.keys(g).length} cart${Object.keys(g).length !== 1 ? 'ões' : 'ão'} cadastrado${Object.keys(g).length !== 1 ? 's' : ''}</p></div></div>`;
        }
        const renderCard = ([cartao, compras]) => {
            const col = ccol(cartao);
            const ativas = compras.filter(c => !isFinished(c)).sort((a, b) => b.valorParcela - a.valorParcela);
            const finalizadas = compras.filter(c => isFinished(c)).sort((a, b) => b.valorParcela - a.valorParcela);
            const tm = ativas.reduce((s, c) => { const ant = c.antecipacoes || []; let antMes = 0; ant.forEach(a => { if (a === now) antMes++ }); let val = c.valorParcela * antMes; for (let i = 0; i < c.qtdParcelas - ant.length; i++) { if (am(c.dataPrimeiraParcela, i) === now) { val += c.valorParcela; break } } return s + val }, 0);
            const safeId = cartao.replace(/[^a-zA-Z0-9]/g, '_');
            const ddId = `cdd_${safeId}`;
            const finId = `fin_${safeId}`;
            const isOpen = App._openDD.has(ddId);
            const isFinOpen = App._openDD.has(finId);
            const hasFuture = ativas.some(c => c.dataPrimeiraParcela > now);
            const valLabel = tm > 0 ? fmt(tm, true) : (hasFuture ? 'Sem cobrança' : 'R$ 0,00');
            const renderArrC = (arr, off = 0) => arr.map((c, i) => renderItem(c, i + off)).join('');
            let ativasH = '';
            if (ativas.length > 0) {
                ativasH = renderArrC(ativas);
            } else ativasH = '<p style="font-size:11px;text-align:center;padding:8px 0;color:var(--sub)">Nenhuma compra ativa neste mês</p>';

            // Bulk pay: check if all active purchases this month are paid
            const activeThisMonth = ativas.filter(c => { const ant = c.antecipacoes || []; let antMes = ant.filter(a => a === now).length; const len = c.qtdParcelas - ant.length; let hasNormal = false; for (let j = 0; j < len; j++) { if (am(c.dataPrimeiraParcela, j) === now) { hasNormal = true; break } } return hasNormal || antMes > 0; });
            const allPaidBulk = activeThisMonth.length > 0 && activeThisMonth.every(c => d.faturasPagas[`${c.id}_${now}`]);
            const bulkToggle = activeThisMonth.length > 0
                ? `<button class="paid-toggle ${allPaidBulk ? 'is-paid' : ''}" onclick="event.stopPropagation();App.bulkPayCard('${cartao.replace(/'/g, "\\'")}', '${now}')" title="${allPaidBulk ? 'Desmarcar fatura' : 'Marcar fatura inteira como paga'}" style="flex-shrink:0"><svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></button>`
                : '';

            return `<div class="card card-h" style="border-left:3px solid ${col}">
      <div class="flex items-center justify-between" style="cursor:pointer;user-select:none" onclick="App.togDD('${ddId}');App.renderCar()">
<div class="flex items-center gap-2">${bulkToggle}<div class="ic" style="background:${col};border-radius:12px"><span style="color:#fff;display:flex"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg></span></div>
<div><p class="font-bold text-sm">${cartao}</p><p style="font-size:11px;color:var(--sub)">${ativas.length} ativa${ativas.length !== 1 ? 's' : ''}${finalizadas.length ? ' · ' + finalizadas.length + ' finalizada' + (finalizadas.length > 1 ? 's' : '') : ''}</p></div></div>
<div class="flex items-center gap-3"><div class="text-right"><p class="font-bold text-sm" style="color:${tm > 0 ? col : 'var(--sub)'}">${valLabel}</p><p style="font-size:11px;color:var(--sub)">em ${MS[pm(now).m - 1]}</p></div>
<div style="width:24px;height:24px;border-radius:6px;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:var(--sub);flex-shrink:0"><svg class="chvM${isOpen ? ' r90' : ''}" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="transition:transform .25s"><path d="M9 5l7 7-7 7"/></svg></div></div>
      </div>
      <div class="ddb${isOpen ? ' open' : ''}" id="${ddId}">
      <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:12px">
      ${ativasH}
      ${finalizadas.length ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"><button type="button" class="at" onclick="App.togDD('${finId}');App.renderCar()"><svg class="chv2${isFinOpen ? ' r90' : ''}" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="transition:transform .25s"><path d="M9 5l7 7-7 7"/></svg>Finalizadas <span class="badge badge-green" style="font-size:9px">${finalizadas.length}</span></button><div class="ddb${isFinOpen ? ' open' : ''}" id="${finId}"><div class="pt-1">${finalizadas.map((c, i) => renderItem(c, i)).join('')}</div></div></div>` : ''}
      </div></div></div>`;
        };
        if (activeCards.length) {
            h += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%, 340px),1fr));gap:12px">${activeCards.map(renderCard).join('')}</div>`;
        }
        if (inactiveCards.length) {
            const iid = 'inact_cards';
            const isInactOpen = App._openDD.has(iid);
            h += `<div style="margin-top:12px"><button type="button" class="at" onclick="App.togDD('${iid}');App.renderCar()"><svg class="chv2${isInactOpen ? ' r90' : ''}" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="transition:transform .25s"><path d="M9 5l7 7-7 7"/></svg>${inactiveCards.length} cart${inactiveCards.length !== 1 ? 'ões' : 'ão'} sem cobrança em ${MS[pm(now).m - 1]}</button><div class="ddb${isInactOpen ? ' open' : ''}" id="${iid}"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%, 340px),1fr));gap:12px;padding-top:12px">${inactiveCards.map(renderCard).join('')}</div></div></div>`;
        }
        document.getElementById('carList').innerHTML = h;
    },
    // ================== CONTAS ==================
    openContaModal(id = null) {
        this.closeM('mSettings');
        const m = document.getElementById('mConta');
        if (id) {
            const d = D.get(), c = d.contas.find(x => x.id === id); if (!c) return;
            document.getElementById('ctId').value = c.id;
            document.getElementById('ctNome').value = c.nome;
            document.getElementById('ctSaldo').value = c.saldoInicial;
            document.getElementById('ctCor').value = c.cor || 'var(--card)';
            document.getElementById('mContaTitle').textContent = 'Editar Conta';
        } else {
            document.getElementById('ctId').value = '';
            document.getElementById('fConta') ? document.getElementById('fConta').reset() : (document.getElementById('ctNome').value = '', document.getElementById('ctSaldo').value = '', document.getElementById('ctCor').value = 'var(--purple)');
            document.getElementById('mContaTitle').textContent = 'Nova Conta';
        }
        m.classList.add('active');
        setTimeout(() => document.getElementById('ctNome').focus(), 100);
    },
    saveConta(e) {
        e.preventDefault();
        const d = D.get();
        const id = document.getElementById('ctId').value;
        const nome = document.getElementById('ctNome').value.trim();
        const saldoInicial = +(document.getElementById('ctSaldo').value || 0);
        const cor = document.getElementById('ctCor').value;

        if (!nome) return toast('Digite um nome válido', '#f87171', 'error');

        const obj = { id: id || uid(), nome, cor, saldoInicial };

        if (id) {
            const i = d.contas.findIndex(x => x.id === id);
            if (i >= 0) d.contas[i] = obj;
        } else {
            d.contas.push(obj);
        }

        D.save();
        this.closeM('mConta');
        this.renderAll();
        this.renderContas();
        document.getElementById('mSettings').classList.add('active');
        toast(id ? 'Conta Atualizada!' : 'Conta Adicionada!');
    },
    async delConta(id) {
        const d = D.get(), item = d.contas.find(x => x.id === id);
        if (!item) return;
        // Bloquear exclusão da última conta
        if (d.contas.length <= 1) {
            toast('Impossível excluir a única conta', '#f87171', 'error');
            return;
        }
        const vinculadas = d.receitas.filter(r => r.contaId === id).length;
        if (vinculadas > 0) {
            // Oferecer migração para outra conta
            const outras = d.contas.filter(c => c.id !== id);
            const destino = outras[0]; // Default: primeira outra conta
            const msg = `${vinculadas} transaç${vinculadas > 1 ? 'ões serão movidas' : 'ão será movida'} para "${destino.nome}".`;
            if (!await cfm2(`Excluir conta "${item.nome}"?`, msg, 'Cancelar', 'Excluir e Mover', true)) return;
            // Migrar transações para a primeira outra conta
            d.receitas.forEach(r => { if (r.contaId === id) r.contaId = destino.id });
        } else {
            if (!await cfm2(`Excluir conta "${item.nome}"?`, 'Nenhuma transação vinculada.', 'Cancelar', 'Excluir Conta', true)) return;
        }
        d.contas = d.contas.filter(x => x.id !== id);
        D.save();
        this.renderAll();
        this.renderContas();
        toast('Conta Removida', '#f87171', 'error');
    },
    renderContas() {
        const ls = document.getElementById('contasList');
        if (!ls) return;
        const d = D.get();
        const contas = d.contas || [];

        if (contas.length === 0) {
            ls.innerHTML = `<div class="text-center py-4" style="color:var(--sub)"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 4px;opacity:.4"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg><p class="text-xs">Nenhuma conta cadastrada</p></div>`;
            return;
        }

        const totalSaldo = contas.reduce((s, c) => s + saldoConta(c.id, App.curM), 0);
        ls.innerHTML = `<div class="flex items-center justify-between mb-2" style="padding:4px 0"><span class="text-xs" style="color:var(--sub)">${contas.length} conta${contas.length > 1 ? 's' : ''}</span><span class="font-bold text-xs" style="color:${totalSaldo >= 0 ? 'var(--accent)' : 'var(--red)'}">${fmt(totalSaldo)}</span></div>` + contas.sort((a, b) => saldoConta(b.id, App.curM) - saldoConta(a.id, App.curM)).map((c, i) => {
            const corIcon = c.cor || 'var(--accent)';
            const corBg = c.cor ? c.cor + '1a' : 'rgba(99,102,241,.1)';
            const saldo = saldoConta(c.id, App.curM);
            const vinc = D.get().receitas.filter(r => r.contaId === c.id).length;
            return `<div class="flex items-center gap-2 py-2" style="border-top:1px solid var(--border)"><div class="ic ic-sm shrink-0" style="background:${corBg}"><span style="color:${corIcon}"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg></span></div><div class="min-w-0 flex-1"><p class="font-semibold text-xs truncate">${c.nome}</p><p style="font-size:9px;color:var(--sub)">${vinc} transaç${vinc !== 1 ? 'ões' : 'ão'}</p></div><span class="font-bold text-xs shrink-0" style="color:${saldo < 0 ? 'var(--red)' : 'var(--text)'}">${fmt(saldo)}</span><div class="flex items-center gap-1 shrink-0"><button class="bi" style="width:22px;height:22px" title="Editar" onclick="App.openContaModal('${c.id}')">${IC.edit}</button><button class="bi" style="width:22px;height:22px" title="Excluir" onclick="App.delConta('${c.id}')">${IC.trash}</button></div></div>`;
        }).join('');
    },

    // PROJETOS
    togProjF() { const t = document.getElementById('pTipo').value; document.getElementById('pMeta').style.display = (t === 'meta_continua' || t === 'oportunidade') ? 'block' : 'none'; document.getElementById('pEvento').style.display = t === 'evento_unico' ? 'block' : 'none' },
    openProjModal(id) {
        const m = document.getElementById('mProj');
        if (id) {
            const d = D.get(), p = d.projetos.find(x => x.id === id); if (!p) return;
            document.getElementById('pId').value = p.id; document.getElementById('pNome').value = p.nome; document.getElementById('pTipo').value = p.tipo;
            document.getElementById('pValMes').value = p.valorMensal || '';
            document.getElementById('pObj').value = p.objetivo || '';
            document.getElementById('pValEv').value = p.valor || '';
            document.getElementById('pTaxa').value = p.taxaRendimento || '';
            mpProjI.setVal(p.dataInicio || this.curM);
            mpProjE.setVal(p.mes || this.curM);
            mpProjAlvo.setVal(p.dataAlvo || this.curM);
            this.togProjF(); document.getElementById('mProjTitle').textContent = 'Editar Meta';
        } else {
            document.getElementById('pId').value = ''; document.getElementById('fProj').reset(); document.getElementById('pTipo').value = 'meta_continua';
            mpProjI.setVal(this.curM); mpProjE.setVal(this.curM); mpProjAlvo.setVal('');
            this.togProjF(); document.getElementById('mProjTitle').textContent = 'Nova Meta'
        }
        m.classList.add('active');
    },
    saveProj(e) {
        e.preventDefault(); const d = D.get(), id = document.getElementById('pId').value, tipo = document.getElementById('pTipo').value;
        const p = id ? d.projetos.find(x => x.id === id) : { id: uid(), aportes: {}, rendimentos: {} };
        p.nome = document.getElementById('pNome').value;
        p.tipo = tipo;
        p.valorMensal = +document.getElementById('pValMes').value || 0;
        p.dataInicio = mpProjI.getVal();
        p.objetivo = +document.getElementById('pObj').value || 0;
        p.valor = +document.getElementById('pValEv').value || 0;
        p.mes = mpProjE.getVal();
        p.dataAlvo = mpProjAlvo.getVal();
        p.taxaRendimento = +document.getElementById('pTaxa').value || 0;

        if (!id) d.projetos.push(p);
        D.save(); this.closeM('mProj'); this.renderAll(); toast(id ? 'Atualizado!' : 'Projeto criado!');
    },
    dupProj(id) { const d = D.get(), p = d.projetos.find(x => x.id === id); if (!p) return; const n = { ...JSON.parse(JSON.stringify(p)), id: uid(), nome: p.nome + ' (cópia)' }; d.projetos.push(n); D.save(); this.renderAll(); toast('Duplicado!') },
    async delProj(id) { const d = D.get(), item = d.projetos.find(x => x.id === id); if (!await cfm2('Excluir "' + ((item && item.nome) || 'projeto') + '"?', 'Dados perdidos.')) return; d.projetos = d.projetos.filter(x => x.id !== id); D.save(); this.renderAll(); toast('Excluído', '#f87171', 'error') },
    openDivModal(pid) { document.getElementById('dvPid').value = pid; mpDiv.setVal(this.curM); document.getElementById('dvVal').value = ''; document.getElementById('mDiv').classList.add('active') },
    saveDivVal(e) {
        e.preventDefault(); const d = D.get(), pid = document.getElementById('dvPid').value, mes = mpDiv.getVal(), val = +document.getElementById('dvVal').value;
        const p = d.projetos.find(x => x.id === pid); if (!p) return; if (!p.valores) p.valores = {};
        const paidKey = `${pid}_${mes}`;
        if (val === 0) { delete p.valores[mes]; delete d.projetosPagos[paidKey]; }
        else { p.valores[mes] = val; d.projetosPagos[paidKey] = true; }
        D.save(); this.closeM('mDiv'); this.renderAll(); toast('Valor definido!');
    },
    async delDivV(pid, mes) { const d = D.get(), p = d.projetos.find(x => x.id === pid); if (p && p.valores) { delete p.valores[mes]; delete d.projetosPagos[`${pid}_${mes}`]; D.save(); this.renderAll(); toast('Removido', '#f87171', 'error') } },
    openAporteModal(pid) {
        const d = D.get(), p = d.projetos.find(x => x.id === pid);
        document.getElementById('apPid').value = pid;
        mpAporte.setVal(this.curM);
        document.getElementById('apVal').value = p ? (p.valorMensal || '') : '';
        document.getElementById('mAporte').classList.add('active');
    },
    saveAporte(e) {
        e.preventDefault(); const d = D.get(), pid = document.getElementById('apPid').value, mes = mpAporte.getVal(), val = +document.getElementById('apVal').value;
        const p = d.projetos.find(x => x.id === pid); if (!p) return;
        if (!p.aportes) p.aportes = {};
        const paidKey = `${pid}_${mes}`;
        if (val === 0) { delete p.aportes[mes]; delete d.projetosPagos[paidKey]; }
        else { p.aportes[mes] = val; d.projetosPagos[paidKey] = true; }
        D.save(); this.closeM('mAporte'); this.renderAll(); toast(val >= 0 ? 'Aporte registrado!' : 'Retirada registrada!');
    },
    async delAporte(pid, mes) {
        const d = D.get(), p = d.projetos.find(x => x.id === pid);
        if (p && p.aportes) { delete p.aportes[mes]; delete d.projetosPagos[`${pid}_${mes}`]; D.save(); this.renderAll(); toast('Aporte removido', '#f87171', 'error') }
    },
    openRendModal(pid) {
        document.getElementById('rdPid').value = pid;
        mpRendimento.setVal(this.curM);
        document.getElementById('rdVal').value = '';
        document.getElementById('mRendimento').classList.add('active');
    },
    saveRendimento(e) {
        e.preventDefault(); const d = D.get(), pid = document.getElementById('rdPid').value, mes = mpRendimento.getVal(), val = +document.getElementById('rdVal').value;
        const p = d.projetos.find(x => x.id === pid); if (!p) return;
        if (!p.rendimentos) p.rendimentos = {};
        if (val === 0) delete p.rendimentos[mes]; else p.rendimentos[mes] = val;
        D.save(); this.closeM('mRendimento'); this.renderAll(); toast('Rendimento registrado!');
    },
    async delRendimento(pid, mes) {
        const d = D.get(), p = d.projetos.find(x => x.id === pid);
        if (p && p.rendimentos) { delete p.rendimentos[mes]; D.save(); this.renderAll(); toast('Rendimento removido', '#f87171', 'error') }
    },
    calcAcumulado(p) {
        if (p.tipo !== 'meta_continua' && p.tipo !== 'oportunidade') return 0;
        if (!p.dataInicio) return 0;
        const d = D.get(), now = this.curM;
        let total = 0;
        let m = p.dataInicio;
        while (m <= now) {
            if (p.aportes && p.aportes[m] !== undefined) {
                // Explicit aportes always count
                total += +p.aportes[m];
            } else {
                // Default monthly contribution: only if marked as paid
                const isPaid = d.projetosPagos && d.projetosPagos[`${p.id}_${m}`];
                if (isPaid) total += +(p.valorMensal || 0);
            }
            if (p.rendimentos && p.rendimentos[m] !== undefined) total += +p.rendimentos[m];
            if (p.taxaRendimento > 0 && total > 0) total *= (1 + p.taxaRendimento / 100);
            m = am(m, 1);
        }
        return total;
    },
    simProj(id, extra, resEl) {
        const d = D.get(), p = d.projetos.find(x => x.id === id);
        if (!p || !p.objetivo) return;
        let total = this.calcAcumulado(p);
        if (total >= p.objetivo) { resEl.textContent = 'Meta atingida!'; return; }
        const baseAporte = (p.valorMensal || 0) + (+extra || 0);
        if (baseAporte <= 0) { resEl.textContent = 'Nunca'; return; }
        let months = 0;
        while (total < p.objetivo && months < 360) {
            total += baseAporte;
            if (p.taxaRendimento > 0) total *= (1 + p.taxaRendimento / 100);
            months++;
        }
        resEl.textContent = `${months} meses`;
    },
    renderProj() {
        const d = D.get();
        if (!d.projetos.length) { document.getElementById('projList').innerHTML = `<div class="card text-center py-8 col-span-3" style="color:var(--sub)"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" style="margin:0 auto 6px;opacity:.4"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg><p class="text-sm font-medium">Nenhum projeto cadastrado</p><p style="font-size:11px;margin-top:4px">Pressione <b>N</b> para criar</p></div>`; return }
        const ti = {
            divida_irregular: { l: 'Pagamento/Acordo', b: 'badge-red', g: 'linear-gradient(135deg,#f87171,#ef4444)' },
            meta_continua: { l: 'Investimento/Reserva', b: 'badge-blue', g: 'linear-gradient(135deg,#6366f1,#818cf8)' },
            evento_unico: { l: 'Meta Pontual', b: 'badge-purple', g: 'linear-gradient(135deg,#a78bfa,#7c3aed)' },
            oportunidade: { l: 'Oportunidade', b: 'badge-cyan', g: 'linear-gradient(135deg,#22d3ee,#06b6d4)' }
        };
        document.getElementById('projList').innerHTML = d.projetos.map((p, idx) => {
            const inf = ti[p.tipo]; let det = '';
            if (p.tipo === 'divida_irregular') {
                const ent = Object.entries(p.valores || {}).sort((a, b) => a[0].localeCompare(b[0]));
                det = `<div class="mt-3 pt-2" style="border-top:1px solid var(--border)">${ent.length ? ent.map(([m, v]) => `<div class="flex items-center justify-between py-2"><span style="color:var(--sub);font-size:11px">${ml(m)}</span><div class="flex items-center gap-2"><span class="font-semibold text-xs" style="color:var(--red)">${fmt(v)}</span><button class="bi" style="width:22px;height:22px" onclick="App.delDivV('${p.id}','${m}')">${IC.x}</button></div></div>`).join('') : `<p style="font-size:11px;text-align:center;padding:8px 0;color:var(--sub)">Nenhum valor definido</p>`}
        <button class="btn btn-g btn-sm w-full mt-1" onclick="App.openDivModal('${p.id}')">${IC.plus} Definir valor</button></div>`;
            } else if (p.tipo === 'meta_continua' || p.tipo === 'oportunidade') {
                const ac = this.calcAcumulado(p);
                const pct = p.objetivo ? Math.min(100, (ac / p.objetivo) * 100) : 0;
                const aportesArr = Object.entries(p.aportes || {}).filter(([m]) => m <= this.curM).sort((a, b) => b[0].localeCompare(a[0]));
                const rendsArr = Object.entries(p.rendimentos || {}).filter(([m]) => m <= this.curM).sort((a, b) => b[0].localeCompare(a[0]));
                const fid = 'ap_' + p.id.replace(/\W/g, '');
                const fidR = 'rd_' + p.id.replace(/\W/g, '');
                const acRend = rendsArr.reduce((s, [, v]) => s + +v, 0);

                let suggested = 0;
                if (p.objetivo > ac && p.dataAlvo && p.dataAlvo > this.curM) {
                    const months = diffMonths(this.curM, p.dataAlvo);
                    if (months > 0) suggested = (p.objetivo - ac) / months;
                }

                det = `<div class="mt-3 pt-2" style="border-top:1px solid var(--border)">
<div class="flex items-center justify-between mb-2"><span style="font-size:11px;color:var(--sub)">${fmt(p.valorMensal || 0, true)}/mês desde ${p.dataInicio ? ml(p.dataInicio) : '—'}</span>${acRend > 0 ? `<span style="font-size:10px;color:var(--green);background:rgba(52,211,153,.1);padding:2px 6px;border-radius:4px">+${fmt(acRend, true)} de ganhos</span>` : ''}</div>
<p class="font-bold text-base mb-1" style="color:${ac > 0 ? (p.tipo === 'oportunidade' ? 'var(--cyan,#22d3ee)' : 'var(--accent2)') : (ac < 0 ? 'var(--red)' : 'var(--sub)')}">${fmt(ac, true)}${p.objetivo ? ' <span style="font-size:11px;font-weight:400;color:var(--sub)">de ' + fmt(p.objetivo, true) + '</span>' : ''}</p>
${p.objetivo ? `<div class="pbar mb-1" style="height:8px"><div class="pfill" style="width:${pct}%;${p.tipo === 'oportunidade' ? 'background:var(--cyan,#22d3ee)' : ''}"></div></div><div class="flex justify-between items-center"><span style="font-size:11px;color:var(--sub)">${pct.toFixed(0)}% do objetivo</span>${p.dataAlvo ? `<span style="font-size:10px;color:var(--sub)">Meta em ${ml(p.dataAlvo)}</span>` : ''}</div>` : ''}

${suggested > 0 ? `<div class="mt-3 p-2 rounded-lg" style="background:rgba(99,102,241,0.05);border:1px dashed rgba(99,102,241,0.2)"><p style="font-size:10px;color:var(--sub);margin-bottom:2px">Aporte sugerido para atingir a meta:</p><p class="font-bold text-xs" style="color:var(--accent)">${fmt(suggested, true)} / mês</p></div>` : ''}

<details style="margin-top:10px">
  <summary style="padding:8px;border-radius:10px;background:var(--bg3);font-size:10px;cursor:pointer;font-weight:700;color:var(--accent);list-style:none;display:flex;align-items:center;gap:4px"><svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>Simulador de Prazo</summary>
  <div style="padding:8px;border-radius:0 0 10px 10px;background:var(--bg3);font-size:10px;margin-top:-2px">
    <div class="flex items-center justify-between"><span style="color:var(--sub)">Aporte Extra (R$):</span><input class="fi" type="number" step="10" value="0" style="width:60px;height:24px;padding:2px 6px;font-size:10px" oninput="App.simProj('${p.id}', this.value, this.parentElement.nextElementSibling.querySelector('b'))"></div>
    <div class="mt-1" style="color:var(--sub)">Tempo restante: <b style="color:var(--text)">${p.objetivo && ac < p.objetivo ? 'Calculando...' : 'Meta atingida'}</b></div>
  </div>
</details>

<div class="flex gap-2">
    <button class="btn btn-g btn-sm flex-1 mt-3" onclick="App.openAporteModal('${p.id}')">${IC.plus} Aporte</button>
    <button class="btn btn-g btn-sm flex-1 mt-3" style="color:var(--green);border-color:rgba(52,211,153,.3);background:rgba(52,211,153,.05)" onclick="App.openRendModal('${p.id}')">${IC.plus} Rendim.</button>
</div>
${aportesArr.length ? `<div style="margin-top:8px"><button type="button" class="at" onclick="document.getElementById('${fid}').classList.toggle('open');this.querySelector('.chv2').classList.toggle('r90')"><svg class="chv2" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="transition:transform .25s"><path d="M9 5l7 7-7 7"/></svg>Aportes <span class="badge badge-blue" style="font-size:9px">${aportesArr.length}</span></button><div class="ddb" id="${fid}"><div class="pt-1">${aportesArr.map(([m, v]) => `<div class="flex items-center justify-between py-2"><span style="color:var(--sub);font-size:11px">${ml(m)}</span><div class="flex items-center gap-2"><span class="font-semibold text-xs" style="color:${+v >= 0 ? 'var(--accent2)' : 'var(--red)'}">${+v >= 0 ? '+' : ''}${fmt(v, true)}</span><button class="bi" style="width:22px;height:22px" onclick="App.delAporte('${p.id}','${m}')">${IC.x}</button></div></div>`).join('')}</div></div></div>` : ''}
${rendsArr.length ? `<div style="margin-top:4px"><button type="button" class="at" onclick="document.getElementById('${fidR}').classList.toggle('open');this.querySelector('.chv2').classList.toggle('r90')"><svg class="chv2" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="transition:transform .25s"><path d="M9 5l7 7-7 7"/></svg>Rendimentos da Caixinha <span class="badge badge-green" style="font-size:9px">${rendsArr.length}</span></button><div class="ddb" id="${fidR}"><div class="pt-1">${rendsArr.map(([m, v]) => `<div class="flex items-center justify-between py-2"><span style="color:var(--sub);font-size:11px">${ml(m)}</span><div class="flex items-center gap-2"><span class="font-semibold text-xs" style="color:${+v >= 0 ? 'var(--green)' : 'var(--red)'}">${+v >= 0 ? '+' : ''}${fmt(v, true)}</span><button class="bi" style="width:22px;height:22px" onclick="App.delRendimento('${p.id}','${m}')">${IC.x}</button></div></div>`).join('')}</div></div></div>` : ''}
</div>`;
            } else {
                const isFuture = p.mes && p.mes > this.curM;
                const mesesFalta = isFuture ? (() => { const { y: y1, m: m1 } = pm(this.curM), { y: y2, m: m2 } = pm(p.mes); return (y2 - y1) * 12 + (m2 - m1) })() : 0;
                const aportesEvArr = Object.entries(p.aportes || {}).sort((a, b) => b[0].localeCompare(a[0]));
                const acEv = aportesEvArr.reduce((s, [, v]) => s + +v, 0);
                const pctEv = p.valor ? Math.min(100, (acEv / p.valor) * 100) : 0;
                const fidEv = 'apev_' + p.id.replace(/\W/g, '');
                det = `<div class="mt-3 pt-2" style="border-top:1px solid var(--border)">
<div class="flex items-center justify-between mb-1"><p style="font-size:12px;color:var(--sub)">Meta: ${fmt(p.valor || 0, true)} ${p.mes ? 'até ' + ml(p.mes) : ''}</p>${isFuture ? `<span style="font-size:11px;color:var(--accent2)">Faltam ${mesesFalta} meses</span>` : ''}</div>
<p class="font-bold text-base mb-1" style="color:${acEv > 0 ? 'var(--purple)' : 'var(--sub)'}">${fmt(acEv, true)} <span style="font-size:11px;font-weight:400;color:var(--sub)">de ${fmt(p.valor || 0, true)}</span></p>
${p.valor ? `<div class="pbar mb-1" style="height:8px"><div class="pfill" style="width:${pctEv}%;background:linear-gradient(90deg,#a78bfa,#7c3aed)"></div></div><p style="font-size:11px;color:var(--sub)">${pctEv.toFixed(0)}% ${pctEv >= 100 ? '<span style="color:var(--green)">— Meta atingida!</span>' : 'juntado'}</p>` : ''}
<button class="btn btn-g btn-sm w-full mt-2" onclick="App.openAporteModal('${p.id}')">${IC.plus} Registrar Aporte</button>
${aportesEvArr.length ? `<div style="margin-top:8px"><button type="button" class="at" onclick="document.getElementById('${fidEv}').classList.toggle('open');this.querySelector('.chv2').classList.toggle('r90')"><svg class="chv2" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="transition:transform .25s"><path d="M9 5l7 7-7 7"/></svg>Aportes <span class="badge badge-purple" style="font-size:9px">${aportesEvArr.length}</span></button><div class="ddb" id="${fidEv}"><div class="pt-1">${aportesEvArr.map(([m, v]) => `<div class="flex items-center justify-between py-2"><span style="color:var(--sub);font-size:11px">${ml(m)}</span><div class="flex items-center gap-2"><span class="font-semibold text-xs" style="color:${+v >= 0 ? 'var(--purple)' : 'var(--red)'}">+${fmt(v, true)}</span><button class="bi" style="width:22px;height:22px" onclick="App.delAporte('${p.id}','${m}')">${IC.x}</button></div></div>`).join('')}</div></div></div>` : ''}
</div>`;
            }
            const isPaidP = d.projetosPagos && d.projetosPagos[`${p.id}_${this.curM}`];
            return `<div class="card card-h stagger" style="border-left:4px solid; border-image: ${inf.g} 1; animation-delay:${idx * .06}s; ${isPaidP ? 'opacity:0.85' : ''}"><div class="flex items-center justify-between min-w-0 gap-2">
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <button class="paid-toggle ${isPaidP ? 'is-paid' : ''}" onclick="event.stopPropagation();App.togPaidProj('${p.id}', '${this.curM}')" title="${isPaidP ? 'Desmarcar pago' : 'Marcar como pago'}"><svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></button>
      <div class="min-w-0">
        <p class="font-bold text-sm truncate uppercase tracking-wider flex items-center gap-2" style="${isPaidP ? 'opacity:0.6' : ''}">${p.nome}</p>
        <div class="flex items-center gap-2">
          <span class="badge ${isPaidP ? 'badge-green' : inf.b} truncate flex shrink-0 w-fit">${isPaidP ? 'REALIZADO' : inf.l}</span>
          ${isPaidP ? `<span class="badge-paid">PAGO</span>` : ''}
        </div>
      </div>
    </div>
    <div class="proj-ra flex-shrink-0"><button class="bi shrink-0" title="Editar" onclick="App.openProjModal('${p.id}')">${IC.edit}</button><button class="bi shrink-0" title="Duplicar" onclick="App.dupProj('${p.id}')">${IC.dup}</button><button class="bi shrink-0" title="Excluir" onclick="App.delProj('${p.id}')">${IC.trash}</button></div></div>${det}</div>`
        }).join('');
        // Execute initial simulation for all projects
        d.projetos.forEach(p => { if ((p.tipo === 'meta_continua' || p.tipo === 'oportunidade') && p.objetivo) { const el = document.getElementById(`simRes_${p.id}`); if (el) this.simProj(p.id, 0, el); } });
    },

    cfmR(v) { document.getElementById('cfmDlg').classList.remove('active'); if (_cfmCb) { _cfmCb(v); _cfmCb = null } },
    exportJSON() { const d = D.get(), b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `financeiro_${new Date().toISOString().slice(0, 10)}.json`; a.click(); toast('Exportado!') },
    importJSON(e) { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { try { const d = JSON.parse(ev.target.result); D.reset(d); D.load(); const siInput = document.getElementById('siInput'); if (siInput) siInput.value = d.saldoInicialBase || ''; this.renderAll(); toast('Importado!') } catch (err) { toast('Arquivo inválido', '#f87171', 'error') } }; r.readAsText(f); e.target.value = '' },
    toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        localStorage.setItem('fintrackr_theme', isLight ? 'light' : 'dark');
    },
    obStep(dir) {
        const steps = document.querySelectorAll('.ob-step');
        const dots = document.querySelectorAll('.ob-dot');
        let cur = Array.from(steps).findIndex(s => s.style.display !== 'none');
        if (cur === -1) cur = 0;

        steps[cur].style.display = 'none';
        dots[cur].classList.remove('active');

        cur += dir;

        if (cur >= steps.length) {
            const ob = document.getElementById('onboardingOverlay');
            ob.classList.remove('active');
            setTimeout(() => ob.style.display = 'none', 300);

            const d = D.get();
            d.onboardingDone = true;
            D.saveToFirestore();
            return;
        }

        steps[cur].style.display = 'block';
        dots[cur].classList.add('active');

        document.getElementById('obPrev').style.display = cur > 0 ? 'inline-block' : 'none';
        document.getElementById('obNext').textContent = cur === steps.length - 1 ? 'Começar!' : 'Próximo';
    },
    async loginGoogle() {
        const btn = document.getElementById('btnGoogleLogin');
        const status = document.getElementById('loginStatus');
        btn.disabled = true; btn.style.opacity = '.6';
        status.textContent = 'Conectando...';
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await auth.signInWithPopup(provider);
        } catch (e) {
            if (e.code !== 'auth/popup-closed-by-user') {
                status.textContent = 'Erro: ' + e.message;
                status.style.color = 'var(--red)';
            } else { status.textContent = '' }
            btn.disabled = false; btn.style.opacity = '1';
        }
    },
    async logout() {
        try {
            await auth.signOut();
            D._d = null;
            document.getElementById('loginOverlay').style.display = 'flex';
            document.getElementById('userBadge').style.display = 'none';
        } catch (e) { console.error('Logout error:', e) }
    }
};

document.querySelectorAll('.modal-bg').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active') }));
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('fintrackr_theme') === 'light') document.body.classList.add('light-theme');

    if (_isDevMode) {
        // ─── DEV MODE: pula Firebase Auth, carrega do localStorage ───
        const overlay = document.getElementById('loginOverlay');
        overlay.style.display = 'none';
        document.getElementById('onboardingOverlay').style.display = 'none';
        D.load();
        App.init();
        console.log('%c[DEV MODE] App inicializado com dados locais', 'color:#34d399;font-weight:bold');
        return;
    }

    auth.getRedirectResult().catch(e => {
        if (e.code === 'auth/missing-initial-state' || e.code === 'auth/api-key-expired') {
            console.log("Limpando cache de autenticação antigo...");
            window.sessionStorage.clear();
            localStorage.removeItem('firebase:sentinel');
            window.location.reload();
        }
    });
    auth.onAuthStateChanged(async user => {
        const overlay = document.getElementById('loginOverlay');
        if (user) {
            _fbUid = user.uid;
            document.getElementById('loginStatus').textContent = 'Carregando dados...';
            await D.loadFromFirestore();
            overlay.style.display = 'none';
            document.getElementById('userBadge').style.display = 'flex';
            document.getElementById('userAvatar').src = user.photoURL || '';
            document.getElementById('userAvatar').title = user.displayName || user.email;
            App.init();

            if (!D.get().onboardingDone) {
                document.getElementById('onboardingOverlay').style.display = 'flex';
                setTimeout(() => {
                    document.getElementById('onboardingOverlay').classList.add('active');
                    App.obStep(0); // initialize layout
                }, 50);
            } else {
                document.getElementById('onboardingOverlay').style.display = 'none';
            }
        } else {
            _fbUid = null;
            overlay.style.display = 'flex';
            document.getElementById('loginStatus').textContent = '';
            document.getElementById('userBadge').style.display = 'none';
            // Re-enable login button after logout
            const btn = document.getElementById('btnGoogleLogin');
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        }
    });
});