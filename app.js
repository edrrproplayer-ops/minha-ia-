const $=s=>document.querySelector(s);
const chat=$("#chat"), input=$("#input"), status=$("#status");
const KEY="minhaia_offline_v1", MEM="minhaia_memory_v1";
let messages=JSON.parse(localStorage.getItem(KEY)||"[]");
let memories=JSON.parse(localStorage.getItem(MEM)||"[]");

function save(){localStorage.setItem(KEY,JSON.stringify(messages));localStorage.setItem(MEM,JSON.stringify(memories))}
function add(text, user=false, extra=""){
  messages.push({text,user,extra,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})});
  render();
}
function render(){
  chat.innerHTML="";
  if(!messages.length) add("Olá! Eu sou a Minha IA. 😊\nEstou funcionando no modo local, sem API paga. Posso conversar, guardar memórias, ler alguns arquivos, falar e ouvir você.",false);
  messages.forEach(m=>{
    const row=document.createElement("div"); row.className="msg "+(m.user?"user":"bot");
    const b=document.createElement("div"); b.className="bubble";
    b.textContent=m.text;
    if(m.extra){const d=document.createElement("div");d.className="file-card";d.textContent=m.extra;b.appendChild(d)}
    const meta=document.createElement("div");meta.className="meta";meta.textContent=m.time;b.appendChild(meta);
    row.appendChild(b);chat.appendChild(row);
  });
  chat.scrollTop=chat.scrollHeight; save();
}
function localReply(raw){
  const t=raw.trim(), l=t.toLowerCase();
  if(l.startsWith("lembre que")||l.startsWith("memorize que")){
    const value=t.replace(/^(lembre que|memorize que)\s*/i,"").trim();
    if(value){memories.push(value);save();return "Pronto. Guardei isso na memória deste aparelho. 🧠";}
  }
  if(l.includes("minhas memórias")||l.includes("o que você lembra")) return memories.length?("Eu lembro de:\n• "+memories.join("\n• ")):"Ainda não tenho memórias salvas.";
  if(l.includes("que horas")||l==="hora") return "Agora são "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+".";
  if(l.includes("data de hoje")||l==="hoje") return "Hoje é "+new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})+".";
  if(l.startsWith("calcule ")||l.startsWith("quanto é ")){
    const expr=t.replace(/^calcule\s+/i,"").replace(/^quanto é\s+/i,"").replace(/,/g,".");
    if(/^[0-9+\-*/().%\s]+$/.test(expr)){try{return "Resultado: "+Function('"use strict";return ('+expr+')')();}catch{}}
  }
  if(l.startsWith("pesquise ")||l.startsWith("buscar ")){
    const q=t.replace(/^(pesquise|buscar)\s+/i,"").trim();
    if(q){window.open("https://www.google.com/search?q="+encodeURIComponent(q),"_blank");return "Abri uma pesquisa na internet para: "+q;}
  }
  if(l.includes("ajuda")||l.includes("o que você pode")){
    return "Posso:\n• conversar no modo local;\n• ouvir sua voz e responder por voz;\n• guardar memórias com “lembre que...”;\n• ler arquivos de texto/CSV/JSON/HTML;\n• mostrar imagens da galeria/câmera;\n• fazer contas simples;\n• abrir pesquisas na internet.\n\nPara recursos de IA avançada, depois podemos conectar um serviço de IA.";
  }
  if(/^(oi|olá|ola|bom dia|boa tarde|boa noite)\b/i.test(t)) return "Olá! 😄 Como posso ajudar?";
  if(l.includes("obrigad")) return "Por nada! ❤️";
  return "Entendi. 😊 Estou no modo local, então ainda não tenho um modelo de IA avançado conectado. Mas posso executar comandos simples, usar sua voz, arquivos e memória neste aparelho.";
}
function send(){
  const t=input.value.trim(); if(!t)return;
  input.value=""; input.style.height="auto"; add(t,true);
  setTimeout(()=>{const r=localReply(t);add(r,false); speak(r)},180);
}
function speak(text){
  if("speechSynthesis" in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="pt-BR";u.rate=.95;speechSynthesis.speak(u)}
}
$("#send").onclick=send;
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,120)+"px"});
$("#newChat").onclick=()=>{messages=[];save();render()};
$("#memoryBtn").onclick=()=>{$("#memoryPanel").classList.toggle("hidden");renderMemory()};
$("#clearMemory").onclick=()=>{memories=[];save();renderMemory()};
function renderMemory(){const box=$("#memoryList");box.innerHTML=memories.length?memories.map(x=>`<div class="memory-item">${escapeHtml(x)}</div>`).join(""):"<p>Nenhuma memória salva.</p>"}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

$("#fileBtn").onclick=()=>$("#fileInput").click();
$("#cameraBtn").onclick=()=>$("#cameraInput").click();
async function handleFiles(files){
  for(const f of files){
    if(f.type.startsWith("image/")){
      const url=URL.createObjectURL(f);
      add("Imagem recebida: "+f.name,true);
      const row=document.createElement("div");row.className="msg bot";
      const b=document.createElement("div");b.className="bubble";b.innerHTML=`Imagem: ${escapeHtml(f.name)}<br><img class="preview" src="${url}">`;
      row.appendChild(b);chat.appendChild(row);chat.scrollTop=chat.scrollHeight;
    }else if(f.type==="text/plain"||f.name.match(/\.(txt|md|csv|json|html?)$/i)){
      const txt=await f.text();add("Arquivo recebido: "+f.name,true);add("Li o arquivo. Os primeiros 4.000 caracteres são:\n\n"+txt.slice(0,4000),false);
    }else add("Arquivo selecionado: "+f.name,true,"Este tipo de arquivo está anexado apenas como referência no modo local.");
  }
}
$("#fileInput").onchange=e=>handleFiles(e.target.files);
$("#cameraInput").onchange=e=>handleFiles(e.target.files);

let rec=null;
$("#micBtn").onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){status.textContent="Seu navegador não oferece reconhecimento de voz";return}
  if(rec){rec.stop();rec=null;status.textContent="Modo local • sem API paga";return}
  rec=new SR();rec.lang="pt-BR";rec.interimResults=false;rec.maxAlternatives=1;
  rec.onstart=()=>status.textContent="Ouvindo… fale agora";
  rec.onresult=e=>{input.value=e.results[0][0].transcript;input.dispatchEvent(new Event("input"));};
  rec.onerror=()=>status.textContent="Não consegui ouvir. Tente novamente.";
  rec.onend=()=>{rec=null;status.textContent="Modo local • sem API paga"};
  rec.start();
};

if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
render();renderMemory();