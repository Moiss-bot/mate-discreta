const AFDExpendedora = (() => {
  const estado = {
    canvas: null,
    ctx: null,
    selector: null,
    monedas: [],
    productos: [],
    productoObjetivo: null,
    saldoActual: 0,
    saldoAnterior: 0,
    ultimaMoneda: null,
    fase: "inicio",
    ultimoVuelto: 0,
    historialDepositos: [],
    compraActual: null
  };

  const PASO = 10;
  const coloresMoneda = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#fb7185", "#60a5fa"];

  function formatoDinero(valor) {
    return "S/" + (valor / 100).toFixed(2);
  }

  function formatoMoneda(valor) {
    return valor < 100 ? valor + "c" : formatoDinero(valor);
  }

  function etiquetaSaldo(valor) {
    return (valor / 100).toFixed(2);
  }

  function productoInicial(productos) {
    return productos.slice().sort((a, b) => a.precio - b.precio)[0] || null;
  }

  function colorMoneda(moneda) {
    const indice = Math.max(0, estado.monedas.indexOf(moneda));
    return coloresMoneda[indice % coloresMoneda.length];
  }

  function configurarCanvas(anchoCss, altoCss) {
    const ratio = window.devicePixelRatio || 1;
    estado.canvas.style.width = anchoCss + "px";
    estado.canvas.style.height = altoCss + "px";
    estado.canvas.width = Math.floor(anchoCss * ratio);
    estado.canvas.height = Math.floor(altoCss * ratio);
    estado.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function limiteEstados(precio) {
    const saldosUsados = estado.historialDepositos.flatMap((paso) => [paso.saldoAnterior, paso.saldoActual]);
    const maxProducto = estado.productos.length
      ? Math.max(...estado.productos.map((producto) => producto.precio))
      : 0;
    const maxHistorial = saldosUsados.length ? Math.max(...saldosUsados) : 0;
    const maxCompra = estado.compraActual ? estado.compraActual.saldoCompra : 0;
    return Math.max(precio, maxProducto, maxHistorial, maxCompra, estado.saldoActual);
  }

  function estadosDeSaldo(precio) {
    const limite = limiteEstados(precio);
    const estados = [];
    for (let saldo = 0; saldo <= limite; saldo += PASO) estados.push(saldo);
    estado.historialDepositos.forEach((paso) => {
      if (!estados.includes(paso.saldoAnterior)) estados.push(paso.saldoAnterior);
      if (!estados.includes(paso.saldoActual)) estados.push(paso.saldoActual);
    });
    if (estado.compraActual && !estados.includes(estado.compraActual.saldoCompra)) {
      estados.push(estado.compraActual.saldoCompra);
    }
    return estados.sort((a, b) => a - b);
  }

  function destino(origen, moneda) {
    return origen + moneda;
  }

  function vuelto(origen, moneda, precio) {
    return Math.max(0, origen + moneda - precio);
  }

  function fondo(ancho, alto) {
    const ctx = estado.ctx;
    ctx.fillStyle = "#08111f";
    ctx.fillRect(0, 0, ancho, alto);

    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= ancho; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, alto);
      ctx.stroke();
    }
    for (let y = 0; y <= alto; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ancho, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(125, 211, 252, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(22, 22, ancho - 44, alto - 44, 18);
    ctx.stroke();
  }

  function cabecera(ancho) {
    const ctx = estado.ctx;
    const producto = estado.productoObjetivo;
    ctx.fillStyle = "#dbeafe";
    ctx.font = "900 24px Segoe UI, Arial";
    ctx.fillText("Flujo AFD de la expendedora", 36, 56);
    ctx.font = "800 13px Segoe UI, Arial";
    ctx.fillStyle = "#93c5fd";
    ctx.fillText("Cada nodo es un saldo. Cada flecha es una moneda. Al llegar al precio: producto, vuelto y retorno a q0.", 36, 82);
    ctx.fillStyle = "#bbf7d0";
    const detalleCompra = estado.compraActual
      ? "Compra: " + estado.compraActual.producto.nombre + " | precio " + formatoDinero(estado.compraActual.precio) + " | vuelto " + formatoDinero(estado.compraActual.vuelto)
      : "Historial de monedas insertadas conservado hasta comprar.";
    ctx.fillText(detalleCompra, 36, 106);

    ctx.textAlign = "right";
    ctx.fillStyle = "#facc15";
    ctx.fillText("Entradas: " + estado.monedas.map(formatoMoneda).join("  |  "), ancho - 42, 56);
    ctx.fillStyle = "#c4b5fd";
    ctx.fillText("Doble circulo = aceptacion", ancho - 42, 82);
    ctx.textAlign = "left";
  }

  function layout(estados, ancho, alto) {
    const filas = 6;
    const columnas = Math.ceil(estados.length / filas);
    const margenX = 105;
    const margenY = 145;
    const pasoX = 135;
    const pasoY = 118;
    const puntos = new Map();

    estados.forEach((saldo, indice) => {
      const columna = Math.floor(indice / filas);
      const fila = indice % filas;
      const offsetY = columna % 2 === 0 ? 0 : 28;
      puntos.set(saldo, {
        x: margenX + columna * pasoX,
        y: margenY + fila * pasoY + offsetY,
        radio: saldo === estado.productoObjetivo.precio ? 34 : 25
      });
    });

    const referencia = estado.compraActual ? estado.compraActual.saldoCompra : estado.saldoActual;
    const aceptacion = puntos.get(referencia) || puntos.get(0);
    const salidaY = Math.max(aceptacion.y + 125, alto - 145);

    return {
      saldos: puntos,
      producto: { x: Math.max(105, aceptacion.x - 115), y: salidaY, radio: 38 },
      vuelto: { x: aceptacion.x, y: salidaY, radio: 38 },
      retorno: { x: Math.min(ancho - 120, aceptacion.x + 125), y: salidaY, radio: 34 }
    };
  }

  function textoCentro(texto, x, y, font, color) {
    const ctx = estado.ctx;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, x, y);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function nodoSaldo(saldo, punto, aceptacion) {
    const ctx = estado.ctx;
    const activo = estado.fase === "saldo" && estado.saldoActual === saldo;
    const visitado = saldo === 0 || estado.historialDepositos.some((paso) => paso.saldoAnterior === saldo || paso.saldoActual === saldo);

    ctx.save();
    if (activo || (estado.fase === "inicio" && saldo === 0)) {
      ctx.shadowColor = "rgba(59, 130, 246, 0.95)";
      ctx.shadowBlur = 18;
    }
    ctx.fillStyle = activo ? "#93c5fd" : visitado ? "#dbeafe" : "#f8fafc";
    ctx.strokeStyle = activo ? "#2563eb" : visitado ? "#38bdf8" : aceptacion ? "#f59e0b" : "#e2e8f0";
    ctx.lineWidth = activo ? 4 : visitado ? 3 : aceptacion ? 3 : 1.7;
    ctx.beginPath();
    ctx.arc(punto.x, punto.y, punto.radio, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (aceptacion) {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(punto.x, punto.y, punto.radio - 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    textoCentro(etiquetaSaldo(saldo), punto.x, punto.y - 1, "900 10px Segoe UI, Arial", activo ? "#1e3a8a" : "#111827");
    if (saldo === 0) textoCentro("q0", punto.x, punto.y + 17, "800 8px Segoe UI, Arial", "#2563eb");
  }

  function nodoSalida(punto, titulo, subtitulo, activo, color) {
    const ctx = estado.ctx;
    ctx.save();
    if (activo) {
      ctx.shadowColor = "rgba(249, 115, 22, 0.9)";
      ctx.shadowBlur = 18;
    }
    ctx.fillStyle = activo ? "#fed7aa" : "#fde68a";
    ctx.strokeStyle = activo ? "#f97316" : color;
    ctx.lineWidth = activo ? 4 : 2.4;
    ctx.beginPath();
    ctx.arc(punto.x, punto.y, punto.radio, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(punto.x, punto.y, punto.radio - 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    textoCentro(titulo, punto.x, punto.y - 8, "900 9px Segoe UI, Arial", "#7c2d12");
    textoCentro(subtitulo, punto.x, punto.y + 10, "800 8px Segoe UI, Arial", "#7c2d12");
  }

  function etiqueta(texto, x, y, color, activa) {
    const ctx = estado.ctx;
    ctx.save();
    ctx.font = activa ? "900 9px Segoe UI, Arial" : "800 7px Segoe UI, Arial";
    const ancho = ctx.measureText(texto).width + 8;
    ctx.fillStyle = activa ? "#ffedd5" : "rgba(15, 23, 42, 0.70)";
    ctx.strokeStyle = activa ? "#f97316" : color;
    ctx.lineWidth = activa ? 1.5 : 0.7;
    ctx.beginPath();
    ctx.roundRect(x - ancho / 2, y - 7, ancho, 14, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = activa ? "#9a3412" : "#e2e8f0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, x, y + 1);
    ctx.restore();
  }

  function flecha(origen, destino, texto, color, activa = false, curva = 0, mostrarEtiqueta = true) {
    const ctx = estado.ctx;
    const dx = destino.x - origen.x;
    const dy = destino.y - origen.y;
    const distancia = Math.hypot(dx, dy) || 1;
    const nx = dx / distancia;
    const ny = dy / distancia;
    const inicioX = origen.x + nx * (origen.radio || 24);
    const inicioY = origen.y + ny * (origen.radio || 24);
    const finX = destino.x - nx * (destino.radio || 24);
    const finY = destino.y - ny * (destino.radio || 24);
    const medioX = (inicioX + finX) / 2;
    const medioY = (inicioY + finY) / 2;
    const normalX = -ny;
    const normalY = nx;
    const controlX = medioX + normalX * curva;
    const controlY = medioY + normalY * curva;

    ctx.save();
    ctx.globalAlpha = activa ? 1 : 0.56;
    ctx.strokeStyle = activa ? "#f97316" : color;
    ctx.lineWidth = activa ? 4.2 : 1.15;
    ctx.beginPath();
    ctx.moveTo(inicioX, inicioY);
    if (Math.abs(curva) > 1) ctx.quadraticCurveTo(controlX, controlY, finX, finY);
    else ctx.lineTo(finX, finY);
    ctx.stroke();

    const angulo = Math.abs(curva) > 1 ? Math.atan2(finY - controlY, finX - controlX) : Math.atan2(finY - inicioY, finX - inicioX);
    ctx.fillStyle = activa ? "#f97316" : color;
    ctx.beginPath();
    ctx.moveTo(finX, finY);
    ctx.lineTo(finX - 9 * Math.cos(angulo - Math.PI / 6), finY - 9 * Math.sin(angulo - Math.PI / 6));
    ctx.lineTo(finX - 9 * Math.cos(angulo + Math.PI / 6), finY - 9 * Math.sin(angulo + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (texto && mostrarEtiqueta) etiqueta(texto, Math.abs(curva) > 1 ? controlX : medioX, (Math.abs(curva) > 1 ? controlY : medioY) - 7, activa ? "#f97316" : color, activa);
  }

  function flechaInicial(q0) {
    const ctx = estado.ctx;
    const x1 = q0.x - 62;
    const x2 = q0.x - q0.radio - 4;
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, q0.y);
    ctx.lineTo(x2, q0.y);
    ctx.stroke();
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.moveTo(x2, q0.y);
    ctx.lineTo(x2 - 13, q0.y - 7);
    ctx.lineTo(x2 - 13, q0.y + 7);
    ctx.closePath();
    ctx.fill();
  }

  function transicionActiva(origen, moneda, dest) {
    return estado.historialDepositos.some((paso) => (
      paso.saldoAnterior === origen
      && paso.moneda === moneda
      && paso.saldoActual === dest
    ));
  }

  function redibujar() {
    if (!estado.canvas || !estado.productoObjetivo) return;

    const precio = estado.compraActual ? estado.compraActual.precio : estado.saldoActual;
    const estados = estadosDeSaldo(precio);
    const filas = 6;
    const columnas = Math.ceil(estados.length / filas);
    const ancho = Math.max(estado.canvas.parentElement.clientWidth, 240 + columnas * 135 + 320);
    const alto = Math.max(estado.canvas.parentElement.clientHeight, 900);
    configurarCanvas(ancho, alto);
    fondo(ancho, alto);
    cabecera(ancho);

    const dibujo = layout(estados, ancho, alto);
    const q0 = dibujo.saldos.get(0);
    flechaInicial(q0);

    estados.forEach((origen) => {
      estado.monedas.forEach((moneda, indiceMoneda) => {
        const dest = destino(origen, moneda);
        const pOrigen = dibujo.saldos.get(origen);
        const pDestino = dibujo.saldos.get(dest);
        if (!pOrigen || !pDestino) return;
        const activa = transicionActiva(origen, moneda, dest);
        const exceso = Math.max(0, origen + moneda - precio);
        const texto = exceso > 0 ? formatoMoneda(moneda) + "/V" + formatoDinero(exceso) : formatoMoneda(moneda);
        const curva = ((indiceMoneda % 6) - 2.5) * 10;
        flecha(pOrigen, pDestino, texto, colorMoneda(moneda), activa, curva, true);
      });
    });

    estados.forEach((saldo) => nodoSaldo(saldo, dibujo.saldos.get(saldo), false));

    const compra = estado.compraActual;
    const origenCompra = compra ? dibujo.saldos.get(compra.saldoCompra) : dibujo.saldos.get(estado.saldoActual);
    const precioEntrega = compra ? formatoDinero(compra.precio) : "S/0.00";
    const vueltoEntrega = compra ? formatoDinero(compra.vuelto) : "S/0.00";
    const salidaActiva = compra && (estado.fase === "producto" || estado.fase === "vuelto" || estado.fase === "final");

    nodoSalida(dibujo.producto, "ENTREGA", precioEntrega, salidaActiva, "#f59e0b");
    nodoSalida(dibujo.vuelto, "VUELTO", vueltoEntrega, salidaActiva, "#f97316");

    if (origenCompra) {
      flecha(origenCompra, dibujo.producto, compra ? "comprar " + formatoDinero(compra.precio) : "producto", "#f59e0b", salidaActiva, 20, true);
    }
    flecha(dibujo.producto, dibujo.vuelto, "vuelto " + vueltoEntrega, "#f97316", salidaActiva, 0, true);
    flecha(dibujo.vuelto, q0, "retorno q0", "#60a5fa", salidaActiva, -170, true);
  }

  function poblarSelector() {
    if (!estado.selector || !estado.productoObjetivo) return;
    estado.selector.innerHTML = "";
    estado.productos.forEach((producto) => {
      const opcion = document.createElement("option");
      opcion.value = producto.codigo;
      opcion.textContent = producto.codigo + " - " + producto.nombre + " (" + formatoDinero(producto.precio) + ")";
      estado.selector.appendChild(opcion);
    });
    estado.selector.value = estado.productoObjetivo.codigo;
  }

  function reiniciarDatos() {
    estado.saldoActual = 0;
    estado.saldoAnterior = 0;
    estado.ultimaMoneda = null;
    estado.fase = "inicio";
    estado.ultimoVuelto = 0;
    estado.historialDepositos = [];
    estado.compraActual = null;
  }

  function init({ canvasId, selectorId, monedas, productos }) {
    estado.canvas = document.getElementById(canvasId);
    estado.selector = document.getElementById(selectorId);
    if (!estado.canvas) return;
    estado.ctx = estado.canvas.getContext("2d");
    estado.monedas = monedas.slice();
    estado.productos = productos.slice();
    estado.productoObjetivo = productoInicial(productos);
    reiniciarDatos();
    poblarSelector();
    if (estado.selector) {
      estado.selector.addEventListener("change", () => {
        seleccionarProducto(estado.productos.find((producto) => producto.codigo === estado.selector.value));
      });
    }
    redibujar();
  }

  function configurar({ monedas, productos }) {
    if (monedas) estado.monedas = monedas.slice();
    if (productos) estado.productos = productos.slice();
    if (!estado.productoObjetivo || !estado.productos.some((producto) => producto.codigo === estado.productoObjetivo.codigo)) {
      estado.productoObjetivo = productoInicial(estado.productos);
    }
    poblarSelector();
    redibujar();
  }

  function seleccionarProducto(producto) {
    if (!producto) return;
    estado.productoObjetivo = producto;
    if (estado.selector) estado.selector.value = producto.codigo;
    redibujar();
  }

  function registrarMoneda({ saldoAnterior, moneda, saldoActual }) {
    if (!estado.productoObjetivo) return;
    estado.saldoAnterior = saldoAnterior;
    estado.saldoActual = saldoActual;
    estado.ultimaMoneda = moneda;
    estado.fase = "saldo";
    estado.ultimoVuelto = 0;
    estado.compraActual = null;
    estado.historialDepositos.push({ saldoAnterior, moneda, saldoActual });
    redibujar();
  }

  function registrarCompra({ producto, vuelto, saldoCompra }) {
    estado.productoObjetivo = producto;
    if (estado.selector) estado.selector.value = producto.codigo;
    estado.fase = vuelto > 0 ? "vuelto" : "producto";
    estado.ultimoVuelto = vuelto;
    estado.compraActual = {
      producto,
      precio: producto.precio,
      saldoCompra,
      vuelto
    };
    redibujar();
  }

  function registrarFinal() {
    estado.fase = "final";
    redibujar();
  }

  function reiniciar() {
    reiniciarDatos();
    redibujar();
  }

  window.addEventListener("resize", redibujar);

  return {
    init,
    configurar,
    seleccionarProducto,
    registrarMoneda,
    registrarCompra,
    registrarFinal,
    reiniciar,
    redibujar
  };
})();