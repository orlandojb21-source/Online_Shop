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
        <thead><tr><th></th><th>Código</th><th>Descripción</th><th>Talla</th><th>Stock</th><th>Importe</th></tr></thead>
        <tbody>
          ${data.map(p => `
            <tr>
              <td><button class="btn-editar-prod" data-id="${p.ID}" title="Editar" style="background:none; border:none; cursor:pointer; font-size:16px;">✏️</button></td>
              <td>${p.CodigoDeProducto}</td>
              <td>${p.Descripcion}</td>
              <td>${p.Talla}</td>
              <td>${p.StockActual}${Number(p.StockActual) <= 5 ? ' <span class="badge badge-alerta">Bajo</span>' : ''}</td>
              <td>$${Number(p.Importe || 0).toFixed(2)}</td>
            </tr>
          `).join('') || '<tr><td colspan="6">Sin productos aún</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  const form = document.getElementById('form-nuevo-producto');
  let editandoId = null;

  document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
    editandoId = null;
    document.getElementById('inp-codigo').value = '';
    document.getElementById('inp-codigo').disabled = false;
    document.getElementById('inp-descripcion').value = '';
    document.getElementById('inp-talla').value = '';
    document.getElementById('inp-lote').value = '';
    document.getElementById('inp-stock').value = '';
    document.getElementById('inp-costo').value = '';
    document.querySelector('#form-nuevo-producto h3').textContent = 'Nuevo Producto';
    document.getElementById('btn-guardar-producto').textContent = 'Guardar';
    form.classList.toggle('oculto');
  });

  document.getElementById('btn-cancelar-producto').addEventListener('click', () => form.classList.add('oculto'));

  document.querySelectorAll('.btn-editar-prod').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const producto = data.find(p => p.ID === id);
      if (!producto) return;

      editandoId = id;
      document.getElementById('inp-codigo').value = producto.CodigoDeProducto || '';
      document.getElementById('inp-codigo').disabled = true; // el código no se edita para no romper referencias en Entrada/Salida
      document.getElementById('inp-descripcion').value = producto.Descripcion || '';
      document.getElementById('inp-talla').value = producto.Talla || '';
      document.getElementById('inp-lote').value = producto['N°Lote'] || '';
      document.getElementById('inp-stock').value = producto.StockActual || '';
      document.getElementById('inp-costo').value = producto.CostoPromedio || '';

      document.querySelector('#form-nuevo-producto h3').textContent = 'Editar Producto';
      document.getElementById('btn-guardar-producto').textContent = 'Guardar Cambios';
      form.classList.remove('oculto');
      form.scrollIntoView({ behavior: 'smooth' });
    });
  });

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

    // Alerta (no bloqueo) si ya existe un producto con la misma descripción — solo al crear, no al editar
    if (!editandoId) {
      const duplicado = data.find(p => (p.Descripcion || '').trim().toLowerCase() === descripcion.toLowerCase());
      if (duplicado) {
        const continuar = confirm(`Ya existe un producto con esta descripción:\n\n"${duplicado.Descripcion}" (Código: ${duplicado.CodigoDeProducto})\n\n¿Seguro que quieres crear otro producto con la misma descripción?`);
        if (!continuar) return;
      }
    }

    const btn = document.getElementById('btn-guardar-producto');
    btn.disabled = true;
    btn.textContent = editandoId ? 'Guardando cambios...' : 'Guardando...';

    const fila = {
      CodigoDeProducto: codigo,
      Descripcion: descripcion,
      Talla: talla,
      'N°Lote': lote,
      StockActual: stock,
      CostoPromedio: costo,
      Importe: stock * costo
    };

    const resultado = editandoId
      ? await Api.actualizar('Inventario', editandoId, fila)
      : await Api.agregar('Inventario', { ...fila, Entrada: stock, Salida: 0 });

    if (resultado.ok) {
      renderInventario(contenedor);
    } else {
      btn.disabled = false;
      btn.textContent = editandoId ? 'Guardar Cambios' : 'Guardar';
    }
  });
}

// Estado temporal de las líneas de producto mientras se arma una solicitud nueva
let lineasSolicitud = [];

async function renderSolicitudProveedor(contenedor) {
  const [resSolicitudes, resProveedores, resInventario] = await Promise.all([
    Api.obtener('SolicitudProveedor'),
    Api.obtener('Proveedor'),
    Api.obtener('Inventario')
  ]);
  const solicitudes = resSolicitudes.data || [];
  const proveedores = resProveedores.data || [];
  const inventario = resInventario.data || [];
  lineasSolicitud = [];

  // Agrupar solicitudes por N°Solicitud — solo se muestran las que aún no han sido entregadas
  const pendientes = solicitudes.filter(s => s.Estado !== 'Recibido');
  const grupos = {};
  pendientes.forEach(s => {
    const num = s['N°Solicitud'] || s.ID;
    if (!grupos[num]) grupos[num] = [];
    grupos[num].push(s);
  });

  contenedor.innerHTML = `
    <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
      <button class="btn btn-primary" id="btn-nueva-solicitud">+ Nueva Solicitud</button>
    </div>

    <div class="card oculto" id="form-nueva-solicitud">
      <h3 style="margin-bottom:16px;">Nueva Solicitud a Proveedor</h3>
      <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px; margin-bottom:20px;">
        <div class="form-group">
          <label>N° de Solicitud</label>
          <input type="text" id="sol-numero" placeholder="Ej. SOL-001">
        </div>
        <div class="form-group">
          <label>Proveedor</label>
          <select id="sol-proveedor">
            <option value="">Selecciona un proveedor</option>
            ${proveedores.map(p => `<option value="${p['N°Proveedor']}" data-nombre="${p.Nombre}">${p.Nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Fecha de Solicitud</label>
          <input type="date" id="sol-fecha">
        </div>
        <div class="form-group">
          <label>¿Ya pagado?</label>
          <select id="sol-pagado">
            <option value="No">No</option>
            <option value="Sí">Sí</option>
          </select>
        </div>
      </div>

      <h4 style="margin-bottom:10px; color:var(--color-gris-texto);">Productos de esta solicitud</h4>
      <p style="font-size:12.5px; color:var(--color-gris-texto); margin-bottom:10px;">Busca por código, descripción o talla — solo puedes agregar productos que ya existan en Inventario.</p>
      <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 0.8fr auto; gap:10px; margin-bottom:8px;">
        <div>
          <input type="text" id="linea-buscar" list="lista-inventario" placeholder="Buscar producto por código, descripción o talla...">
          <datalist id="lista-inventario">
            ${inventario.map(p => `<option value="${p.CodigoDeProducto} — ${p.Descripcion} (${p.Talla})">`).join('')}
          </datalist>
          <div id="linea-stock-info" style="font-size:12px; color:var(--color-gris-texto); margin-top:4px;"></div>
        </div>
        <input type="text" id="linea-lote" placeholder="N° Lote">
        <input type="number" id="linea-cantidad" placeholder="Cantidad">
        <input type="number" step="0.01" id="linea-precio" placeholder="Precio/u">
        <button class="btn btn-secundario" id="btn-agregar-linea">+ Agregar</button>
      </div>

      <div id="tabla-lineas" style="margin-bottom:16px;"></div>

      <div style="display:flex; gap:10px; margin-top:8px;">
        <button class="btn btn-primary" id="btn-guardar-solicitud">Guardar Solicitud Completa</button>
        <button class="btn btn-secundario" id="btn-cancelar-solicitud">Cancelar</button>
      </div>
    </div>

    <div class="card">
      ${Object.keys(grupos).length === 0 ? '<p>Sin solicitudes pendientes</p>' : Object.entries(grupos).map(([numSolicitud, lineas]) => {
        const primera = lineas[0];
        const idGrupo = 'grupo-' + numSolicitud.replace(/[^a-zA-Z0-9]/g, '');
        return `
          <div style="border:1px solid var(--color-borde); border-radius:var(--radio); margin-bottom:12px; overflow:hidden;">
            <div class="fila-resumen-solicitud" data-target="${idGrupo}" style="display:flex; justify-content:space-between; align-items:center; padding:14px 16px; cursor:pointer; background:#faf7f0;">
              <div>
                <strong>Solicitud ${numSolicitud}</strong>
                <span style="color:var(--color-gris-texto); margin-left:10px;">${primera.NombreDeProveedor} · ${formatearFecha(primera.Fecha)}</span>
                <span class="badge ${primera.Pagado === 'Sí' ? 'badge-ok' : 'badge-pendiente'}" style="margin-left:8px;">${primera.Pagado === 'Sí' ? 'Pagado' : 'No pagado'}</span>
                <span class="badge badge-alerta" style="margin-left:6px;">Pendiente</span>
              </div>
              <span style="color:var(--color-gris-texto); font-size:13px;">Ver detalle ▾</span>
            </div>
            <div id="${idGrupo}" class="oculto" style="padding:16px;">
              <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
                <button class="btn btn-primary btn-entregado-grupo" data-num="${numSolicitud}" style="padding:6px 14px; font-size:13px;">Marcar todo como Entregado</button>
              </div>
              <table>
                <thead><tr><th>Código</th><th>Descripción</th><th>Talla</th><th>Cant.</th><th>Total</th></tr></thead>
                <tbody>
                  ${lineas.map(l => `
                    <tr>
                      <td>${l.CodigoDeProducto}</td>
                      <td>${l.Descripcion}</td>
                      <td>${l.Talla}</td>
                      <td>${l.Cantidad}</td>
                      <td>$${Number(l.TotalDeCosto || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Expandir/colapsar detalle de cada solicitud al hacer click en el resumen
  document.querySelectorAll('.fila-resumen-solicitud').forEach(fila => {
    fila.addEventListener('click', () => {
      document.getElementById(fila.dataset.target).classList.toggle('oculto');
    });
  });

  const form = document.getElementById('form-nueva-solicitud');
  document.getElementById('sol-fecha').valueAsDate = new Date();

  document.getElementById('btn-nueva-solicitud').addEventListener('click', () => form.classList.toggle('oculto'));
  document.getElementById('btn-cancelar-solicitud').addEventListener('click', () => form.classList.add('oculto'));

  function renderTablaLineas() {
    const div = document.getElementById('tabla-lineas');
    if (lineasSolicitud.length === 0) {
      div.innerHTML = '<p style="color:var(--color-gris-texto); font-size:13.5px;">Aún no has agregado productos a esta solicitud.</p>';
      return;
    }
    div.innerHTML = `
      <table>
        <thead><tr><th>Código</th><th>Descripción</th><th>Talla</th><th>Lote</th><th>Cant.</th><th>Precio/u</th><th>Total</th><th></th></tr></thead>
        <tbody>
          ${lineasSolicitud.map((l, idx) => `
            <tr>
              <td>${l.codigo}</td><td>${l.descripcion}</td><td>${l.talla}</td><td>${l.lote}</td>
              <td>${l.cantidad}</td><td>$${l.precio.toFixed(2)}</td><td>$${(l.cantidad * l.precio).toFixed(2)}</td>
              <td><button class="btn-quitar-linea" data-idx="${idx}" style="background:none; border:none; color:var(--color-rojo); cursor:pointer; font-weight:700;">✕</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    div.querySelectorAll('.btn-quitar-linea').forEach(b => {
      b.addEventListener('click', () => {
        lineasSolicitud.splice(Number(b.dataset.idx), 1);
        renderTablaLineas();
      });
    });
  }

  // Muestra el stock actual del producto que coincide con lo que se está escribiendo/seleccionando
  const inputBuscar = document.getElementById('linea-buscar');
  const infoStock = document.getElementById('linea-stock-info');

  function buscarProductoPorTexto(texto) {
    // El texto viene del datalist como "CODIGO — Descripcion (Talla)"; extraemos el código antes de " — "
    const codigoTexto = texto.split(' — ')[0].trim();
    return inventario.find(p => p.CodigoDeProducto === codigoTexto);
  }

  inputBuscar.addEventListener('input', () => {
    const producto = buscarProductoPorTexto(inputBuscar.value);
    if (producto) {
      infoStock.textContent = `Stock actual: ${producto.StockActual} unidades — ${producto.Descripcion}`;
      infoStock.style.color = 'var(--color-gris-texto)';
    } else {
      infoStock.textContent = inputBuscar.value ? 'Producto no encontrado en Inventario' : '';
      infoStock.style.color = inputBuscar.value ? 'var(--color-rojo)' : 'var(--color-gris-texto)';
    }
  });

  document.getElementById('btn-agregar-linea').addEventListener('click', () => {
    const producto = buscarProductoPorTexto(inputBuscar.value);
    const lote = document.getElementById('linea-lote').value.trim();
    const cantidad = Number(document.getElementById('linea-cantidad').value) || 0;
    const precio = Number(document.getElementById('linea-precio').value) || 0;

    if (!producto) {
      alert('Selecciona un producto válido de la lista de Inventario. Si el producto no existe, agrégalo primero en el módulo de Inventario (con stock 0).');
      return;
    }
    if (!cantidad) {
      alert('La cantidad es obligatoria');
      return;
    }

    lineasSolicitud.push({
      codigo: producto.CodigoDeProducto,
      descripcion: producto.Descripcion,
      talla: producto.Talla,
      lote, cantidad, precio
    });
    renderTablaLineas();

    inputBuscar.value = '';
    document.getElementById('linea-lote').value = '';
    document.getElementById('linea-cantidad').value = '';
    document.getElementById('linea-precio').value = '';
    infoStock.textContent = '';
    inputBuscar.focus();
  });

  document.getElementById('btn-guardar-solicitud').addEventListener('click', async () => {
    const numSolicitud = document.getElementById('sol-numero').value.trim();
    const selectProv = document.getElementById('sol-proveedor');
    const proveedor = selectProv.value;
    const nombreProveedor = selectProv.selectedOptions[0]?.dataset.nombre || '';
    const pagado = document.getElementById('sol-pagado').value;
    const fecha = document.getElementById('sol-fecha').value;

    if (!numSolicitud || !proveedor) {
      alert('N° de Solicitud y Proveedor son obligatorios');
      return;
    }
    if (lineasSolicitud.length === 0) {
      alert('Agrega al menos un producto a la solicitud');
      return;
    }

    const btn = document.getElementById('btn-guardar-solicitud');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    for (const linea of lineasSolicitud) {
      await Api.agregar('SolicitudProveedor', {
        'N°Solicitud': numSolicitud,
        CodigoDeProducto: linea.codigo,
        Descripcion: linea.descripcion,
        Talla: linea.talla,
        PrecioUnidad: linea.precio,
        'N°Lote': linea.lote,
        Cantidad: linea.cantidad,
        TotalDeCosto: linea.cantidad * linea.precio,
        Proveedor: proveedor,
        NombreDeProveedor: nombreProveedor,
        Pagado: pagado,
        Estado: 'Pendiente',
        Fecha: fecha
      });
    }

    renderSolicitudProveedor(contenedor);
  });

  // Botón "Marcar todo como Entregado": convierte TODAS las líneas de esa solicitud en Entradas reales
  document.querySelectorAll('.btn-entregado-grupo').forEach(btn => {
    btn.addEventListener('click', async () => {
      const numSolicitud = btn.dataset.num;
      const lineasGrupo = grupos[numSolicitud].filter(l => l.Estado !== 'Recibido');

      const numFactura = prompt('N° de Factura de Compra (viene con el envío, aplica a toda la solicitud):');
      if (numFactura === null) return;

      btn.disabled = true;
      btn.textContent = 'Procesando...';

      const hoy = new Date();
      const fechaISO = hoy.toISOString().split('T')[0];
      const mes = calcularMes(fechaISO);

      for (const linea of lineasGrupo) {
        const resultado = await Api.registrarEntrada({
          numFactura: numFactura,
          mes: mes,
          fecha: fechaISO,
          codigo: linea.CodigoDeProducto,
          descripcion: linea.Descripcion,
          talla: linea.Talla,
          lote: linea['N°Lote'],
          proveedor: linea.NombreDeProveedor,
          cantidad: Number(linea.Cantidad),
          costoPorUnidad: Number(linea.PrecioUnidad)
        });
        if (resultado.ok) {
          // La solicitud ya se convirtió en Entrada real; se elimina de Solicitud a Proveedor
          await Api.eliminar('SolicitudProveedor', linea.ID);
        }
      }

      renderSolicitudProveedor(contenedor);
    });
  });
}

// Calcula el nombre del mes en español a partir de una fecha (YYYY-MM-DD)
function calcularMes(fechaStr) {
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const fecha = new Date(fechaStr + 'T00:00:00');
  return meses[fecha.getMonth()];
}

// Formatea una fecha (string ISO, Date, o "YYYY-MM-DD") a formato legible dd/mm/aaaa
function formatearFecha(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  const dia = String(fecha.getUTCDate()).padStart(2, '0');
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const anio = fecha.getUTCFullYear();
  return `${dia}/${mes}/${anio}`;
}

async function renderEntrada(contenedor) {
  const res = await Api.obtener('Entrada');
  const entradas = res.data || [];

  const grupos = {};
  entradas.forEach(e => {
    const num = e['N°FacturaCompra'] || e.ID;
    if (!grupos[num]) grupos[num] = [];
    grupos[num].push(e);
  });

  contenedor.innerHTML = `
    <div class="card">
      <p style="color:var(--color-gris-texto); font-size:13px; margin-bottom:16px;">Este historial se llena automáticamente cuando marcas una solicitud como "Entregado" en Solicitud a Proveedor.</p>
      ${Object.keys(grupos).length === 0 ? '<p>Sin entradas registradas aún</p>' : Object.entries(grupos).map(([numFactura, lineas]) => {
        const primera = lineas[0];
        const totalFactura = lineas.reduce((sum, l) => sum + (Number(l.CostoTotal) || 0), 0);
        const idGrupo = 'entrada-' + numFactura.replace(/[^a-zA-Z0-9]/g, '');
        return `
          <div style="border:1px solid var(--color-borde); border-radius:var(--radio); margin-bottom:12px; overflow:hidden;">
            <div class="fila-resumen-entrada" data-target="${idGrupo}" style="display:flex; justify-content:space-between; align-items:center; padding:14px 16px; cursor:pointer; background:#faf7f0;">
              <div>
                <strong>Factura ${numFactura}</strong>
                <span style="color:var(--color-gris-texto); margin-left:10px;">${primera.Proveedor} · ${formatearFecha(primera.Fecha)}</span>
                <span style="color:var(--color-gris-texto); margin-left:10px;">Total: $${totalFactura.toFixed(2)}</span>
              </div>
              <span style="color:var(--color-gris-texto); font-size:13px;">Ver detalle ▾</span>
            </div>
            <div id="${idGrupo}" class="oculto" style="padding:16px;">
              <table>
                <thead><tr><th>Código</th><th>Descripción</th><th>Talla</th><th>Lote</th><th>Cant.</th><th>Costo/u</th><th>Total</th></tr></thead>
                <tbody>
                  ${lineas.map(l => `
                    <tr>
                      <td>${l.CodigoDeProducto}</td>
                      <td>${l.Descripcion}</td>
                      <td>${l.Talla}</td>
                      <td>${l.Lote}</td>
                      <td>${l.Cantidad}</td>
                      <td>$${Number(l.CostoPorUnidad || 0).toFixed(2)}</td>
                      <td>$${Number(l.CostoTotal || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  document.querySelectorAll('.fila-resumen-entrada').forEach(fila => {
    fila.addEventListener('click', () => {
      document.getElementById(fila.dataset.target).classList.toggle('oculto');
    });
  });
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
        <div class="form-group">
          <label>Código de País</label>
          <input type="text" id="inp-cod-pais" placeholder="Ej. +507" value="+507">
        </div>
        <div class="form-group">
          <label>Teléfono</label>
          <input type="text" id="inp-telefono" placeholder="Ej. 6123-4567">
        </div>
      </div>
      <div style="display:flex; gap:10px; margin-top:8px;">
        <button class="btn btn-primary" id="btn-guardar-proveedor">Guardar</button>
        <button class="btn btn-secundario" id="btn-cancelar-proveedor">Cancelar</button>
      </div>
    </div>

    <div class="card">
      <table>
        <thead><tr><th>N° Proveedor</th><th>Nombre</th><th>Teléfono</th><th></th></tr></thead>
        <tbody>
          ${data.map(p => `
            <tr>
              <td>${p['N°Proveedor']}</td>
              <td>${p.Nombre}</td>
              <td>${p.Telefono ? `<a href="https://wa.me/${soloDigitos(p.Telefono)}" target="_blank" style="color:var(--color-rojo); text-decoration:none; font-weight:600;">📱 ${p.Telefono}</a>` : '—'}</td>
              <td><button class="btn btn-secundario btn-editar-prov" data-id="${p.ID}" style="padding:6px 14px; font-size:13px;">Editar</button></td>
            </tr>
          `).join('') || '<tr><td colspan="4">Sin proveedores aún</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  const form = document.getElementById('form-nuevo-proveedor');
  let editandoId = null;

  document.getElementById('btn-nuevo-proveedor').addEventListener('click', () => {
    editandoId = null;
    document.getElementById('inp-nombre-prov').value = '';
    document.getElementById('inp-num-prov').value = '';
    document.getElementById('inp-cod-pais').value = '+507';
    document.getElementById('inp-telefono').value = '';
    document.querySelector('#form-nuevo-proveedor h3').textContent = 'Nuevo Proveedor';
    document.getElementById('btn-guardar-proveedor').textContent = 'Guardar';
    form.classList.toggle('oculto');
  });

  document.getElementById('btn-cancelar-proveedor').addEventListener('click', () => form.classList.add('oculto'));

  document.querySelectorAll('.btn-editar-prov').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const proveedor = data.find(p => p.ID === id);
      if (!proveedor) return;

      editandoId = id;
      document.getElementById('inp-nombre-prov').value = proveedor.Nombre || '';
      document.getElementById('inp-num-prov').value = proveedor['N°Proveedor'] || '';

      // Separar código de país y número (asume formato "+507 6123-4567")
      const partes = (proveedor.Telefono || '').split(' ');
      document.getElementById('inp-cod-pais').value = partes[0] || '+507';
      document.getElementById('inp-telefono').value = partes.slice(1).join(' ') || '';

      document.querySelector('#form-nuevo-proveedor h3').textContent = 'Editar Proveedor';
      document.getElementById('btn-guardar-proveedor').textContent = 'Guardar Cambios';
      form.classList.remove('oculto');
      form.scrollIntoView({ behavior: 'smooth' });
    });
  });

  document.getElementById('btn-guardar-proveedor').addEventListener('click', async () => {
    const nombre = document.getElementById('inp-nombre-prov').value.trim();
    const numProveedor = document.getElementById('inp-num-prov').value.trim();
    const codPais = document.getElementById('inp-cod-pais').value.trim();
    const telefono = document.getElementById('inp-telefono').value.trim();

    if (!nombre || !numProveedor) {
      alert('Nombre y N° Proveedor son obligatorios');
      return;
    }

    const btn = document.getElementById('btn-guardar-proveedor');
    btn.disabled = true;
    btn.textContent = editandoId ? 'Guardando cambios...' : 'Guardando...';

    const telefonoCompleto = telefono ? `${codPais} ${telefono}` : '';
    const fila = {
      Nombre: nombre,
      'N°Proveedor': numProveedor,
      Telefono: telefonoCompleto
    };

    const resultado = editandoId
      ? await Api.actualizar('Proveedor', editandoId, fila)
      : await Api.agregar('Proveedor', fila);

    if (resultado.ok) {
      renderProveedores(contenedor); // recargar tabla
    } else {
      btn.disabled = false;
      btn.textContent = editandoId ? 'Guardar Cambios' : 'Guardar';
    }
  });
}

// Deja solo dígitos de un teléfono (para armar el link de WhatsApp wa.me)
function soloDigitos(texto) {
  return String(texto).replace(/\D/g, '');
}

// Cargar dashboard al iniciar
cargarModulo('dashboard');
