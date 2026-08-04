# Handoff: Rediseño panel de administración — Apartamentos Valeria

## Overview
Rediseño completo de la interfaz de administración del sistema de alquiler temporal
**Apartamentos Valeria** (repo `fer336/00-Apartamentos_valeria`). Reemplaza el diseño
actual (gradientes teal/azul/ámbar, muchos emojis, blobs de fondo) por un sistema de
diseño coherente basado en el **OctopusTrack Design System** (lila/púrpura), con un
**sidebar púrpura oscuro fijo + paneles claros** al estilo ERP. El objetivo del rediseño
es que **cada función se entienda de un vistazo**: navegación siempre visible, jerarquía
tipográfica clara, tarjetas y tablas legibles, y color usado con intención (no decorativo).

Cubre las secciones: **Inicio** (2 vistas: general y operativa), **Calendario**,
**Propiedades**, **Clientes**, **Contabilidad**, **Gastos y reparaciones** e **Inventario**.

## About the Design Files
El archivo `Apartamentos Valeria.dc.html` de este bundle es una **referencia de diseño
hecha en HTML** — un prototipo que muestra el look y el comportamiento buscados, **no
código para copiar directamente**. Está escrito como un "Design Component" (plantilla +
clase de lógica) sólo para poder previsualizarse; **no** refleja la arquitectura destino.

La tarea es **recrear este diseño en el codebase existente**:
`frontend/` → **React 18 + Vite + TypeScript + Tailwind CSS + react-router-dom + lucide-react**.
Reutilizá los componentes, rutas y patrones ya presentes (ver `frontend/src/pages/*`,
`frontend/src/components/Layout.tsx`). No introduzcas HTML plano ni estilos inline en
producción: llevá los valores de este documento a clases de Tailwind y/o tokens en
`tailwind.config.js`.

`reference_tokens.css` contiene todas las variables de color y tipografía del design system,
como fuente de verdad para mapearlas a Tailwind.

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografías, espaciados, radios y estados son
definitivos. Recreá la UI de forma pixel-cercana usando las librerías del codebase
(Tailwind + lucide-react). Los **datos son de ejemplo**: reemplazalos por los reales de
la API (`frontend/src/services/api.ts`). Mantené la estructura visual y de interacción.

---

## Design Tokens

Mapear a `frontend/tailwind.config.js` (extender `theme.colors` y `fontFamily`). Fuente
completa en `reference_tokens.css`.

### Fuentes (Google Fonts)
- **Display / títulos y números:** `Bricolage Grotesque`, pesos 800–900. Usar en H1/H2/H3,
  cifras grandes de KPI, montos. `font-family: 'Bricolage Grotesque', system-ui, sans-serif`.
- **Cuerpo / UI:** `Figtree`, pesos 400–700. Todo lo demás.
- Import: `@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap');`

### Colores — acento lila/púrpura (primary)
| Token | Hex | Uso |
|---|---|---|
| primary-50 | `#f5f2fa` | fondos suaves, hover de filas |
| primary-100 | `#ece6f6` | chips/avatares lila, badges |
| primary-200 | `#d9caeb` | bordes acento |
| primary-300 | `#c3abdf` | gradientes, texto sobre púrpura |
| primary-500 | `#9d84bf` | barras, acentos |
| primary-600 | `#7c5ca8` | **fill de botón primario**, nav activo, links |
| primary-700 | `#5c3a8c` | texto secundario fuerte, hover botón |
| primary-900 | `#3a2459` | **top del sidebar** (gradiente) |
| primary-950 | `#25163a` | **base del sidebar** (gradiente) |

### Colores — superficie (light, la app)
| Rol | Hex |
|---|---|
| Fondo de página | `#eeebf4` |
| Superficie / tarjeta | `#ffffff` |
| Borde tarjeta (hairline) | `#e7dff3` |
| Borde input | `#e0d7ef` |
| Divisor de fila en tabla | `#f3eefa` |
| Fondo de header de tabla / celda suave | `#faf8fd` |
| Texto primario (ink) | `#121325` |
| Texto secundario | `#5c3a8c` |
| Texto muted | `#7b6b95` / labels `#9583b3` |

### Colores — estado / semántica
| Rol | Texto | Fondo (chip) |
|---|---|---|
| Éxito / disponible / confirmada | `#2f8f4e` | `#e4f3ea` |
| Info / ocupada / pesos (ARS) | `#2563eb` | `#e6eefc` |
| Advertencia / seña / mantenimiento | `#c2410c` (icono `#f97316`) | `#fdf0e2` |
| Peligro / vencido / gastos | `#dc2626` | `#fdecec` / `#fdeaea` |
| Neutro / pendiente | `#5c3a8c` | `#f0ebf8` |

### Radios
- Inputs / chips pequeños: `8px`
- Botones / nav items / chips: `10–12px`
- Tarjetas y tablas: `16px`
- Avatares: `10–11px` (no círculo; cuadrado redondeado)

### Sombras (tintadas a púrpura, no gris)
- Tarjeta base: `0 1px 2px rgba(18,19,37,.04)`
- Hover tarjeta (lift): `translateY(-3px)` + `0 16px 36px rgba(92,58,140,.14)`
- Botón primario: `0 8px 22px rgba(92,58,140,.32)`

### Espaciado
- Padding de contenido: `26px 30px`
- Gap entre tarjetas/grids: `16–18px`
- Padding interno tarjeta: `18–22px`
- Ancho máx. de contenido: `1220px`, centrado.

### Iconografía
**lucide-react** (ya es dependencia). Stroke ~1.9px, 24px grid. Íconos usados:
`Home, Calendar, Building2, Users, Wallet/CreditCard, Wrench, Package, Search, Bell,
Plus, ArrowRight, LogOut, ChevronLeft, ChevronRight, ChevronDown, MapPin, Tv, TrendingUp,
DollarSign, Download`. **No usar emojis como íconos.** Única excepción admitida (pedido
del cliente): banderas de moneda 🇦🇷 y 💵 en Contabilidad y en los KPIs de ingresos.

---

## Layout global (shell)

Reemplaza `frontend/src/components/Layout.tsx`. Estructura: `flex` a pantalla completa
(`height:100vh`), sidebar fijo a la izquierda + columna principal con topbar + área
scrolleable.

### Sidebar (izquierda, fijo)
- Ancho `250px`, no colapsable. Fondo: `linear-gradient(185deg,#3a2459,#2a1a45 55%,#22133a)`.
  Glow radial lila decorativo arriba a la derecha (blur), sin interacción.
- **Logo:** cuadrado `40px` radio `12px` con gradiente `#ad8ed2→#7c5ca8` e ícono `Building2`
  blanco; al lado wordmark "Valeria" (Bricolage 800, blanco) + "Administración" (10px, `#b9a9d6`).
- **Grupos de nav** con label de sección (10px, 700, tracking `.16em`, `#8f7db0`):
  - `PRINCIPAL`: Inicio, Calendario, Propiedades, Clientes
  - `GESTIÓN`: Contabilidad, Gastos, Inventario
- **Item de nav:** flex, gap 12, padding `10px 12px`, radio `11px`, texto 14/600.
  - Inactivo: fondo transparente, texto e ícono `#c9bce0`.
  - Activo: fondo `rgba(255,255,255,.13)`, texto e ícono `#ffffff`.
  - Ícono hereda `currentColor`.
- **Footer del sidebar:** tarjeta de usuario (avatar cuadrado gradiente lila con inicial "V",
  nombre "Valeria M." blanco 700, rol "Propietaria" `#b9a9d6`, ícono `LogOut` a la derecha),
  fondo `rgba(255,255,255,.05)`, borde `rgba(255,255,255,.1)`, radio 12. `margin-top:auto`.

### Topbar (arriba de la columna principal)
- Alto `72px`, fondo `rgba(255,255,255,.75)` + `backdrop-filter: blur(12px)`, borde inferior `#e0d7ef`.
- Izquierda: **título de página dinámico** (Bricolage 800, 22px, `#121325`) + **subtítulo**
  (12px, `#7b6b95`). Cambian según la ruta activa:
  - Inicio → "Resumen general de tu operación"
  - Calendario → "Reservas y disponibilidad"
  - Propiedades → "Tus unidades en alquiler"
  - Clientes → "Inquilinos y contactos"
  - Contabilidad → "Ingresos en pesos y dólares"
  - Gastos y reparaciones → "Egresos operativos por propiedad"
  - Inventario → "Items por propiedad"
- Derecha: **buscador** (input con ícono `Search`, ancho 240, borde `#e0d7ef`, radio 11,
  placeholder "Buscar reserva, cliente…"), **botón campana** (42×42, borde `#e0d7ef`, radio 11,
  con punto naranja `#f97316` de notificación), **botón primario "Nueva reserva"** (fill
  `#7c5ca8`, texto blanco, ícono `Plus`, radio 11, sombra púrpura; hover `#6b4d95` +
  `translateY(-1px)`).

### Área de contenido
- `flex:1; overflow-y:auto; padding:26px 30px 40px`. Cada pantalla envuelta en un contenedor
  `max-width:1220px; margin:0 auto` con animación de entrada `fadeUp .4s cubic-bezier(.22,1,.36,1)`.

---

## Screens / Views

### 1. Inicio (`/`)
Tiene un **switcher segmentado** arriba (fondo `#e2daf0`, radio 12, padding 4): dos botones
"Vista general" / "Vista operativa". El activo es blanco con texto `#5c3a8c` y sombra sutil;
el inactivo transparente con texto `#8b7aab`.

**Vista general:**
1. **Fila de 4 KPI cards** (`grid-cols-4`, gap 16). Cada card: blanco, borde `#e7dff3`, radio 16,
   padding 18. Label superior (11px/700/uppercase/`#8b7aab`) + medallón de ícono 32px (fondo y
   color según KPI) a la derecha; cifra grande (Bricolage 800, 27px, `#121325`); subtexto
   (12px/600) coloreado.
   - "Ingresos del mes" — `$4.820.500` — "▲ 12% vs. mes anterior" (verde) — ícono TrendingUp, `#e4f3ea/#2f8f4e`
   - "Ocupación" — `78%` — "24 de 31 noches" — ícono Calendar, `#ece6f6/#7c5ca8`
   - "Reservas activas" — `9` — "3 llegan esta semana" — ícono Building2, `#e6eefc/#2563eb`
   - "Saldos por cobrar" — `U$D 3.150` — "en 4 reservas" (naranja) — ícono DollarSign, `#fdecdd/#f97316`
2. **Grid 2fr/1fr:** izquierda tarjeta "Disponibilidad de temporada" (subtítulo "Noches libres
   por mes · todas las propiedades", badge "2025"): 6 mini-cards de mes (Ene–Jun), cada uno con
   nombre, punto de estado, nº de noches libres (Bricolage 800, 22px), label "noches libres" y
   una barra de progreso (fondo `#eae1f5`, relleno lila; roja si no hay disponibilidad).
   Derecha: tarjeta **DirecTV** con fondo púrpura oscuro (gradiente `#3a2459→#26173e`), ícono Tv,
   lista de equipos con ubicación, nº de tarjeta y chip de "días restantes" (verde `#7ecf86` si
   OK, rojo `#fca5a5` si ≤3 días).
3. **Tabla "Próximas reservas"** (full width): header con link "Ver calendario →". Columnas:
   Cliente (avatar cuadrado con iniciales + nombre + código `BK-2025-0xx` en mono), Propiedad,
   Estadía (rango de fechas), Estado (chip: Confirmada/Seña/Pendiente), Saldo (Bricolage 700;
   gris si "Pagado", ink si adeuda).

**Vista operativa:**
1. **Grid 1fr/1fr:** tarjeta "Check-in de hoy" (medallón verde, subtítulo "2 llegadas · a partir
   de 14:00") y "Check-out de hoy" (medallón rojo, "1 salida · antes de 11:00"). Cada una lista
   items con avatar, cliente, propiedad/huéspedes, hora (Bricolage 800) y un chip de acción
   ("Seña paga", "Cobrar saldo", "Revisar depósito").
2. **Tarjeta "Pendientes que requieren atención"**: filas de alerta con fondo/borde según
   severidad (naranja/rojo/lila), medallón de ícono, título + descripción, y botón de acción a la
   derecha ("Recargar", "Ver reserva", "Inspeccionar").

### 2. Calendario (`/calendar`)
- Header: navegador de mes (dos flechas Chevron en un grupo con borde) + "Julio 2025" (Bricolage
  800, 22px); a la derecha leyenda de reservas (punto de color + apellido) + botón "Nueva reserva".
- **Grilla mensual** dentro de una tarjeta: fila de días de semana (Lun…Dom, 11px/700/uppercase/
  `#9583b3`), luego grid `repeat(7,1fr)` gap 8. Cada celda: `min-height:96px`, radio 11, fondo
  `#faf8fd` (o `#f5f2fa` + borde lila `#c3abdf` si es hoy). Nº de día arriba a la derecha (el día
  de hoy va en badge `#7c5ca8` con texto blanco). Dentro, **chips de reserva** apilados: barra de
  color de la reserva con el apellido en el día de inicio y barra atenuada (opacity .55) en los
  días de continuación. Semana empieza en **lunes**.
- Reservas de ejemplo: Gómez (lila, 12–18), Medina (verde, 14–21), Ávila (azul, 19–25), Sosa
  (naranja, 20–27).

### 3. Propiedades (`/properties`)
- Header: fila de **chips-filtro** ("Todas · 6" activo púrpura, "Disponibles · 3", "Ocupadas · 2")
  + botón "Agregar propiedad".
- **Grid `repeat(3,1fr)`** de tarjetas. Cada tarjeta (radio 16, hover lift): banda superior de
  96px con gradiente lila `#c3abdf→#7c5ca8`, chip de estado arriba a la derecha
  (Disponible/Ocupada/Mantenimiento) e ícono Building2 translúcido. Cuerpo: nombre (Bricolage 800,
  16px), zona + tipo con ícono MapPin (12.5px, muted); fila de stats con divisores
  (huéspedes / ambientes / baños, cifras Bricolage 800 + labels 10px); pie: precio/noche
  (Bricolage 800, `#5c3a8c`) y % de ocupación (verde).

### 4. Clientes (`/clients`)
- Header: buscador ancho (320) "Buscar por nombre, DNI o teléfono…" + botón "Nuevo cliente".
- **Tabla** en tarjeta. Header con fondo `#faf8fd`. Columnas: Cliente (avatar cuadrado con
  iniciales + nombre), Documento (mono, `#5c3a8c`), Contacto (teléfono + email en dos líneas),
  Estadías (Bricolage 800), Rating (`5 ★` en `#f59e0b`), Última (fecha, alineada derecha).
  Filas con hover `#faf8fd`.

### 5. Contabilidad (`/finance`)
- **Grid de 3 tarjetas resumen:**
  - "Recaudado en Pesos" — fondo azul suave (`#eaf1fd→#f4f8ff`, borde `#d6e4fb`) — `$8.640.500`
    (Bricolage 800, `#1d4ed8`) — 🇦🇷 — desglose "Anticipos … · Saldos …".
  - "Recaudado en Dólares" — fondo verde suave (`#e7f5ec→#f3fbf5`) — `U$D 12.870` (`#1d7a3e`) — 💵.
  - "Resultado del mes" — fondo púrpura oscuro (gradiente + glow) — `$4.820.500` blanco — con
    ícono TrendingUp y desglose "Ingresos − Gastos".
- **Tabla "Movimientos recientes"**: header con botón "Exportar" (ícono Download). Columnas:
  Fecha, Cliente, Concepto (`#5c3a8c`), Método, Monto (Bricolage 700, con bandera de moneda
  antepuesta según ARS/USD).

### 6. Gastos y reparaciones (`/expenses`)
- **Grid 1fr/320px:**
  - Izquierda: tarjeta con tabla "Egresos del mes" (botón "Registrar gasto"). Columnas: Fecha,
    Categoría (chip de color por categoría), Descripción, Propiedad, Monto (Bricolage 700, `#dc2626`).
  - Derecha: tarjeta "Por categoría" con total (`$407.700`, Bricolage 800, rojo) y lista de
    categorías, cada una con cuadradito de color, label, monto y barra de progreso proporcional
    (Mantenimiento 42%, Insumos 22%, Impuestos 13%, Limpieza 11%, Servicios 8%).

### 7. Inventario (`/inventory`)
- Header: selector de propiedad ("Depto Costanera 1A" + Chevron) + botón "Agregar item".
- **Tabla** en tarjeta. Columnas: Item (700), Categoría, Cantidad (Bricolage 800), Estado (chip:
  Nuevo/Bueno/Regular/A revisar, color según condición).

---

---

## Modales / Ventanas

Sistema de modal compartido: **scrim** `position:fixed; inset:0; z-index:100;
background:rgba(18,19,37,.45); backdrop-filter:blur(4px)`, centra el diálogo arriba
(`align-items:flex-start; padding:44px 20px; overflow-y:auto`). Click en el scrim cierra;
click dentro del diálogo hace `stopPropagation`. Entrada `fadeUp .22s cubic-bezier(.22,1,.36,1)`.

**Diálogo (estructura común):** blanco, radio 20, `box-shadow:0 30px 80px rgba(18,19,37,.4)`,
`overflow:hidden`, ancho máx. según modal.
- **Header:** eyebrow (11px/700/uppercase/tracking .14em/`#9583b3`) + título (Bricolage 800, 20px,
  `#121325`) a la izquierda; botón cerrar (X, 34×34, borde `#e7dff3`, fondo `#faf8fd`, ícono `X`
  lucide `#5c3a8c`) a la derecha. Borde inferior `#eee5f6`.
- **Body:** grid de campos, `padding:22px 24px; gap:16px`.
- **Footer:** derecha, `padding:16px 24px`, fondo `#faf8fd`, borde superior `#eee5f6`. Botón
  **Cancelar** (borde `#e0d7ef`, fondo blanco, texto `#5c3a8c`; hover `#f0ebf8`) + botón **primario**
  (fill `#7c5ca8`, texto blanco, sombra púrpura; hover `#6b4d95`).

**Campo de formulario (estilo común):**
- Label: `12.5px/600`, color `#5c3a8c`, `margin-bottom:7px`.
- input/select/textarea: `width:100%`, borde `#e0d7ef`, radio 10, `padding:11px 13px`, `font-size:14px`,
  color `#121325`, fondo blanco.
- **Foco:** `border-color:#ad8ed2; box-shadow:0 0 0 3px rgba(124,92,168,.15); outline:none`.

### Disparadores
- **Nueva reserva** → botón primario del topbar y botón del Calendario. También al hacer click en
  una fila de "Próximas reservas" se abre el **Detalle de reserva**.
- **Nueva propiedad** → botón "Agregar propiedad" (pantalla Propiedades).
- **Nuevo cliente** → botón "Nuevo cliente" (pantalla Clientes).
- **Registrar gasto** → botón "Registrar gasto" (pantalla Gastos).
- **Agregar item** → botón "Agregar item" (pantalla Inventario).

### 1. Nueva reserva (máx. 580px)
Grid 2 columnas. Campos: **Propiedad** (select), **Cliente** (select con "Buscar o crear cliente…"),
**Check-in** y **Check-out** (date), **Huéspedes** (number), **Precio total USD** (text). Bloque
resumen destacado (fondo `#f5f2fa`, borde `#e7dff3`, radio 12): **Anticipo (30%)** `U$D 420` y
**Saldo (70%)** `U$D 980` calculados (Bricolage 800), + input **Depósito (ARS)**. Footer:
Cancelar / "Crear reserva →". *En el codebase, reutilizar el `BookingModal` existente y aplicar
este estilo; el anticipo/saldo se calcula desde el precio total y `advance_payment_percentage`.*

### 2. Nueva propiedad (máx. 600px)
Grid 3 columnas. Campos: **Nombre** (full-width), **Tipo** (select: Departamento/Casa/Monoambiente/
Cabaña), **Zona** (span 2), **Huéspedes**, **Ambientes**, **Baños** (number), **Precio/noche USD**,
**Estado** (span 2: Disponible/Ocupada/Mantenimiento), y **Comodidades**: chips toggleables — activos
en `#ece6f6`/`#5c3a8c`, inactivos con borde punteado `#d9caeb` y prefijo "+". Footer: Cancelar /
"Crear propiedad →".

### 3. Nuevo cliente (máx. 540px)
Grid 2 columnas. Campos: **Nombre completo** (full-width), **Tipo doc.** (select DNI/Pasaporte/Otro) +
**Número**, **Email**, **Teléfono**, **WhatsApp**, **Nacionalidad** (default "Argentina"), **Notas
internas** (textarea, full-width). Footer: Cancelar / "Guardar cliente".

### 4. Registrar gasto (máx. 540px)
Grid 2 columnas. Campos: **Categoría** (select: Mantenimiento/Limpieza/Servicios/Insumos/Impuestos/
Otro) + **Fecha** (date), **Descripción** (full-width), **Propiedad** (select, full-width), **Monto** +
**Método de pago** (select: Efectivo/Transferencia/Mercado Pago/Tarjeta), y **Comprobante**: dropzone
punteada (borde `#d9caeb`, fondo `#faf8fd`, ícono Upload, texto "Arrastrá una foto… o buscá un
archivo"). Footer: Cancelar / "Registrar gasto". *Sube a MinIO/S3 como el resto de comprobantes.*

### 5. Agregar item (máx. 480px)
Grid 2 columnas. Campos: **Item** (full-width), **Categoría** (select, full-width: Ropa blanca/Cocina/
Electrónica/Electrodomésticos/Mobiliario), **Cantidad** (number), **Estado** (select: Nuevo/Bueno/
Regular/A revisar). Footer: Cancelar / "Agregar item".

### 6. Detalle de reserva + check-in/out (máx. 500px)
Header **oscuro** (gradiente púrpura `#3a2459→#26173e` + glow): código `BK-2025-018` (mono, `#c3abdf`),
nombre del cliente (Bricolage 800, 22px, blanco), propiedad + huéspedes, y chip de estado
("Confirmada · Seña paga", verde `#7ecf86` sobre `rgba(126,207,134,.2)`). Body: 2 tarjetas
Check-in / Check-out (fecha + hora), tabla de pagos (Precio total / Anticipo pagado en verde /
Saldo pendiente en naranja), y **acciones**: botón primario "Registrar check-in" (ícono Check) +
botón outline "Cobrar saldo". *Enlaza a los flujos de check-in/checkout y pagos del backend.*

## Interactions & Behavior
- **Navegación:** click en item de sidebar → cambia de sección (en el codebase, `react-router`
  `<Link>`/`navigate`). El item activo se resalta según la ruta (`useLocation`). Título/subtítulo
  del topbar derivan de la ruta.
- **Switcher de Inicio:** estado local (general | operativa); cambia el bloque renderizado.
  Transición de entrada `fadeUp` al montar cada vista.
- **Hover:** tarjetas de propiedad hacen lift (`translateY(-3px)` + sombra púrpura .2s); filas de
  tabla cambian fondo a `#faf8fd`; botón primario oscurece a `#6b4d95` y sube 1px; botones ghost
  del calendario pintan fondo `#f0ebf8`.
- **"Nueva reserva"** (topbar y calendario): abre el modal de reserva ya existente
  (`BookingModal`) — reutilizar el del codebase.
- **Responsive:** el diseño es desktop-first a `1220px`. Para mobile, el sidebar debe colapsar a
  un drawer (patrón hamburguesa ya existente en `Layout.tsx`) y los grids de 3–4 columnas pasar a
  1–2. Respetá `prefers-reduced-motion` desactivando las animaciones de entrada/hover.
- **Accesibilidad:** contraste AA; targets táctiles ≥44px en mobile; foco visible con ring lila
  (`box-shadow: 0 0 0 2px rgba(124,92,168,.4)`).

## State Management
Recrear con los hooks/estado del codebase (hoy usa `useState` + `services/api.ts`):
- `activeSection` / ruta activa (via react-router).
- `dashboardView`: `'general' | 'operativa'` (estado local de la página Inicio).
- `activeModal`: `null | 'reserva' | 'propiedad' | 'cliente' | 'gasto' | 'item' | 'detalle'`
  (o el patrón de modales que ya use el codebase). Abrir/cerrar desde los disparadores; cerrar con
  click en scrim, botón X o Cancelar.
- Datos por sección desde la API: `getDashboardStats`, `getProperties`, clientes, pagos, gastos,
  inventario, reservas del calendario. Los datos de ejemplo del prototipo deben reemplazarse por
  estos endpoints.

## Assets
- Sin imágenes propias: el logo es un cuadrado con gradiente lila + ícono `Building2` de lucide.
  Las bandas de las tarjetas de propiedad son gradientes CSS (placeholder para foto real —
  idealmente reemplazar por foto de la propiedad cuando exista `photos` en el modelo).
- Íconos: **lucide-react** (dependencia existente).
- Fuentes: Google Fonts (Figtree + Bricolage Grotesque).
- Banderas de moneda: emojis Unicode 🇦🇷 💵 (única excepción de emoji, por pedido del cliente).

## Files
- `Apartamentos Valeria.dc.html` — prototipo de referencia (todas las pantallas navegables).
  Abrir en navegador para ver el diseño en vivo e inspeccionar valores exactos.
- `reference_tokens.css` — variables de color y tipografía del OctopusTrack Design System.

### Archivos del codebase a tocar
- `frontend/src/components/Layout.tsx` — shell (sidebar + topbar).
- `frontend/src/pages/Dashboard.tsx` — Inicio (2 vistas).
- `frontend/src/pages/Calendar.tsx` — Calendario.
- `frontend/src/pages/Properties.tsx` — Propiedades.
- `frontend/src/pages/Clients.tsx` — Clientes.
- `frontend/src/pages/Finance.tsx` — Contabilidad.
- `frontend/src/pages/Expenses.tsx` — Gastos.
- `frontend/tailwind.config.js` — agregar los tokens de color y las font families.
