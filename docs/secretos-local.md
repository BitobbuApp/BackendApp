# Simulación local de producción (PM2 + Infisical)

Referencia: `gestion-secretos-produccion.md`. En prod no hay `.env`; PM2 solo conoce punteros de bootstrap y la app descarga sus secretos en memoria al arrancar.

## 1. Preparación (una vez)
1. `npm i -g pm2`
2. Infisical Cloud: proyecto de **prueba**, entorno `prod`, carpetas `/shared`, `/api`, `/worker` con los secretos del esquema (`src/bootstrap/configSchema.ts`, ver `.env.example`). Nunca uses secretos reales de producción.
3. Machine identity (universal auth) con lectura solo a ese entorno.
4. Credencial de bootstrap fuera del repo:
   ```powershell
   mkdir $env:USERPROFILE\.secrets
   '{"clientId":"...","clientSecret":"..."}' | Set-Content $env:USERPROFILE\.secrets\bootstrap.json
   icacls $env:USERPROFILE\.secrets\bootstrap.json /inheritance:r /grant:r "$env:USERNAME:(R)"
   ```
   En el VPS: archivo `0400`, propiedad del usuario sin privilegios que corre PM2.

## 2. Arrancar
```powershell
npm run build
$env:INFISICAL_PROJECT_ID = "<id>"
$env:INFISICAL_ENV = "prod"
$env:INFISICAL_CREDENTIALS_FILE = "$env:USERPROFILE\.secrets\bootstrap.json"
npm run pm2:start
pm2 logs
```

## 3. Verificación
- Sin credencial / sin un secreto requerido: el proceso sale con código 1 y el mensaje lista solo nombres de variables.
- `pm2 env 0` y `pm2 save`, luego buscar en `~\.pm2\dump.pm2`: `DATABASE_URL` y `JWT_SECRET` deben dar 0 coincidencias.
- Revocar la identity y hacer `pm2 reload`: el arranque falla de forma controlada tras los reintentos.

## 4. Limitaciones
- Los secretos se inyectan en `process.env` **dentro del proceso** (los módulos aún lo leen al importarse). No tocan disco ni PM2, pero no se cumple aún "nunca en `process.env`". Fase 2: módulo `config` inmutable.
- `prisma migrate/generate` no pasa por el bootstrap; pasa `DATABASE_URL` solo para ese comando (p. ej. `infisical run`) en vez de `.env.prod`.
- `.env` / `.env.prod` locales siguen en disco: bórralos o vacíalos cuando ya no los uses.
- Los sockets siguen dentro del proceso `api`.
