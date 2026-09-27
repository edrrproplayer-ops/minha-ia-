const $ = s => document.querySelector(s);

const chat = $("#chat");
const input = $("#input");
const status = $("#status");

const KEY = "minhaia_offline_v2";
const MEM = "minhaia_memory_v2";

let messages = JSON.parse(localStorage.getItem(KEY) || "[]");
let memories = JSON.parse(localStorage.getItem(MEM) || "[]");

function save() {
  localStorage.setItem(KEY, JSON.stringify(messages));
  localStorage.setItem(MEM, JSON.stringify(memories));
}

function add(text, user = false, extra = "") {
  messages.push({
    text,
    user,
    extra,
    time: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  });
  render();
}

function render() {
  chat.innerHTML = "";

  if (!messages.length) {
    messages.push({
      text:
        "Olá! Eu sou a Minha IA. 😊\n\n" +
        "Estou no modo local e posso conversar, guardar memórias, " +
        "calcular, pesquisar na internet, ler alguns arquivos e usar sua voz.\n\n" +
        "Experimente perguntar: \"Que horas são?\", \"Calcule 25*4\" ou \"Lembre que meu nome é...\"",
      user: false,
      extra: "",
      time: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    });
  }

  messages.forEach(m => {
    const row = document.createElement("div");
    row.className = "msg " + (m.user ? "user" : "bot");

    const b = document.createElement("div");
    b.className = "bubble";
    b.textContent = m.text;

    if (m.extra) {
      const d = document.createElement("div");
      d.className = "file-card";
      d.textContent = m.extra;
      b.appendChild(d);
    }

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = m.time;
    b.appendChild(meta);

    row.appendChild(b);
    chat.appendChild(row);
  });

  chat.scrollTop = chat.scrollHeight;
  save();
}

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function localReply(raw) {
  const t = raw.trim();
  const l = normalize(t);

  if (!t) return "Pode falar. 😊";

  // MEMÓRIA
  if (
    l.startsWith("lembre que") ||
    l.startsWith("memorize que") ||
    l.startsWith("guarde que") ||
    l.startsWith("lembra que")
  ) {
    const value = t
      .replace(/^(lembre que|memorize que|guarde que|lembra que)\s*/i, "")
      .trim();

    if (value) {
      memories.push(value);
      save();
      return "Pronto! 🧠 Guardei isso na memória deste aparelho.";
    }
  }

  if (
    l.includes("minhas memorias") ||
    l.includes("o que voce lembra") ||
    l.includes("o que voce sabe sobre mim")
  ) {
    if (!memories.length) {
      return "Ainda não tenho nenhuma memória salva. Você pode dizer: \"Lembre que meu nome é...\"";
    }

    return "Estas são as coisas que você me pediu para guardar:\n\n• " +
      memories.join("\n• ");
  }

  // HORA
  if (l.includes("que horas") || l === "hora" || l.includes("horas sao")) {
    return "Agora são " +
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "
