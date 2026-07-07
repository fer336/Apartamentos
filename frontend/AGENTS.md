# ⚛️ Frontend Agent - AGENTS.md

Dominio encargado de la Interfaz de Usuario (UI) y Experiencia de Usuario (UX).

## 📋 Directrices de Frontend

1.  **Component Driven**: UI modular usando componentes funcionales de React.
2.  **Hooks Pattern**: Lógica de estado y efectos encapsulada en Hooks personalizados o directos.
3.  **Tailwind Utility**: Estilizado inline con Tailwind CSS. Evitar CSS puro salvo excepciones.
4.  **Api Service**: Toda llamada al backend debe estar centralizada en `services/api.ts`.

## 🛠️ Tabla de Skills Disponibles (Frontend)

| Skill | Descripción | URL |
| :--- | :--- | :--- |
| `react-component` | Estructura de componentes, props y renderizado condicional. | [frontend/skills/COMPONENT.md](./skills/COMPONENT.md) |
| `axios-integration` | Consumo de API, interceptores y manejo de errores HTTP. | [frontend/skills/API_SERVICE.md](./skills/API_SERVICE.md) |
| `tailwind-ui` | Patrones de diseño responsive, dark mode y layouts. | [frontend/skills/STYLING.md](./skills/STYLING.md) |
| `form-handling` | Manejo de formularios, validación y envío de datos (incluyendo archivos). | [frontend/skills/FORMS.md](./skills/FORMS.md) |

## 🤖 Tabla de Auto-Invocación (Agentes Frontend)

| Acción | Skill a Invocar | Notas |
| :--- | :--- | :--- |
| Crear nueva Página | `react-component` | Registrar ruta en `App.tsx`. |
| Conectar con Backend | `axios-integration` | Agregar función exportada en `api.ts`. |
| Crear Modal/Form | `form-handling` | Usar `useState` para control de inputs. |
| Estilizar Card/Lista | `tailwind-ui` | Seguir paleta de colores del sistema. |

## 🏗️ Tech Stack & Comandos (Frontend)

*   **Framework**: React (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React

```bash
# Entrar al entorno
cd frontend

# Instalar dependencias
npm install

# Correr servidor (Dev)
npm run dev
```

