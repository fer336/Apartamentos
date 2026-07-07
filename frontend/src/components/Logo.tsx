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
      <rect width="100" height="100" fill="#EFF6FF" /> {/* blue-50 */}
      
      {/* Sol */}
      <circle cx="78" cy="25" r="12" fill="#FB7185" /> {/* rose-400 */}

      {/* Mar (Olas suaves) */}
      <path 
        d="M-10 65 C20 65 30 55 60 55 C90 55 100 65 110 65 V110 H-10 V65 Z" 
        fill="#38BDF8" 
      /> {/* sky-400 */}
      
      {/* Arena/Costa (detalle inferior) */}
      <path 
        d="M-10 85 C20 85 30 80 60 80 C90 80 100 85 110 85 V110 H-10 V85 Z" 
        fill="#0EA5E9" 
      /> {/* sky-500 */}

      {/* Pino (Geométrico y Sólido) */}
      {/* Copa superior */}
      <path d="M50 15 L72 45 H28 L50 15Z" fill="#10B981" /> {/* emerald-500 */}
      {/* Copa media con sombra */}
      <path d="M50 15 L50 45 H72 L50 15Z" fill="#059669" opacity="0.2" /> {/* Sombra mitad */}
      
      {/* Copa inferior */}
      <path d="M50 35 L78 75 H22 L50 35Z" fill="#10B981" />
      <path d="M50 35 L50 75 H78 L50 35Z" fill="#059669" opacity="0.2" />
      
      {/* Tronco */}
      <rect x="46" y="75" width="8" height="10" fill="#78350F" />
    </g>

    {/* Borde del contenedor para contraste */}
    <rect x="1" y="1" width="98" height="98" rx="22" stroke="#CBD5E1" strokeWidth="2" />
  </svg>
);
