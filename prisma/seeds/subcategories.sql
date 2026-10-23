-- Subcategories seed (second level of the category taxonomy)
-- Run once per environment after `npx prisma db push` (idempotent: re-running does not duplicate rows).
-- Rows are joined by categories.slug (ids may differ between environments).
-- Subcategories are never deleted: manage them later from the BackOffice (create / edit / activate / deactivate).

INSERT INTO subcategories (category_id, slug, name_es, name_en, sort_order, updated_at)
SELECT c.id, v.slug, v.name_es, v.name_en, v.sort_order, now()
FROM (VALUES
    -- Alimentos
    ('alimentos', 'alimentos-lacteos', 'Lácteos', 'Dairy', 1),
    ('alimentos', 'alimentos-carnicos-y-embutidos', 'Cárnicos y embutidos', 'Meat and cold cuts', 2),
    ('alimentos', 'alimentos-granos-y-harinas', 'Granos y harinas', 'Grains and flours', 3),
    ('alimentos', 'alimentos-bebidas', 'Bebidas', 'Beverages', 4),
    ('alimentos', 'alimentos-frutas-y-vegetales', 'Frutas y vegetales', 'Fruits and vegetables', 5),
    ('alimentos', 'alimentos-enlatados-y-conservas', 'Enlatados y conservas', 'Canned and preserved food', 6),
    ('alimentos', 'alimentos-panaderia-y-reposteria', 'Panadería y repostería', 'Bakery and pastry', 7),
    -- Ferretería
    ('ferreteria', 'ferreteria-herramientas-manuales', 'Herramientas manuales', 'Hand tools', 1),
    ('ferreteria', 'ferreteria-herramientas-electricas', 'Herramientas eléctricas', 'Power tools', 2),
    ('ferreteria', 'ferreteria-tornilleria-y-fijaciones', 'Tornillería y fijaciones', 'Fasteners', 3),
    ('ferreteria', 'ferreteria-materiales-electricos', 'Materiales eléctricos', 'Electrical supplies', 4),
    ('ferreteria', 'ferreteria-plomeria', 'Plomería', 'Plumbing', 5),
    ('ferreteria', 'ferreteria-pinturas-y-acabados', 'Pinturas y acabados', 'Paints and finishes', 6),
    -- Salud
    ('salud', 'salud-insumos-medicos', 'Insumos médicos', 'Medical supplies', 1),
    ('salud', 'salud-medicamentos', 'Medicamentos', 'Medicines', 2),
    ('salud', 'salud-equipos-medicos', 'Equipos médicos', 'Medical equipment', 3),
    ('salud', 'salud-higiene-y-cuidado-personal', 'Higiene y cuidado personal', 'Hygiene and personal care', 4),
    ('salud', 'salud-laboratorio', 'Laboratorio', 'Laboratory', 5),
    ('salud', 'salud-odontologia', 'Odontología', 'Dentistry', 6),
    -- IT
    ('it', 'it-hardware-y-equipos', 'Hardware y equipos', 'Hardware and equipment', 1),
    ('it', 'it-software-y-licencias', 'Software y licencias', 'Software and licenses', 2),
    ('it', 'it-redes-y-telecomunicaciones', 'Redes y telecomunicaciones', 'Networking and telecom', 3),
    ('it', 'it-soporte-tecnico', 'Soporte técnico', 'Technical support', 4),
    ('it', 'it-desarrollo-de-software', 'Desarrollo de software', 'Software development', 5),
    ('it', 'it-ciberseguridad', 'Ciberseguridad', 'Cybersecurity', 6),
    -- Automotriz
    ('automotriz', 'automotriz-repuestos', 'Repuestos', 'Spare parts', 1),
    ('automotriz', 'automotriz-lubricantes-y-aceites', 'Lubricantes y aceites', 'Lubricants and oils', 2),
    ('automotriz', 'automotriz-neumaticos', 'Neumáticos', 'Tires', 3),
    ('automotriz', 'automotriz-baterias', 'Baterías', 'Batteries', 4),
    ('automotriz', 'automotriz-accesorios', 'Accesorios', 'Accessories', 5),
    ('automotriz', 'automotriz-servicio-y-mantenimiento', 'Servicio y mantenimiento', 'Service and maintenance', 6),
    -- Embalaje
    ('embalaje', 'embalaje-cajas-de-carton', 'Cajas de cartón', 'Cardboard boxes', 1),
    ('embalaje', 'embalaje-bolsas-plasticas', 'Bolsas plásticas', 'Plastic bags', 2),
    ('embalaje', 'embalaje-envases-y-botellas', 'Envases y botellas', 'Containers and bottles', 3),
    ('embalaje', 'embalaje-film-y-stretch', 'Film y stretch', 'Film and stretch wrap', 4),
    ('embalaje', 'embalaje-etiquetas', 'Etiquetas', 'Labels', 5),
    ('embalaje', 'embalaje-paletas', 'Paletas', 'Pallets', 6),
    -- Químicos
    ('quimicos', 'quimicos-quimicos-industriales', 'Químicos industriales', 'Industrial chemicals', 1),
    ('quimicos', 'quimicos-limpieza-y-desinfeccion', 'Limpieza y desinfección', 'Cleaning and disinfection', 2),
    ('quimicos', 'quimicos-agroquimicos', 'Agroquímicos', 'Agrochemicals', 3),
    ('quimicos', 'quimicos-solventes', 'Solventes', 'Solvents', 4),
    ('quimicos', 'quimicos-tratamiento-de-agua', 'Tratamiento de agua', 'Water treatment', 5),
    -- Oficina
    ('oficina', 'oficina-papeleria', 'Papelería', 'Stationery', 1),
    ('oficina', 'oficina-mobiliario', 'Mobiliario', 'Furniture', 2),
    ('oficina', 'oficina-equipos-de-oficina', 'Equipos de oficina', 'Office equipment', 3),
    ('oficina', 'oficina-consumibles-de-impresion', 'Consumibles de impresión', 'Printing supplies', 4),
    ('oficina', 'oficina-articulos-de-cafeteria', 'Artículos de cafetería', 'Breakroom supplies', 5),
    -- Textil
    ('textil', 'textil-telas', 'Telas', 'Fabrics', 1),
    ('textil', 'textil-uniformes', 'Uniformes', 'Uniforms', 2),
    ('textil', 'textil-confeccion', 'Confección', 'Garment manufacturing', 3),
    ('textil', 'textil-hilos-y-merceria', 'Hilos y mercería', 'Threads and haberdashery', 4),
    ('textil', 'textil-lenceria-industrial', 'Lencería industrial', 'Industrial linens', 5),
    -- Logística
    ('logistica', 'logistica-transporte-de-carga', 'Transporte de carga', 'Freight transport', 1),
    ('logistica', 'logistica-almacenamiento', 'Almacenamiento', 'Warehousing', 2),
    ('logistica', 'logistica-courier-y-paqueteria', 'Courier y paquetería', 'Courier and parcels', 3),
    ('logistica', 'logistica-distribucion', 'Distribución', 'Distribution', 4),
    ('logistica', 'logistica-importacion-y-aduanas', 'Importación y aduanas', 'Import and customs', 5),
    -- Mantenimiento
    ('mantenimiento', 'mantenimiento-mantenimiento-industrial', 'Mantenimiento industrial', 'Industrial maintenance', 1),
    ('mantenimiento', 'mantenimiento-climatizacion-y-refrigeracion', 'Climatización y refrigeración', 'HVAC and refrigeration', 2),
    ('mantenimiento', 'mantenimiento-electricidad', 'Electricidad', 'Electrical work', 3),
    ('mantenimiento', 'mantenimiento-limpieza-de-instalaciones', 'Limpieza de instalaciones', 'Facility cleaning', 4),
    ('mantenimiento', 'mantenimiento-jardineria', 'Jardinería', 'Landscaping', 5),
    -- Seguridad
    ('seguridad', 'seguridad-equipos-de-proteccion-personal', 'Equipos de protección personal', 'Personal protective equipment', 1),
    ('seguridad', 'seguridad-seguridad-electronica', 'Seguridad electrónica (CCTV y alarmas)', 'Electronic security (CCTV and alarms)', 2),
    ('seguridad', 'seguridad-vigilancia', 'Vigilancia', 'Security guards', 3),
    ('seguridad', 'seguridad-prevencion-de-incendios', 'Prevención de incendios', 'Fire prevention', 4),
    ('seguridad', 'seguridad-senalizacion', 'Señalización', 'Signage', 5),
    -- Marketing
    ('marketing', 'marketing-publicidad-impresa', 'Publicidad impresa', 'Print advertising', 1),
    ('marketing', 'marketing-marketing-digital', 'Marketing digital', 'Digital marketing', 2),
    ('marketing', 'marketing-material-pop', 'Material POP', 'POP materials', 3),
    ('marketing', 'marketing-diseno-grafico', 'Diseño gráfico', 'Graphic design', 4),
    ('marketing', 'marketing-eventos-y-activaciones', 'Eventos y activaciones', 'Events and activations', 5),
    -- Legal
    ('legal', 'legal-asesoria-corporativa', 'Asesoría corporativa', 'Corporate advisory', 1),
    ('legal', 'legal-laboral', 'Laboral', 'Labor law', 2),
    ('legal', 'legal-tributario-y-fiscal', 'Tributario y fiscal', 'Tax law', 3),
    ('legal', 'legal-propiedad-intelectual', 'Propiedad intelectual', 'Intellectual property', 4),
    ('legal', 'legal-tramites-y-registros', 'Trámites y registros', 'Filings and registrations', 5),
    -- RRHH
    ('rrhh', 'rrhh-reclutamiento-y-seleccion', 'Reclutamiento y selección', 'Recruitment and selection', 1),
    ('rrhh', 'rrhh-nomina', 'Nómina', 'Payroll', 2),
    ('rrhh', 'rrhh-capacitacion', 'Capacitación', 'Training', 3),
    ('rrhh', 'rrhh-outsourcing-de-personal', 'Outsourcing de personal', 'Staff outsourcing', 4),
    ('rrhh', 'rrhh-bienestar-laboral', 'Bienestar laboral', 'Employee wellbeing', 5)
) AS v(category_slug, slug, name_es, name_en, sort_order)
JOIN categories c ON c.slug = v.category_slug
ON CONFLICT (slug) DO NOTHING;

-- Verification: subcategories per category (every category should have rows)
SELECT c.slug AS category, COUNT(s.id) AS subcategories
FROM categories c
LEFT JOIN subcategories s ON s.category_id = c.id
GROUP BY c.slug
ORDER BY c.slug;
