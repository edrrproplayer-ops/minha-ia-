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
        "Agora posso conversar com você pela internet usando meu cérebro online.\n\n" +
        "Também mantenho algumas funções locais, como memória e cálculos.",
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
      .replace(
        /^(lembre que|memorize que|guarde que|lembra que)\s*/i,
        ""
      )
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

    return (
      "Estas são as coisas que você me pediu para guardar:\n\n• " +
      memories.join("\n• ")
    );
  }

  // HORA
  if (
    l.includes("que horas") ||
    l === "hora" ||
    l.includes("horas sao")
  ) {
    return (
      "Agora são " +
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      }) +
      "."
    );
  }

  // DATA
  if (
    l.includes("que dia e hoje") ||
    l.includes("qual a data") ||
    l === "data"
  ) {
    return (
      "Hoje é " +
      new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }) +
      "."
    );
  }

  // CÁLCULOS SIMPLES
  if (/^[0-9+\-*/().%\s]+$/.test(t)) {
    try {
      const result = Function('"use strict"; return (' + t + ")")();

      if (Number.isFinite(result)) {
        return "O resultado é " + result + ".";
      }
    } catch (e) {}
  }

  // RESPOSTAS LOCAIS
  if (
    l === "oi" ||
    l === "ola" ||
    l === "ola minha ia" ||
    l.includes("bom dia") ||
    l.includes("boa tarde") ||
    l.includes("boa noite")
  ) {
    return "Olá! 😊 Estou aqui. Como posso ajudar?";
  }

  if (
    l.includes("quem e voce") ||
    l.includes("o que voce e")
  ) {
    return "Eu sou a Minha IA, sua assistente pessoal. 🤖";
  }

  if (
    l.includes("obrigado") ||
    l.includes("obrigada")
  ) {
    return "Por nada! 😊";
  }

  return null;
}

// FALA DA IA
function speak(text) {
  if (!("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.log("Voz indisponível:", error);
  }
}

// ENVIA PARA A IA ONLINE
async function send() {
  const t = input.value.trim();

  if (!t) return;

  input.value = "";
  input.style.height = "auto";

  add(t, true);

  if (status) {
    status.textContent = "Minha IA está pensando...";
  }

  // Primeiro verifica funções locais
  const local = localReply(t);

  if (local) {
    setTimeout(() => {
      add(local, false);
      speak(local);

      if (status) {
        status.textContent = "Online";
      }
    }, 300);

    return;
  }

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: t
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Erro ao conversar com a IA"
      );
    }

    const reply =
      data.answer ||
      "Não recebi uma resposta da inteligência artificial.";

    add(reply, false);
    speak(reply);

    if (status) {
      status.textContent = "Online";
    }

  } catch (error) {
    console.error(error);

    const fallback =
      "Desculpe, não consegui conectar ao meu cérebro online agora. 😕\n\n" +
      "Verifique se a função do Netlify e a chave da OpenRouter estão configuradas corretamente.";

    add(fallback, false);
    speak(fallback);

    if (status) {
      status.textContent = "Erro de conexão";
    }
  }
}

// BOTÃO ENVIAR
const sendButton = $("#send");

if (sendButton) {
  sendButton.onclick = send;
}

// ENTER PARA ENVIAR
if (input) {
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  });
}

// AJUSTA ALTURA DO CAMPO DE TEXTO
if (input) {
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  });
}

// MICROFONE
const micButton =
  $("#mic") ||
  $("#voice") ||
  $("#microphone");

if (micButton && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  const recognition = new SpeechRecognition();

  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;

  micButton.onclick = () => {
    try {
      recognition.start();

      if (status) {
        status.textContent = "Estou ouvindo...";
      }
    } catch (error) {
      console.log(error);
    }
  };

  recognition.onresult = event => {
    const text = event.results[0][0].transcript;

    input.value = text;

    if (status) {
      status.textContent = "Mensagem reconhecida";
    }
  };

  recognition.onend = () => {
    if (status) {
      status.textContent = "Online";
    }
  };

  recognition.onerror = error => {
    console.log("Erro no microfone:", error);

    if (status) {
      status.textContent = "Microfone indisponível";
    }
  };
}

// INICIA A INTERFACE
render();

if (status) {
  status.textContent = "Online";
    }
