# Plan de Implementación: Mejoras a Vitrina de Empresas (CompanyOffer)

Este documento detalla los ajustes técnicos a nivel de base de datos (Prisma) y backend para soportar:
1. **Desactivación/Eliminación lógica ("soft-delete")** de un producto en la vitrina.
2. **Precios escalonados (tiered pricing)** por rango de cantidades (ej. al estilo Alibaba).

## Cambios Requeridos

### 1. Esquema de Base de Datos (Prisma)

Se actualizará el archivo `prisma/schema.prisma` para agregar el borrado lógico a las ofertas y soportar la nueva tabla de niveles de precios.

- Añadir el campo `deleted_at DateTime?` al modelo `CompanyOffer`.
- Crear el modelo `CompanyOfferPricingTier` con los campos:
  - `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`
  - `offer_id String @db.Uuid`
  - `min_quantity Int`
  - `max_quantity Int?` (Si es null, el precio aplica para cualquier cantidad mayor o igual a `min_quantity`)
  - `price_usd Decimal @db.Decimal(12, 2)`
  - `created_at DateTime @default(now()) @db.Timestamptz(6)`
- Relacionar `CompanyOfferPricingTier` de vuelta con `CompanyOffer` mediante una relación uno-a-muchos: `pricing_tiers CompanyOfferPricingTier[]` en el modelo `CompanyOffer`.

### 2. Capa de Dominio (Entities)

Extenderemos las entidades para que el backend reconozca el nuevo modelo de niveles de precio y el campo de fecha de borrado.

**Archivo:** `src/modules/companyOffers/domain/entities/companyOffer.entity.ts`
- Añadir a `CompanyOffer` la propiedad `deleted_at: Date | null` y `pricing_tiers: CompanyOfferPricingTier[]`.
- Crear la nueva clase `CompanyOfferPricingTier` exportada con las propiedades mapeadas.

### 3. Capa de Persistencia (Repositories)

Actualizaremos el acceso a datos para leer/escribir las tablas de rangos de precio, así como para filtrar los productos "eliminados".

**Archivo:** `src/modules/companyOffers/domain/repositories/companyOffer.repository.ts`
- Adaptar o especificar la firma del borrado lógico `delete(id: string): Promise<void>`.

**Archivo:** `src/modules/companyOffers/infrastructure/persistence/PrismaCompanyOfferRepository.ts`
- Modificar las lecturas (`findMany`, `findAllWithPagination`, `findByCompanyId`) para que apliquen por defecto la condición `deleted_at: null` y usen `include: { pricing_tiers: true }`.
- Actualizar `create` y `update` para que al guardar la oferta también guarde/reemplace la lista de `pricing_tiers`.
- Modificar el método de eliminación (`delete`) para que ejecute un "soft-delete", haciendo un update y marcando `deleted_at = new Date()` e `is_active = false`.

### 4. DTOs (Validación de entrada y salida)

Aseguraremos que la API reciba y valide los nuevos datos que serán enviados por el frontend.

**Archivo:** `src/modules/companyOffers/application/dtos/companyOffer.dto.ts`
- Añadir un Joi Schema para `CompanyOfferPricingTier` validando `min_quantity`, `max_quantity`, y `price_usd`.
- Añadir el arreglo `pricing_tiers` opcional/requerido a los validadores `createCompanyOfferDtoRequestSchema` y `updateCompanyOfferDtoRequestSchema`.
- Modificar el esquema de respuesta `companyOfferDtoResponseSchema` para exponer `pricing_tiers` y `deleted_at`.

### 5. Casos de Uso (Use Cases)

Actualizar la lógica de negocio para gestionar el nuevo flujo de precios.

**Archivo:** `src/modules/companyOffers/application/createCompanyOfferUseCase.ts`
- Aceptar el arreglo `pricing_tiers` en la interface DTO.
- Pasar la data procesada al repositorio al crear.

**Archivo:** `src/modules/companyOffers/application/updateCompanyOfferUseCase.ts`
- Aceptar el arreglo `pricing_tiers` para permitir la sobreescritura (o actualización) de los rangos de precios en base de datos.

**Archivo:** `src/modules/companyOffers/application/deleteCompanyOfferUseCase.ts`
- Internamente llamará al repositorio que ahora ejecuta un soft-delete. 

## Decisiones Técnicas Confirmadas

1. **Rango Infinito (`max_quantity = null`):** Se confirma que si el límite superior es nulo, el precio definido aplicará para toda cantidad mayor o igual al `min_quantity`.
2. **Precio Base:** El campo `base_price_usd` existente en `CompanyOffer` se conservará y será el precio que se utilice para aquellos productos que no manejen rangos o niveles de precio (tiered pricing).
