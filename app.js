// ── LocalStorage DB ──
const DB = {
  get: k => JSON.parse(localStorage.getItem('ph_' + k) || '[]'),
  set: (k, v) => localStorage.setItem('ph_' + k, JSON.stringify(v)),
};

// ── Toast ──
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Smooth scroll ──
function goTo(id) {
  document.querySelector(id).scrollIntoView({ behavior: 'smooth' });
}

// ── Navbar scroll effect ──
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});

// ── Scroll reveal ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Tab switching ──
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.target.classList.add('active');
  if (name === 'asistencia') populateSelects();
}

// ── Stats ──
function updateStats() {
  const users    = DB.get('users');
  const routines = DB.get('routines');
  const att      = DB.get('attendance');
  const today    = new Date().toISOString().slice(0, 10);
  document.getElementById('statUsers').textContent      = users.length;
  document.getElementById('statRoutines').textContent   = routines.length;
  document.getElementById('statAttendance').textContent = att.filter(a => a.fecha === today).length;
  document.getElementById('statActive').textContent     = users.filter(u => u.estado === 'Activo').length;
}

// ────────────────────────────────────────────────────
// USUARIOS
// ────────────────────────────────────────────────────
function saveUser() {
  const nombre = document.getElementById('u-nombre').value.trim();
  const correo = document.getElementById('u-correo').value.trim();
  if (!nombre || !correo) { toast('⚠️ Nombre y correo son requeridos'); return; }
  const users = DB.get('users');
  users.push({
    id:        Date.now(),
    nombre,
    correo,
    tel:       document.getElementById('u-tel').value,
    membresia: document.getElementById('u-membresia').value,
    estado:    document.getElementById('u-estado').value,
    fecha:     document.getElementById('u-fecha').value || new Date().toISOString().slice(0, 10),
  });
  DB.set('users', users);
  ['u-nombre', 'u-correo', 'u-tel', 'u-fecha'].forEach(id => document.getElementById(id).value = '');
  renderUsers(); updateStats(); toast('✅ Usuario registrado exitosamente');
}

function deleteUser(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  DB.set('users', DB.get('users').filter(u => u.id !== id));
  renderUsers(); updateStats(); toast('🗑️ Usuario eliminado');
}

function renderUsers() {
  const q = document.getElementById('searchUser').value.toLowerCase();
  const users = DB.get('users').filter(u =>
    u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)
  );
  const tb = document.getElementById('usersTable');
  tb.innerHTML = users.length
    ? users.map(u => `
        <tr>
          <td><strong>${u.nombre}</strong></td>
          <td>${u.correo}</td>
          <td>${u.tel || '—'}</td>
          <td>${u.membresia}</td>
          <td><span class="badge badge-${u.estado === 'Activo' ? 'active' : 'inactive'}">${u.estado}</span></td>
          <td>${u.fecha}</td>
          <td><button class="btn-del" onclick="deleteUser(${u.id})">Eliminar</button></td>
        </tr>`).join('')
    : '<tr><td colspan="7" style="text-align:center;opacity:0.4;padding:2rem;">Sin usuarios registrados</td></tr>';
}

// ────────────────────────────────────────────────────
// RUTINAS
// ────────────────────────────────────────────────────
function saveRoutine() {
  const nombre = document.getElementById('r-nombre').value.trim();
  if (!nombre) { toast('⚠️ El nombre de la rutina es requerido'); return; }
  const routines = DB.get('routines');
  routines.push({
    id:         Date.now(),
    nombre,
    instructor: document.getElementById('r-instructor').value,
    dia:        document.getElementById('r-dia').value,
    hora:       document.getElementById('r-hora').value,
    duracion:   document.getElementById('r-duracion').value,
    nivel:      document.getElementById('r-nivel').value,
    desc:       document.getElementById('r-desc').value,
  });
  DB.set('routines', routines);
  ['r-nombre', 'r-instructor', 'r-duracion', 'r-desc'].forEach(id => document.getElementById(id).value = '');
  renderRoutines(); updateStats(); toast('✅ Rutina guardada');
}

function deleteRoutine(id) {
  if (!confirm('¿Eliminar esta rutina?')) return;
  DB.set('routines', DB.get('routines').filter(r => r.id !== id));
  renderRoutines(); updateStats(); toast('🗑️ Rutina eliminada');
}

function renderRoutines() {
  const routines = DB.get('routines');
  const tb = document.getElementById('routinesTable');
  tb.innerHTML = routines.length
    ? routines.map(r => `
        <tr>
          <td><strong>${r.nombre}</strong></td>
          <td>${r.instructor || '—'}</td>
          <td>${r.dia}</td>
          <td>${r.hora}</td>
          <td>${r.duracion || '—'} min</td>
          <td><span class="badge badge-nivel">${r.nivel}</span></td>
          <td>${r.desc || '—'}</td>
          <td><button class="btn-del" onclick="deleteRoutine(${r.id})">Eliminar</button></td>
        </tr>`).join('')
    : '<tr><td colspan="8" style="text-align:center;opacity:0.4;padding:2rem;">Sin rutinas registradas</td></tr>';
}

// ────────────────────────────────────────────────────
// ASISTENCIA
// ────────────────────────────────────────────────────
function populateSelects() {
  const us = DB.get('users');
  const rs = DB.get('routines');
  const au = document.getElementById('a-usuario');
  const ar = document.getElementById('a-rutina');
  const curU = au.value;
  const curR = ar.value;
  au.innerHTML = '<option value="">Seleccionar usuario...</option>' +
    us.map(u => `<option value="${u.nombre}" ${u.nombre === curU ? 'selected' : ''}>${u.nombre}</option>`).join('');
  ar.innerHTML = '<option value="">Seleccionar rutina...</option>' +
    rs.map(r => `<option value="${r.nombre}" ${r.nombre === curR ? 'selected' : ''}>${r.nombre} — ${r.dia} ${r.hora}</option>`).join('');
}

function saveAttendance() {
  const u = document.getElementById('a-usuario').value;
  const r = document.getElementById('a-rutina').value;
  const f = document.getElementById('a-fecha').value;
  if (!u || !r || !f) { toast('⚠️ Usuario, rutina y fecha son requeridos'); return; }
  const att = DB.get('attendance');
  att.push({ id: Date.now(), usuario: u, rutina: r, fecha: f, obs: document.getElementById('a-obs').value });
  DB.set('attendance', att);
  document.getElementById('a-obs').value = '';
  renderAttendance(); updateStats(); toast('✅ Asistencia registrada');
}

function deleteAttendance(id) {
  if (!confirm('¿Eliminar este registro?')) return;
  DB.set('attendance', DB.get('attendance').filter(a => a.id !== id));
  renderAttendance(); updateStats(); toast('🗑️ Registro eliminado');
}

function renderAttendance() {
  const fd  = document.getElementById('filterDate').value;
  let att   = DB.get('attendance');
  if (fd) att = att.filter(a => a.fecha === fd);
  const tb  = document.getElementById('attendanceTable');
  tb.innerHTML = att.length
    ? [...att].reverse().map(a => `
        <tr>
          <td><strong>${a.usuario}</strong></td>
          <td>${a.rutina}</td>
          <td>${a.fecha}</td>
          <td>${a.obs || '—'}</td>
          <td><button class="btn-del" onclick="deleteAttendance(${a.id})">Eliminar</button></td>
        </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;opacity:0.4;padding:2rem;">Sin registros de asistencia</td></tr>';
}

// ── Init ──
document.getElementById('u-fecha').value = new Date().toISOString().slice(0, 10);
document.getElementById('a-fecha').value = new Date().toISOString().slice(0, 10);
renderUsers();
renderRoutines();
renderAttendance();
updateStats();
