# 🗺️ Bitobbu API - Geographic Data Guide (Countries & States)

This document explains how to use the geographic endpoints to populate country/state selectors and location fields across the Bitobbu ecosystem (Web and Mobile).

---

## 📍 Endpoints Overview

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/countries` | Not required | List all active countries |
| `GET` | `/api/v1/states/:countryId` | Not required | List all states for a given country |
| `GET` | `/api/v1/cities/:stateId` | Not required | List all cities for a given state |

---

## 1️⃣ `GET /api/v1/countries`

Returns all available countries. Currently the platform operates in **Venezuela** (`VE`).

**Authentication:** Not required — public endpoint.

### Response Fields

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Numeric ID — use this in API requests |
| `name_es` | `string` | Country name in Spanish |
| `name_en` | `string` | Country name in English |
| `iso_code` | `string` | 2-letter ISO 3166-1 code (e.g. `"VE"`) |
| `phone_code` | `string` | International dialing prefix (e.g. `"+58"`) |
| `is_active` | `boolean` | Whether the country is available on the platform |

### Example Response

```json
{
    "success": true,
    "message": "Countries listed successfully",
    "data": [
        {
            "id": 1,
            "name_es": "Venezuela",
            "name_en": "Venezuela",
            "iso_code": "VE",
            "phone_code": "+58",
            "is_active": true
        }
    ]
}
```

### Usage Example

```javascript
// Populate a country selector
const response = await api.get('/api/v1/countries');
const countries = response.data.data;

// Display label based on user language
const label = (country) => userLang === 'es' ? country.name_es : country.name_en;

// When submitting a location, send the numeric id:
// { country_id: 1, state_id: 15, city_id: 42 }
```

---

## 2️⃣ `GET /api/v1/states/:countryId`

Returns all states/provinces belonging to a country. Pass the country's numeric `id` as the URL parameter.

**Authentication:** Not required — public endpoint.

**URL Parameter:**

| Param | Type | Example | Description |
|---|---|---|---|
| `countryId` | `number` | `1` | The `id` from the countries endpoint |

### Response Fields

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Numeric ID — use this in API requests |
| `country_id` | `number` | Parent country reference |
| `name` | `string` | State/province name |
| `code` | `string` | 2-letter state code (e.g. `"MI"` for Miranda) |

### Example Request

```
GET /api/v1/states/1
```

### Example Response (abbreviated)

```json
{
    "success": true,
    "message": "States listed successfully",
    "data": [
        { "id": 1,  "country_id": 1, "name": "Amazonas",         "code": "AM" },
        { "id": 2,  "country_id": 1, "name": "Anzoátegui",       "code": "AN" },
        { "id": 7,  "country_id": 1, "name": "Carabobo",         "code": "CA" },
        { "id": 10, "country_id": 1, "name": "Distrito Capital", "code": "DC" },
        { "id": 13, "country_id": 1, "name": "Lara",             "code": "LA" },
        { "id": 15, "country_id": 1, "name": "Miranda",          "code": "MI" },
        { "id": 24, "country_id": 1, "name": "Zulia",            "code": "ZU" }
        // ... 24 states total for Venezuela
    ]
}
```

### All Venezuelan States Reference

| id | Code | Name |
|---|---|---|
| 1  | AM | Amazonas |
| 2  | AN | Anzoátegui |
| 3  | AP | Apure |
| 4  | AR | Aragua |
| 5  | BA | Barinas |
| 6  | BO | Bolívar |
| 7  | CA | Carabobo |
| 8  | CO | Cojedes |
| 9  | DA | Delta Amacuro |
| 10 | DC | Distrito Capital |
| 11 | FA | Falcón |
| 12 | GU | Guárico |
| 13 | LA | Lara |
| 14 | ME | Mérida |
| 15 | MI | Miranda |
| 16 | MO | Monagas |
| 17 | NE | Nueva Esparta |
| 18 | PO | Portuguesa |
| 19 | SU | Sucre |
| 20 | TA | Táchira |
| 21 | TR | Trujillo |
| 22 | VA | Vargas |
| 23 | YA | Yaracuy |
| 24 | ZU | Zulia |

---

## 3️⃣ `GET /api/v1/cities/:stateId`

Returns all cities for a given state. Pass the state's numeric `id` as the URL parameter.

**Authentication:** Not required — public endpoint.

**URL Parameter:**

| Param | Type | Example | Description |
|---|---|---|---|
| `stateId` | `number` | `15` | The `id` from the states endpoint (e.g. `15` = Miranda) |

### Response Fields

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Numeric ID — use this in API requests |
| `state_id` | `number` | Parent state reference |
| `name` | `string` | City name |

---

## 🛠️ Implementation Guide

### Cascading Selectors (Country → State → City)

The typical pattern for a location form is **3 chained selectors**. Load each list only when the parent value changes:

```javascript
// 1. On component mount — load countries
const countries = await api.get('/api/v1/countries');

// 2. When user selects a country — load its states
const onCountryChange = async (countryId) => {
    setSelectedState(null);
    setSelectedCity(null);
    const states = await api.get(`/api/v1/states/${countryId}`);
    setStateList(states.data.data);
};

// 3. When user selects a state — load its cities
const onStateChange = async (stateId) => {
    setSelectedCity(null);
    const cities = await api.get(`/api/v1/cities/${stateId}`);
    setCityList(cities.data.data);
};
```

### Submitting Location Data

When creating or updating a company location, **always send the numeric IDs**, not the names:

```json
{
    "country_id": 1,
    "state_id": 15,
    "city_id": 42,
    "tax_address": "Av. Principal, Local 3",
    "national_coverage": false
}
```

### ⚡ Caching Recommendation

Countries and states are **static data** — they don't change. Cache them aggressively:

```javascript
// Cache at app initialization (e.g. in your store)
// Only re-fetch on full app reload or version bump

const GEO_CACHE_KEY = 'bitobbu_geo_cache';
const cached = localStorage.getItem(GEO_CACHE_KEY);

if (!cached) {
    const countries = await api.get('/api/v1/countries');
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(countries.data.data));
}
```

> **Note:** Cities are more numerous — only fetch them on demand when the user opens the city selector, not at app startup.

---

*Geographic API Guide | Bitobbu Platform | v2*
