/**
 * ONLINE SHOP - Frontend Core Module
 * SPA Architecture, Dynamic Rendering & State Management
 */

// Global State
let estadoUsuario = null;
let temporizadorBusqueda = null;

// IIFE para la persistencia y verificación de sesión
(() => {
    const tokenSesion = sessionStorage.getItem('idToken');
    const datosUsuario = localStorage.getItem('perfilUsuario');
    if (tokenSesion && datosUsuario) {
        estadoUsuario = JSON.parse(datosUsuario);
        document.addEventListener('DOMContentLoaded', () => {
            inicializarAplicacion();
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            mostrarPantallaLogin();
        });
    }
})();

/**
 * 1. SISTEMA DE NAVEGACIÓN Y CARGA DE MÓDULOS
 */
function irAModulo(modulo, filtroInventario = 'Todos') {
    // Gestionar clases activas en la barra de navegación
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('activo'));
    const linkActivo = document.querySelector(`[data-modulo="${modulo}"]`);
    if (linkActivo) linkActivo.classList.add('activo');

    // Actualizar encabezado principal
    const tituloModulo = document.getElementById('titulo-modulo');
    if (tituloModulo) {
        tituloModulo.textContent = modulo.toUpperCase().replace('-', ' ');
    }

    cargarModulo(modulo, filtroInventario);
}

async function cargarModulo(modulo, filtroInventario) {
    const contenedor = document.getElementById('contenido-modulo');
    if (!contenedor) return;

    // Indicador de carga
    contenedor.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando módulo...</span>
            </div>
        </div>
    `;

    try {
        switch (modulo) {
            case 'dashboard':
                await renderDashboard(contenedor);
                break;
            case 'inventario':
                await renderInventario(contenedor, filtroInventario);
                break;
            case 'proveedor':
                await renderSolicitudProveedor(contenedor);
                break;
            case 'ventas':
                await renderSalida(contenedor);
                break;
            case 'balance':
                await renderBalance(contenedor);
                break;
            case 'proveedores':
                await renderProveedores(contenedor);
                break;
            default:
                contenedor.innerHTML = '<div class="alert alert-danger">Módulo no encontrado.</div>';
        }
    } catch (error) {
        contenedor.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error al cargar el módulo</h5>
                <p>${error.message}</p>
            </div>
        `;
    }
}

/**
 * 2. ESTRUCTURA DE LOS MÓDULOS PRINCIPALES
 */

/* 📊 DASHBOARD */
async function renderDashboard(contenedor) {
    // Promesas paralelas para optimizar tiempos de respuesta
    const [inventario, salidas] = await Promise.all([
        Api.obtenerInventario(),
        Api.obtenerSalidas()
    ]);

    // Métricas en Tiempo Real
    let stockTotal = 0;
    let productosAgotados = 0;
    let stockBajo = 0;
    let valorInventario = 0;

    inventario.forEach(prod => {
        const stock = parseInt(prod.Stock) || 0;
        stockTotal += stock;
        valorInventario += stock * (parseFloat(prod.Precio) || 0);

        if (stock === 0) productosAgotados++;
        else if (stock <= 5) stockBajo++;
    });

    // Algoritmos de Clasificación: Top Clientes e Ingresos por Producto
    const ingresosPorProducto = {};
    const comprasPorCliente = {};

    salidas.forEach(salida => {
        const total = parseFloat(salida.Total) || 0;
        // Agrupar por producto
        ingresosPorProducto[salida.Descripcion] = (ingresosPorProducto[salida.Descripcion] || 0) + total;
        // Agrupar por cliente
        comprasPorCliente[salida.Cliente] = (comprasPorCliente[salida.Cliente] || 0) + total;
    });

    const topProductos = Object.entries(ingresosPorProducto)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const topClientes = Object.entries(comprasPorCliente)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    contenedor.innerHTML = `
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card card-indicador bg-light text-center p-3 cursor-pointer" onclick="irAModulo('inventario', 'Con Stock')">
                    <h6>Unidades en Stock</h6>
                    <h3 class="text-primary">${stockTotal}</h3>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card card-indicador bg-light text-center p-3 cursor-pointer" onclick="irAModulo('inventario', 'Agotado')">
                    <h6>Productos Agotados</h6>
                    <h3 class="text-danger">${productosAgotados}</h3>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card card-indicador bg-light text-center p-3 cursor-pointer" onclick="irAModulo('inventario', 'Bajo')">
                    <h6>Stock Bajo (≤ 5)</h6>
                    <h3 class="text-warning">${stockBajo}</h3>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card card-indicador bg-light text-center p-3">
                    <h6>Valor del Inventario</h6>
                    <h3 class="text-success">$${valorInventario.toFixed(2)}</h3>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-md-6">
                <div class="card p-3 h-100">
                    <h5>🔥 Top 5 Productos más Vendidos ($)</h5>
                    <ul class="list-group list-group-flush mt-2">
                        ${topProductos.map(([prod, total]) => `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                ${prod} <span>$${total.toFixed(2)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card p-3 h-100">
                    <h5>👑 Top 5 Clientes Principales</h5>
                    <ul class="list-group list-group-flush mt-2">
                        ${topClientes.map(([cliente, total]) => `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                ${cliente} <span>$${total.toFixed(2)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

/* 📦 INVENTARIO */
async function renderInventario(contenedor, filtroPredeterminado = 'Todos') {
    let productos = await Api.obtenerInventario();

    contenedor.innerHTML = `
        <div class="d-flex flex-wrap gap-2 justify-content-between mb-3 align-items-center">
            <div class="d-flex gap-2 flex-grow-1 max-w-500">
                <input type="text" id="busqueda-inv" class="form-control" placeholder="Buscar por código, descripción, talla...">
                <select id="filtro-stock" class="form-select w-auto">
                    <option value="Todos" ${filtroPredeterminado === 'Todos' ? 'selected' : ''}>Todos</option>
                    <option value="Con Stock" ${filtroPredeterminado === 'Con Stock' ? 'selected' : ''}>Con Stock</option>
                    <option value="Bajo" ${filtroPredeterminado === 'Bajo' ? 'selected' : ''}>Stock Bajo</option>
                    <option value="Agotado" ${filtroPredeterminado === 'Agotado' ? 'selected' : ''}>Agotado</option>
                </select>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-warning" onclick="auditarInventarioInterno()">
                    <i class="bi bi-shield-check"></i> Auditar Saldos
                </button>
                <button class="btn btn-primary" onclick="mostrarModalProducto()">
                    <i class="bi bi-plus-lg"></i> Nuevo Producto
                </button>
            </div>
        </div>
        <div class="table-responsive card">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-dark">
                    <tr>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>Talla</th>
                        <th class="text-center">Stock</th>
                        <th class="text-end">Costo</th>
                        <th class="text-end">Precio</th>
                        <th class="text-end">Importe Total</th>
                        <th class="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-inventario-cuerpo">
                    <!-- Inyección dinámica vía JS -->
                </tbody>
            </table>
        </div>
    `;

    const aplicarFiltros = () => {
        const busqueda = document.getElementById('busqueda-inv').value.toLowerCase();
        const filtroStock = document.getElementById('filtro-stock').value;
        const cuerpo = document.getElementById('tabla-inventario-cuerpo');

        let filtrados = productos.filter(p => {
            const matchesBusqueda = p.Codigo.toLowerCase().includes(busqueda) || 
                                    p.Descripcion.toLowerCase().includes(busqueda) || 
                                    (p.Talla && p.Talla.toLowerCase().includes(busqueda));
            
            const stock = parseInt(p.Stock) || 0;
            let matchesStock = true;

            if (filtroStock === 'Con Stock') matchesStock = stock > 0;
            else if (filtroStock === 'Bajo') matchesStock = stock > 0 && stock <= 5;
            else if (filtroStock === 'Agotado') matchesStock = stock === 0;

            return matchesBusqueda && matchesStock;
        });

        // Ordenar alfabéticamente por descripción
        filtrados.sort((a, b) => a.Descripcion.localeCompare(b.Descripcion));

        cuerpo.innerHTML = filtrados.map(p => {
            const stock = parseInt(p.Stock) || 0;
            const importe = stock * (parseFloat(p.Costo) || 0);
            let badgeClass = 'bg-success';
            if (stock === 0) badgeClass = 'bg-danger';
            else if (stock <= 5) badgeClass = 'bg-warning text-dark';

            return `
                <tr>
                    <td><strong>${p.Codigo}</strong></td>
                    <td>${p.Descripcion}</td>
                    <td><span class="badge bg-secondary">${p.Talla || 'N/A'}</span></td>
                    <td class="text-center"><span class="badge ${badgeClass} fs-6">${stock}</span></td>
                    <td class="text-end">$${parseFloat(p.Costo).toFixed(2)}</td>
                    <td class="text-end">$${parseFloat(p.Precio).toFixed(2)}</td>
                    <td class="text-end fw-bold">$${importe.toFixed(2)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" onclick="mostrarModalProducto('${p.Codigo}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    document.getElementById('busqueda-inv').addEventListener('input', aplicarFiltros);
    document.getElementById('filtro-stock').addEventListener('change', aplicarFiltros);
    aplicarFiltros();
}

async function auditarInventarioInterno() {
    if (!confirm("¿Deseas ejecutar la verificación cruzada de saldos contra el historial de transacciones?")) return;
    
    const resultado = await Api.auditarInventario();
    if (resultado.desajustes && resultado.desajustes.length > 0) {
        let plantillaDesajustes = resultado.desajustes.map(d => 
            `<li>Código ${d.codigo}: Historial reporta ${d.esperado}, Inventario tiene ${d.actual}</li>`
        ).join('');
        
        // Ofrecer corrección automática de los importes financieros desalineados
        document.getElementById('contenido-modulo').insertAdjacentHTML('afterbegin', `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <h5><i class="bi bi-exclamation-triangle-fill"></i> Inconsistencias Detectadas</h5>
                <ul>${plantillaDesajustes}</ul>
                <button class="btn btn-sm btn-dark mt-2" onclick="corregirImportesAuditoria()">Corregir importe financiero</button>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
    } else {
        alert("🎉 Auditoría exitosa: Todos los saldos y flujos coinciden perfectamente.");
    }
}

/* 🤝 SOLICITUD A PROVEEDOR (ÓRDENES DE COMPRA) */
async function renderSolicitudProveedor(contenedor) {
    const solicitudes = await Api.obtenerSolicitudesProveedor();
    
    // Agrupar líneas por N° de Solicitud
    const ordenesAgrupadas = {};
    solicitudes.forEach(sol => {
        if (!ordenesAgrupadas[sol.NoSolicitud]) {
            ordenesAgrupadas[sol.NoSolicitud] = {
                id: sol.NoSolicitud,
                proveedor: sol.Proveedor,
                fecha: sol.Fecha,
                estado: sol.Estado, // 'Pendiente' o 'Recibido'
                items: []
            };
        }
        ordenesAgrupadas[sol.NoSolicitud].items.push(sol);
    });

    contenedor.innerHTML = `
        <h5 class="mb-3">Órdenes de Compra y Suministros</h5>
        <div class="accordion" id="accordionSolicitudes">
            ${Object.values(ordenesAgrupadas).map((orden, index) => {
                const todasRecibidas = orden.items.every(i => i.Estado === 'Recibido');
                return `
                    <div class="accordion-item mb-2 card border shadow-sm">
                        <h2 class="accordion-header" id="heading${orden.id}">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${orden.id}">
                                <div class="d-flex justify-content-between w-100 sub-container alignment-fix">
                                    <span><strong>Orden #${orden.id}</strong> — ${orden.proveedor} <small class="text-muted">(${orden.fecha})</small></span>
                                    <span class="badge ${todasRecibidas ? 'bg-success' : 'bg-warning text-dark'} me-3">
                                        ${todasRecibidas ? 'Completada' : 'Pendiente de Arribo'}
                                    </span>
                                </div>
                            </button>
                        </h2>
                        <div id="collapse${orden.id}" class="accordion-collapse collapse" data-bs-parent="#accordionSolicitudes">
                            <div class="accordion-body bg-light">
                                <div class="table-responsive">
                                    <table class="table table-bordered bg-white align-middle">
                                        <thead>
                                            <tr>
                                                <th>Código</th>
                                                <th>Descripción</th>
                                                <th class="text-center">Cant. Solicitada</th>
                                                <th>Estado</th>
                                                <th>Factura Ref.</th>
                                                <th class="text-center">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${orden.items.map(item => `
                                                <tr>
                                                    <td>${item.Codigo}</td>
                                                    <td>${item.Descripcion}</td>
                                                    <td class="text-center fw-bold">${item.Cantidad}</td>
                                                    <td>
                                                        <span class="badge ${item.Estado === 'Recibido' ? 'bg-success' : 'bg-secondary'}">
                                                            ${item.Estado}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${item.Estado === 'Recibido' 
                                                            ? `<code>${item.Factura || 'N/A'}</code>` 
                                                            : `<input type="text" id="factura-${orden.id}-${item.Codigo}" class="form-control form-control-sm" placeholder="N° Factura">`
                                                        }
                                                    </td>
                                                    <td class="text-center">
                                                        ${item.Estado === 'Pendiente' 
                                                            ? `<button class="btn btn-sm btn-success" onclick="recibirItemProveedor('${orden.id}', '${item.Codigo}')">Recibir</button>` 
                                                            : `<i class="bi bi-check-circle-fill text-success fs-5"></i>`
                                                        }
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                ${!todasRecibidas ? `
                                    <div class="text-end mt-2">
                                        <button class="btn btn-dark btn-sm" onclick="recibirOrdenCompleta('${orden.id}')">
                                            Recibir Carga Completa
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/* 🧾 VENTAS / SALIDAS */
async function renderSalida(contenedor) {
    let carrito = [];
    const inventario = await Api.obtenerInventario();

    contenedor.innerHTML = `
        <div class="row g-3">
            <!-- Selector de Productos -->
            <div class="col-md-7">
                <div class="card p-3 shadow-sm h-100">
                    <h5>🛒 Armar Carrito de Salidas</h5>
                    <div class="mb-3 position-relative mt-2">
                        <input type="text" id="buscar-prod-venta" class="form-control" placeholder="Escribe el código o descripción para añadir...">
                        <div id="sugerencias-venta" class="list-group position-absolute w-100 z-index-master dynamic-dropdown-box"></div>
                    </div>
                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th class="text-center" style="width: 120px;">Cantidad</th>
                                    <th class="text-end">Precio U.</th>
                                    <th class="text-end">Total</th>
                                    <th class="text-center"></th>
                                </tr>
                            </thead>
                            <tbody id="carrito-cuerpo">
                                <tr><td colspan="5" class="text-center text-muted py-4">El carrito está vacío.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <!-- Datos de Facturación y Liquidación -->
            <div class="col-md-5">
                <div class="card p-3 shadow-sm h-100 d-flex flex-column justify-content-between">
                    <div>
                        <h5>📋 Información del Cliente y Pago</h5>
                        <div class="mt-3">
                            <label class="form-label mb-1">Cliente</label>
                            <input type="text" id="cliente-venta" class="form-control" placeholder="Nombre completo">
                        </div>
                        <div class="mt-2">
                            <label class="form-label mb-1">Celular / WhatsApp</label>
                            <input type="tel" id="telefono-venta" class="form-control" placeholder="Ej: +50766000000">
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between fs-5 fw-bold mb-2">
                            <span>Monto Total:</span>
                            <span id="monto-total-venta">$0.00</span>
                        </div>
                        <div class="row g-2">
                            <div class="col-6">
                                <label class="form-label mb-1">Monto Abonado</label>
                                <input type="number" id="abono-venta" class="form-control" value="0" min="0" step="0.01">
                            </div>
                            <div class="col-6">
                                <label class="form-label mb-1">Saldo Pendiente</label>
                                <input type="text" id="saldo-venta" class="form-control text-danger fw-bold" value="$0.00" readonly>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4">
                        <button class="btn btn-success w-100 py-2 fs-5" id="btn-procesar-venta" disabled>
                            <i class="bi bi-cart-check"></i> Procesar y Registrar Salida
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Lógica interactiva del Carrito
    const inputBuscar = document.getElementById('buscar-prod-venta');
    const panelSugerencias = document.getElementById('sugerencias-venta');
    const cuerpoCarrito = document.getElementById('carrito-cuerpo');
    const txtTotal = document.getElementById('monto-total-venta');
    const inputAbono = document.getElementById('abono-venta');
    const inputSaldo = document.getElementById('saldo-venta');
    const btnProcesar = document.getElementById('btn-procesar-venta');

    const actualizarInterfazVenta = () => {
        if (carrito.length === 0) {
            cuerpoCarrito.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">El carrito está vacío.</td></tr>`;
            txtTotal.textContent = "$0.00";
            inputSaldo.value = "$0.00";
            btnProcesar.disabled = true;
            return;
        }

        let totalGeneral = 0;
        cuerpoCarrito.innerHTML = carrito.map((item, index) => {
            const subtotal = item.cantidad * item.Precio;
            totalGeneral += subtotal;
            return `
                <tr>
                    <td>
                        <div><strong>${item.Codigo}</strong></div>
                        <small class="text-muted">${item.Descripcion}</small>
                    </td>
                    <td>
                        <input type="number" class="form-control form-control-sm text-center input-cant-carrito" 
                               value="${item.cantidad}" min="1" max="${item.Stock}" data-index="${index}">
                    </td>
                    <td class="text-end">$${parseFloat(item.Precio).toFixed(2)}</td>
                    <td class="text-end fw-bold">$${subtotal.toFixed(2)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-link text-danger eliminar-item-carrito" data-index="${index}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        txtTotal.textContent = `$${totalGeneral.toFixed(2)}`;
        const abono = parseFloat(inputAbono.value) || 0;
        const saldo = totalGeneral - abono;
        inputSaldo.value = `$${saldo.toFixed(2)}`;
        btnProcesar.disabled = false;
    };

    // Buscador predictivo en caliente
    inputBuscar.addEventListener('input', () => {
        const query = inputBuscar.value.toLowerCase();
        panelSugerencias.innerHTML = '';
        if (!query) return;

        const coincidencias = inventario.filter(p => 
            (p.Codigo.toLowerCase().includes(query) || p.Descripcion.toLowerCase().includes(query)) && parseInt(p.Stock) > 0
        ).slice(0, 5);

        panelSugerencias.innerHTML = coincidencias.map(p => `
            <button class="list-group-item list-group-item-action text-start btn-sug-item" type="button" data-codigo="${p.Codigo}">
                <strong>${p.Codigo}</strong> — ${p.Descripcion} <span class="badge bg-primary float-end">Stock: ${p.Stock}</span>
            </button>
        `).join('');
    });

    // Delegación de eventos en sugerencias e inputs dinámicos
    document.addEventListener('click', (e) => {
        const botonSug = e.target.closest('.btn-sug-item');
        if (botonSug) {
            const cod = botonSug.dataset.codigo;
            const itemProd = inventario.find(p => p.Codigo === cod);
            const existe = carrito.find(i => i.Codigo === cod);

            if (existe) {
                if (existe.cantidad < parseInt(itemProd.Stock)) existe.cantidad++;
            } else {
                carrito.push({ ...itemProd, cantidad: 1 });
            }
            inputBuscar.value = '';
            panelSugerencias.innerHTML = '';
            actualizarInterfazVenta();
        }
    });

    cuerpoCarrito.addEventListener('input', (e) => {
        if (e.target.classList.contains('input-cant-carrito')) {
            const index = e.target.dataset.index;
            const maxVal = parseInt(carrito[index].Stock);
            let val = parseInt(e.target.value) || 1;
            
            if (val > maxVal) {
                alert(`Inventario insuficiente. Stock actual disponible: ${maxVal}`);
                val = maxVal;
            }
            carrito[index].cantidad = val;
            actualizarInterfazVenta();
        }
    });

    cuerpoCarrito.addEventListener('click', (e) => {
        const btnEliminar = e.target.closest('.eliminar-item-carrito');
        if (btnEliminar) {
            const index = btnEliminar.dataset.index;
            carrito.splice(index, 1);
            actualizarInterfazVenta();
        }
    });

    inputAbono.addEventListener('input', actualizarInterfazVenta);

    btnProcesar.addEventListener('click', async () => {
        const cliente = document.getElementById('cliente-venta').value.trim();
        const telefono = document.getElementById('telefono-venta').value.trim();

        if (!cliente) return alert("Por favor, introduce el nombre del cliente.");

        const payload = {
            cliente,
            telefono,
            productos: carrito.map(i => ({ codigo: i.Codigo, cantidad: i.cantidad })),
            abono: parseFloat(inputAbono.value) || 0
        };

        const res = await Api.registrarSalida(payload);
        if (res.exito) {
            alert("Salida procesada con éxito.");
            
            // Integración nativa con WhatsApp y Generación de Recibo PDF
            if (telefono) {
                const mensajeWa = encodeURIComponent(`Hola ${cliente}, adjuntamos tu recibo digital de compra en ONLINE SHOP: ${res.urlRecibo}`);
                window.open(`https://wa.me/${telefono.replace('+', '')}?text=${mensajeWa}`, '_blank');
            }
            irAModulo('dashboard');
        }
    });
}

/* 📈 BALANCE Y GRÁFICO SVG */
async function renderBalance(contenedor) {
    const datosFinancieros = await Api.obtenerBalanceFinanciero();

    // Dibujado del Gráfico Dinámico Vectorial (SVG)
    const anchoGrafico = 600;
    const altoGrafico = 300;
    const margen = 40;
    
    // Obtener valores máximos para escalar las barras proporcionalmente
    const maxMonto = Math.max(...datosFinancieros.map(d => Math.max(d.Ingresos, d.Egresos)), 100);
    const escalaY = (altoGrafico - (margen * 2)) / maxMonto;
    const anchoBarra = ((anchoGrafico - (margen * 2)) / datosFinancieros.length) / 2.5;

    let barrasSvg = '';
    datosFinancieros.forEach((periodo, idx) => {
        const xBase = margen + (idx * (anchoGrafico - (margen * 2)) / datosFinancieros.length);
        
        // Coordenadas calculadas en base a la matriz de datos
        const altoIngreso = periodo.Ingresos * escalaY;
        const yIngreso = altoGrafico - margen - altoIngreso;
        
        const altoEgreso = periodo.Egresos * escalaY;
        const yEgreso = altoGrafico - margen - altoEgreso;

        // Barras de Ingreso (Verde) y Egreso (Rojo)
        barrasSvg += `
            <rect x="${xBase}" y="${yIngreso}" width="${anchoBarra}" height="${altoIngreso}" fill="#198754" />
            <rect x="${xBase + anchoBarra + 4}" y="${yEgreso}" width="${anchoBarra}" height="${altoEgreso}" fill="#dc3545" />
            <text x="${xBase + anchoBarra}" y="${altoGrafico - 15}" font-size="11" text-anchor="middle" fill="#666">${periodo.Etiqueta}</text>
        `;
    });

    contenedor.innerHTML = `
        <div class="card p-3 mb-4 shadow-sm">
            <h5>Análisis Operativo y Curva de Rendimiento</h5>
            <div class="text-center overflow-auto py-2">
                <svg width="${anchoGrafico}" height="${altoGrafico}" class="bg-white border rounded">
                    <!-- Líneas Guía de Fondo -->
                    <line x1="${margen}" y1="${altoGrafico - margen}" x2="${anchoGrafico - margen}" y2="${altoGrafico - margen}" stroke="#ccc" stroke-width="1"/>
                    ${barrasSvg}
                </svg>
            </div>
            <div class="d-flex justify-content-center gap-3 mt-2 font-small">
                <span><span class="badge bg-success">&nbsp;</span> Ingresos Operativos</span>
                <span><span class="badge bg-danger">&nbsp;</span> Costos / Egresos</span>
            </div>
        </div>

        <div class="card p-3 shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="m-0">Tabla de Rendimientos por Periodo</h5>
                <button class="btn btn-sm btn-outline-danger" onclick="exportarPdfBalance()">
                    <i class="bi bi-file-earmark-pdf"></i> Exportar PDF
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-striped text-end align-middle">
                    <thead class="table-dark">
                        <tr>
                            <th class="text-start">Periodo</th>
                            <th>(+) Ingresos</th>
                            <th>(-) Egresos</th>
                            <th>(=) Margen Neto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${datosFinancieros.map(d => {
                            const margenNeto = d.Ingresos - d.Egresos;
                            return `
                                <tr>
                                    <td class="text-start fw-bold">${d.Etiqueta}</td>
                                    <td class="text-success">$${d.Ingresos.toFixed(2)}</td>
                                    <td class="text-danger">$${d.Egresos.toFixed(2)}</td>
                                    <td class="${margenNeto >= 0 ? 'text-primary' : 'text-danger'} fw-bold">$${margenNeto.toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/* 👥 PROVEEDORES */
async function renderProveedores(contenedor) {
    const proveedores = await Api.obtenerProveedores();

    contenedor.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="m-0">Directorio Comercial</h5>
            <button class="btn btn-primary btn-sm" onclick="mostrarModalProveedor()"><i class="bi bi-plus"></i> Añadir Proveedor</button>
        </div>
        <div class="row g-3">
            ${proveedores.map(p => {
                // Formateo del teléfono para limpieza de canales de contacto directo
                const numeroLimpio = p.Telefono ? p.Telefono.replace(/[^0-9+]/g, '') : '';
                return `
                    <div class="col-md-4">
                        <div class="card p-3 shadow-sm h-100 d-flex flex-column justify-content-between">
                            <div>
                                <h5 class="text-primary mb-1">${p.Nombre}</h5>
                                <p class="text-muted small mb-2"><i class="bi bi-tag"></i> ${p.Rubro || 'General'}</p>
                                <div class="font-small">
                                    <div><strong>Contacto:</strong> ${p.Contacto || 'N/A'}</div>
                                    <div><strong>Teléfono:</strong> ${p.Telefono || 'N/A'}</div>
                                    <div><strong>Correo:</strong> ${p.Correo || 'N/A'}</div>
                                </div>
                            </div>
                            <div class="mt-3 pt-2 border-top text-end">
                                ${numeroLimpio ? `
                                    <a href="https://wa.me/${numeroLimpio.replace('+', '')}" target="_blank" class="btn btn-sm btn-outline-success">
                                        <i class="bi bi-whatsapp"></i> Chat Comercial
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * 3. CARACTERÍSTICAS GLOBALES Y TRANSVERSALES
 */

/* 🔍 BÚSQUEDA GLOBAL INTERACTIVA (DEBOUNCE) */
function inicializarBusquedaGlobal() {
    const barraBusqueda = document.getElementById('input-busqueda-global');
    const panelResultados = document.getElementById('resultados-busqueda-global');
    
    if (!barraBusqueda || !panelResultados) return;

    barraBusqueda.addEventListener('input', () => {
        clearTimeout(temporizadorBusqueda);
        const query = barraBusqueda.value.trim().toLowerCase();

        if (!query) {
            panelResultados.innerHTML = '';
            panelResultados.classList.add('d-none');
            return;
        }

        // Técnica Debounce: Retardo controlado de 200ms para no saturar al servidor
        temporizadorBusqueda = setTimeout(async () => {
            const resultados = await Api.buscarGlobalmente(query);
            
            if (resultados.length === 0) {
                panelResultados.innerHTML = `<div class="p-2 text-muted text-center">No hay coincidencias para "${query}"</div>`;
            } else {
                panelResultados.innerHTML = resultados.map(r => `
                    <button class="list-group-item list-group-item-action text-start p-2 border-bottom btn-click-busqueda" 
                            data-modulo="${r.moduloTarget}" data-filtro="${r.filtroExtra || ''}">
                        <span class="badge bg-secondary me-2 font-monospace">${r.tipo.toUpperCase()}</span>
                        <strong>${r.identificador}</strong> — <span class="text-truncate">${r.extracto}</span>
                    </button>
                `).join('');
            }
            panelResultados.classList.remove('d-none');
        }, 200);
    });

    document.addEventListener('click', (e) => {
        const elementoClickeado = e.target.closest('.btn-click-busqueda');
        if (elementoClickeado) {
            const modulo = elementoClickeado.dataset.modulo;
            const filtro = elementoClickeado.dataset.filtro;
            
            barraBusqueda.value = '';
            panelResultados.classList.add('d-none');
            irAModulo(modulo, filtro);
            return;
        }

        if (!e.target.closest('#contenedor-busqueda-global')) {
            panelResultados.classList.add('d-none');
        }
    });
}

/**
 * 4. SEGURIDAD Y CAPA DE AUTENTICACIÓN GOOGLE IDENTITY
 */
function manejarLoginGoogle(credentialResponse) {
    try {
        const tokenJwt = credentialResponse.credential;
        // Desestructurar payload del JWT (Base64) de forma segura nativa
        const base64Url = tokenJwt.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payloadDecodificado = JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')));

        // Validaciones internas del dominio o emisor si fuese necesario
        estadoUsuario = {
            nombre: payloadDecodificado.name,
            email: payloadDecodificado.email,
            avatar: payloadDecodificado.picture
        };

        // Almacenar credenciales de sesión cifradas y perfiles de uso continuo
        sessionStorage.setItem('idToken', tokenJwt);
        localStorage.setItem('perfilUsuario', JSON.stringify(estadoUsuario));

        inicializarAplicacion();
    } catch (error) {
        console.error("Error crítico en parseo e ingreso con Google Identity Token:", error);
        alert("Autenticación fallida. Inténtalo de nuevo.");
    }
}

function inicializarAplicacion() {
    const appContainer = document.getElementById('app-root');
    if (!appContainer) return;

    // Layout Estructural Principal de ONLINE SHOP
    appContainer.innerHTML = `
        <div class="d-flex" id="wrapper-general">
            <!-- Barra Lateral de Navegación -->
            <div class="bg-dark text-white border-end" id="sidebar-wrapper" style="width: 250px; min-height: 100vh;">
                <div class="sidebar-heading text-center p-3 fs-4 border-bottom border-secondary fw-bold text-tracking">
                    ONLINE SHOP
                </div>
                <div class="list-group list-group-flush p-2 nav-spa-box">
                    <button class="nav-link btn btn-dark text-start w-100 mb-1 py-2 px-3 active" data-modulo="dashboard" onclick="irAModulo('dashboard')">
                        <i class="bi bi-speedometer2 me-2"></i> Dashboard
                    </button>
                    <button class="nav-link btn btn-dark text-start w-100 mb-1 py-2 px-3" data-modulo="inventario" onclick="irAModulo('inventario')">
                        <i class="bi bi-box-seam me-2"></i> Inventario
                    </button>
                    <button class="nav-link btn btn-dark text-start w-100 mb-1 py-2 px-3" data-modulo="proveedor" onclick="irAModulo('proveedor')">
                        <i class="bi bi-truck me-2"></i> Pedidos Proveedor
                    </button>
                    <button class="nav-link btn btn-dark text-start w-100 mb-1 py-2 px-3" data-modulo="ventas" onclick="irAModulo('ventas')">
                        <i class="bi bi-receipt-cutoff me-2"></i> Ventas / Salidas
                    </button>
                    <button class="nav-link btn btn-dark text-start w-100 mb-1 py-2 px-3" data-modulo="balance" onclick="irAModulo('balance')">
                        <i class="bi bi-graph-up-arrow me-2"></i> balances
                    </button>
                    <button class="nav-link btn btn-dark text-start w-100 mb-1 py-2 px-3" data-modulo="proveedores" onclick="irAModulo('proveedores')">
                        <i class="bi bi-people me-2"></i> Proveedores
                    </button>
                </div>
                <div class="p-3 border-top border-secondary mt-auto position-absolute bottom-0 w-250-fixed bg-dark-pure text-center">
                    <img src="${estadoUsuario.avatar}" class="rounded-circle me-2" width="30" height="30" alt="Avatar">
                    <small class="text-truncate d-inline-block max-w-150 align-middle">${estadoUsuario.nombre}</small>
                    <button class="btn btn-sm btn-outline-danger ms-2 p-1 border-0" onclick="cerrarSesionApp()" title="Salir">
                        <i class="bi bi-power"></i>
                    </button>
                </div>
            </div>

            <!-- Contenedor de Contenidos -->
            <div id="page-content-wrapper" class="w-100 bg-white-smoke">
                <!-- Barra Superior -->
                <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom py-2 px-4 d-flex justify-content-between">
                    <h4 class="m-0 text-capitalize text-dark fw-bold" id="titulo-modulo">Dashboard</h4>
                    <!-- Buscador Global Compuesto -->
                    <div class="position-relative w-25" id="contenedor-busqueda-global">
                        <input type="text" id="input-busqueda-global" class="form-control form-control-sm pr-4 rounded-pill" placeholder="🔍 Control de búsqueda directa...">
                        <div id="resultados-busqueda-global" class="list-group position-absolute w-100 z-index-master shadow border mt-1 d-none max-h-300 overflow-y-auto bg-white"></div>
                    </div>
                </nav>
                <!-- Renderizado Modular -->
                <div class="container-fluid p-4" id="contenido-modulo"></div>
            </div>
        </div>
    `;

    // Inicializaciones funcionales post inyección estructural
    inicializarBusquedaGlobal();
    irAModulo('dashboard');
}

function mostrarPantallaLogin() {
    const appContainer = document.getElementById('app-root');
    if (!appContainer) return;

    appContainer.innerHTML = `
        <div class="container d-flex align-items-center justify-content-center" style="min-height: 100vh;">
            <div class="card p-5 text-center shadow border-0 max-w-400">
                <h2 class="fw-bold mb-2 text-primary">ONLINE SHOP</h2>
                <p class="text-muted mb-4 small">Consola interna de Control Integral de Operaciones de Inventario</p>
                <div class="border p-3 rounded mb-3 bg-light fs-6 text-secondary">
                    <i class="bi bi-shield-lock-fill fs-3 text-warning d-block mb-1"></i>
                    Acceso Restringido. Es necesario iniciar sesión con tu cuenta corporativa autorizada.
                </div>
                <!-- Div Ancla para Google Identity Services de forma Nativa -->
                <div class="d-flex justify-content-center mt-3">
                    <div id="buttonDivGoogle"></div>
                </div>
            </div>
        </div>
    `;

    // Renderizado del botón oficial de Google One Tap / Identity
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "TU_GOOGLE_CLIENT_ID_AQUI.apps.googleusercontent.com",
            callback: manejarLoginGoogle
        });
        google.accounts.id.renderButton(
            document.getElementById("buttonDivGoogle"),
            { theme: "outline", size: "large", width: "100%" }
        );
    }
}

function cerrarSesionApp() {
    if (!confirm("¿Seguro que deseas salir del sistema?")) return;
    sessionStorage.clear();
    localStorage.removeItem('perfilUsuario');
    window.location.reload();
}
