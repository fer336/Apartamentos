// Deriva una etiqueta corta (1-2 caracteres) a partir del nombre de la
// propiedad para mostrar en el círculo identificador de las tarjetas
// (ej: "Departamento A" -> "A").
export const getPropertyShortLabel = (name?: string) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  const last = words[words.length - 1];
  return (last.length <= 2 ? last : last.slice(0, 2)).toUpperCase();
};
