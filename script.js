// ---------- Armazenamento (por navegador; leitura/escrita protegidas por try/catch) ----------
const KEY = 'recepcao:registros';
let regs = [];
let aba = 'dentro';
try { regs = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { regs = []; }
function salvar() { try { localStorage.setItem(KEY, JSON.stringify(regs)); } catch (e) {} }

// ---------- Utilidades ----------
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hora = iso => new Date(iso).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
const ehHoje = iso => new Date(iso).toDateString() === new Date().toDateString();
function ha(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
}

// ---------- Ações ----------
function registrar() {
  const nome = $('nome').value.trim(), doc = $('doc').value.trim();
  const tipo = $('tipo').value, retirada = tipo.startsWith('Responsável');
  const aluno = $('aluno').value.trim();
  if (!nome || !doc || (retirada && !aluno)) {
    $('msg').textContent = 'Preencha nome, documento' + (retirada ? ' e aluno.' : '.');
    return;
  }
  regs.unshift({ id: Date.now(), nome, doc, tipo, aluno: retirada ? aluno : '',
                 destino: $('destino').value, entrada: new Date().toISOString(), saida: null });
  salvar();
  ['nome','doc','aluno'].forEach(i => $(i).value = '');
  $('msg').textContent = 'Entrada de ' + nome + ' registrada às ' + hora(regs[0].entrada) + '.';
  $('nome').focus();
  render();
}
function darSaida(id) {
  const r = regs.find(x => x.id === id);
  if (r) { r.saida = new Date().toISOString(); salvar(); render(); }
}

// ---------- Renderização ----------
function render() {
  const hoje = regs.filter(r => ehHoje(r.entrada));
  const dentro = regs.filter(r => !r.saida);
  $('sDentro').textContent = dentro.length;
  $('sHoje').textContent = hoje.length;
  $('sRetirada').textContent = hoje.filter(r => r.tipo.startsWith('Responsável')).length;

  const q = $('busca').value.toLowerCase();
  const base = aba === 'dentro' ? dentro : hoje;
  const itens = base.filter(r => (r.nome + ' ' + r.aluno + ' ' + r.destino).toLowerCase().includes(q));

  $('lista').innerHTML = itens.length ? itens.map(r => `
    <div class="row">
      <div class="info">
        <strong>${esc(r.nome)}</strong>
        <small><span class="tag">${esc(r.tipo)}</span>${esc(r.destino)}${r.aluno ? ' · Aluno: ' + esc(r.aluno) : ''}</small>
        <small>Doc.: ${esc(r.doc)} · Entrada ${hora(r.entrada)}${r.saida
          ? ' · <span class="out">Saída ' + hora(r.saida) + '</span>'
          : ' · <span class="in">dentro há ' + ha(r.entrada) + '</span>'}</small>
      </div>
      ${r.saida ? '' : `<button data-id="${r.id}">Registrar saída</button>`}
    </div>`).join('') : '<div class="empty">Nenhum registro encontrado.</div>';
}

// ---------- Eventos ----------
$('btnAdd').onclick = registrar;
$('tipo').onchange = () => $('boxAluno').classList.toggle('hide', !$('tipo').value.startsWith('Responsável'));
$('busca').oninput = render;
$('lista').onclick = e => { const id = e.target.dataset.id; if (id) darSaida(Number(id)); };
function trocarAba(a) {
  aba = a;
  $('tDentro').setAttribute('aria-pressed', a === 'dentro');
  $('tHist').setAttribute('aria-pressed', a === 'hist');
  render();
}
$('tDentro').onclick = () => trocarAba('dentro');
$('tHist').onclick = () => trocarAba('hist');
setInterval(render, 60000); // atualiza o "dentro há X min"
render();
