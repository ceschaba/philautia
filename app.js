// ╔══════════════════════════════════════════════════╗
// ║  PHILAUTIA — Firebase Firestore                  ║
// ║  Proyecto: philautia-4caf6                       ║
// ╚══════════════════════════════════════════════════╝

// Usar CDN con versión compatible
const { initializeApp }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot }
  = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

// ── Credenciales ──
const firebaseConfig = {
  apiKey:            "AIzaSyCQow7IqOHttFAcVFvpbQetmyh3TPs0M6U",
  authDomain:        "philautia-4caf6.firebaseapp.com",
  projectId:         "philautia-4caf6",
  storageBucket:     "philautia-4caf6.firebasestorage.app",
  messagingSenderId: "658981945322",
  appId:             "1:658981945322:web:9563f58c2644a180907c93"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const COL_USERS      = "usuarios";
const COL_ROUTINES   = "rutinas";
const COL_ATTENDANCE = "asistencia";

// ════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

// ════════════════════════════════════════════════════
// NAVEGACIÓN
// ════════════════════════════════════════════════════
window.goTo = function(id) {
  document.querySelector(id).scrollIntoView({ behavior: "smooth" });
};

window.addEventListener("scroll", () => {
  document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 40);
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// ════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════
window.switchTab = function(name) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  event.target.classList.add("active");
  if (name === "asistencia") populateSelects();
};

// ════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════
function updateStats() {
  const today = new Date().toISOString().slice(0, 10);
  onSnapshot(collection(db, COL_USERS), snap => {
    document.getElementById("statUsers").textContent  = snap.size;
    document.getElementById("statActive").textContent = snap.docs.filter(d => d.data().estado === "Activo").length;
  });
  onSnapshot(collection(db, COL_ROUTINES), snap => {
    document.getElementById("statRoutines").textContent = snap.size;
  });
  onSnapshot(collection(db, COL_ATTENDANCE), snap => {
    document.getElementById("statAttendance").textContent = snap.docs.filter(d => d.data().fecha === today).length;
  });
}

// ════════════════════════════════════════════════════
// USUARIOS
// ════════════════════════════════════════════════════
window.saveUser = async function() {
  const nombre = document.getElementById("u-nombre").value.trim();
  const correo = document.getElementById("u-correo").value.trim();
  if (!nombre || !correo) { toast("⚠️ Nombre y correo son requeridos"); return; }
  try {
    await addDoc(collection(db, COL_USERS), {
      nombre, correo,
      tel:       document.getElementById("u-tel").value,
      membresia: document.getElementById("u-membresia").value,
      estado:    document.getElementById("u-estado").value,
      fecha:     document.getElementById("u-fecha").value || new Date().toISOString().slice(0, 10),
      creadoEn:  new Date().toISOString(),
    });
    ["u-nombre","u-correo","u-tel","u-fecha"].forEach(id => document.getElementById(id).value = "");
    toast("✅ Usuario registrado exitosamente");
    loadUsers();
  } catch(e) { toast("❌ Error: " + e.message); }
};

window.deleteUser = async function(id) {
  if (!confirm("¿Eliminar este usuario?")) return;
  try {
    await deleteDoc(doc(db, COL_USERS, id));
    toast("🗑️ Usuario eliminado");
    loadUsers();
  } catch(e) { toast("❌ Error: " + e.message); }
};

async function loadUsers() {
  const q    = document.getElementById("searchUser").value.toLowerCase();
  const snap = await getDocs(query(collection(db, COL_USERS), orderBy("creadoEn", "desc")));
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(u => u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q));
  document.getElementById("usersTable").innerHTML = list.length
    ? list.map(u => `
        <tr>
          <td><strong>${u.nombre}</strong></td>
          <td>${u.correo}</td>
          <td>${u.tel || "—"}</td>
          <td>${u.membresia}</td>
          <td><span class="badge badge-${u.estado === "Activo" ? "active" : "inactive"}">${u.estado}</span></td>
          <td>${u.fecha}</td>
          <td><button class="btn-del" onclick="deleteUser('${u.id}')">Eliminar</button></td>
        </tr>`).join("")
    : `<tr><td colspan="7" style="text-align:center;opacity:0.4;padding:2rem;">Sin usuarios registrados</td></tr>`;
}
window.loadUsers = loadUsers;

// ════════════════════════════════════════════════════
// RUTINAS
// ════════════════════════════════════════════════════
window.saveRoutine = async function() {
  const nombre = document.getElementById("r-nombre").value.trim();
  if (!nombre) { toast("⚠️ El nombre de la rutina es requerido"); return; }
  try {
    await addDoc(collection(db, COL_ROUTINES), {
      nombre,
      instructor: document.getElementById("r-instructor").value,
      dia:        document.getElementById("r-dia").value,
      hora:       document.getElementById("r-hora").value,
      duracion:   document.getElementById("r-duracion").value,
      nivel:      document.getElementById("r-nivel").value,
      desc:       document.getElementById("r-desc").value,
      creadoEn:   new Date().toISOString(),
    });
    ["r-nombre","r-instructor","r-duracion","r-desc"].forEach(id => document.getElementById(id).value = "");
    toast("✅ Rutina guardada");
    loadRoutines();
  } catch(e) { toast("❌ Error: " + e.message); }
};

window.deleteRoutine = async function(id) {
  if (!confirm("¿Eliminar esta rutina?")) return;
  try {
    await deleteDoc(doc(db, COL_ROUTINES, id));
    toast("🗑️ Rutina eliminada");
    loadRoutines();
  } catch(e) { toast("❌ Error: " + e.message); }
};

async function loadRoutines() {
  const snap = await getDocs(query(collection(db, COL_ROUTINES), orderBy("creadoEn", "desc")));
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  document.getElementById("routinesTable").innerHTML = list.length
    ? list.map(r => `
        <tr>
          <td><strong>${r.nombre}</strong></td>
          <td>${r.instructor || "—"}</td>
          <td>${r.dia}</td>
          <td>${r.hora}</td>
          <td>${r.duracion || "—"} min</td>
          <td><span class="badge badge-nivel">${r.nivel}</span></td>
          <td>${r.desc || "—"}</td>
          <td><button class="btn-del" onclick="deleteRoutine('${r.id}')">Eliminar</button></td>
        </tr>`).join("")
    : `<tr><td colspan="8" style="text-align:center;opacity:0.4;padding:2rem;">Sin rutinas registradas</td></tr>`;
}
window.loadRoutines = loadRoutines;

// ════════════════════════════════════════════════════
// ASISTENCIA
// ════════════════════════════════════════════════════
async function populateSelects() {
  const us = await getDocs(collection(db, COL_USERS));
  const rs = await getDocs(collection(db, COL_ROUTINES));
  const au = document.getElementById("a-usuario");
  const ar = document.getElementById("a-rutina");
  const curU = au.value; const curR = ar.value;
  au.innerHTML = '<option value="">Seleccionar usuario...</option>' +
    us.docs.map(d => `<option value="${d.data().nombre}" ${d.data().nombre===curU?"selected":""}>${d.data().nombre}</option>`).join("");
  ar.innerHTML = '<option value="">Seleccionar rutina...</option>' +
    rs.docs.map(d => `<option value="${d.data().nombre}" ${d.data().nombre===curR?"selected":""}>${d.data().nombre} — ${d.data().dia} ${d.data().hora}</option>`).join("");
}
window.populateSelects = populateSelects;

window.saveAttendance = async function() {
  const u = document.getElementById("a-usuario").value;
  const r = document.getElementById("a-rutina").value;
  const f = document.getElementById("a-fecha").value;
  if (!u || !r || !f) { toast("⚠️ Usuario, rutina y fecha son requeridos"); return; }
  try {
    await addDoc(collection(db, COL_ATTENDANCE), {
      usuario: u, rutina: r, fecha: f,
      obs:      document.getElementById("a-obs").value,
      creadoEn: new Date().toISOString(),
    });
    document.getElementById("a-obs").value = "";
    toast("✅ Asistencia registrada");
    loadAttendance();
  } catch(e) { toast("❌ Error: " + e.message); }
};

window.deleteAttendance = async function(id) {
  if (!confirm("¿Eliminar este registro?")) return;
  try {
    await deleteDoc(doc(db, COL_ATTENDANCE, id));
    toast("🗑️ Registro eliminado");
    loadAttendance();
  } catch(e) { toast("❌ Error: " + e.message); }
};

async function loadAttendance() {
  const fd   = document.getElementById("filterDate").value;
  const snap = await getDocs(query(collection(db, COL_ATTENDANCE), orderBy("creadoEn", "desc")));
  let list   = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (fd) list = list.filter(a => a.fecha === fd);
  document.getElementById("attendanceTable").innerHTML = list.length
    ? list.map(a => `
        <tr>
          <td><strong>${a.usuario}</strong></td>
          <td>${a.rutina}</td>
          <td>${a.fecha}</td>
          <td>${a.obs || "—"}</td>
          <td><button class="btn-del" onclick="deleteAttendance('${a.id}')">Eliminar</button></td>
        </tr>`).join("")
    : `<tr><td colspan="5" style="text-align:center;opacity:0.4;padding:2rem;">Sin registros de asistencia</td></tr>`;
}
window.loadAttendance = loadAttendance;

// ════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════
document.getElementById("u-fecha").value = new Date().toISOString().slice(0, 10);
document.getElementById("a-fecha").value = new Date().toISOString().slice(0, 10);
loadUsers();
loadRoutines();
loadAttendance();
updateStats();
