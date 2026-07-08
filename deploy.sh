#!/bin/bash

set -e  # Exit on error

echo "🚀 =================================================="
echo "   DESPLIEGUE A PRODUCCIÓN - APARTAMENTOS VALERIA"
echo "   =================================================="
echo ""

# Variables
BACKEND_VERSION="v2.3"
FRONTEND_VERSION="v2.3"
DOCKER_USER="ferc33"

# ⚠️ IMPORTANTE: Configurar el servidor de producción
# Puede ser una IP o un hostname. No hardcodear servidores reales en Git.
PRODUCTION_SERVER="${PRODUCTION_SERVER:-user@your-production-host}"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: No se encuentra docker-compose.yml"
    echo "   Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

echo "📋 Versiones a construir:"
echo "   - Backend: ${BACKEND_VERSION}"
echo "   - Frontend: ${FRONTEND_VERSION}"
echo ""

# Verificar que existe el secreto en Docker Swarm
echo "🔐 Verificando secreto de backend..."
if ! docker secret ls | grep -q "apartamentos_backend_env"; then
    echo "⚠️  ADVERTENCIA: El secreto 'apartamentos_backend_env' no existe en Docker Swarm"
    echo ""
    echo "   Para crearlo, ejecuta:"
    echo "   docker secret create apartamentos_backend_env backend/.env"
    echo ""
    read -p "¿Continuar de todas formas? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Backend
echo ""
echo "📦 =================================================="
echo "   CONSTRUYENDO BACKEND ${BACKEND_VERSION}"
echo "   =================================================="
cd backend

echo "🔨 Building imagen con --no-cache..."
sudo docker build --no-cache -t ${DOCKER_USER}/apartamentos-backend:${BACKEND_VERSION} .

echo "🏷️  Tageando como latest..."
sudo docker tag ${DOCKER_USER}/apartamentos-backend:${BACKEND_VERSION} ${DOCKER_USER}/apartamentos-backend:latest

echo "⬆️  Subiendo a Docker Hub..."
sudo docker push ${DOCKER_USER}/apartamentos-backend:${BACKEND_VERSION}
sudo docker push ${DOCKER_USER}/apartamentos-backend:latest

cd ..

# Frontend
echo ""
echo "🎨 =================================================="
echo "   CONSTRUYENDO FRONTEND ${FRONTEND_VERSION}"
echo "   =================================================="

# IMPORTANTE:
# VITE_BACKEND_URL="" -> Para que use rutas relativas en producción (/api) y Traefik maneje el proxy

echo "🔨 Building imagen con build args..."
sudo docker build --no-cache -t ${DOCKER_USER}/apartamentos-frontend:${FRONTEND_VERSION} \
  --build-arg VITE_BACKEND_URL="" \
  frontend/

echo "🏷️  Tageando como latest..."
sudo docker tag ${DOCKER_USER}/apartamentos-frontend:${FRONTEND_VERSION} ${DOCKER_USER}/apartamentos-frontend:latest

echo "⬆️  Subiendo a Docker Hub..."
sudo docker push ${DOCKER_USER}/apartamentos-frontend:${FRONTEND_VERSION}
sudo docker push ${DOCKER_USER}/apartamentos-frontend:latest

# Actualizar docker-compose.yml
echo ""
echo "📝 Actualizando docker-compose.yml..."
sed -i "s|apartamentos-backend:v[0-9.]\+|apartamentos-backend:${BACKEND_VERSION}|" docker-compose.yml
sed -i "s|apartamentos-frontend:v[0-9.]\+|apartamentos-frontend:${FRONTEND_VERSION}|" docker-compose.yml

# Si es la primera vez y no hay versión anterior para reemplazar, advertir
if ! grep -q "${BACKEND_VERSION}" docker-compose.yml; then
    echo "⚠️  Nota: No se pudo actualizar automáticamente la versión en docker-compose.yml"
    echo "   Asegúrate de actualizar manualmente las imágenes a:"
    echo "   - ${DOCKER_USER}/apartamentos-backend:${BACKEND_VERSION}"
    echo "   - ${DOCKER_USER}/apartamentos-frontend:${FRONTEND_VERSION}"
fi

echo ""
echo "✅ =================================================="
echo "   IMÁGENES CONSTRUIDAS Y SUBIDAS EXITOSAMENTE"
echo "   =================================================="
echo ""
echo "📋 Resumen:"
echo "   - Backend: ${DOCKER_USER}/apartamentos-backend:${BACKEND_VERSION}"
echo "   - Frontend: ${DOCKER_USER}/apartamentos-frontend:${FRONTEND_VERSION}"
echo ""
echo "📤 Las imágenes están disponibles en Docker Hub"
echo ""
echo "🚀 =================================================="
echo "   PRÓXIMOS PASOS EN EL SERVIDOR DE PRODUCCIÓN"
echo "   =================================================="
echo ""
echo "1. Copia el docker-compose.yml al servidor:"
echo "   scp docker-compose.yml ${PRODUCTION_SERVER}:~/"
echo ""
echo "2. Conecta al servidor:"
echo "   ssh ${PRODUCTION_SERVER}"
echo ""
echo "3. Ejecuta estos comandos en el servidor:"
echo ""
echo "   # 1. Eliminar el stack actual"
echo "   docker stack rm apartamentos"
echo ""
echo "   # 2. Esperar a que se eliminen los servicios"
echo "   sleep 30"
echo ""
echo "   # 3. Eliminar el volumen viejo con bind mount"
echo "   docker volume rm apartamentos_backend_logs"
echo ""
echo "   # 4. Verificar que el secreto existe (crear si no)"
echo "   docker secret ls | grep apartamentos_backend_env"
echo ""
echo "   # 5. Redesplegar con el nuevo docker-compose.yml"
echo "   docker stack deploy -c docker-compose.yml apartamentos"
echo ""
echo "   # 6. Ver logs en tiempo real"
echo "   docker service logs apartamentos_backend --tail 50 --follow"
echo ""
echo "=================================================="
