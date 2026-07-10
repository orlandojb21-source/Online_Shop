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
    // 1. Obtener el idToken criptográfico real que guardamos en el Paso 1
    const tokenCriptografico = sessionStorage.getItem('google_id_token');
    
    // Mantenemos el flujo actual por si acaso, pero añadimos el token en la raíz
    const usuario = obtenerUsuarioSesion();
    const datosConUsuario = usuario ? { ...data, usuario } : data;

    // Construimos el nuevo payload de seguridad
    const payload = {
      accion: accion,
      idToken: tokenCriptografico, // <-- Enviamos el token firmado por Google para validar la API
      data: datosConUsuario
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Evita preflight CORS con Apps Script
      body: JSON.stringify(payload) // Mandamos todo el payload con el idToken incluido
    });

    const json = await res.json();
    
    // Si Apps Script nos devuelve un estado de error controlado (ej: token inválido)
    if (json.status === 'error' || json.ok === false) {
      console.error('Error API:', json.message || json.error);
      alert('Error de Seguridad / Aplicación: ' + (json.message || json.error));
      return { ok: false, error: json.message || json.error };
    }

    // Retornamos el formato esperado por tu frontend actual para no romper tus vistas (.ok y .resultado)
    return { ok: true, resultado: json.data };
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
