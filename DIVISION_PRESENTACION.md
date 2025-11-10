# División de Temas para Presentación
## Sistema de Gestión de Multas - Base de Datos II

---

## 👤 **Persona 1: Ezequiel DiGiacomo**
### **Tema: Arquitectura General y Configuración de Base de Datos**

#### **1. Introducción al Proyecto (2-3 min)**
- Descripción general del sistema
- Objetivo y funcionalidades principales
- Stack tecnológico utilizado

#### **2. Arquitectura de la Aplicación (3-4 min)**
- **Estructura del proyecto MVC**
  - Modelo (Models/Schemas)
  - Vista (Handlebars templates)
  - Controlador (Routes/API)
- **Archivo `app.js`** (líneas 1-92)
  - Configuración de Express
  - Middlewares utilizados
  - Configuración de sesiones
  - Handlebars helpers personalizados

#### **3. Conexión a MongoDB (2-3 min)**
- **Archivo `config/db.js`**
  - Estrategia de conexión con MongoDB
  - Variables de entorno y configuración
  - Manejo de errores de conexión
- **Archivo `models/collections.js`**
  - Funciones para acceder a las colecciones
  - Patrón de diseño utilizado

#### **4. Estructura de Base de Datos (2-3 min)**
- **Colecciones principales:**
  - `conductores`
  - `vehiculos`
  - `multas`
- **Índices creados:**
  - Índice único en `conductores.dni`
  - Índice único en `conductores.email`
  - Índice único en `vehiculos.placa`
- **Relaciones entre colecciones:**
  - Multa → Conductor (por DNI)
  - Multa → Vehículo (por placa)

---

## 👤 **Persona 2: Jimena Maldonado**
### **Tema: API y Base de Datos de Conductores**

#### **1. Esquema de Conductores (2-3 min)**
- **Archivo `models/ConductorSchema.js`**
  - Estructura del documento:
    ```javascript
    {
      nombre, email, dni, licencia,
      telefono, direccion, puntos,
      habilitado, fechaRegistro
    }
    ```
  - **Sistema de puntos:** Cada conductor inicia con 20 puntos
  - **Validaciones del modelo:**
    - Nombre mínimo 3 caracteres
    - Email válido con formato
    - DNI mínimo 7 caracteres
    - Licencia mínimo 5 caracteres
  - Método `crearDesdeRequest()`

#### **2. API REST de Conductores (5-6 min)**
- **Archivo `routes/api/conductores.js`**

##### **Endpoints principales:**

**GET `/api/conductores`**
- Listar todos los conductores
- Respuesta JSON con array de conductores

**POST `/api/conductores`**
- Crear nuevo conductor
- Validaciones:
  - DNI único (no duplicados)
  - Email único
- Respuesta JSON: `{success: true, conductorId}`

**GET `/api/conductores/buscar/:dni`**
- Buscar conductor por DNI
- Usado para relaciones con multas
- Respuesta: `{success: true/false, conductor: {...}}`

**DELETE `/api/conductores/:id`**
- Eliminar conductor por ID
- Validación de existencia
- Respuesta JSON confirmando eliminación

#### **3. Características de BD (2 min)**
- **Índices únicos aplicados:**
  - Campo `dni`: Previene conductores duplicados
  - Campo `email`: Previene emails duplicados
- **Manejo de errores E11000** (duplicate key)
- **Queries agregadas:**
  - Conteo de conductores habilitados
  - Sistema de puntos con actualización

---

## 👤 **Persona 3: Mariel Boher**
### **Tema: API y Base de Datos de Vehículos**

#### **1. Esquema de Vehículos (2-3 min)**
- **Archivo `models/VehiculoSchema.js`**
  - Estructura del documento:
    ```javascript
    {
      placa, marca, modelo, año,
      color, fechaRegistro, activo
    }
    ```
  - **Transformaciones automáticas:**
    - Placa siempre en mayúsculas
    - Año convertido a entero
  - **Validaciones del modelo:**
    - Placa mínimo 6 caracteres
    - Marca y modelo requeridos
    - Año válido (1900 - año actual + 1)
    - Color requerido
  - Método `crearDesdeRequest()`

#### **2. API REST de Vehículos (5-6 min)**
- **Archivo `routes/api/vehiculos.js`**

##### **Endpoints principales:**

**GET `/api/vehiculos`**
- Listar todos los vehículos
- Respuesta JSON con array de vehículos

**POST `/api/vehiculos`**
- Crear nuevo vehículo
- Validaciones:
  - Placa única (no duplicados)
  - Formato de placa válido
- Respuesta JSON: `{success: true, vehiculoId}`

**GET `/api/vehiculos/buscar/:placa`**
- Buscar vehículo por placa
- Usado para relaciones con multas
- Conversión automática a mayúsculas
- Respuesta: `{success: true/false, vehiculo: {...}}`

**DELETE `/api/vehiculos/:id`**
- Eliminar vehículo por ID (ObjectId)
- Validación de formato de ID
- Respuesta JSON confirmando eliminación

#### **3. Características de BD (2 min)**
- **Índice único en campo `placa`:**
  - Previene vehículos duplicados
  - Case-sensitive
- **Problema resuelto: índice `patente_1`**
  - Script `fix-vehiculos-index.js`
  - Migración de campo legacy
- **Queries agregadas:**
  - Conteo de vehículos activos
  - Filtro por estado

---

## 👤 **Persona 4: Natalia Sablich**
### **Tema: API de Multas y Sistema de Autenticación**

#### **1. Esquema de Multas (2-3 min)**
- **Archivo `models/MultaSchema.js`**
  - Estructura del documento:
    ```javascript
    {
      dniConductor, placaVehiculo,
      motivo, monto, gravedad,
      fechaInfraccion, fechaCreacion,
      pagada, puntosDescontados
    }
    ```
  - **Sistema de gravedad:**
    - `leve`: 1 punto
    - `media`: 3 puntos
    - `grave`: 5 puntos
    - `muy_grave`: 10 puntos
  - **Relaciones con otras colecciones:**
    - Campo `dniConductor` → enlaza con Conductores
    - Campo `placaVehiculo` → enlaza con Vehículos
  - Método `calcularPuntosDescontados()`

#### **2. API REST de Multas (4-5 min)**
- **Archivo `routes/api/multas.js`**

##### **Endpoints principales:**

**GET `/api/multas`**
- Listar todas las multas
- Ordenadas por `fechaInfraccion` descendente

**POST `/api/multas`**
- Crear nueva multa
- **Validaciones complejas:**
  1. Verificar que conductor existe (por DNI)
  2. Verificar que vehículo existe (por placa)
  3. Calcular puntos según gravedad
  4. **Actualizar puntos del conductor**
- Respuesta JSON: `{success: true, multaId}`

**POST `/api/multas/:id/pagar`**
- Marcar multa como pagada
- Actualizar campo `pagada: true`
- Validaciones:
  - Multa existe
  - Multa no estaba ya pagada
- Respuesta diferenciada según caso

**GET `/api/multas` (con agregaciones)**
- Estadísticas en Dashboard:
  - Total de multas
  - Multas pendientes
  - Multas pagadas
  - Tasa de pago

#### **3. Sistema de Autenticación (3-4 min)**
- **Archivo `routes/api/auth.js`**

##### **POST `/api/auth/login`**
- Autenticación de usuario
- **Hardcoded credentials** (demo):
  - Usuario: `alumno`
  - Contraseña: `alu123`
- Creación de sesión con `express-session`
- Respuesta JSON o redirección

##### **POST `/api/auth/logout`**
- Destruir sesión
- Redirección a login

#### **4. Middleware de Autenticación (1-2 min)**
- **Archivo `middleware/auth.js`**
- Función `requireAuth`:
  - Verifica sesión activa
  - Diferencia entre peticiones AJAX y vistas
  - Respuestas 401 para API
  - Redirección para vistas HTML

#### **5. Características Avanzadas de BD (1-2 min)**
- **Transaccionalidad implícita:**
  - Actualización de puntos al crear multa
- **Queries con múltiples colecciones:**
  - Validación de existencia antes de crear relaciones
- **Cache-Control headers:**
  - Prevención de caché en APIs

---

## 📊 **Distribución de Tiempo Sugerida**

| Persona | Tema Principal | Tiempo | Enfoque BD/API |
|---------|---------------|--------|----------------|
| Ezequiel | Arquitectura + BD General | 9-12 min | 60% BD, 40% Arquitectura |
| Jimena | Conductores | 9-11 min | 40% BD, 60% API |
| Mariel | Vehículos | 9-11 min | 40% BD, 60% API |
| Natalia | Multas + Auth | 10-13 min | 50% BD, 50% API |

**Total: 37-47 minutos** (ajustar según requerimientos)

---

## 🎯 **Consejos para la Presentación**

### **Elementos comunes a destacar:**
1. **MongoDB sin Mongoose**: Uso del driver nativo
2. **Validaciones a nivel de aplicación**: Schemas personalizados
3. **APIs RESTful**: Siguiendo convenciones HTTP
4. **Manejo de errores**: Respuestas JSON consistentes
5. **Relaciones entre colecciones**: Sin JOINs, usando referencias por campos

### **Aspectos técnicos importantes:**
- **Índices únicos**: Prevención de duplicados a nivel de BD
- **Validaciones en dos capas**: Schema + API
- **Sesiones con express-session**: Autenticación stateful
- **Middleware de autenticación**: Protección de rutas
- **Normalización de datos**: Mayúsculas en placas, parseo de números

### **Demostración práctica sugerida:**
1. Mostrar conexión a MongoDB
2. Crear un conductor (POST)
3. Crear un vehículo (POST)
4. Crear una multa que relacione ambos
5. Mostrar cómo se actualizan los puntos del conductor
6. Marcar multa como pagada

---

## 📝 **Archivos clave por persona**

### **Ezequiel:**
- `app.js` (líneas 1-92)
- `config/db.js`
- `models/collections.js`

### **Jimena:**
- `models/ConductorSchema.js`
- `routes/api/conductores.js`

### **Mariel:**
- `models/VehiculoSchema.js`
- `routes/api/vehiculos.js`
- `scripts/fix-vehiculos-index.js`

### **Natalia:**
- `models/MultaSchema.js`
- `routes/api/multas.js`
- `routes/api/auth.js`
- `middleware/auth.js`

---

**¡Éxito en la presentación! 🚀**

