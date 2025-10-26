Oracle en Docker (rápido) — guía rápida

Este repo incluye un `docker-compose.oracle.yml` que usa la imagen `gvenzl/oracle-xe:23-slim` (Oracle XE 23c community) para levantar una base Oracle local para desarrollo.

Requisitos

- Docker Desktop instalado (Windows) y con WSL2 backend si estás en Windows 10/11.
- Al menos 4GB de RAM asignada a Docker (ideal 6-8GB para Oracle). Ajusta en Docker Desktop -> Settings -> Resources.

Archivos incluidos

- `docker-compose.oracle.yml` — definicion del servicio.
- `.env.oracle` — variables de entorno (ORACLE_PASSWORD por defecto `oraclepwd`).

Comandos básicos

1. Levantar (en PowerShell):

```powershell
cd C:\carga-datos-vue
# Cargar variables desde .env.oracle automáticamente
docker compose -f docker-compose.oracle.yml --env-file .env.oracle up -d
```

2. Ver logs (espera a que el healthcheck pase):

```powershell
docker compose -f docker-compose.oracle.yml logs -f oracle
```

Busca en los logs un mensaje tipo "Database ready to use" o que el healthcheck sea "healthy".

3. Conectar desde tu app

- Host: `localhost`
- Puerto: `1521`
- Service name (PDB): `XEPDB1` (la imagen usa XEPDB1 como pluggable DB por defecto)
- Usuario/Password: `SYSTEM` / valor de `ORACLE_PASSWORD` (por defecto `oraclepwd`) o crea un usuario nuevo.

Ejemplo de connection string (Oracle Thin):

- jdbc:oracle:thin:@//localhost:1521/XEPDB1

4. Entrar al contenedor y usar sqlplus:

```powershell
# abrir shell interactivo en el contenedor
docker exec -it oracle-xe-23 bash
# dentro del contenedor
sqlplus system/${ORACLE_PASSWORD}@//127.0.0.1:1521/XEPDB1
```

Notas

- Si tienes problemas al levantar, asegúrate de que el puerto 1521 no esté ocupado y que Docker tenga suficiente RAM.
- Datos se persisten en `./data/oracle` en tu proyecto. Para borrar datos, detén el contenedor y elimina esa carpeta (pero cuidado: eliminará la base).

Siguiente paso

- Puedo preparar un script que cree un schema y tablas según el layout que definamos, y te muestro cómo insertar los datos extraídos desde `Uster`.
- Dime si quieres que prepare ya un script SQL para crear las tablas y un endpoint Node.js (Express) que reciba JSON y lo inserte en Oracle (usando `oracledb`) para pruebas.
