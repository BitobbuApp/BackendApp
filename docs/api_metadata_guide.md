# 🌍 Bitobbu API - Metadata Guide for Frontend & Mobile Apps

This document explains how to use the global metadata endpoint to populate dropdowns, filters, and labels across the Bitobbu ecosystem (Web and Mobile).

## 🚀 Endpoint
**URL:** `GET /api/v1/metadata/app`  
**Authentication:** Not required (Public access for app initialization).

---

## 📦 Data Structure Overview

The response is designed to provide all the necessary "look-up" data in a single request. 

### 1. Categories (`categories`)
Used for business sectors.
- **`id`**: Numeric identifier for API requests.
- **`name_es` / `name_en`**: Localized UI labels.
- **`slug`**: URL-friendly string.
- **`icon`**: (Optional) String representing an icon name or URL.
- **`is_active`**: Boolean indicating if the category is currently available.

### 2. Company Types (`company_types`)
Differentiates between Manufacturers, Wholesalers, etc.
- **`id`**: Numeric identifier.
- **`name_es` / `name_en`**: Localized UI labels.
- **`description`**: (Optional) Brief explanation of the type.

### 3. Notification Types (`notification_types`)
Used for system alert categorization.
- **`id`**: Numeric identifier.
- **`name`**: Internal reference name (`offer`, `message`, `system`, etc.).
- **`icon`**: (Optional) Associated icon.

### 4. Payment Methods (`payment_methods`)
Standardized payment options (Zelle, Bank Transfer, Crypto, etc.).
- **`id`**: Numeric identifier.
- **`name_es` / `name_en`**: Localized UI labels.
- **`is_active`**: Availability status.

### 5. Units of Measure (`units_of_measure`)
Used for items in requests and offers.
- **`id`**: Numeric identifier.
- **`name`**: Full name of the unit.
- **`abbreviation`**: Short label (e.g., "kg", "u", "L").

### 6. Verification Document Types (`verif_doc_types`)
Required files for the "Verified Company" badge.
- **`id`**: Numeric identifier.
- **`name`**: Internal type name (`tax_id`, `rep_id`, etc.).
- **`instructions`**: (Optional) Guidelines for the user on what to upload.

---

## 🛠️ Implementation Best Practices

### 🔑 Always use `id` for Logic
When sending data back to the Backend (via `POST` or `PATCH`), **always use the numeric `id`**. Do not send the string names.

### 🇪🇸 Localized UI
The API provides `name_es` and `name_en` for most entities. Check the user's language preference in your app and display the corresponding field:
```javascript
// Example logic
const label = userLang === 'es' ? category.name_es : category.name_en;
```

### ⚡ Caching Recommendation
Since this data changes infrequently, frontend teams should **cache this response** locally (Redux, Vuex, or LocalStorage) during the app boot sequence to avoid redundant API calls.

---

## 📄 Example Response Reference

```json
{
    "success": true,
    "message": "App metadata listed",
    "data": {
        "categories": [
            { "id": 1, "name_en": "Food", "name_es": "Alimentos", "slug": "alimentos", "icon": null, "is_active": true },
            { "id": 5, "name_en": "Automotive", "name_es": "Automotriz", "slug": "automotriz", "icon": null, "is_active": true }
            // ... more
        ],
        "company_types": [
            { "id": 1, "name_en": "Manufacturer", "name_es": "Fabricante", "description": null }
            // ... more
        ],
        "payment_methods": [
            { "id": 1, "name_en": "Bank Transfer", "name_es": "Transferencia", "is_active": true },
            { "id": 7, "name_en": "Zelle", "name_es": "Zelle", "is_active": true }
        ],
        "units_of_measure": [
            { "id": 1, "name": "Units", "abbreviation": "u" },
            { "id": 2, "name": "Kg", "abbreviation": "kg" }
        ]
    }
}
```
