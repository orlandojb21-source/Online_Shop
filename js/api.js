// ============ API - comunicación con Apps Script ============
// Reemplaza con tu URL de despliegue del Web App
const API_URL = 'https://script.google.com/macros/s/AKfycbxTJIqP2k2WieYdZe9sQigRwI6VSO-Qx-Kej-WRNrjgi0UmF5HLAjLLbRtY_51Tt7Po/exec';

// Lee la sesión activa (guardada en sessionStorage al hacer login con Google) para mandar
// el idToken en cada llamada — así el backend valida quién eres en CADA request, no solo al entrar.
function obtenerSesionActual() {
  try {
    const guardada = sessionStorage.getItem('online_shop_sesion');
    if (!guardada) return null;
    return JSON.parse(guardada);
  } catch (e) {
    return null;
  }
}

async function apiCall(accion, data = {}) {
  try {
    const sesion = obtenerSesionActual();
    const datosConSesion = sesion ? { ...data, idToken: sesion.idToken } : data;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // evita preflight CORS con Apps Script
      body: JSON.stringify({ accion, data: datosConSesion })
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
