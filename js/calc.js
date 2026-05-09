function calc(mes, soConfirmados = false) {
    const d = D.get(); let ent = 0, fix = 0, car = 0, proj = 0, vari = 0;
    d.receitas.forEach(r => {
        let act = false;
        if (r.repeticao === 'mensal') act = !(r.mesInicio && mes < r.mesInicio);
        else if (r.repeticao === 'parcelado') act = r.mesInicio && mes >= r.mesInicio && mes <= am(r.mesInicio, (r.qtdMeses || 1) - 1);
        else act = r.mesUnico === mes;
        if (!act) return;

        if (soConfirmados) {
            const pid = r.repeticao === 'mensal' || r.repeticao === 'parcelado' ? `${r.id}_${mes}` : r.id;
            if (!d.pagamentos[pid]) return;
        }

        if (r.tipo === 'entrada') ent += +r.valor;
        else if (r.tipo === 'variavel') vari += +r.valor;
        else fix += +r.valor
    });
    d.cartoes.forEach(c => {
        if (soConfirmados && !d.faturasPagas[`${c.id}_${mes}`]) return;
        const ant = c.antecipacoes || [];
        let antMes = 0; ant.forEach(a => { if (a === mes) antMes++ });
        let normalMes = false;
        for (let i = 0; i < c.qtdParcelas - ant.length; i++) { if (am(c.dataPrimeiraParcela, i) === mes) { normalMes = true; break } }
        if (normalMes || antMes > 0) car += c.valorParcela * ((normalMes ? 1 : 0) + antMes);
    });
    d.projetos.forEach(p => {
        const paidKey = `${p.id}_${mes}`;
        if (p.tipo === 'divida_irregular') {
            if (soConfirmados && !d.projetosPagos[paidKey]) return;
            if (p.valores && p.valores[mes]) proj += +p.valores[mes]
        }
        else if (p.tipo === 'meta_continua') {
            if (soConfirmados && !d.projetosPagos[paidKey]) return;
            if (p.aportes && p.aportes[mes] !== undefined) proj += +p.aportes[mes];
            else if (p.dataInicio && mes >= p.dataInicio) proj += +(p.valorMensal || 0);
        }
        else if (p.tipo === 'evento_unico') {
            if (soConfirmados && !d.projetosPagos[paidKey]) return;
            if (p.mes === mes) proj += +p.valor
        }
    });
    return { ent, fix, car, proj, vari };
}
// Calcula despesas agrupadas por categoria no mês
function calcByCategory(mes) {
    const d = D.get(), cats = {};
    d.receitas.forEach(r => {
        let act = false;
        if (r.repeticao === 'mensal') act = !(r.mesInicio && mes < r.mesInicio);
        else if (r.repeticao === 'parcelado') act = r.mesInicio && mes >= r.mesInicio && mes <= am(r.mesInicio, (r.qtdMeses || 1) - 1);
        else act = r.mesUnico === mes;
        if (!act || r.tipo === 'entrada') return;
        const cat = r.cat || 'Sem categoria';
        cats[cat] = (cats[cat] || 0) + +r.valor;
    });
    d.cartoes.forEach(c => {
        const ant = c.antecipacoes || [];
        let antMes = 0; ant.forEach(a => { if (a === mes) antMes++ });
        let normalMes = false;
        for (let i = 0; i < c.qtdParcelas - ant.length; i++) { if (am(c.dataPrimeiraParcela, i) === mes) { normalMes = true; break } }
        if (normalMes || antMes > 0) {
            const cat = c.cat || 'Cartões';
            cats[cat] = (cats[cat] || 0) + c.valorParcela * ((normalMes ? 1 : 0) + antMes);
        }
    });
    return cats;
}
// Classificação 50-30-20
const CatClass = {
    'Moradia': 'N', 'Alimentação': 'N', 'Transporte': 'N', 'Saúde': 'N',
    'Educação': 'I', 'Assinaturas': 'D', 'Lazer': 'D', 'Compras': 'D',
    'Serviços': 'N', 'Outros': 'D', 'Sem categoria': 'D', 'Cartões': 'D'
};
function saldoIni(mes, soConfirmados = false) {
    const d = D.get();
    if (mes <= d.primeiroMes) return (d.contas ? d.contas.reduce((acc, c) => acc + (c.saldoInicial || 0), 0) : 0);
    const prev = am(mes, -1), si = saldoIni(prev, soConfirmados), c = calc(prev, soConfirmados);
    // Saldo baseado apenas em despesas REAIS cadastradas (sem teto fantasma)
    return si + c.ent - c.fix - c.car - c.proj - c.vari;
}
function saldoConta(contaId, mes, soConfirmados = false) {
    const d = D.get(), ct = d.contas.find(x => x.id === contaId);
    if (!ct) return 0;
    let saldo = ct.saldoInicial || 0;
    const inicio = d.primeiroMes || mes;
    const isPrincipal = d.contas.length === 1 || d.contas[0].id === contaId;
    let m = inicio;
    while (m <= mes) {
        const c = calc(m, soConfirmados);
        // Receitas e despesas vinculadas a esta conta
        d.receitas.forEach(r => {
            if (r.contaId !== contaId) return;
            let act = false;
            if (r.repeticao === 'mensal') act = !(r.mesInicio && m < r.mesInicio);
            else if (r.repeticao === 'parcelado') act = r.mesInicio && m >= r.mesInicio && m <= am(r.mesInicio, (r.qtdMeses || 1) - 1);
            else act = r.mesUnico === m;
            if (!act) return;

            if (soConfirmados) {
                const pid = r.repeticao === 'mensal' || r.repeticao === 'parcelado' ? `${r.id}_${m}` : r.id;
                if (!d.pagamentos[pid]) return;
            }

            if (r.tipo === 'entrada') saldo += +r.valor;
            else saldo -= +r.valor;
        });
        if (isPrincipal) {
            // Cartões e Caixinhas (gastos globais)
            d.cartoes.forEach(cr => {
                if (soConfirmados && !d.faturasPagas[`${cr.id}_${m}`]) return;
                const ant = cr.antecipacoes || [];
                let antMes = 0; ant.forEach(a => { if (a === m) antMes++ });
                let normalMes = false;
                for (let i = 0; i < cr.qtdParcelas - ant.length; i++) { if (am(cr.dataPrimeiraParcela, i) === m) { normalMes = true; break } }
                if (normalMes || antMes > 0) saldo -= cr.valorParcela * ((normalMes ? 1 : 0) + antMes);
            });
            d.projetos.forEach(p => {
                const paidKey = `${p.id}_${m}`;
                if (soConfirmados && !d.projetosPagos[paidKey]) return;
                if (p.tipo === 'divida_irregular') { if (p.valores && p.valores[m]) saldo -= +p.valores[m] }
                else if (p.tipo === 'meta_continua') {
                    if (p.aportes && p.aportes[m] !== undefined) saldo -= +p.aportes[m];
                    else if (p.dataInicio && m >= p.dataInicio) saldo -= +(p.valorMensal || 0);
                }
                else if (p.tipo === 'evento_unico') { if (p.mes === m) saldo -= +p.valor }
            });
        }
        m = am(m, 1);
    }
    return saldo;
}

// DONUT CHART
function donut(el, segs, total) {
    if (total <= 0) { el.innerHTML = `<p class="text-xs font-bold mb-2">Composição</p><div class="text-center py-4" style="color:var(--sub)"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 6px;opacity:.4"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg><p class="text-xs">Sem saídas registradas</p><p style="font-size:10px;margin-top:2px">Adicione despesas para ver o gráfico</p></div>`; return }
    const R = 40, C = 2 * Math.PI * R; let off = 0;
    const backdrop = `<circle r="${R}" cx="50" cy="50" fill="none" stroke="var(--bg3)" stroke-width="14" />`;
    const paths = segs.filter(s => s.v > 0).map(s => {
        const pct = s.v / total;
        const dash = C * pct;
        const gap = C - dash;
        const path = `<circle r="${R}" cx="50" cy="50" fill="none" stroke="${s.c}" stroke-width="14" stroke-dasharray="${Math.max(0, dash - 0.5)} ${gap + 0.5}" stroke-dashoffset="${-off}" stroke-linecap="round" style="transition:all .5s; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15))"/>`;
        off += dash;
        return path;
    });
    const legend = segs.filter(s => s.v > 0).map(s => `
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
                <div style="width:10px;height:10px;border-radius:3px;background:${s.c};box-shadow:0 0 6px ${s.c}66"></div>
                <span style="color:var(--text);font-size:11px;font-weight:500;white-space:nowrap">${s.l}</span>
            </div>
            <div class="text-right pl-3">
                <span class="font-bold text-xs">${((s.v / total) * 100).toFixed(0)}%</span>
            </div>
        </div>`).join('');
    el.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <span class="sl">Composição</span>
            <div class="ic ic-sm" style="background:rgba(167,139,250,0.1)"><span style="color:var(--purple)"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z"/></svg></span></div>
        </div>
        <div class="donut-wrap flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-1">
            <div style="position:relative;width:100px;height:100px;flex-shrink:0">
                <svg viewBox="0 0 100 100" width="100%" height="100%" style="transform:rotate(-90deg);overflow:visible">
                    ${backdrop}
                    ${paths.join('')}
                </svg>
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column">
                    <span style="font-size:9px;color:var(--sub);font-weight:600;text-transform:uppercase">Total</span>
                    <span style="font-size:10px;font-weight:800;color:var(--text)">${fmt(total).replace('R$', '').trim()}</span>
                </div>
            </div>
            <div class="flex-1 min-w-0 w-full" style="padding-top:4px">
                ${legend}
            </div>
        </div>`.replace(/>\s+</g, '><').trim();
}