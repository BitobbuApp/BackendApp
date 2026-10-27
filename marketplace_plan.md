# Plan de Activación del Marketplace (Backend)

Este plan detalla los pasos para habilitar la sección de Marketplace (mercado) a nivel de la API, la cual será alimentada por los productos de la vitrina (`CompanyOffer`) de cada empresa o proveedor. 

**No es necesario modificar el esquema de base de datos (Prisma)**, ya que el modelo actual cuenta con toda la información necesaria (categorías, tipos de proveedor, precios, ubicación mediante relaciones, etc.).

## 1. Ajustes en el Backend (API)

El objetivo principal en el backend es exponer un endpoint **público** que sirva como punto de entrada (entry point) de la app. Los usuarios podrán explorar, filtrar y ordenar productos sin necesidad de estar logueados.

### 1.1 Repositorio: `PrismaCompanyOfferRepository.ts`
- **Nuevo Método**: `searchMarketplace(filters, pagination)`
- **Lógica**: Construir una consulta de Prisma dinámica (`where`) basada en los filtros:
  - `is_active = true` (Obligatorio siempre).
  - Búsqueda de texto (`searchTerm`) en el nombre o descripción (`ilike` / `contains`).
  - Filtros exactos: `categoryId`, `supplierTypeId`.
  - Filtros de precio: `minPrice` y `maxPrice`.
  - **Filtro de ubicación**: A través de la relación de la empresa (`company -> locations -> some -> { country_id, state_id }`).
- **Ordenamiento (Sort)**: Mapear el parámetro `sortBy` hacia `orderBy` de Prisma (ej. `price_asc`, `price_desc`, `rating_desc`, `newest`).

### 1.2 Caso de Uso: `SearchMarketplaceOffersUseCase.ts`
- **Nuevo Archivo**: Crear este caso de uso en `src/modules/companyOffers/application/`.
- **Validación**: Utilizar `Joi` para validar fuertemente los parámetros de consulta (query params).
- **Ejecución**: Llamar a `searchMarketplace` del repositorio y devolver la data paginada junto con el total de registros.

### 1.3 Rutas: `companyOfferRoutes.ts`
- **Nuevo Endpoint**: Exponer la ruta `GET /company-offers/marketplace`.
- **Importante**: Esta ruta **NO** debe tener el `authMiddleware`, debe ser totalmente **PÚBLICA**.
- **Controlador**: Recibir los query parameters de la URL, pasarlos al caso de uso, y retornar la respuesta utilizando el formato estándar (`ApiResponse`).
