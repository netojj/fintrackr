const SK = 'financeiro_data';
const Categ = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Serviços', 'Compras', 'Outros'];
const MN = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
const fmt = (v, forceShow = false) => {
    const val = (+v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (forceShow) return val;
    return `<span class="pv" onclick="event.stopPropagation();this.classList.toggle('revealed')"><span class="pv-mask">••••</span><span class="pv-val">${val}</span></span>`;
};
const mk = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
const pm = k => { const p = k.split('-'); return { y: +p[0], m: +p[1] } };
const am = (k, n) => { const { y, m } = pm(k); const d = new Date(y, m - 1 + n, 1); return mk(d.getFullYear(), d.getMonth() + 1) };
const ml = k => { const { y, m } = pm(k); return `${MN[m - 1]} ${y}` };
const curMonth = () => mk(new Date().getFullYear(), new Date().getMonth() + 1);
const diffMonths = (m1, m2) => { const { y: y1, m: mm1 } = pm(m1), { y: y2, m: mm2 } = pm(m2); return (y2 - y1) * 12 + (mm2 - mm1); };
const IC = {
    edit: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>',
    dup: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    plus: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14"/></svg>',
    x: '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    card: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
    chk: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
    warn: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"/></svg>'
};
const CC = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
function ccol(n) { let h = 0; for (let i = 0; i < n.length; i++)h = n.charCodeAt(i) + ((h << 5) - h); return CC[Math.abs(h) % CC.length] }