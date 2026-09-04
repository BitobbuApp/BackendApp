Bitobbu  — Documento Técnico: SuperadministradorConfidencial
BITOBBU
Superadministrador de Plataforma


Especificación técnica y funcional para el equipo de desarrollo
Versión 1.0  —  MVP
  1. OBJETIVO DEL DOCUMENTO




Este documento define las funcionalidades del módulo Superadministrador de Bitobbu para la fase MVP. Su propósito es dar al equipo de desarrollo una referencia clara, priorizada y justificada de lo que debe construirse, sin ambigüedades.


El Superadministrador es el panel de control interno desde el cual el equipo de Bitobbu gestiona usuarios, contenido, verificaciones y la salud operativa de la plataforma. No es visible para compradores ni proveedores.


Nota importante: Un usuario en Bitobbu puede ser comprador y proveedor simultáneamente. Todas las vistas del admin deben reflejar ambos roles de forma separada y clara dentro del mismo perfil.


  2. RECOMENDACIONES GENERALES DE DESARROLLO




* Construir sobre roles y permisos desde el inicio. El admin debe tener niveles: Superadmin (acceso total) y Admin (acceso limitado sin poder eliminar cuentas ni cambiar planes).
* Toda acción ejecutada desde el panel debe quedar registrada en un log de auditoría con: quién ejecutó la acción, sobre qué usuario o entidad, y con qué timestamp. Esto es obligatorio desde el MVP.
* El acceso como usuario (impersonación) debe dejar traza en el log. Nunca debe poder el admin ejecutar acciones como si fuera el usuario sin que quede registrado.
* Diseñar el panel con filtros y búsqueda funcional desde el primer día. Un admin que no puede buscar un usuario por email o RIF en 3 segundos es un panel inútil.
* Los indicadores del panel principal deben conectarse posteriormente a Looker Studio vía API o base de datos directa. Diseñar la estructura de datos pensando en esa integración futura.
* Prioridad de desarrollo: Panel Principal → Gestión de Usuarios → Gestión de Proveedores → Reportes → Notificaciones → Configuración.


  3. PANEL PRINCIPAL — INDICADORES




Vista de entrada al Superadministrador. Muestra el estado de la plataforma en tiempo real. No requiere navegación adicional para leer el pulso del negocio.


Funcionalidad
	Descripción y propósito
	Prioridad
	Usuarios registrados totales
	Total acumulado con desglose: cuántos son solo compradores, solo proveedores, y cuántos tienen ambos roles activos.
	CRÍTICO
	Usuarios activos (7 días)
	Usuarios que ejecutaron al menos una acción en los últimos 7 días. Excluye usuarios registrados pero inactivos. Métrica real de uso.
	CRÍTICO
	RFQs publicados esta semana
	Volumen de solicitudes de cotización de los últimos 7 días. Indicador principal de demanda activa en la plataforma.
	CRÍTICO
	Cotizaciones enviadas esta semana
	Total de cotizaciones respondidas por proveedores en los últimos 7 días. Indica si el lado de la oferta está respondiendo.
	CRÍTICO
	Transacciones confirmadas acumuladas
	Cierres de compra confirmados por el comprador desde el inicio. El KPI más importante de Bitobbu.
	CRÍTICO
	Proveedores pendientes de verificación
	Cola de proveedores que esperan revisión y aprobación del sello verificado. Debe estar siempre en cero o cerca.
	ALTO
	

  4. GESTIÓN DE USUARIOS




4.1 Lista de Usuarios
Vista tabular de todos los usuarios registrados en la plataforma con filtros y búsqueda.


Funcionalidad
	Descripción y propósito
	Prioridad
	Listado general
	Tabla con nombre, email, fecha de registro, rol activo (comprador / proveedor / ambos) y estado de cuenta.
	CRÍTICO
	Filtro por rol activo
	Filtrar por: solo comprador, solo proveedor, ambos roles. Permite identificar la distribución del ecosistema.
	CRÍTICO
	Filtro por estado
	Filtrar por: activo, suspendido, inactivo (registrado sin actividad en +30 días).
	ALTO
	Buscador
	Búsqueda por nombre, email o RIF. Resultado en tiempo real sin recargar la página.
	CRÍTICO
	

4.2 Perfil del Usuario
Vista detallada de un usuario individual. Es la pantalla más usada del admin — debe mostrar todo lo relevante en un solo lugar.


Funcionalidad
	Descripción y propósito
	Prioridad
	Información personal y empresa
	Nombre, email, RIF, teléfono, ciudad, fecha de registro y plan actual.
	CRÍTICO
	Roles activos
	Indicador visual claro de si ese usuario opera como comprador, proveedor o ambos. Si tiene ambos, mostrar actividad separada por rol.
	CRÍTICO
	Historial de actividad como comprador
	RFQs publicados, cotizaciones recibidas, negociaciones abiertas, transacciones confirmadas.
	CRÍTICO
	Historial de actividad como proveedor
	Cotizaciones enviadas, negociaciones recibidas, transacciones cerradas, calificación promedio recibida.
	CRÍTICO
	Plan y vencimiento
	Plan actual, fecha de inicio y fecha de vencimiento. Con botón para cambiar plan manualmente.
	ALTO
	Acceder como usuario
	Impersonación: el admin ve la plataforma exactamente como la ve ese usuario. Queda registrado en el log de auditoría con timestamp.
	CRÍTICO
	Enviar mensaje directo
	Campo para enviarle una notificación o mensaje interno al usuario directamente desde su perfil.
	MEDIO
	Suspender cuenta
	Suspensión con campo obligatorio de motivo. El usuario recibe notificación automática.
	CRÍTICO
	Reactivar cuenta
	Reactivación de cuenta suspendida con registro del admin que la reactivó.
	CRÍTICO
	Eliminar cuenta
	Eliminación con doble confirmación. Acción irreversible con registro en auditoría.
	ALTO
	

  5. GESTIÓN DE PROVEEDORES




Módulo crítico para mantener la confianza de la plataforma. La verificación de proveedores es el activo diferenciador de Bitobbu. Debe ser ágil pero rigurosa.


Funcionalidad
	Descripción y propósito
	Prioridad
	Cola de verificación
	Lista de proveedores pendientes ordenada por fecha de solicitud. El admin revisa RIF, fotos y datos antes de aprobar.
	CRÍTICO
	Aprobar verificación
	Otorga el Sello Bitobbu Verificado al proveedor. El usuario recibe notificación automática.
	CRÍTICO
	Rechazar verificación
	Rechazo con motivo obligatorio. El proveedor puede corregir y volver a solicitar.
	CRÍTICO
	Revocar verificación
	Quitar el sello a un proveedor ya aprobado. Requiere motivo registrado. Acción de alto impacto.
	ALTO
	Ver métricas del proveedor
	Tasa de respuesta, tiempo promedio de respuesta, cotizaciones enviadas, transacciones cerradas y calificación promedio.
	ALTO
	

  6. GESTIÓN DE CONTENIDO




Control sobre el contenido generado por los usuarios. Permite moderar la plataforma y actuar ante violaciones de políticas.


6.1 RFQs
Funcionalidad
	Descripción y propósito
	Prioridad
	Lista de RFQs activos y cerrados
	Vista general con filtros por categoría, ciudad, estado y fecha.
	ALTO
	Ver detalle de RFQ
	Comprador, descripción, categoría, cotizaciones recibidas y estado actual.
	ALTO
	Eliminar RFQ
	Eliminación con motivo registrado. Solo para casos que violen políticas.
	MEDIO
	

6.2 Cotizaciones
Funcionalidad
	Descripción y propósito
	Prioridad
	Lista de cotizaciones
	Vista general de cotizaciones enviadas con proveedor, comprador, precio y estado.
	MEDIO
	Eliminar cotización
	Eliminación con motivo registrado ante violación de políticas.
	MEDIO
	

6.3 Negociaciones
Funcionalidad
	Descripción y propósito
	Prioridad
	Lista de negociaciones activas
	Conversaciones abiertas entre compradores y proveedores.
	MEDIO
	Ver chat en modo lectura
	El admin puede leer cualquier chat sin participar. Solo ante reportes o disputas.
	ALTO
	Cerrar negociación
	Cierre forzado de una negociación que viole políticas. Con notificación a ambas partes.
	MEDIO
	

6.4 Ofertas Proactivas
Funcionalidad
	Descripción y propósito
	Prioridad
	Lista de ofertas publicadas
	Ofertas activas publicadas por proveedores con estado y fecha.
	MEDIO
	Aprobar oferta
	Revisión antes de publicación para garantizar calidad. Opcional según política interna.
	MEDIO
	Eliminar oferta
	Eliminación con motivo ante violación de políticas.
	MEDIO
	

6.5 Reseñas
Funcionalidad
	Descripción y propósito
	Prioridad
	Lista de reseñas
	Todas las reseñas publicadas con filtro por calificación y estado.
	MEDIO
	Reseñas reportadas
	Cola de reseñas que usuarios han reportado como falsas o inapropiadas.
	ALTO
	Eliminar reseña
	Eliminación con motivo registrado. Solo para reseñas que violen políticas.
	MEDIO
	

  7. REPORTES Y DENUNCIAS




Sistema de moderación basado en reportes de usuarios. Es el mecanismo de autoregulación de la comunidad. Debe resolverse rápido — un reporte sin atender en más de 48 horas daña la confianza.


Funcionalidad
	Descripción y propósito
	Prioridad
	Lista de reportes activos
	Reportes ordenados por fecha con usuario que reportó, usuario reportado y motivo.
	CRÍTICO
	Ver detalle del reporte
	Descripción completa, historial del usuario reportado y acciones disponibles.
	CRÍTICO
	Suspender desde el reporte
	Acción directa de suspensión sin salir del reporte. Agiliza la moderación.
	ALTO
	Advertir al usuario
	Enviar advertencia formal al usuario reportado sin suspender. Queda registrado.
	ALTO
	Desestimar reporte
	Marcar el reporte como infundado con nota interna. El denunciante no recibe respuesta automática.
	ALTO
	Marcar como resuelto
	Cierre del reporte con nota interna del admin que lo gestionó.
	CRÍTICO
	

  8. PLANES Y SUSCRIPCIONES




Gestión manual de planes para casos de soporte, cortesías comerciales o correcciones de errores en el cobro.


Funcionalidad
	Descripción y propósito
	Prioridad
	Ver plan actual del usuario
	Plan activo, fecha de inicio y fecha de vencimiento desde el perfil del usuario.
	CRÍTICO
	Cambiar plan manualmente
	Asignar o degradar plan de forma manual. Requiere motivo registrado. Útil para cortesías y soporte.
	ALTO
	Extender vencimiento
	Agregar días adicionales al plan sin cambiar el tipo. Para compensar errores o problemas técnicos.
	ALTO
	Historial de cambios de plan
	Registro de todos los cambios de plan de un usuario con fecha, admin responsable y motivo.
	ALTO
	

  9. NOTIFICACIONES Y COMUNICACIÓN




Canal de comunicación directa desde el admin hacia los usuarios. Usar con criterio — el abuso de notificaciones genera desactivación.


Funcionalidad
	Descripción y propósito
	Prioridad
	Notificación a usuario específico
	Mensaje directo a un usuario identificado. Para soporte, alertas o seguimiento comercial.
	ALTO
	Notificación por segmento
	Envío masivo segmentado: todos los compradores, todos los proveedores, usuarios gratuitos, usuarios inactivos.
	ALTO
	Notificación global
	Mensaje a toda la plataforma. Solo para mantenimientos, actualizaciones o avisos críticos.
	MEDIO
	Historial de notificaciones
	Registro de todas las notificaciones enviadas con fecha, segmento y admin responsable.
	MEDIO
	

  10. CONFIGURACIÓN DE LA PLATAFORMA




Panel de configuración global. Cambios aquí afectan a todos los usuarios. Acceso restringido al Superadmin únicamente.


Funcionalidad
	Descripción y propósito
	Prioridad
	Gestión de categorías
	Crear, editar y desactivar categorías de productos y servicios disponibles en la plataforma.
	CRÍTICO
	Gestión de ciudades
	Agregar o desactivar ciudades disponibles en filtros y perfiles.
	ALTO
	Motivos de reporte
	Definir los motivos disponibles cuando un usuario reporta a otro. Mantener actualizado.
	MEDIO
	Activar/desactivar funciones
	Toggle global para activar o desactivar funcionalidades de la plataforma sin desplegar código.
	ALTO
	Textos de emails transaccionales
	Editar los mensajes automáticos que reciben los usuarios — bienvenida, verificación, suspensión.
	MEDIO
	

  11. LOG DE AUDITORÍA




Esta es la funcionalidad más crítica para la operación segura del Superadministrador. Sin log de auditoría no hay trazabilidad ni responsabilidad interna.


Funcionalidad
	Descripción y propósito
	Prioridad
	Registro automático de acciones
	Cada acción ejecutada en el admin genera un registro automático: quién, qué, sobre quién, cuándo.
	CRÍTICO
	Registro de impersonaciones
	Cada vez que un admin accede como un usuario queda registrado con timestamp de inicio y fin.
	CRÍTICO
	Filtros del log
	Filtrar por admin, tipo de acción, usuario afectado y rango de fechas.
	ALTO
	Export del log
	Exportar el log a CSV para auditorías externas o revisiones internas.
	MEDIO
	

  12. PREPARACIÓN PARA LOOKER STUDIO




El panel de indicadores del Superadministrador es la vista operativa del día a día. Looker Studio será la herramienta de análisis estratégico y reportes avanzados. Deben diseñarse como capas complementarias, no duplicadas.


Datos mínimos a registrar desde el MVP para alimentar Looker Studio


Funcionalidad
	Descripción y propósito
	Prioridad
	Eventos con timestamp
	Cada acción importante (registro, primer RFQ, primera cotización, cierre de transacción, cancelación) debe quedar en la base de datos con tipo de evento y fecha exacta.
	CRÍTICO
	Rol en cada evento
	Registrar si la acción la ejecutó el usuario en su rol de comprador o de proveedor.
	CRÍTICO
	Ciudad y categoría en transacciones
	Cada RFQ y cada transacción debe tener ciudad y categoría asociadas. Sin eso el análisis geográfico y sectorial no es posible.
	CRÍTICO
	Precios en cotizaciones
	Registrar el precio ofertado en cada cotización y el precio final aceptado en cada cierre. Base del historial de precios.
	CRÍTICO
	Canal de adquisición
	Registrar desde qué canal llegó cada usuario (LinkedIn, WhatsApp, referido, publicidad). Base del análisis de CAC por canal.
	ALTO
	

Regla de oro: si un dato no está en la base de datos desde el primer día, no existe. Looker Studio solo puede mostrar lo que está guardado. Registrar bien desde el inicio vale más que cualquier dashboard bonito después.


  LEYENDA DE PRIORIDADES




CRÍTICO
	Debe estar en el MVP. Sin esta funcionalidad la plataforma no puede operar correctamente.
	ALTO
	Importante para una buena operación. Puede entrar en la segunda iteración del MVP si hay restricciones de tiempo.
	MEDIO
	Útil pero no bloqueante. Se desarrolla después de validar las funcionalidades críticas y altas.
	

Bitobbu — Documento de uso interno exclusivo del equipo de desarrollo.
Bitobbu © 2025  —  Uso interno exclusivoPágina