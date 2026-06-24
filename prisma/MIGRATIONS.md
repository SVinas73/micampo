# Migraciones de base de datos (runbook)

Hasta ahora el esquema se aplicaba a mano con `prisma db push`. Eso no deja
historial y es la causa de un riesgo real: si alguien mergea un cambio de schema
y no corre el push antes de desplegar, una columna nueva no existe en la base y
**se cae el módulo en producción** (un `SELECT` falla).

A partir de acá usamos **migraciones versionadas** (`prisma migrate`), que sí
dejan historial en `prisma/migrations/` y se aplican de forma determinística en
cada deploy.

---

## 1. Adopción por única vez (sobre la base que YA existe)

La base ya tiene todas las tablas (se crearon con `db push`). El baseline
`00000000000000_baseline` describe ese estado actual. Hay que decirle a Prisma
que ese baseline **ya está aplicado**, para que no intente recrear las tablas:

```bash
# Con DATABASE_URL apuntando a la base real (Neon):
npx prisma migrate resolve --applied 00000000000000_baseline
npx prisma migrate status   # debe decir: Database schema is up to date
```

### Verificar que no hay "drift"
Como antes se usaba `db push`, la base podría haber quedado distinta del schema.
Antes de confiar en las migraciones, confirmá que coinciden:

```bash
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-migrations ./prisma/migrations \
  --script
```

- Si imprime `-- This is an empty migration.` (o no hay diferencias): perfecto.
- Si imprime sentencias `ALTER/CREATE`: hay drift. Generá una migración de
  corrección (`prisma migrate dev --name corregir_drift`) y revisala a mano
  antes de aplicar.

---

## 2. Flujo de trabajo de ahora en más

**Al cambiar `schema.prisma` (desarrollo):**
```bash
npm run db:migrate -- --name describi_el_cambio   # crea y aplica la migración local
```
Esto crea una carpeta nueva en `prisma/migrations/` que **se commitea** junto al
cambio de schema.

**En el deploy (producción):**
```bash
npm run db:deploy    # = prisma migrate deploy (aplica las migraciones pendientes)
```

> Importante: corré `db:deploy` en el paso de **release/deploy**, no en el build.
> El `build` (`prisma generate && next build`) no toca la base. Agregá
> `npm run db:deploy` al comando de deploy de tu plataforma (o a un job de CI que
> corra con `DATABASE_URL` apuntando a producción), de modo que **ningún deploy
> llegue a la app sin haber migrado la base primero**.

---

## 3. Reglas de oro

1. Nunca más `prisma db push` contra producción.
2. Toda migración se commitea con el cambio de `schema.prisma` que la generó.
3. El deploy aplica `migrate deploy` ANTES de levantar la nueva versión de la app.
4. Si una migración es destructiva (drop column / table), revisala en el PR.
