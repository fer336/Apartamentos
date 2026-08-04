// Paleta fija del sistema Kanagawa usada para diferenciar entidades (clientes,
// propiedades) por color de forma determinística vía hash de su id, sin
// necesidad de guardar el color en base de datos.
export const ENTITY_COLORS = [
  { key: 'primary', solid: 'bg-primary', dot: 'bg-primary' },
  { key: 'green', solid: 'bg-state-green', dot: 'bg-state-green' },
  { key: 'blue', solid: 'bg-state-blue', dot: 'bg-state-blue' },
  { key: 'orange', solid: 'bg-state-orange', dot: 'bg-state-orange' },
  { key: 'red', solid: 'bg-state-red', dot: 'bg-state-red' },
  { key: 'yellow', solid: 'bg-state-yellow', dot: 'bg-state-yellow' },
  { key: 'cyan', solid: 'bg-state-cyan', dot: 'bg-state-cyan' },
  { key: 'green-strong', solid: 'bg-state-green-strong', dot: 'bg-state-green-strong' },
] as const;

export const getEntityColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return ENTITY_COLORS[hash % ENTITY_COLORS.length];
};

export const getColorByKey = (key?: string | null) => {
  if (!key) return undefined;
  return ENTITY_COLORS.find((c) => c.key === key);
};
