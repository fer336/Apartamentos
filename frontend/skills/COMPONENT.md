# Skill: React Functional Component

**ID**: `react-component`
**Dominio**: Frontend

## 📖 Descripción
Estructura estándar para componentes de React funcionales con TypeScript, utilizando Hooks y Tailwind CSS.

## 💻 Patrón de Código

```tsx
import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface MyComponentProps {
  title: string;
  isActive?: boolean;
  onAction: (id: string) => void;
  icon?: LucideIcon;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  isActive = false,
  onAction,
  icon: Icon
}) => {
  // 1. Hooks de Estado
  const [loading, setLoading] = useState(false);

  // 2. Efectos (si son necesarios)
  useEffect(() => {
    // Lógica de montaje
  }, []);

  // 3. Handlers
  const handleClick = () => {
    setLoading(true);
    onAction('some-id');
    setLoading(false);
  };

  // 4. Renderizado
  return (
    <div className={`p-4 rounded-xl border transition-all ${isActive ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-gray-500" />}
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      
      <button 
        onClick={handleClick}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Cargando...' : 'Acción'}
      </button>
    </div>
  );
};
```

## ✅ Checklist de Implementación

1.  [ ] Definir interfaz de `Props` clara y tipada.
2.  [ ] Usar `React.FC<Props>` para el componente.
3.  [ ] Desestructurar props en la firma de la función.
4.  [ ] Agrupar Hooks al inicio del componente.
5.  [ ] Usar clases de Tailwind para estilos (evitar `style={{}}`).
6.  [ ] Iconos: Importar de `lucide-react`.

