# Rediseño completo de interfaz — Sistema de propiedades Kanagawa

Quiero rediseñar la interfaz completa de este sistema de administración de propiedades usando una identidad visual **Kanagawa**, conservando toda la estructura, funcionalidades, textos, rutas, componentes y lógica existentes.

El objetivo es cambiar únicamente la presentación visual y crear un sistema de diseño consistente para todas las pantallas.

---

## Instrucción inicial para el agente

Las imágenes adjuntas son los recursos visuales oficiales del diseño.

No las regeneres ni las reemplaces.

Copialas al proyecto, renombrarlas de forma semántica y registralas en un archivo central de assets.

---

# 1. Objetivo general

Transformar la interfaz actual en un sistema visual:

- japonés;
- nocturno;
- minimalista;
- cinematográfico;
- artesanal;
- elegante;
- melancólico;
- moderno;
- profesional;
- legible;
- no fluorescente.

La aplicación administra:

- propiedades;
- reservas;
- calendarios;
- clientes;
- ingresos;
- gastos;
- reparaciones;
- importación y exportación;
- disponibilidad por temporada.

No debe parecer una página temática o decorativa.

Debe seguir sintiéndose como un **software profesional de gestión**, donde la estética Kanagawa acompaña a la información sin dificultar su lectura.

---

# 2. Restricciones obligatorias

No modificar:

- lógica de negocio;
- endpoints;
- llamadas a API;
- estructura de datos;
- rutas existentes;
- permisos;
- formularios;
- validaciones;
- textos funcionales;
- acciones;
- comportamiento del calendario;
- tablas;
- filtros;
- componentes que ya funcionan.

No eliminar funcionalidades.

No reemplazar contenido real con imágenes.

No crear una maqueta estática.

No hardcodear datos que actualmente provienen del backend.

No introducir estilos cyberpunk, neón, glassmorphism excesivo ni colores eléctricos.

El rediseño debe aplicarse sobre el sistema real.

---

# 3. Temas requeridos

Implementar dos temas completos:

```ts
type AppTheme =
  | "kanagawa-dark"
  | "kanagawa-light";
```

Debe existir un selector de tema y la preferencia debe persistir.

Usar:

```ts
localStorage.setItem("app-theme", theme);
```

También respetar inicialmente:

```css
@media (prefers-color-scheme: dark)
```

---

# 4. Estilo Kanagawa Dark

## Sensación visual

El modo oscuro debe sentirse:

- nocturno;
- profundo;
- silencioso;
- sofisticado;
- cinematográfico;
- inspirado en grabados japoneses;
- con superficies azul-negro;
- con violetas apagados;
- con texto crema;
- con ilustraciones sutiles.

## Paleta base

```css
:root[data-theme="kanagawa-dark"] {
  /* Fondos */
  --background-deep: #030411;
  --background: #050717;
  --background-alt: #090b1b;

  /* Superficies */
  --surface: #0d0d1f;
  --surface-elevated: #111124;
  --surface-violet: #191727;
  --surface-hover: #202038;

  /* Bordes */
  --border-subtle: #2f2d45;
  --border: #393550;
  --border-strong: #4f4c6a;
  --divider: rgba(138, 123, 145, 0.28);

  /* Texto */
  --text-primary: #f0e6e0;
  --text-secondary: #c9b9bd;
  --text-muted: #8a7b91;
  --text-violet-soft: #a99ac4;

  /* Violeta principal */
  --primary: #574582;
  --primary-hover: #685496;
  --primary-active: #7865a5;
  --primary-soft: #957fb8;
  --primary-dark: #383058;

  /* Estados */
  --blue: #7e9cd8;
  --cyan: #7fb4ca;
  --green: #98bb6c;
  --green-strong: #4e913f;
  --red: #e46876;
  --red-strong: #d33e48;
  --yellow: #e6c384;
  --orange: #ffa066;
}
```

---

# 5. Estilo Kanagawa Light

## Sensación visual

El modo claro debe sentirse:

- como papel japonés envejecido;
- cálido;
- suave;
- artesanal;
- limpio;
- luminoso sin usar blanco puro;
- elegante y poco saturado.

## Paleta base

```css
:root[data-theme="kanagawa-light"] {
  /* Fondos */
  --background-deep: #ece4d6;
  --background: #f7f3ea;
  --background-alt: #f3eee3;

  /* Superficies */
  --surface: #fffaf1;
  --surface-elevated: #f9f4eb;
  --surface-violet: #f0e9f5;
  --surface-hover: #eee7dc;

  /* Bordes */
  --border-subtle: #e4dccf;
  --border: #d5ccbd;
  --border-strong: #b8a9c9;
  --divider: rgba(106, 91, 122, 0.18);

  /* Texto */
  --text-primary: #292637;
  --text-secondary: #4a4657;
  --text-muted: #80778d;
  --text-violet-soft: #75658e;

  /* Violeta principal */
  --primary: #8067a8;
  --primary-hover: #725a99;
  --primary-active: #654e89;
  --primary-soft: #a28bc0;
  --primary-dark: #4b3869;

  /* Estados */
  --blue: #5f7fbe;
  --cyan: #6094a6;
  --green: #789657;
  --green-strong: #537a42;
  --red: #d95462;
  --red-strong: #b9404d;
  --yellow: #c99747;
  --orange: #d98254;
}
```

No usar:

```css
background: #ffffff;
color: #000000;
```

---

# 6. Tipografía

Usar una combinación serif + sans serif.

## Fuente de títulos

Usar:

```css
font-family: "Cormorant Garamond", Georgia, serif;
```

Aplicarla en:

- títulos principales;
- títulos de secciones;
- nombres de meses;
- cifras destacadas;
- encabezados de paneles;
- resultados financieros destacados.

Pesos recomendados:

```css
font-weight: 600;
font-weight: 700;
```

## Fuente de interfaz

Usar:

```css
font-family: "Inter", "Manrope", sans-serif;
```

Aplicarla en:

- navegación;
- botones;
- formularios;
- filtros;
- tablas;
- etiquetas;
- mensajes;
- datos secundarios.

## Fuente monoespaciada

Usar opcionalmente:

```css
font-family: "JetBrains Mono", monospace;
```

Aplicarla en:

- fechas;
- períodos;
- identificadores;
- pequeñas cifras técnicas;
- importación y exportación;
- columnas de tablas financieras.

## Variables tipográficas

```css
--font-display: "Cormorant Garamond", Georgia, serif;
--font-ui: "Inter", "Manrope", sans-serif;
--font-mono: "JetBrains Mono", monospace;
```

No usar más de estas tres familias.

No aplicar serif a botones pequeños, inputs ni menús.

---

# 7. Recursos gráficos

Usar las imágenes Kanagawa proporcionadas como recursos reales del sistema.

No regenerarlas.

No añadir texto dentro de las imágenes.

Organizarlas en:

```text
public/
└── assets/
    └── kanagawa/
        ├── backgrounds/
        │   ├── dashboard-dark.png
        │   ├── dashboard-light.png
        │   ├── dashboard-dark-mobile.png
        │   └── dashboard-light-mobile.png
        │
        ├── cards/
        │   ├── pesos-blue.png
        │   ├── dolares-green.png
        │   ├── resultado-red.png
        │   ├── income-pines.png
        │   ├── expense-fuji.png
        │   └── property-landscape.png
        │
        └── decorative/
            ├── wave.png
            ├── fuji.png
            ├── red-sun.png
            ├── pines.png
            └── clouds.png
```

Crear un registro central:

```ts
export const kanagawaAssets = {
  background: {
    dark: "/assets/kanagawa/backgrounds/dashboard-dark.png",
    light: "/assets/kanagawa/backgrounds/dashboard-light.png",
    darkMobile:
      "/assets/kanagawa/backgrounds/dashboard-dark-mobile.png",
    lightMobile:
      "/assets/kanagawa/backgrounds/dashboard-light-mobile.png",
  },

  cards: {
    pesos: "/assets/kanagawa/cards/pesos-blue.png",
    dolares: "/assets/kanagawa/cards/dolares-green.png",
    resultado: "/assets/kanagawa/cards/resultado-red.png",
    incomePines: "/assets/kanagawa/cards/income-pines.png",
    expenseFuji: "/assets/kanagawa/cards/expense-fuji.png",
    propertyLandscape:
      "/assets/kanagawa/cards/property-landscape.png",
  },
} as const;
```

No repetir rutas manualmente en distintos componentes.

---

# 8. Fondo general del sistema

## Dark

El fondo oscuro debe combinar:

- azul negro profundo;
- violeta apagado;
- textura muy ligera;
- ola japonesa a la izquierda;
- monte Fuji o paisaje a la derecha;
- espacio central limpio.

```css
.app-shell[data-theme="kanagawa-dark"] {
  background:
    radial-gradient(
      circle at 70% 18%,
      rgba(87, 69, 130, 0.15),
      transparent 36%
    ),
    linear-gradient(
      145deg,
      #030411 0%,
      #050717 48%,
      #090b1b 100%
    );
}
```

## Light

El modo claro debe usar:

- papel crema;
- lavanda muy suave;
- ilustración desaturada;
- opacidad moderada;
- bastante espacio negativo.

```css
.app-shell[data-theme="kanagawa-light"] {
  background:
    radial-gradient(
      circle at 70% 16%,
      rgba(149, 127, 184, 0.07),
      transparent 38%
    ),
    linear-gradient(
      145deg,
      #f7f3ea 0%,
      #f3eee3 52%,
      #ece4d6 100%
    );
}
```

## Componente

```tsx
type KanagawaBackgroundProps = {
  theme: "dark" | "light";
};

export function KanagawaBackground({
  theme,
}: KanagawaBackgroundProps) {
  return (
    <picture aria-hidden="true">
      <source
        media="(max-width: 768px)"
        srcSet={
          theme === "dark"
            ? kanagawaAssets.background.darkMobile
            : kanagawaAssets.background.lightMobile
        }
      />

      <img
        src={
          theme === "dark"
            ? kanagawaAssets.background.dark
            : kanagawaAssets.background.light
        }
        alt=""
        draggable={false}
        className="kanagawa-background"
      />
    </picture>
  );
}
```

```css
.kanagawa-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  user-select: none;
}

[data-theme="kanagawa-dark"] .kanagawa-background {
  opacity: 0.34;
}

[data-theme="kanagawa-light"] .kanagawa-background {
  opacity: 0.46;
}
```

El contenido debe quedar en:

```css
.dashboard-content {
  position: relative;
  z-index: 1;
}
```

---

# 9. Sidebar

El sidebar debe mantener su estructura actual.

## Dark

```css
.sidebar {
  background:
    linear-gradient(
      180deg,
      rgba(17, 17, 36, 0.98),
      rgba(8, 9, 24, 0.98)
    );

  border-right: 1px solid var(--border-subtle);
}
```

## Light

```css
.sidebar {
  background:
    linear-gradient(
      180deg,
      rgba(255, 250, 241, 0.96),
      rgba(247, 243, 234, 0.98)
    );

  border-right: 1px solid var(--border-subtle);
}
```

## Navegación activa

```css
.sidebar-link-active {
  background:
    linear-gradient(
      90deg,
      rgba(87, 69, 130, 0.72),
      rgba(87, 69, 130, 0.32)
    );

  color: var(--text-primary);
  border: 1px solid rgba(149, 127, 184, 0.24);
}
```

En modo claro:

```css
[data-theme="kanagawa-light"] .sidebar-link-active {
  background: rgba(128, 103, 168, 0.13);
  color: var(--primary-dark);
}
```

No rediseñar la navegación de manera que cambien las rutas.

---

# 10. Header

Mantener:

- título de sección;
- subtítulo;
- buscador;
- notificaciones;
- botón “Nueva reserva”.

El header debe ser compacto y tener una separación clara respecto del contenido.

```css
.topbar {
  background: color-mix(
    in srgb,
    var(--surface) 88%,
    transparent
  );

  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(14px);
}
```

---

# 11. Sistema de tarjetas

Todas las tarjetas deben usar un componente base.

```tsx
type KanagawaCardProps = {
  children: React.ReactNode;
  tone?:
    | "default"
    | "blue"
    | "green"
    | "red"
    | "violet"
    | "gold";
  artwork?: string;
  className?: string;
};
```

## Tarjeta base

```css
.kanagawa-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;

  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--surface-elevated) 94%, transparent),
      color-mix(in srgb, var(--surface) 92%, transparent)
    );

  border: 1px solid var(--border);
  border-radius: 16px;

  box-shadow:
    0 18px 44px rgba(3, 4, 17, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.035);
}
```

En el modo claro la sombra debe ser suave:

```css
[data-theme="kanagawa-light"] .kanagawa-card {
  box-shadow:
    0 12px 30px rgba(77, 62, 90, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
}
```

---

# 12. Imágenes dentro de las tarjetas

Todas las imágenes son decorativas.

Usar:

```tsx
<img
  src={artwork}
  alt=""
  aria-hidden="true"
  draggable={false}
  className="card-artwork"
/>
```

```css
.card-artwork {
  position: absolute;
  right: -2%;
  bottom: -12%;
  z-index: 0;

  width: 52%;
  height: 112%;
  object-fit: contain;
  object-position: right bottom;

  opacity: 0.38;
  pointer-events: none;
  user-select: none;

  mask-image: linear-gradient(
    to right,
    transparent 0%,
    rgba(0, 0, 0, 0.2) 18%,
    black 48%,
    black 100%
  );
}
```

El contenido debe quedar por encima:

```css
.card-content {
  position: relative;
  z-index: 2;
}
```

---

# 13. Tarjetas de contabilidad

## Recaudado en pesos

Usar la ilustración azul:

```ts
artwork: kanagawaAssets.cards.pesos
```

Color semántico:

```css
--card-accent: #7e9cd8;
```

La imagen debe mostrar:

- agua;
- olas;
- montaña;
- azules apagados;
- degradado hacia transparente.

## Recaudado en dólares

Usar la ilustración verde:

```ts
artwork: kanagawaAssets.cards.dolares
```

Color semántico:

```css
--card-accent: #98bb6c;
```

La imagen puede incluir:

- pinos;
- montaña;
- ondas;
- verde salvia;
- niebla.

## Resultado del mes

Usar la imagen roja con Fuji y sol:

```ts
artwork: kanagawaAssets.cards.resultado
```

Color semántico:

```css
--card-accent: #e46876;
```

La imagen debe permanecer en el lado derecho.

El texto debe quedar perfectamente legible en el lado izquierdo.

El rojo debe ser coral oscuro, no rojo neón.

---

# 14. Dashboard de inicio

Mantener las tarjetas:

- ingresos del mes;
- ocupación;
- reservas activas;
- saldos por cobrar;
- disponibilidad de temporada;
- próximas reservas.

Aplicar colores semánticos:

```text
Ingresos: verde salvia
Ocupación: violeta suave
Reservas activas: azul apagado
Saldos por cobrar: amarillo dorado o coral
```

La sección “Disponibilidad de temporada” puede incorporar una ilustración de paisaje japonés en el extremo derecho, con opacidad baja.

No colocar imágenes detrás de los números de los meses.

---

# 15. Calendario

El calendario debe ser oscuro y sobrio en dark mode.

Cada celda:

```css
.calendar-day {
  background: color-mix(
    in srgb,
    var(--surface-elevated) 90%,
    transparent
  );

  border: 1px solid var(--border-subtle);
  border-radius: 12px;
}
```

Día seleccionado:

```css
.calendar-day-selected {
  border-color: var(--primary-soft);

  background:
    linear-gradient(
      145deg,
      rgba(87, 69, 130, 0.38),
      rgba(25, 23, 39, 0.72)
    );

  box-shadow:
    0 0 0 1px rgba(149, 127, 184, 0.22),
    0 8px 24px rgba(3, 4, 17, 0.2);
}
```

Las reservas deben usar colores apagados por categoría o propiedad.

No llenar el calendario de imágenes.

La ornamentación debe quedar alrededor o debajo del panel, nunca dentro de cada día.

---

# 16. Propiedades

Cada tarjeta de propiedad debe incluir:

- imagen real de la propiedad cuando exista;
- imagen Kanagawa como fallback;
- nombre;
- ubicación;
- huéspedes;
- dormitorios;
- baños;
- precio;
- ocupación;
- estado;
- acciones.

Fallback:

```ts
kanagawaAssets.cards.propertyLandscape
```

Las tarjetas deben conservar una relación visual consistente.

```css
.property-card-image {
  aspect-ratio: 16 / 7;
  object-fit: cover;
}
```

Estado disponible:

```css
.status-available {
  color: #537a42;
  background: rgba(152, 187, 108, 0.16);
  border: 1px solid rgba(152, 187, 108, 0.28);
}
```

Estado ocupado:

```css
.status-occupied {
  color: #b9404d;
  background: rgba(228, 104, 118, 0.14);
  border: 1px solid rgba(228, 104, 118, 0.28);
}
```

---

# 17. Gastos y reparaciones

Usar:

- coral para gastos;
- dorado para mantenimiento;
- verde para resultados positivos;
- azul para servicios;
- violeta para categorías generales.

El estado vacío puede contener una ilustración japonesa con:

- luna o sol apagado;
- árbol;
- pequeña montaña;
- niebla;
- baja opacidad.

No usar ilustraciones brillantes.

---

# 18. Importar y exportar

El área de carga debe conservar su funcionalidad.

```css
.upload-zone {
  border: 1px dashed var(--border-strong);
  background:
    color-mix(
      in srgb,
      var(--surface) 84%,
      transparent
    );

  border-radius: 18px;
}
```

Hover:

```css
.upload-zone:hover {
  border-color: var(--primary-soft);
  background:
    color-mix(
      in srgb,
      var(--primary) 8%,
      var(--surface)
    );
}
```

Puede incorporar una montaña o una ola muy tenue en el borde inferior.

---

# 19. Tablas

Las tablas deben sentirse livianas.

```css
.table-row {
  border-bottom: 1px solid var(--divider);
}

.table-row:hover {
  background:
    color-mix(
      in srgb,
      var(--primary) 6%,
      transparent
    );
}
```

Los encabezados deben usar:

```css
font-size: 0.75rem;
font-weight: 600;
letter-spacing: 0.08em;
text-transform: uppercase;
color: var(--text-muted);
```

No añadir bordes verticales innecesarios.

---

# 20. Botones

## Principal

```css
.button-primary {
  color: #f0e6e0;

  background:
    linear-gradient(
      145deg,
      var(--primary-hover),
      var(--primary)
    );

  border: 1px solid var(--primary-active);
  border-radius: 12px;

  box-shadow:
    0 8px 22px rgba(44, 31, 69, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
}
```

## Secundario

```css
.button-secondary {
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
}
```

## Destructivo

```css
.button-danger {
  color: var(--red);
  background: rgba(228, 104, 118, 0.1);
  border: 1px solid rgba(228, 104, 118, 0.22);
}
```

No usar degradados fuertes.

---

# 21. Formularios

Inputs:

```css
.form-control {
  color: var(--text-primary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.form-control:focus {
  border-color: var(--primary-soft);
  box-shadow:
    0 0 0 3px rgba(149, 127, 184, 0.12);
}
```

Placeholder:

```css
color: var(--text-muted);
```

No cambiar los nombres ni la lógica de los campos.

---

# 22. Iconos

Mantener una sola librería de iconos.

Usar preferentemente:

- Lucide React;
- Heroicons;
- la librería que ya tenga instalada el proyecto.

No mezclar varias bibliotecas.

Los iconos deben usar:

```css
stroke-width: 1.7;
```

Evitar iconos rellenos excesivamente pesados.

---

# 23. Espaciado

Usar una escala consistente:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

Radios:

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
```

No redondear todos los elementos de manera exagerada.

---

# 24. Animaciones

Las animaciones deben ser discretas.

Duración:

```css
--duration-fast: 140ms;
--duration-normal: 180ms;
--duration-slow: 260ms;
```

Curva:

```css
--ease-kanagawa: cubic-bezier(0.22, 1, 0.36, 1);
```

Aplicar en:

- hover de tarjetas;
- botones;
- tabs;
- cambio de tema;
- apertura de modales;
- navegación lateral.

No usar rebotes ni animaciones llamativas.

---

# 25. Responsive

## Desktop

- Sidebar fija.
- Cuadrícula completa.
- Fondos panorámicos.
- Tarjetas horizontales.

## Tablet

- Sidebar reducible.
- Tarjetas en dos columnas.
- Calendario desplazable si fuera necesario.

## Mobile

- Sidebar en drawer.
- Header compacto.
- Tarjetas en una columna.
- Tablas con scroll horizontal.
- Usar fondos verticales específicos.
- Ocultar imágenes decorativas cuando afecten la legibilidad.

```css
@media (max-width: 768px) {
  .card-artwork {
    width: 64%;
    opacity: 0.22;
  }
}
```

---

# 26. Accesibilidad

Cumplir:

- navegación por teclado;
- foco visible;
- contraste suficiente;
- etiquetas de formularios;
- estados no comunicados únicamente mediante color;
- `aria-hidden="true"` para ilustraciones decorativas;
- `alt=""` para imágenes ornamentales;
- respeto por `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# 27. Arquitectura recomendada

```text
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── KanagawaBackground.tsx
│   │
│   ├── ui/
│   │   ├── KanagawaCard.tsx
│   │   ├── DecorativeCardImage.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── EmptyState.tsx
│   │
│   └── finance/
│       ├── CurrencyCard.tsx
│       ├── MonthlyResultCard.tsx
│       └── SeasonComparison.tsx
│
├── theme/
│   ├── kanagawa-assets.ts
│   ├── kanagawa-tokens.ts
│   ├── ThemeProvider.tsx
│   └── theme.css
│
└── pages/
    ├── Dashboard.tsx
    ├── Calendar.tsx
    ├── Properties.tsx
    ├── Finance.tsx
    ├── Expenses.tsx
    └── ImportExport.tsx
```

Adaptar esta estructura al framework actual.

No reorganizar todo el proyecto sin necesidad.

---

# 28. Proceso de implementación

Realizar el trabajo en este orden:

1. Analizar la estructura actual.
2. Detectar componentes compartidos.
3. Crear los tokens de dark y light.
4. Crear el proveedor de tema.
5. Registrar todos los assets.
6. Aplicar el nuevo layout base.
7. Rediseñar sidebar y header.
8. Crear el componente de tarjeta reutilizable.
9. Adaptar el dashboard.
10. Adaptar calendario.
11. Adaptar propiedades.
12. Adaptar contabilidad.
13. Adaptar gastos.
14. Adaptar importación y exportación.
15. Verificar responsive.
16. Verificar accesibilidad.
17. Ejecutar TypeScript, lint, tests y build.
18. Corregir errores antes de terminar.

---

# 29. Validación visual

Comprobar:

- que los textos sean legibles;
- que las imágenes no tapen datos;
- que la ola y la montaña no compitan con las tarjetas;
- que el rojo y el verde sean semánticos;
- que el violeta siga siendo el color principal;
- que el modo claro no use blanco puro;
- que el modo oscuro no use negro puro;
- que las tarjetas mantengan alturas consistentes;
- que no exista scroll horizontal accidental;
- que los layouts coincidan entre dark y light;
- que las imágenes móviles se carguen correctamente.

---

# 30. Resultado esperado

El sistema final debe sentirse como una plataforma profesional de administración de propiedades con una identidad visual propia:

> Kanagawa nocturno en dark mode y papel japonés envejecido en light mode, con ilustraciones discretas, tipografía editorial, datos claros y colores semánticos elegantes.

No debe parecer:

- una landing page;
- un videojuego;
- una interfaz cyberpunk;
- una plantilla genérica;
- un collage de imágenes japonesas.

Debe parecer un producto SaaS cuidado, moderno y coherente.

---

# 31. Entrega final

Al finalizar:

1. Mostrar los archivos creados y modificados.
2. Explicar dónde se encuentran los tokens.
3. Explicar dónde se registran las imágenes.
4. Indicar cómo cambiar entre light y dark.
5. Mostrar qué componentes fueron reutilizados.
6. Confirmar que no se modificó la lógica de negocio.
7. Ejecutar y mostrar el resultado de:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Usar los comandos equivalentes si el proyecto tiene otros scripts.

No finalizar mientras existan errores de TypeScript, build o lint relacionados con los cambios.
