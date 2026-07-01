/* =========================================================
   ENGESOL — Script principal (site público)
========================================================= */

/* ---------- Utilitário de armazenamento (simula banco de dados) ---------- */
const ENGESOL_DB = {
  KEYS: {
    quotes: "engesol_quotes",
    schedules: "engesol_schedules",
    messages: "engesol_messages",
    clients: "engesol_clients",
  },
  uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  },
  read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  addQuote(data) {
    const list = this.read(this.KEYS.quotes);
    const record = { ...data, id: this.uid(), createdAt: new Date().toISOString(), status: "Novo" };
    list.push(record);
    this.write(this.KEYS.quotes, list);
    this.addClient({ nome: data.nome, contato: data.email || data.telefone, origem: "Orçamento" });
    return record;
  },
  addSchedule(data) {
    const list = this.read(this.KEYS.schedules);
    const record = { ...data, id: this.uid(), createdAt: new Date().toISOString(), status: "Agendado" };
    list.push(record);
    this.write(this.KEYS.schedules, list);
    this.addClient({ nome: data.nome, contato: data.email || data.telefone, origem: "Agendamento" });
    return record;
  },
  addMessage(data) {
    const list = this.read(this.KEYS.messages);
    const record = { ...data, id: this.uid(), createdAt: new Date().toISOString() };
    list.push(record);
    this.write(this.KEYS.messages, list);
    this.addClient({ nome: data.nome, contato: data.email || data.telefone, origem: "Contato" });
    return record;
  },
  addClient(data) {
    const list = this.read(this.KEYS.clients);
    const record = { ...data, id: this.uid(), createdAt: new Date().toISOString() };
    list.push(record);
    this.write(this.KEYS.clients, list);
    return record;
  },
};

/* ---------- Header: efeito de scroll ---------- */
const header = document.getElementById("header");
function handleHeaderScroll() {
  if (!header) return;
  if (window.scrollY > 30) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
}
window.addEventListener("scroll", handleHeaderScroll);
handleHeaderScroll();

/* ---------- Menu mobile (hambúrguer) ---------- */
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
    hamburger.textContent = mobileMenu.classList.contains("open") ? "✕" : "☰";
  });
  document.querySelectorAll(".mobile-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      hamburger.textContent = "☰";
    });
  });
}

/* ---------- Reveal on scroll ---------- */
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 60 + "ms";
  revealObserver.observe(el);
});

/* ---------- Contadores animados (stats) ---------- */
const counters = document.querySelectorAll(".counter");
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || "";
      let cur = 0;
      const step = target / 60;
      const tick = () => {
        cur += step;
        if (cur < target) {
          el.textContent = Math.floor(cur) + suffix;
          requestAnimationFrame(tick);
        } else {
          el.textContent = target + suffix;
        }
      };
      tick();
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.5 }
);
counters.forEach((c) => counterObserver.observe(c));

/* ---------- FAQ Accordion ---------- */
document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const answer = btn.nextElementSibling;
    const isOpen = btn.classList.contains("open");
    document.querySelectorAll(".faq-question").forEach((b) => {
      b.classList.remove("open");
      b.nextElementSibling.style.maxHeight = "0px";
    });
    if (!isOpen) {
      btn.classList.add("open");
      answer.style.maxHeight = answer.scrollHeight + "px";
    }
  });
});

/* ---------- Simulador de economia ---------- */
const simuladorForm = {
  input: document.getElementById("simConta"),
  select: document.getElementById("simTipo"),
  button: document.getElementById("simCalcular"),
  mensal: document.getElementById("simMensal"),
  anual: document.getElementById("simAnual"),
  total: document.getElementById("simTotal"),
};

const FATORES = {
  Casa: 0.95,
  Comércio: 0.9,
  Indústria: 0.85,
  "Propriedade rural": 0.92,
};

function formatBRL(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

if (simuladorForm.button) {
  simuladorForm.button.addEventListener("click", () => {
    const valor = parseFloat((simuladorForm.input.value || "").replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      simuladorForm.mensal.textContent = "R$ 0,00";
      simuladorForm.anual.textContent = "R$ 0,00";
      simuladorForm.total.textContent = "R$ 0,00";
      return;
    }
    const fator = FATORES[simuladorForm.select.value] || 0.9;
    const mensal = valor * fator;
    simuladorForm.mensal.textContent = formatBRL(mensal);
    simuladorForm.anual.textContent = formatBRL(mensal * 12);
    simuladorForm.total.textContent = formatBRL(mensal * 12 * 25);
  });
}

/* ---------- Validação genérica ---------- */
function isValidEmail(v) {
  return /^\S+@\S+\.\S+$/.test(v);
}
function isValidPhone(v) {
  return /^[\d()\s-]{8,}$/.test(v);
}
function setFieldError(input, errorEl, message) {
  if (message) {
    input.classList.add("error");
    errorEl.textContent = message;
    errorEl.style.display = "block";
  } else {
    input.classList.remove("error");
    errorEl.textContent = "";
    errorEl.style.display = "none";
  }
}

/* ---------- Formulário: Solicitação de Orçamento ---------- */
const quoteForm = document.getElementById("quoteForm");
if (quoteForm) {
  quoteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = quoteForm.querySelector("[name=nome]");
    const cidade = quoteForm.querySelector("[name=cidade]");
    const tipoImovel = quoteForm.querySelector("[name=tipoImovel]");
    const valorConta = quoteForm.querySelector("[name=valorConta]");
    const telefone = quoteForm.querySelector("[name=telefone]");
    const email = quoteForm.querySelector("[name=email]");

    let valid = true;

    setFieldError(nome, document.getElementById("err-quote-nome"), nome.value.trim() ? "" : "Informe seu nome.");
    if (!nome.value.trim()) valid = false;

    setFieldError(cidade, document.getElementById("err-quote-cidade"), cidade.value.trim() ? "" : "Informe sua cidade.");
    if (!cidade.value.trim()) valid = false;

    const validValor = valorConta.value.trim() && !isNaN(Number(valorConta.value.replace(",", ".")));
    setFieldError(valorConta, document.getElementById("err-quote-valor"), validValor ? "" : "Informe um valor válido.");
    if (!validValor) valid = false;

    setFieldError(telefone, document.getElementById("err-quote-telefone"), isValidPhone(telefone.value) ? "" : "Telefone inválido.");
    if (!isValidPhone(telefone.value)) valid = false;

    setFieldError(email, document.getElementById("err-quote-email"), isValidEmail(email.value) ? "" : "E-mail inválido.");
    if (!isValidEmail(email.value)) valid = false;

    if (!valid) return;

    ENGESOL_DB.addQuote({
      nome: nome.value.trim(),
      cidade: cidade.value.trim(),
      tipoImovel: tipoImovel.value,
      valorConta: valorConta.value.trim(),
      telefone: telefone.value.trim(),
      email: email.value.trim(),
    });

    quoteForm.reset();
    const msg = document.getElementById("quoteSuccess");
    msg.classList.add("show");
    setTimeout(() => msg.classList.remove("show"), 6000);
  });
}

/* ---------- Formulário: Agendamento de Manutenção ---------- */
const scheduleForm = document.getElementById("scheduleForm");
if (scheduleForm) {
  scheduleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = scheduleForm.querySelector("[name=nome]");
    const telefone = scheduleForm.querySelector("[name=telefone]");
    const email = scheduleForm.querySelector("[name=email]");
    const endereco = scheduleForm.querySelector("[name=endereco]");
    const tipoServico = scheduleForm.querySelector("[name=tipoServico]");
    const dataDesejada = scheduleForm.querySelector("[name=dataDesejada]");
    const observacoes = scheduleForm.querySelector("[name=observacoes]");

    let valid = true;

    setFieldError(nome, document.getElementById("err-sched-nome"), nome.value.trim() ? "" : "Informe seu nome.");
    if (!nome.value.trim()) valid = false;

    setFieldError(telefone, document.getElementById("err-sched-telefone"), isValidPhone(telefone.value) ? "" : "Telefone inválido.");
    if (!isValidPhone(telefone.value)) valid = false;

    setFieldError(email, document.getElementById("err-sched-email"), isValidEmail(email.value) ? "" : "E-mail inválido.");
    if (!isValidEmail(email.value)) valid = false;

    setFieldError(endereco, document.getElementById("err-sched-endereco"), endereco.value.trim() ? "" : "Informe o endereço.");
    if (!endereco.value.trim()) valid = false;

    setFieldError(dataDesejada, document.getElementById("err-sched-data"), dataDesejada.value ? "" : "Escolha uma data.");
    if (!dataDesejada.value) valid = false;

    if (!valid) return;

    ENGESOL_DB.addSchedule({
      nome: nome.value.trim(),
      telefone: telefone.value.trim(),
      email: email.value.trim(),
      endereco: endereco.value.trim(),
      tipoServico: tipoServico.value,
      dataDesejada: dataDesejada.value,
      observacoes: observacoes.value.trim(),
    });

    scheduleForm.reset();
    const msg = document.getElementById("scheduleSuccess");
    msg.classList.add("show");
    setTimeout(() => msg.classList.remove("show"), 6000);
  });
}

/* ---------- Formulário: Contato ---------- */
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = contactForm.querySelector("[name=nome]");
    const email = contactForm.querySelector("[name=email]");
    const telefone = contactForm.querySelector("[name=telefone]");
    const mensagem = contactForm.querySelector("[name=mensagem]");

    if (!nome.value.trim() || !isValidEmail(email.value)) {
      alert("Preencha nome e e-mail válidos.");
      return;
    }

    ENGESOL_DB.addMessage({
      nome: nome.value.trim(),
      email: email.value.trim(),
      telefone: telefone.value.trim(),
      mensagem: mensagem.value.trim(),
    });

    contactForm.reset();
    const msg = document.getElementById("contactSuccess");
    msg.classList.add("show");
    setTimeout(() => msg.classList.remove("show"), 5000);
  });
}

/* ---------- Navegação suave para links internos (mesma página) ---------- */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const targetId = link.getAttribute("href");
    if (targetId.length > 1) {
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
});