// ============ APP - navegación entre módulos ============

const titulos = {
  dashboard: 'Dashboard',
  inventario: 'Inventario',
  solicitudProveedor: 'Solicitud a Proveedor',
  entrada: 'Entrada de Mercancía',
  salida: 'Ventas (Salida)',
  balance: 'Balance',
  proveedores: 'Proveedores'
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('activo'));
    item.classList.add('activo');
    const modulo = item.dataset.modulo;
    document.getElementById('titulo-modulo').textContent = titulos[modulo];
    cargarModulo(modulo);
  });
});

async function cargarModulo(modulo) {
  const contenedor = document.getElementById('contenido-modulo');
  contenedor.innerHTML = '<div class="loading">Cargando...</div>';

  switch (modulo) {
    case 'dashboard': return renderDashboard(contenedor);
    case 'inventario': return renderInventario(contenedor);
    case 'solicitudProveedor': return renderSolicitudProveedor(contenedor);
    case 'entrada': return renderEntrada(contenedor);
    case 'salida': return renderSalida(contenedor);
    case 'balance': return renderBalance(contenedor);
    case 'proveedores': return renderProveedores(contenedor);
  }
}

// ============ DASHBOARD ============
async function renderDashboard(contenedor) {
  const inv = await Api.obtener('Inventario');
  const productos = inv.data || [];
  const stockTotal = productos.reduce((sum, p) => sum + (Number(p.StockActual) || 0), 0);
  const stockBajo = productos.filter(p => Number(p.StockActual) <= 5).length;
  const valorInventario = productos.reduce((sum, p) => sum + (Number(p.Importe) || 0), 0);

  contenedor.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Productos en catálogo</div>
        <div class="valor">${productos.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Stock total (unidades)</div>
        <div class="valor">${stockTotal}</div>
      </div>
      <div class="stat-card">
        <div class="label">Productos con stock bajo</div>
        <div class="valor">${stockBajo}</div>
      </div>
      <div class="stat-card">
        <div class="label">Valor de inventario</div>
        <div class="valor">$${valorInventario.toFixed(2)}</div>
      </div>
    </div>
    <div class="card">
      <p style="color: var(--color-gris-texto)">Este es el punto de partida. En el siguiente paso construimos el detalle de cada módulo (tablas, formularios de alta/edición, filtros).</p>
    </div>
  `;
}

// ============ MÓDULOS (placeholders — se construyen en el siguiente paso) ============
async function renderInventario(contenedor) {
  const res = await Api.obtener('Inventario');
  const data = res.data || [];
  contenedor.innerHTML = `
    <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
      <button class="btn btn-primary" id="btn-nuevo-producto">+ Agregar Producto</button>
    </div>

    <div class="card oculto" id="form-nuevo-producto">
      <h3 style="margin-bottom:16px;">Nuevo Producto</h3>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
        <div class="form-group">
          <label>Código de Producto</label>
          <input type="text" id="inp-codigo" placeholder="Ej. CAM-001">
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <input type="text" id="inp-descripcion" placeholder="Ej. Camisa Manga Larga">
        </div>
        <div class="form-group">
          <label>Talla</label>
          <input type="text" id="inp-talla" placeholder="Ej. M">
        </div>
        <div class="form-group">
          <label>N° Lote (referencia, opcional)</label>
          <input type="text" id="inp-lote" placeholder="Ej. Lote inicial">
        </div>
        <div class="form-group">
          <label>Stock Actual (unidades que tienes hoy)</label>
          <input type="number" id="inp-stock" placeholder="0">
        </div>
        <div class="form-group">
          <label>Costo Promedio por Unidad</label>
          <input type="number" step="0.01" id="inp-costo" placeholder="0.00">
        </div>
      </div>
      <div style="display:flex; gap:10px; margin-top:8px;">
        <button class="btn btn-primary" id="btn-guardar-producto">Guardar</button>
        <button class="btn btn-secundario" id="btn-cancelar-producto">Cancelar</button>
      </div>
    </div>

    <div class="card">
      <table>
        <thead><tr><th>Código</th><th>Descripción</th><th>Talla</th><th>Stock</th><th>Importe</th></tr></thead>
        <tbody>
          ${data.map(p => `
            <tr>
              <td>${p.CodigoDeProducto}</td>
              <td>${p.Descripcion}</td>
              <td>${p.Talla}</td>
              <td>${p.StockActual}${Number(p.StockActual) <= 5 ? ' <span class="badge badge-alerta">Bajo</span>' : ''}</td>
              <td>$${Number(p.Importe || 0).toFixed(2)}</td>
            </tr>
          `).join('') || '<tr><td colspan="5">Sin productos aún</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  const form = document.getElementById('form-nuevo-producto');
  document.getElementById('btn-nuevo-producto').addEventListener('click', () => form.classList.toggle('oculto'));
  document.getElementById('btn-cancelar-producto').addEventListener('click', () => form.classList.add('oculto'));

  document.getElementById('btn-guardar-producto').addEventListener('click', async () => {
    const codigo = document.getElementById('inp-codigo').value.trim();
    const descripcion = document.getElementById('inp-descripcion').value.trim();
    const talla = document.getElementById('inp-talla').value.trim();
    const lote = document.getElementById('inp-lote').value.trim();
    const stock = Number(document.getElementById('inp-stock').value) || 0;
    const costo = Number(document.getElementById('inp-costo').value) || 0;

    if (!codigo || !descripcion || !talla) {
      alert('Código, Descripción y Talla son obligatorios');
      return;
    }

    const btn = document.getElementById('btn-guardar-producto');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const resultado = await Api.agregar('Inventario', {
      CodigoDeProducto: codigo,
      Descripcion: descripcion,
      Talla: talla,
      'N°Lote': lote,
      Entrada: stock,
      Salida: 0,
      StockActual: stock,
      CostoPromedio: costo,
      Importe: stock * costo
    });

    if (resultado.ok) {
      renderInventario(contenedor); // recargar tabla
    } else {
      btn.disabled = false;
      btn.textContent = 'Guardar';
    }
  });
}

async function renderSolicitudProveedor(contenedor) {
  contenedor.innerHTML = `<div class="card">Módulo de Solicitud a Proveedor — construimos el formulario y tabla en el siguiente paso.</div>`;
}

async function renderEntrada(contenedor) {
  contenedor.innerHTML = `<div class="card">Módulo de Entrada de Mercancía — construimos el formulario (con actualización automática de Inventario) en el siguiente paso.</div>`;
}

async function renderSalida(contenedor) {
  contenedor.innerHTML = `<div class="card">Módulo de Ventas — construimos el formulario (con descuento automático de stock) en el siguiente paso.</div>`;
}

async function renderBalance(contenedor) {
  contenedor.innerHTML = `<div class="card">Módulo de Balance mensual — se construye en el siguiente paso.</div>`;
}

async function renderProveedores(contenedor) {
  const res = await Api.obtener('Proveedor');
  const data = res.data || [];
  contenedor.innerHTML = `
    <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
      <button class="btn btn-primary" id="btn-nuevo-proveedor">+ Agregar Proveedor</button>
    </div>

    <div class="card oculto" id="form-nuevo-proveedor">
      <h3 style="margin-bottom:16px;">Nuevo Proveedor</h3>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
        <div class="form-group">
          <label>Nombre del Proveedor</label>
          <input type="text" id="inp-nombre-prov" placeholder="Ej. Textiles del Istmo">
        </div>
        <div class="form-group">
          <label>N° Proveedor</label>
          <input type="text" id="inp-num-prov" placeholder="Ej. PROV-001">
        </div>
      </div>
      <div style="display:flex; gap:10px; margin-top:8px;">
        <button class="btn btn-primary" id="btn-guardar-proveedor">Guardar</button>
        <button class="btn btn-secundario" id="btn-cancelar-proveedor">Cancelar</button>
      </div>
    </div>

    <div class="card">
      <table>
        <thead><tr><th>N° Proveedor</th><th>Nombre</th></tr></thead>
        <tbody>
          ${data.map(p => `
            <tr>
              <td>${p['N°Proveedor']}</td>
              <td>${p.Nombre}</td>
            </tr>
          `).join('') || '<tr><td colspan="2">Sin proveedores aún</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  const form = document.getElementById('form-nuevo-proveedor');
  document.getElementById('btn-nuevo-proveedor').addEventListener('click', () => form.classList.toggle('oculto'));
  document.getElementById('btn-cancelar-proveedor').addEventListener('click', () => form.classList.add('oculto'));

  document.getElementById('btn-guardar-proveedor').addEventListener('click', async () => {
    const nombre = document.getElementById('inp-nombre-prov').value.trim();
    const numProveedor = document.getElementById('inp-num-prov').value.trim();

    if (!nombre || !numProveedor) {
      alert('Nombre y N° Proveedor son obligatorios');
      return;
    }

    const btn = document.getElementById('btn-guardar-proveedor');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const resultado = await Api.agregar('Proveedor', {
      Nombre: nombre,
      'N°Proveedor': numProveedor
    });

    if (resultado.ok) {
      renderProveedores(contenedor); // recargar tabla
    } else {
      btn.disabled = false;
      btn.textContent = 'Guardar';
    }
  });
}

// Cargar dashboard al iniciar
cargarModulo('dashboard');
