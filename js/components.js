// MONTH PICKER COMPONENT
class MonthPicker {
    constructor(wrap, val, onChange) {
        this.wrap = typeof wrap === 'string' ? document.getElementById(wrap) : wrap;
        this.val = val || curMonth();
        this.onChange = onChange;
        const { y } = pm(this.val); this.viewY = y;
        this.render();
        document.addEventListener('click', e => { if (!this.wrap.contains(e.target)) this.close() });
    }
    render() {
        const { m } = pm(this.val); const cur = curMonth(); const { m: cm, y: cy } = pm(cur);
        this.wrap.innerHTML = `<button type="button" class="mp-display" data-mp="tgl"><span>${ml(this.val)}</span><svg width="12" height="12" fill="none" stroke="var(--sub)" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
    <div class="mp-drop" data-mp="drop">
      <div class="mp-year"><button type="button" class="bi" data-mp="prev" style="width:24px;height:24px"><svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg></button>
      <span>${this.viewY}</span>
      <button type="button" class="bi" data-mp="next" style="width:24px;height:24px"><svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></div>
      <div class="mp-grid">${MN.map((_, i) => { const k = mk(this.viewY, i + 1); const isSel = k === this.val; const isCur = i + 1 === cm && this.viewY === cy; return `<button type="button" class="mp-cell${isSel ? ' selected' : ''}${isCur && !isSel ? ' current' : ''}" data-mp="sel" data-v="${k}">${MS[i]}</button>` }).join('')}</div></div>`;
        this.wrap.querySelector('[data-mp="tgl"]').onclick = () => this.toggle();
        this.wrap.querySelector('[data-mp="prev"]').onclick = e => { e.stopPropagation(); this.viewY--; this.render(); this.wrap.querySelector('.mp-drop').classList.add('open') };
        this.wrap.querySelector('[data-mp="next"]').onclick = e => { e.stopPropagation(); this.viewY++; this.render(); this.wrap.querySelector('.mp-drop').classList.add('open') };
        this.wrap.querySelectorAll('[data-mp="sel"]').forEach(b => b.onclick = e => { e.stopPropagation(); this.val = b.dataset.v; this.close(); this.render(); if (this.onChange) this.onChange(this.val) });
    }
    toggle() { const d = this.wrap.querySelector('.mp-drop'); d.classList.toggle('open') }
    close() { const d = this.wrap.querySelector('.mp-drop'); if (d) d.classList.remove('open') }
    getVal() { return this.val }
    setVal(v) { this.val = v; const { y } = pm(v); this.viewY = y; this.render() }
}
let mpRec, mpRecI, mpCar, mpProjI, mpProjE, mpDiv, mpProjAlvo;

// Firebase init calls are now handled in firebase-config.js
const auth = firebase.auth();
const db = firebase.firestore();
db.enablePersistence().catch(() => { });
let _fbUid = null;

// ─── DEV MODE: pula auth no localhost para testar localmente ───
const _isDevMode = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') && !new URLSearchParams(window.location.search).has('prod');
if (_isDevMode) console.log('%c[DEV MODE] Auth bypass ativo — dados do localStorage', 'color:#22d3ee;font-weight:bold');

const D = {
    _d: null,
    dfl() { return { saldoInicialBase: 0, primeiroMes: curMonth(), receitas: [], cartoes: [], projetos: [], meusCartoes: [], contas: [], orcamentoVariavel: 0, orcamentoCategorias: {}, automacoesCategoria: { 'ifood': 'Alimentação', 'uber': 'Transporte', '99app': 'Transporte', 'netflix': 'Lazer', 'spotify': 'Lazer', 'amazon': 'Compras', 'mercado livre': 'Compras' }, onboardingDone: false, pagamentos: {}, faturasPagas: {}, projetosPagos: {} } },
    _migrate(d) {
        if (d.fixas && Array.isArray(d.fixas)) { d.fixas.forEach(f => { if (!d.receitas.find(r => r.id === f.id)) d.receitas.push(f) }); delete d.fixas; }
        ['receitas', 'cartoes', 'projetos', 'meusCartoes', 'contas'].forEach(k => { if (!Array.isArray(d[k])) d[k] = [] });
        d.cartoes.forEach(c => { if (c.cartao && !d.meusCartoes.includes(c.cartao)) d.meusCartoes.push(c.cartao) });
        // Conta padrão obrigatória
        if (!d.contas.length) {
            d.contas.push({ id: uid(), nome: 'Carteira', cor: 'var(--green)', saldoInicial: d.saldoInicialBase || 0 });
        }
        // Migração de órfãs: 1 conta → automático
        if (d.contas.length === 1) {
            const cid = d.contas[0].id;
            let migrated = 0;
            d.receitas.forEach(r => {
                if (!r.contaId || !d.contas.find(c => c.id === r.contaId)) {
                    r.contaId = cid; migrated++;
                }
            });
            if (migrated > 0) setTimeout(() => toast(`${migrated} transaç${migrated > 1 ? 'ões' : 'ão'} vinculada${migrated > 1 ? 's' : ''} à ${d.contas[0].nome}`), 500);
        }
        // Migração de automações
        if (!d.automacoesCategoria) d.automacoesCategoria = { 'ifood': 'Alimentação', 'uber': 'Transporte', '99app': 'Transporte', 'netflix': 'Lazer', 'spotify': 'Lazer', 'amazon': 'Compras', 'mercado livre': 'Compras' };
        if (!d.orcamentoCategorias) d.orcamentoCategorias = {};
        if (!d.pagamentos) d.pagamentos = {};
        if (!d.faturasPagas) d.faturasPagas = {};
        if (!d.projetosPagos) d.projetosPagos = {};
        return d;
    },
    load() {
        try { this._d = JSON.parse(localStorage.getItem(SK)) || this.dfl() } catch (e) { this._d = this.dfl() }
        this._d = this._migrate(this._d);
        return this._d;
    },
    async loadFromFirestore() {
        if (!_fbUid) return this.load();
        try {
            const doc = await db.collection('users').doc(_fbUid).get();
            if (doc.exists) {
                this._d = this._migrate(doc.data());
            } else {
                // New user: start with clean default data
                this._d = this.dfl();
                await this.saveToFirestore();
            }
            localStorage.setItem(SK, JSON.stringify(this._d));
        } catch (e) {
            console.warn('Firestore read failed, using local:', e);
            this.load();
        }
        return this._d;
    },
    save() {
        localStorage.setItem(SK, JSON.stringify(this._d));
        this.saveToFirestore();
    },
    async saveToFirestore() {
        if (!_fbUid || !this._d) return;
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.log('%c[SANDBOX] Alteração salva apenas no localStorage local. Banco de produção protegido.', 'color:#fbbf24;font-weight:bold');
            return;
        }
        try {
            await db.collection('users').doc(_fbUid).set(JSON.parse(JSON.stringify(this._d)));
        } catch (e) { console.warn('Firestore write failed:', e) }
    },
    get() { if (!this._d) this.load(); return this._d },
    reset(d) { this._d = d; this.save() }
};

function toast(m, c = '#34d399', type = 'success') {
    const t = document.getElementById('toast');
    const icons = { success: '<svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>', error: '<svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>', warn: '<svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"/></svg>' };
    document.getElementById('toastIc').innerHTML = icons[type] || icons.success;
    document.getElementById('toastMsg').innerHTML = m;
    t.style.background = c; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}
let _cfmCb = null;
function cfm2(t, m, btnCancel = 'Cancelar', btnConfirm = 'Excluir', isDanger = true) {
    return new Promise(r => {
        document.getElementById('cfmT').textContent = t;
        document.getElementById('cfmM').innerHTML = m;
        document.getElementById('cfmBtnCancel').textContent = btnCancel;
        const bCfm = document.getElementById('cfmBtnConfirm');
        bCfm.textContent = btnConfirm;
        if (isDanger) { bCfm.className = 'btn btn-d w-full'; bCfm.style.background = ''; }
        else { bCfm.className = 'btn btn-p w-full'; bCfm.style.background = 'var(--accent)'; }
        document.getElementById('cfmDlg').classList.add('active');
        _cfmCb = r
    })
}