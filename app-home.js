const tarjetasModulo = document.querySelectorAll("[data-algoritmo]");
const capaModal = document.getElementById("selectorAristas");
const btnCerrarModal = document.getElementById("cerrarSelector");
const botonesTipoArista = document.querySelectorAll("[data-tipo]");

const previewEtiqueta = document.getElementById("previewEtiqueta");
const previewTitulo = document.getElementById("previewTitulo");
const previewDescripcion = document.getElementById("previewDescripcion");
const previewComplejidad = document.getElementById("previewComplejidad");
const previewAplicacion = document.getElementById("previewAplicacion");
const navModulos = document.querySelectorAll("[data-modulo]");

const datosModulos = {
  dijkstra: {
    etiqueta: "§ 4.1 · Fuente única",
    titulo: "Algoritmo de Dijkstra",
    descripcion:
      "Dado un grafo G = (V, E) con pesos w(e) ≥ 0 y un vértice origen s ∈ V, el algoritmo de Dijkstra determina la distancia mínima d(s, v) para todo v ∈ V alcanzable desde s, mediante relajación iterativa de aristas en orden de distancia acumulada creciente.",
    complejidad: "O((V + E) log V) con cola de prioridad",
    aplicacion: "Rutas mínimas desde un único vértice fuente",
  },
  floyd: {
    etiqueta: "§ 4.2 · Todos contra todos",
    titulo: "Floyd-Warshall",
    descripcion:
      "Mediante programación dinámica, el algoritmo evalúa iterativamente cada vértice k como posible intermediario, aplicando d[i][j] = min(d[i][j], d[i][k] + d[k][j]) para obtener la matriz completa de distancias mínimas entre todos los pares ordenados de vértices.",
    complejidad: "O(V³) tiempo, O(V²) espacio",
    aplicacion: "Matriz de caminos mínimos entre todos los pares",
  },
  analizador: {
    etiqueta: "§ 4.3 · Análisis comparativo",
    titulo: "Analizador de Grafos",
    descripcion:
      "Este módulo evalúa empíricamente la topología del grafo construido, midiendo el rendimiento de Dijkstra y Floyd-Warshall para recomendar automáticamente el algoritmo más eficiente según |V|, |E| y el objetivo del cálculo.",
    complejidad: "Comparación empírica O(1) por ejecución",
    aplicacion: "Selección heurística del algoritmo óptimo",
  },
  expendedora: {
    etiqueta: "§ 5 · Autómatas finitos",
    titulo: "Máquina Expendedora (MEF)",
    descripcion:
      "Simulación de un autómata finito M = (Q, Σ, δ, q₀, F) que modela la inserción de monedas, acumulación de saldo, estados de aceptación por producto, función de salida λ y cálculo de vuelto mediante caminos mínimos en el espacio de estados.",
    complejidad: "O(|Q| · |Σ|) para la tabla de transiciones",
    aplicacion: "Modelado formal de máquinas de estados finitos",
  },
};

let destinoPendiente = "";

const actualizarPreview = (modulo) => {
  const datos = datosModulos[modulo];
  if (!datos || !previewTitulo) return;

  previewEtiqueta.textContent = datos.etiqueta;
  previewTitulo.textContent = datos.titulo;
  previewDescripcion.textContent = datos.descripcion;
  previewComplejidad.textContent = datos.complejidad;
  previewAplicacion.textContent = datos.aplicacion;

  navModulos.forEach((item) => {
    item.classList.toggle("activo", item.dataset.modulo === modulo);
  });
};

const abrirModalTipo = (evento) => {
  evento.preventDefault();
  destinoPendiente = evento.currentTarget.getAttribute("href");
  capaModal.hidden = false;
  document.body.classList.add("bloqueo-scroll");
};

const cerrarModalTipo = () => {
  capaModal.hidden = true;
  document.body.classList.remove("bloqueo-scroll");
};

tarjetasModulo.forEach((tarjeta) => tarjeta.addEventListener("click", abrirModalTipo));

navModulos.forEach((item) => {
  item.addEventListener("mouseenter", () => actualizarPreview(item.dataset.modulo));
  item.addEventListener("focus", () => actualizarPreview(item.dataset.modulo));
});

botonesTipoArista.forEach((boton) => {
  boton.addEventListener("click", () => {
    const tipoSeleccionado = boton.dataset.tipo;
    window.location.href = `${destinoPendiente}?tipo=${tipoSeleccionado}`;
  });
});

btnCerrarModal.addEventListener("click", cerrarModalTipo);

capaModal.addEventListener("click", (evento) => {
  if (evento.target === capaModal) cerrarModalTipo();
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && !capaModal.hidden) cerrarModalTipo();
});
