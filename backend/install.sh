#!/bin/bash
# Script de instalación del backend

echo "🚀 Instalando dependencias del backend..."

# Ir al directorio backend
cd "$(dirname "$0")"

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    python -m venv venv
fi

# Activar entorno virtual
echo "✅ Activando entorno virtual..."
source venv/bin/activate

# Actualizar pip
echo "⬆️  Actualizando pip..."
pip install --upgrade pip

# Instalar dependencias
echo "📥 Instalando dependencias..."
pip install -r requirements.txt

echo ""
echo "✅ ¡Instalación completa!"
echo ""
echo "Para ejecutar el servidor:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python main.py"

