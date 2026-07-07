# 🧠 Project Orchestrator - AGENTS.md

Este documento define la arquitectura de agentes para el sistema **Apartamentos Valeria**. Cada cambio en el repositorio debe ser supervisado por el Agente correspondiente utilizando las Skills definidas.

## 📋 Directrices de Repositorio (Global)

1.  **Ecosistema Multi-Agente**: No se escribe código "suelto". Todo código pertenece a un dominio (Frontend, Backend, Automation) y sigue un patrón (Skill).
2.  **Docker First**: La infraestructura es inmutable. Si funciona en local, debe funcionar en producción vía Docker Compose.
3.  **Idioma**: Código, comentarios y commits en **Inglés**. UI/UX y textos visibles al usuario en **Español (AR)**.
4.  **Inhibición de Inferencia**: No adivinar patrones. Si una tarea no tiene un Skill asociado, se debe crear el documento `SKILL.md` primero.

## 🛠️ Tabla de Skills Globales (Infrastructure & DevOps)

| Skill | Descripción | URL |
| :--- | :--- | :--- |
| `docker-compose-ops` | Gestión de contenedores, redes y volúmenes persistentes. | [infra/skills/DOCKER_OPS.md](./infra/skills/DOCKER_OPS.md) |
| `git-flow-deploy` | Estrategia de ramas, versionado y scripts de despliegue (`deploy.sh`). | [infra/skills/DEPLOYMENT.md](./infra/skills/DEPLOYMENT.md) |
| `env-secrets` | Gestión de variables de entorno y secretos Docker. | [infra/skills/SECRETS.md](./infra/skills/SECRETS.md) |

## 🤖 Tabla de Auto-Invocación (Agentes Globales)

| Acción | Agente Responsable | Skill a Invocar |
| :--- | :--- | :--- |
| Desplegar en Producción | **DevOps Agent** | `git-flow-deploy` |
| Agregar servicio externo (ej. Redis) | **Infra Agent** | `docker-compose-ops` |
| Rotar credenciales | **Security Agent** | `env-secrets` |

## 🏗️ Tech Stack & Comandos Globales

*   **OS**: Linux (Debian/Ubuntu)
*   **Container**: Docker Engine & Docker Compose
*   **Proxy**: Traefik (Reverse Proxy + SSL)
*   **DB**: PostgreSQL 15+

```bash
# Setup Inicial
./deploy.sh

# Logs Globales
docker compose logs -f
```

