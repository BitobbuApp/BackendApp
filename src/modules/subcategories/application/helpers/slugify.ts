/** "Lácteos y Huevos" → "lacteos-y-huevos" */
export function slugify(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Global unique slug of a subcategory: `<category-slug>-<name>` (e.g. "alimentos-lacteos"). */
export function buildSubcategorySlug(categorySlug: string, nameEs: string): string {
    return `${categorySlug}-${slugify(nameEs)}`;
}
