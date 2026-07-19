export const Logo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Máscara para recortar contenido dentro del cuadrado redondeado */}
    <mask id="iconMask">
      <rect width="100" height="100" rx="22" fill="white" />
    </mask>

    <g mask="url(#iconMask)">
      {/* Cielo */}
      <rect width="100" height="100" fill="var(--background-alt)" />

      {/* Sol */}
      <circle cx="78" cy="25" r="12" fill="var(--yellow)" />

      {/* Mar (Olas suaves) */}
      <path
        d="M-10 65 C20 65 30 55 60 55 C90 55 100 65 110 65 V110 H-10 V65 Z"
        fill="var(--blue)"
      />

      {/* Arena/Costa (detalle inferior) */}
      <path
        d="M-10 85 C20 85 30 80 60 80 C90 80 100 85 110 85 V110 H-10 V85 Z"
        fill="var(--primary)"
      />

      {/* Pino (Geométrico y Sólido) */}
      {/* Copa superior */}
      <path d="M50 15 L72 45 H28 L50 15Z" fill="var(--green)" />
      {/* Copa media con sombra */}
      <path d="M50 15 L50 45 H72 L50 15Z" fill="var(--green-strong)" opacity="0.3" />

      {/* Copa inferior */}
      <path d="M50 35 L78 75 H22 L50 35Z" fill="var(--green)" />
      <path d="M50 35 L50 75 H78 L50 35Z" fill="var(--green-strong)" opacity="0.3" />

      {/* Tronco */}
      <rect x="46" y="75" width="8" height="10" fill="var(--primary-dark)" />
    </g>

    {/* Borde del contenedor para contraste */}
    <rect x="1" y="1" width="98" height="98" rx="22" stroke="var(--border)" strokeWidth="2" />
  </svg>
);
