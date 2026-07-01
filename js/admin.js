/* =========================================================
   ENGESOL — Script da área administrativa
========================================================= */

const ADMIN_PASSWORD = "engesol2026";

const KEYS = {
  quotes: "engesol_quotes",
  schedules: "engesol_schedules",
  messages: "engesol_messages",
  clients: "engesol_clients",
};

function readDB(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeDB(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Login ---------- */
const loginWrap = document.getElementById("adminLoginWrap");
const dashboard = document.getElementById("adminDashboard");
const loginForm = document.getElementById("adminLoginForm");
const loginError = document.getElementById("adminLoginError");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const pwd = document.getElementById("adminPassword").value;
  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem("engesol_admin_auth", "1");
    showDashboard();
  } else {
    loginError.textContent = "Senha incorreta. Tente novamente.";
  }
});

function showDashboard() {
  loginWrap.style.display = "none";
  dashboard.classList.add("show");
  renderAll();
}

if (sessionStorage.getItem("engesol_admin_auth") === "1") {
  showDashboard();
}

/* ---------- Logout / limpar dados ---------- */
document.getElementById("adminClearBtn").addEventListener("click", () => {
  if (!confirm("Tem certeza que deseja apagar todos os dados de teste?")) return;
  writeDB(KEYS.quotes, []);
  writeDB(KEYS.schedules, []);
  writeDB(KEYS.messages, []);
  writeDB(KEYS.clients, []);
  renderAll();
});

/* ---------- Tabs ---------- */
document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
  });
});

/* ---------- Helpers ---------- */
function statusClass(status) {
  const map = {
    Novo: "status-novo",
    "Em contato": "status-em-contato",
    Fechado: "status-fechado",
    Agendado: "status-agendado",
    Confirmado: "status-confirmado",
    "Concluído": "status-concluido",
  };
  return map[status] || "";
}
function fmtDate(iso) {
  return new Date(iso).toLocaleString("pt-BR");
}

/* ---------- Render principal ---------- */
function renderAll() {
  const quotes = readDB(KEYS.quotes).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const schedules = readDB(KEYS.schedules).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const clients = readDB(KEYS.clients).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // Stats
  document.getElementById("statOrcamentos").textContent = quotes.length;
  document.getElementById("statAgendamentos").textContent = schedules.length;
  document.getElementById("statClientes").textContent = clients.length;
  document.getElementById("statAtendimentos").textContent = quotes.length + schedules.length;

  // Tab labels
  document.getElementById("tabLabelOrcamentos").textContent = `Orçamentos (${quotes.length})`;
  document.getElementById("tabLabelAgendamentos").textContent = `Agendamentos (${schedules.length})`;
  document.getElementById("tabLabelClientes").textContent = `Clientes (${clients.length})`;

  renderResumo(quotes, schedules);
  renderQuotesTable(quotes);
  renderSchedulesTable(schedules);
  renderClientsTable(clients);
}

function renderResumo(quotes, schedules) {
  const quotesList = document.getElementById("resumoOrcamentos");
  const schedulesList = document.getElementById("resumoAgendamentos");

  quotesList.innerHTML = quotes.length
    ? quotes
        .slice(0, 5)
        .map(
          (q) => `
      <div class="admin-list-item">
        <div><strong>${q.nome}</strong><small>${q.cidade} · ${q.tipoImovel}</small></div>
        <span class="status-pill ${statusClass(q.status)}">${q.status}</span>
      </div>`
        )
        .join("")
    : `<p class="admin-empty">Nenhum orçamento recebido ainda. Envie uma solicitação pelo site para ver aqui.</p>`;

  schedulesList.innerHTML = schedules.length
    ? schedules
        .slice(0, 5)
        .map(
          (s) => `
      <div class="admin-list-item">
        <div><strong>${s.nome}</strong><small>${s.tipoServico} · ${s.dataDesejada}</small></div>
        <span class="status-pill ${statusClass(s.status)}">${s.status}</span>
      </div>`
        )
        .join("")
    : `<p class="admin-empty">Nenhum agendamento registrado ainda. Agende uma manutenção pelo site para ver aqui.</p>`;
}

function renderQuotesTable(quotes) {
  const wrap = document.getElementById("quotesTableWrap");
  if (!quotes.length) {
    wrap.innerHTML = `<p class="admin-empty">Nenhum orçamento recebido ainda.</p>`;
    return;
  }
  wrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Nome</th><th>Cidade</th><th>Imóvel</th><th>Conta (R$)</th><th>Contato</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${quotes
          .map(
            (q) => `
          <tr>
            <td><strong>${q.nome}</strong></td>
            <td>${q.cidade}</td>
            <td>${q.tipoImovel}</td>
            <td>${q.valorConta}</td>
            <td>${q.telefone}<br>${q.email}</td>
            <td>
              <select data-id="${q.id}" class="quote-status-select">
                <option ${q.status === "Novo" ? "selected" : ""}>Novo</option>
                <option ${q.status === "Em contato" ? "selected" : ""}>Em contato</option>
                <option ${q.status === "Fechado" ? "selected" : ""}>Fechado</option>
              </select>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;

  wrap.querySelectorAll(".quote-status-select").forEach((sel) => {
    sel.addEventListener("change", () => {
      const list = readDB(KEYS.quotes).map((q) => (q.id === sel.dataset.id ? { ...q, status: sel.value } : q));
      writeDB(KEYS.quotes, list);
      renderAll();
    });
  });
}

function renderSchedulesTable(schedules) {
  const wrap = document.getElementById("schedulesTableWrap");
  if (!schedules.length) {
    wrap.innerHTML = `<p class="admin-empty">Nenhum agendamento registrado ainda.</p>`;
    return;
  }
  wrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Nome</th><th>Serviço</th><th>Data</th><th>Endereço</th><th>Contato</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${schedules
          .map(
            (s) => `
          <tr>
            <td><strong>${s.nome}</strong></td>
            <td>${s.tipoServico}</td>
            <td>${s.dataDesejada}</td>
            <td>${s.endereco}</td>
            <td>${s.telefone}<br>${s.email}</td>
            <td>
              <select data-id="${s.id}" class="schedule-status-select">
                <option ${s.status === "Agendado" ? "selected" : ""}>Agendado</option>
                <option ${s.status === "Confirmado" ? "selected" : ""}>Confirmado</option>
                <option ${s.status === "Concluído" ? "selected" : ""}>Concluído</option>
              </select>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;

  wrap.querySelectorAll(".schedule-status-select").forEach((sel) => {
    sel.addEventListener("change", () => {
      const list = readDB(KEYS.schedules).map((s) => (s.id === sel.dataset.id ? { ...s, status: sel.value } : s));
      writeDB(KEYS.schedules, list);
      renderAll();
    });
  });
}

function renderClientsTable(clients) {
  const wrap = document.getElementById("clientsTableWrap");
  if (!clients.length) {
    wrap.innerHTML = `<p class="admin-empty">Nenhum cliente cadastrado ainda.</p>`;
    return;
  }
  wrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr><th>Nome</th><th>Contato</th><th>Origem</th><th>Data</th></tr>
      </thead>
      <tbody>
        ${clients
          .map(
            (c) => `
          <tr>
            <td><strong>${c.nome}</strong></td>
            <td>${c.contato}</td>
            <td>${c.origem}</td>
            <td>${fmtDate(c.createdAt)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}