// ╔══════════════════════════════════════════════════╗
// ║  PHILAUTIA — Firebase + Auth System              ║
// ║  Admin: contraseña protegida                     ║
// ║  Usuarios: registro y login propio               ║
// ╚══════════════════════════════════════════════════╝

const { initializeApp }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot, where, getDoc, setDoc, updateDoc }
  = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

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
const ADMIN_PASS     = "3dn4F1977";

// ── Sesión actual ──
let currentUser = null; // { id, nombre, correo, rol: 'admin'|'usuario' }

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
// MODALES
// ════════════════════════════════════════════════════
function showModal(id) {
  document.getElementById(id).style.display = "flex";
}
function hideModal(id) {
  document.getElementById(id).style.display = "none";
}
window.showModal = showModal;
window.hideModal = hideModal;

// ════════════════════════════════════════════════════
// SESIÓN
// ════════════════════════════════════════════════════
function saveSession(user) {
  currentUser = user;
  sessionStorage.setItem("ph_user", JSON.stringify(user));
}
function loadSession() {
  const s = sessionStorage.getItem("ph_user");
  if (s) currentUser = JSON.parse(s);
}
window.logout = function() {
  currentUser = null;
  sessionStorage.removeItem("ph_user");
  updateNavBar();
  hideModal("modal-admin");
  hideModal("modal-user-panel");
  toast("👋 Sesión cerrada");
};

function updateNavBar() {
  const navActions = document.getElementById("nav-actions");
  if (currentUser) {
    if (currentUser.rol === "admin") {
      navActions.innerHTML = `
        <span style="font-size:0.82rem;color:var(--navy);opacity:0.7">👑 Admin</span>
        <button class="nav-btn" onclick="openAdminPanel()">Panel Admin</button>
        <button class="nav-btn" style="background:transparent;color:var(--navy);border:1.5px solid var(--navy)" onclick="logout()">Salir</button>`;
    } else {
      navActions.innerHTML = `
        <span style="font-size:0.82rem;color:var(--navy);opacity:0.7">Hola, ${currentUser.nombre.split(" ")[0]} 👋</span>
        <button class="nav-btn" onclick="openUserPanel()">Mi Perfil</button>
        <button class="nav-btn" style="background:transparent;color:var(--navy);border:1.5px solid var(--navy)" onclick="logout()">Salir</button>`;
    }
  } else {
    navActions.innerHTML = `
      <button class="nav-btn" onclick="showModal('modal-login')">Iniciar Sesión</button>
      <button class="nav-btn" style="background:transparent;color:var(--navy);border:1.5px solid var(--navy)" onclick="showModal('modal-register')">Registrarse</button>`;
  }
}

// ════════════════════════════════════════════════════
// LOGIN ADMIN
// ════════════════════════════════════════════════════
window.loginAdmin = function() {
  const pass = document.getElementById("admin-pass").value;
  if (pass === ADMIN_PASS) {
    saveSession({ id: "admin", nombre: "Administrador", correo: "admin@philautia.com", rol: "admin" });
    hideModal("modal-login");
    document.getElementById("admin-pass").value = "";
    updateNavBar();
    openAdminPanel();
    toast("👑 Bienvenida, Administrador");
  } else {
    toast("❌ Contraseña incorrecta");
  }
};

// ════════════════════════════════════════════════════
// REGISTRO DE USUARIO
// ════════════════════════════════════════════════════
window.registerUser = async function() {
  const nombre = document.getElementById("reg-nombre").value.trim();
  const correo = document.getElementById("reg-correo").value.trim().toLowerCase();
  const pass   = document.getElementById("reg-pass").value;
  const pass2  = document.getElementById("reg-pass2").value;

  if (!nombre || !correo || !pass) { toast("⚠️ Todos los campos son requeridos"); return; }
  if (pass !== pass2) { toast("⚠️ Las contraseñas no coinciden"); return; }
  if (pass.length < 6) { toast("⚠️ La contraseña debe tener al menos 6 caracteres"); return; }

  try {
    // Verificar si el correo ya existe
    const snap = await getDocs(query(collection(db, COL_USERS), where("correo", "==", correo)));
    if (!snap.empty) { toast("⚠️ Ese correo ya está registrado"); return; }

    const docRef = await addDoc(collection(db, COL_USERS), {
      nombre, correo,
      pass:      btoa(pass), // codificación básica
      tel:       document.getElementById("reg-tel").value,
      membresia: document.getElementById("reg-membresia").value,
      estado:    "Activo",
      fecha:     new Date().toISOString().slice(0, 10),
      creadoEn:  new Date().toISOString(),
      rol:       "usuario",
    });

    saveSession({ id: docRef.id, nombre, correo, rol: "usuario" });
    hideModal("modal-register");
    ["reg-nombre","reg-correo","reg-pass","reg-pass2","reg-tel"].forEach(id => document.getElementById(id).value = "");
    updateNavBar();
    openUserPanel();
    toast("✅ ¡Registro exitoso! Bienvenida a PHILAUTIA 💜");
  } catch(e) { toast("❌ Error: " + e.message); }
};

// ════════════════════════════════════════════════════
// LOGIN USUARIO
// ════════════════════════════════════════════════════
window.loginUser = async function() {
  const correo = document.getElementById("login-correo").value.trim().toLowerCase();
  const pass   = document.getElementById("login-pass").value;

  if (!correo || !pass) { toast("⚠️ Correo y contraseña son requeridos"); return; }

  // Verificar si es admin
  if (correo === "admin" && pass === ADMIN_PASS) {
    saveSession({ id: "admin", nombre: "Administrador", correo: "admin@philautia.com", rol: "admin" });
    hideModal("modal-login");
    updateNavBar();
    openAdminPanel();
    toast("👑 Bienvenida, Administrador");
    return;
  }

  try {
    const snap = await getDocs(query(collection(db, COL_USERS), where("correo", "==", correo)));
    if (snap.empty) { toast("❌ Correo no encontrado"); return; }

    const userDoc  = snap.docs[0];
    const userData = userDoc.data();

    if (atob(userData.pass) !== pass) { toast("❌ Contraseña incorrecta"); return; }

    saveSession({ id: userDoc.id, nombre: userData.nombre, correo: userData.correo, rol: "usuario" });
    hideModal("modal-login");
    document.getElementById("login-correo").value = "";
    document.getElementById("login-pass").value   = "";
    updateNavBar();
    openUserPanel();
    toast(`💜 Bienvenida, ${userData.nombre.split(" ")[0]}!`);
  } catch(e) { toast("❌ Error: " + e.message); }
};

// ════════════════════════════════════════════════════
// PANEL USUARIO
// ════════════════════════════════════════════════════
async function openUserPanel() {
  if (!currentUser || currentUser.rol !== "usuario") return;
  showModal("modal-user-panel");
  document.getElementById("user-panel-name").textContent = currentUser.nombre;

  // Cargar datos del usuario
  const userDoc  = await getDoc(doc(db, COL_USERS, currentUser.id));
  const userData = userDoc.data();
  document.getElementById("user-info-html").innerHTML = `
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Nombre</span><span class="info-val">${userData.nombre}</span></div>
      <div class="info-item"><span class="info-label">Correo</span><span class="info-val">${userData.correo}</span></div>
      <div class="info-item"><span class="info-label">Teléfono</span><span class="info-val">${userData.tel || "—"}</span></div>
      <div class="info-item"><span class="info-label">Membresía</span><span class="info-val">${userData.membresia}</span></div>
      <div class="info-item"><span class="info-label">Estado</span><span class="info-val"><span class="badge badge-${userData.estado === "Activo" ? "active" : "inactive"}">${userData.estado}</span></span></div>
      <div class="info-item"><span class="info-label">Miembro desde</span><span class="info-val">${userData.fecha}</span></div>
    </div>`;

  // Cargar rutinas
  const rSnap = await getDocs(query(collection(db, COL_ROUTINES), orderBy("creadoEn", "desc")));
  const rutinas = rSnap.docs.map(d => d.data());
  document.getElementById("user-rutinas-html").innerHTML = rutinas.length
    ? `<div class="rutinas-grid">${rutinas.map(r => `
        <div class="rutina-card">
          <div class="rc-dia">${r.dia}</div>
          <div class="rc-nombre">${r.nombre}</div>
          <div class="rc-info">${r.hora} · ${r.duracion || "—"} min</div>
          <div class="rc-info">👩‍🏫 ${r.instructor || "—"}</div>
          <span class="badge badge-nivel">${r.nivel}</span>
        </div>`).join("")}</div>`
    : `<p style="opacity:0.4;text-align:center;padding:2rem;">Sin rutinas disponibles</p>`;

  // Cargar asistencia del usuario
  const aSnap = await getDocs(query(collection(db, COL_ATTENDANCE), where("usuario", "==", currentUser.nombre), orderBy("creadoEn", "desc")));
  const asistencias = aSnap.docs.map(d => d.data());
  document.getElementById("user-asistencia-html").innerHTML = asistencias.length
    ? `<div class="table-wrap"><table>
        <thead><tr><th>Rutina</th><th>Fecha</th><th>Observaciones</th></tr></thead>
        <tbody>${asistencias.map(a => `
          <tr>
            <td>${a.rutina}</td>
            <td>${a.fecha}</td>
            <td>${a.obs || "—"}</td>
          </tr>`).join("")}
        </tbody></table></div>`
    : `<p style="opacity:0.4;text-align:center;padding:2rem;">Sin registros de asistencia</p>`;
}
window.openUserPanel = openUserPanel;

// ════════════════════════════════════════════════════
// PANEL ADMIN
// ════════════════════════════════════════════════════
function openAdminPanel() {
  showModal("modal-admin");
  loadUsers();
  loadRoutines();
  loadAttendance();
  updateStats();
}
window.openAdminPanel = openAdminPanel;

// TABS ADMIN
window.switchTab = function(name) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  event.target.classList.add("active");
  if (name === "asistencia") populateSelects();
};

// TABS USUARIO
window.switchUserTab = function(name) {
  document.querySelectorAll(".user-tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".user-tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("user-tab-" + name).classList.add("active");
  event.target.classList.add("active");
};

// ════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════
function updateStats() {
  const today = new Date().toISOString().slice(0, 10);
  onSnapshot(collection(db, COL_USERS), snap => {
    document.getElementById("statUsers").textContent  = snap.docs.filter(d => d.data().rol !== "admin").length;
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
// USUARIOS (ADMIN)
// ════════════════════════════════════════════════════
window.saveUser = async function() {
  const nombre = document.getElementById("u-nombre").value.trim();
  const correo = document.getElementById("u-correo").value.trim().toLowerCase();
  if (!nombre || !correo) { toast("⚠️ Nombre y correo son requeridos"); return; }
  try {
    await addDoc(collection(db, COL_USERS), {
      nombre, correo,
      pass:      btoa("philautia123"),
      tel:       document.getElementById("u-tel").value,
      membresia: document.getElementById("u-membresia").value,
      estado:    document.getElementById("u-estado").value,
      fecha:     document.getElementById("u-fecha").value || new Date().toISOString().slice(0, 10),
      creadoEn:  new Date().toISOString(),
      rol:       "usuario",
    });
    ["u-nombre","u-correo","u-tel","u-fecha"].forEach(id => document.getElementById(id).value = "");
    toast("✅ Usuario registrado — contraseña inicial: philautia123");
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
  const q    = document.getElementById("searchUser") ? document.getElementById("searchUser").value.toLowerCase() : "";
  const snap = await getDocs(query(collection(db, COL_USERS), orderBy("creadoEn", "desc")));
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(u => u.rol !== "admin")
    .filter(u => u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q));
  const tb = document.getElementById("usersTable");
  if (!tb) return;
  tb.innerHTML = list.length
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
// RUTINAS (ADMIN)
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
  const tb   = document.getElementById("routinesTable");
  if (!tb) return;
  tb.innerHTML = list.length
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
// ASISTENCIA (ADMIN)
// ════════════════════════════════════════════════════
async function populateSelects() {
  const us   = await getDocs(collection(db, COL_USERS));
  const rs   = await getDocs(collection(db, COL_ROUTINES));
  const au   = document.getElementById("a-usuario");
  const ar   = document.getElementById("a-rutina");
  if (!au || !ar) return;
  const curU = au.value; const curR = ar.value;
  au.innerHTML = '<option value="">Seleccionar usuario...</option>' +
    us.docs.filter(d => d.data().rol !== "admin")
      .map(d => `<option value="${d.data().nombre}" ${d.data().nombre===curU?"selected":""}>${d.data().nombre}</option>`).join("");
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
  const fd   = document.getElementById("filterDate") ? document.getElementById("filterDate").value : "";
  const snap = await getDocs(query(collection(db, COL_ATTENDANCE), orderBy("creadoEn", "desc")));
  let list   = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (fd) list = list.filter(a => a.fecha === fd);
  const tb = document.getElementById("attendanceTable");
  if (!tb) return;
  tb.innerHTML = list.length
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
loadSession();
updateNavBar();
if (document.getElementById("u-fecha")) document.getElementById("u-fecha").value = new Date().toISOString().slice(0, 10);
if (document.getElementById("a-fecha")) document.getElementById("a-fecha").value = new Date().toISOString().slice(0, 10);
