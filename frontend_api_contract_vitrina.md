# Contrato de API (Frontend) - Vitrina de Empresas (Company Offers)

Este documento detalla los endpoints, métodos HTTP, estructuras de datos (payloads) y validaciones requeridas por el Frontend para interactuar con la Vitrina de Empresas.

---

## Consideraciones Generales
1. **Autenticación:** Todos estos endpoints están protegidos por JWT. El Frontend debe enviar siempre la cabecera: 
   `Authorization: Bearer <tu_token_jwt>`
2. **Tipos de Contenido:** 
   - Para crear/actualizar datos puros se envía `Content-Type: application/json`.
   - Si se incluyen imágenes (`rawFiles`), se debe enviar como `multipart/form-data` y los campos de texto deben ir adecuadamente inyectados en el form-data.
3. **Rango Infinito:** En los `pricing_tiers`, si `max_quantity` se envía como `null`, significa que ese precio aplica desde `min_quantity` en adelante (sin límite).

---

## 1. Crear una Oferta de Empresa (Producto)

Crea un nuevo producto en la vitrina. 

* **Endpoint:** `/company-offers`
* **Método HTTP:** `POST`

### Payload (Body JSON)
El payload debe estructurarse de la siguiente manera:

```json
{
  "company_id": "123e4567-e89b-12d3-a456-426614174000", // (Requerido) UUID
  "name": "Nombre de Producto Ej",                     // (Requerido) max 200 chars
  "description": "Descripción extensa...",             // (Opcional)
  "category_id": 10,                                   // (Opcional) ID numérico de la categoría
  "supplier_type_id": 2,                               // (Opcional) ID numérico del tipo de proveedor
  "base_price_usd": 150.00,                            // (Opcional) Precio por defecto si no hay rangos
  "unit_id": 1,                                        // (Opcional) ID de la unidad de medida (ej. Cajas, Unidades)
  "moq": 10,                                           // (Opcional) Minimum Order Quantity
  "std_delivery_time": "15 a 20 días",                 // (Opcional) max 100 chars
  "video_url": "https://youtube.com/...",              // (Opcional) Debe ser una URL válida
  "is_active": true,                                   // (Opcional) Por defecto es true
  
  // PRECIOS ESCALONADOS (Opcional pero recomendado para B2B)
  "pricing_tiers": [
    {
      "min_quantity": 10,
      "max_quantity": 49,
      "price_usd": 150.00
    },
    {
      "min_quantity": 50,
      "max_quantity": 199,
      "price_usd": 130.00
    },
    {
      "min_quantity": 200,
      "max_quantity": null,                            // null = 200 unidades en adelante
      "price_usd": 100.00
    }
  ]
}
```

### Respuestas Esperadas
* **201 Created:** Retorna un objeto estándar con la data generada (incluyendo los `id` de la base de datos).
* **400 Bad Request:** Si faltan campos requeridos o `pricing_tiers` tienen una estructura incorrecta (ej. números negativos).

---

## 2. Actualizar una Oferta Existente

Modifica parcial o totalmente una oferta de empresa. Si se envían `pricing_tiers`, **se reemplazarán todos** los rangos actuales por el nuevo arreglo enviado.

* **Endpoint:** `/company-offers/:id`
* **Método HTTP:** `PATCH`

### Parámetros de Ruta
* `id` (UUID del producto en la vitrina)

### Payload (Body JSON)
*Todos los campos son opcionales. Envía únicamente los campos que vas a modificar.*

```json
{
  "name": "Nuevo Nombre Corregido",
  "base_price_usd": 140.00,
  
  // Si deseas modificar los rangos de precios, debes enviar la tabla COMPLETA nuevamente
  "pricing_tiers": [
    {
      "min_quantity": 10,
      "max_quantity": 99,
      "price_usd": 140.00
    },
    {
      "min_quantity": 100,
      "max_quantity": null,
      "price_usd": 90.00
    }
  ]
}
```

### Respuestas Esperadas
* **200 OK:** Retorna el producto actualizado con sus nuevas relaciones.
* **404 Not Found:** Si el `id` no pertenece a ninguna oferta válida.

---

## 3. Eliminar (Desactivar) una Oferta

Aplica un "Soft Delete" (borrado lógico). Esto asegura que el producto ya no sea visible en el marketplace ni en el panel de control, pero preserva el historial para transacciones pasadas.

* **Endpoint:** `/company-offers/:id`
* **Método HTTP:** `DELETE`

### Parámetros de Ruta
* `id` (UUID del producto a eliminar)

### Payload
No requiere body.

### Respuestas Esperadas
* **200 OK:** `{"success": true, "message": "Company offer removed"}`
* **404 Not Found:** Si el `id` no existe.

---

## Notas sobre la Recuperación de Datos (GET)

Al hacer GET sobre `/company-offers` o `/company-offers/company/:companyId`, el backend enviará una estructura idéntica a la que se envía al crearlo. Podrás leer el array `pricing_tiers` para popular una tabla de descuentos en la interfaz del usuario, y el campo `deleted_at` para verificar internamente si se requiere.
