// ============ API - comunicación con Apps Script ============
// Reemplaza con tu URL de despliegue del Web App
const API_URL = 'https://script.google.com/macros/s/AKfycbxTJIqP2k2WieYdZe9sQigRwI6VSO-Qx-Kej-WRNrjgi0UmF5HLAjLLbRtY_51Tt7Po/exec';

// Lee el email de la sesión activa (guardada en sessionStorage al hacer login con Google)
// para mandarlo en cada llamada y así poder registrar quién hizo qué en la hoja Auditoria.
function obtenerUsuarioSesion() {
  try {
    const guardada = sessionStorage.getItem('online_shop_sesion');
    if (!guardada) return null;
    const sesion = JSON.parse(guardada);
    return sesion.email || null;
  } catch (e) {
    return null;
  }
}

async function apiCall(accion, data = {}) {
  try {
    const usuario = obtenerUsuarioSesion();
    const datosConUsuario = usuario ? { ...data, usuario } : data;
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // evita preflight CORS con Apps Script
      body: JSON.stringify({ accion, data: datosConUsuario })
    });
    const json = await res.json();
    if (!json.ok) {
      console.error('Error API:', json.error);
      alert('Error: ' + json.error);
    }
    return json;
  } catch (err) {
    console.error('Error de conexión:', err);
    alert('Error de conexión con el servidor');
    return { ok: false, error: err.message };
  }
}
 
// Helpers específicos por hoja
const Api = {
  obtener: (hoja) => apiCall('obtener', { hoja }),
  agregar: (hoja, fila) => apiCall('agregar', { hoja, fila }),
  actualizar: (hoja, id, fila) => apiCall('actualizar', { hoja, id, fila }),
  eliminar: (hoja, id) => apiCall('eliminar', { hoja, id }),
 
  registrarEntrada: (datos) => apiCall('registrarEntrada', datos),
  registrarSalida: (datos) => apiCall('registrarSalida', datos),
  editarSalida: (datos) => apiCall('editarSalida', datos),
  cancelarSalida: (numFactura) => apiCall('cancelarSalida', { numFactura }),
  registrarAbono: (datos) => apiCall('registrarAbono', datos),
  generarRecibo: (numFactura) => apiCall('generarRecibo', { numFactura }),
  auditarInventario: () => apiCall('auditarInventario', {}),
  generarReporte: (datos) => apiCall('generarReporte', datos),
  recalcularBalance: (mes) => apiCall('recalcularBalance', { mes }),
  verificarSesion: (idToken) => apiCall('verificarSesion', { idToken })
};
