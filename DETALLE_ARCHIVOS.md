# 📚 Documentación Detallada del Sistema de Gestión de Multas
## Base de Datos II - 2025

---

## 📦 **Estructura del Proyecto**

```
FinalDb2/
├── config/
│   └── db.js                    # Configuración de MongoDB
├── middleware/
│   └── auth.js                  # Middleware de autenticación
├── models/
│   ├── collections.js           # Acceso a colecciones
│   ├── ConductorSchema.js       # Esquema de Conductores
│   ├── VehiculoSchema.js        # Esquema de Vehículos
│   └── MultaSchema.js           # Esquema de Multas
├── routes/
│   ├── api/
│   │   ├── auth.js              # API de autenticación
│   │   ├── conductores.js       # API de conductores
│   │   ├── vehiculos.js         # API de vehículos
│   │   └── multas.js            # API de multas
│   └── views/
│       ├── layouts/
│       │   ├── main.hbs         # Layout principal
│       │   └── login.hbs        # Layout de login
│       ├── partials/
│       │   ├── header.hbs       # Cabecera
│       │   ├── nav.hbs          # Navegación
│       │   ├── footer.hbs       # Pie de página
│       │   └── icons.hbs        # Iconos SVG
│       ├── dashboard.hbs        # Vista del dashboard
│       ├── conductores.hbs      # Vista de conductores
│       ├── vehiculos.hbs        # Vista de vehículos
│       ├── multas.hbs           # Vista de multas
│       └── login.hbs            # Vista de login
├── public/
│   ├── css/
│   │   └── styles.css           # Estilos CSS
│   ├── js/
│   │   └── app.js               # JavaScript del frontend
│   └── favicon.svg              # Favicon
├── scripts/
│   └── fix-vehiculos-index.js   # Script de migración de índices
├── app.js                       # Archivo principal
├── package.json                 # Dependencias
└── .env                         # Variables de entorno
```

---

# 🔧 **ARCHIVOS DE CONFIGURACIÓN**

## 1️⃣ `config/db.js`

**Propósito:** Gestionar la conexión a MongoDB Atlas usando el driver nativo.

### **Líneas clave:**

```javascript
// Líneas 1-5: Importación y configuración inicial
const { MongoClient } = require('mongodb');
require('dotenv').config();
let db;
const client = new MongoClient(process.env.MONGODB_URI);
```

- **`MongoClient`**: Driver nativo de MongoDB (sin Mongoose)
- **`dotenv`**: Carga variables de entorno desde `.env`
- **`db`**: Variable global para almacenar la instancia de la BD
- **`client`**: Cliente de MongoDB para la conexión

### **Función `connectDB()` (líneas 7-25):**

```javascript
const connectDB = async () => {
  try {
    await client.connect();
    // Extrae el nombre de la BD de la URI
    const dbName = new URL(process.env.MONGODB_URI).pathname.substring(1) || 'sistema_multas';
    db = client.db(dbName);
    console.log(`✅ Conectado a MongoDB Atlas - Base de datos: ${dbName}`);
    
    // CREACIÓN DE ÍNDICES (MUY IMPORTANTE PARA BD)
    await db.collection('conductores').createIndex({ email: 1 }, { unique: true });
    await db.collection('vehiculos').createIndex({ placa: 1 }, { unique: true });
    await db.collection('multas').createIndex({ conductorId: 1 });
    
    return db;
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};
```

**Aspectos importantes:**
1. **Conexión asíncrona**: Usa `async/await` para manejar promesas
2. **Extracción del nombre de BD**: Parse de la URI usando `new URL()`
3. **Creación automática de índices**:
   - `email` en conductores: Índice único para evitar emails duplicados
   - `placa` en vehículos: Índice único para evitar placas duplicadas
   - `conductorId` en multas: Índice para mejorar queries de búsqueda
4. **Manejo de errores**: Si falla, termina el proceso con `process.exit(1)`

### **Funciones auxiliares (líneas 27-44):**

```javascript
// Obtener instancia de la BD
const getDB = () => {
  if (!db) throw new Error('No hay conexión a la base de datos.');
  return db;
};

// Obtener una colección específica
const getCollection = (collectionName) => {
  return getDB().collection(collectionName);
};

// Cerrar conexión de forma segura
const closeConnection = async () => {
  try {
    await client.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar la conexión:', error.message);
  }
};
```

**Para presentación:**
- Explicar por qué se usa el driver nativo en lugar de Mongoose
- Destacar la importancia de los índices para performance
- Mencionar el patrón Singleton para la conexión

---

## 2️⃣ `package.json`

**Propósito:** Definir dependencias y scripts del proyecto.

### **Dependencias principales:**

```json
"dependencies": {
  "dotenv": "^17.2.3",           // Variables de entorno
  "express": "^5.1.0",            // Framework web
  "express-handlebars": "^8.0.3", // Motor de plantillas
  "express-session": "^1.18.2",   // Manejo de sesiones
  "mongodb": "^7.0.0"             // Driver de MongoDB
}
```

### **Scripts:**
- `npm start`: Ejecuta `node app.js` (producción)
- `npm run dev`: Ejecuta `nodemon app.js` (desarrollo con auto-reload)

**Para presentación:**
- Mencionar la versión de Express 5 (más reciente)
- Destacar que NO se usa Mongoose (driver nativo)
- Explicar el uso de sesiones en lugar de JWT

---

# 📊 **MODELOS (SCHEMAS)**

## 3️⃣ `models/collections.js`

**Propósito:** Centralizar el acceso a las colecciones de MongoDB.

```javascript
const { getCollection } = require('../config/db');

module.exports = {
  usuarios: () => getCollection('usuarios'),
  conductores: () => getCollection('conductores'),
  multas: () => getCollection('multas'),
  vehiculos: () => getCollection('vehiculos'),
};
```

**Ventajas:**
- **Centralización**: Un único punto de acceso a las colecciones
- **Mantenibilidad**: Si cambia el nombre de una colección, se modifica en un solo lugar
- **Funciones dinámicas**: Cada llamada obtiene la colección actualizada

**Para presentación:**
- Explicar el patrón de diseño (Facade/Wrapper)
- Destacar que las colecciones se obtienen dinámicamente

---

## 4️⃣ `models/ConductorSchema.js`

**Propósito:** Definir la estructura y validaciones de un Conductor.

### **Constructor (líneas 3-13):**

```javascript
class ConductorSchema {
    constructor(nombre, email, dni, licencia, telefono = '', direccion = '') {
        this.nombre = nombre;
        this.email = email;
        this.dni = dni;
        this.licencia = licencia;
        this.telefono = telefono;
        this.direccion = direccion;
        this.puntos = 20;           // Cada conductor inicia con 20 puntos
        this.habilitado = true;     // Por defecto está habilitado
        this.fechaRegistro = new Date();
    }
}
```

**Campos:**
- **Requeridos**: nombre, email, dni, licencia
- **Opcionales**: telefono, direccion
- **Automáticos**: puntos (20), habilitado (true), fechaRegistro (fecha actual)

### **Validaciones (líneas 15-35):**

```javascript
validar() {
    const errores = [];
    
    if (!this.nombre || this.nombre.length < 3) {
        errores.push('El nombre debe tener al menos 3 caracteres');
    }
    
    if (!this.email || !this.email.includes('@')) {
        errores.push('Email válido requerido');
    }
    
    if (!this.dni || this.dni.length < 7) {
        errores.push('DNI válido requerido');
    }
    
    if (!this.licencia || this.licencia.length < 5) {
        errores.push('Licencia válida requerida');
    }
    
    return errores; // Array de errores (vacío si todo está ok)
}
```

**Validaciones implementadas:**
1. Nombre: mínimo 3 caracteres
2. Email: debe contener '@'
3. DNI: mínimo 7 caracteres
4. Licencia: mínimo 5 caracteres

### **Factory Method (líneas 37-46):**

```javascript
static crearDesdeRequest(body) {
    return new ConductorSchema(
        body.nombre,
        body.email,
        body.dni,
        body.licencia,
        body.telefono,
        body.direccion
    );
}
```

**Para presentación:**
- Explicar el sistema de puntos (20 iniciales, se descuentan con multas)
- Mencionar que cuando puntos <= 0, el conductor queda inhabilitado
- Destacar las validaciones a nivel de aplicación (no solo de BD)

---

## 5️⃣ `models/VehiculoSchema.js`

**Propósito:** Definir la estructura y validaciones de un Vehículo.

### **Constructor (líneas 3-11):**

```javascript
class VehiculoSchema {
    constructor(placa, marca, modelo, año, color) {
        this.placa = placa.toUpperCase();  // ¡IMPORTANTE! Normalización
        this.marca = marca;
        this.modelo = modelo;
        this.año = parseInt(año);          // Conversión a número
        this.color = color;
        this.fechaRegistro = new Date();
        this.activo = true;                // Por defecto activo
    }
}
```

**Transformaciones automáticas:**
- `placa.toUpperCase()`: Normaliza la placa a mayúsculas (ABC123 === abc123)
- `parseInt(año)`: Convierte el año a número entero

### **Validaciones (líneas 13-36):**

```javascript
validar() {
    const errores = [];
    
    if (!this.placa || this.placa.length < 6) {
        errores.push('La placa debe tener al menos 6 caracteres');
    }
    
    if (!this.marca || this.marca.length < 2) {
        errores.push('La marca es requerida');
    }
    
    if (!this.modelo || this.modelo.length < 1) {
        errores.push('El modelo es requerido');
    }
    
    if (!this.año || this.año < 1900 || this.año > new Date().getFullYear() + 1) {
        errores.push('El año debe ser válido');
    }
    
    if (!this.color || this.color.length < 2) {
        errores.push('El color es requerido');
    }
    
    return errores;
}
```

**Validaciones implementadas:**
1. Placa: mínimo 6 caracteres
2. Marca: mínimo 2 caracteres
3. Modelo: requerido
4. Año: entre 1900 y año actual + 1
5. Color: mínimo 2 caracteres

**Para presentación:**
- Destacar la normalización automática de la placa
- Explicar por qué se permite año actual + 1 (modelos del próximo año)
- Mencionar el campo `activo` para soft deletes (desactivar sin eliminar)

---

## 6️⃣ `models/MultaSchema.js`

**Propósito:** Definir la estructura de una Multa y sistema de puntos.

### **Constructor (líneas 3-13):**

```javascript
class MultaSchema {
    constructor(dniConductor, placaVehiculo, motivo, monto, gravedad = 'leve') {
        this.dniConductor = dniConductor;         // Relación con Conductor
        this.placaVehiculo = placaVehiculo.toUpperCase();  // Relación con Vehículo
        this.motivo = motivo;
        this.monto = parseFloat(monto);           // Conversión a número decimal
        this.gravedad = gravedad;
        this.fechaInfraccion = new Date();
        this.fechaCreacion = new Date();
        this.pagada = false;                      // Por defecto no pagada
        this.puntosDescontados = this.calcularPuntosDescontados(gravedad);
    }
}
```

**Campos importantes:**
- **Relaciones**: `dniConductor` y `placaVehiculo` (referencias)
- **Transformaciones**: placa en mayúsculas, monto a float
- **Automáticos**: fechas, pagada (false), puntos descontados

### **Sistema de puntos (líneas 15-23):**

```javascript
calcularPuntosDescontados(gravedad) {
    const puntos = {
        'leve': 1,
        'media': 3,
        'grave': 5,
        'muy_grave': 10
    };
    return puntos[gravedad] || 1;
}
```

**Sistema de gravedad:**
- **Leve**: 1 punto
- **Media**: 3 puntos
- **Grave**: 5 puntos
- **Muy Grave**: 10 puntos

### **Validaciones (líneas 25-49):**

```javascript
validar() {
    const errores = [];
    
    if (!this.dniConductor) {
        errores.push('DNI del conductor requerido');
    }
    
    if (!this.placaVehiculo || this.placaVehiculo.length < 6) {
        errores.push('Placa del vehículo requerida');
    }
    
    if (!this.motivo || this.motivo.length < 5) {
        errores.push('Motivo de la multa requerido');
    }
    
    if (!this.monto || this.monto <= 0) {
        errores.push('Monto válido requerido');
    }
    
    if (!this.gravedad) {
        errores.push('Gravedad de la multa requerida');
    }
    
    return errores;
}
```

**Para presentación:**
- **CLAVE**: Explicar cómo las multas afectan los puntos del conductor
- Mostrar que las relaciones se hacen por campos (DNI, placa), no por IDs
- Destacar el sistema de gravedad y su impacto
- Mencionar que cuando un conductor llega a 0 puntos, queda inhabilitado

---

# 🔐 **MIDDLEWARE**

## 7️⃣ `middleware/auth.js`

**Propósito:** Proteger rutas que requieren autenticación.

### **Función `requireAuth` (líneas 2-19):**

```javascript
const requireAuth = (req, res, next) => {
  // Verificar si hay sesión activa
  if (req.session && req.session.user) {
    return next();  // Usuario autenticado, continuar
  }
  
  // Si es una petición AJAX (API), devolver JSON
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(401).json({ 
      success: false,
      error: 'Acceso no autorizado. Debe iniciar sesión.',
      redirectTo: '/login'
    });
  }
  
  // Si es una petición de vista HTML, redirigir
  res.redirect('/login');
};
```

**Lógica:**
1. **Verificar sesión**: `req.session.user` existe?
2. **Si está autenticado**: `next()` (continuar)
3. **Si NO está autenticado**:
   - Petición AJAX → JSON con error 401
   - Petición HTML → Redirección a `/login`

**Diferenciación de peticiones:**
- `req.xhr`: Detecta si es XMLHttpRequest (AJAX)
- `req.headers.accept?.indexOf('json')`: Detecta si acepta JSON

### **Función `requireRole` (líneas 21-28):**

```javascript
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === role) {
      return next();
    }
    res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
  };
};
```

**Para presentación:**
- Explicar el uso de sesiones vs JWT (más simple para este caso)
- Destacar la diferenciación entre peticiones API y HTML
- Mencionar el código 401 (Unauthorized) y 403 (Forbidden)

---

# 🌐 **APIs (RUTAS BACKEND)**

## 8️⃣ `routes/api/auth.js`

**Propósito:** Manejar autenticación (login/logout).

### **Credenciales hardcoded (líneas 5-8):**

```javascript
const DEFAULT_USER = {
  usuario: 'alumno',
  password: 'alu123'
};
```

**Nota:** En un sistema real, las contraseñas estarían hasheadas en BD.

### **POST `/api/auth/login` (líneas 11-51):**

```javascript
router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;

    // Validar que se envíen las credenciales
    if (!usuario || !password) {
      return res.render('login', {
        title: 'Iniciar Sesión',
        layout: 'login',
        error: 'Usuario y contraseña son requeridos'
      });
    }

    // Verificar credenciales
    if (usuario === DEFAULT_USER.usuario && password === DEFAULT_USER.password) {
      // Crear sesión
      req.session.user = {
        usuario: DEFAULT_USER.usuario,
        role: 'admin',
        loginTime: new Date()
      };
      
      // Redirigir al dashboard
      return res.redirect('/');
    }

    // Credenciales incorrectas
    return res.render('login', {
      title: 'Iniciar Sesión',
      layout: 'login',
      error: 'Credenciales inválidas. Use: alumno / alu123'
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.render('login', {
      title: 'Iniciar Sesión',
      layout: 'login',
      error: 'Error interno del servidor'
    });
  }
});
```

**Flujo:**
1. Recibir `usuario` y `password` del formulario
2. Validar que ambos campos existan
3. Comparar con credenciales hardcoded
4. Si coinciden → crear sesión y redirigir a `/`
5. Si no coinciden → renderizar login con error

### **POST `/api/auth/logout` (líneas 54-62):**

```javascript
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error cerrando sesión:', err);
    }
    // Redirigir al login después del logout
    res.redirect('/login');
  });
});
```

**Para presentación:**
- Explicar cómo funcionan las sesiones con `express-session`
- Mencionar que las sesiones se almacenan en memoria (en producción se usaría Redis/MongoDB)
- Destacar la simplicidad vs JWT para aplicaciones pequeñas

---

## 9️⃣ `routes/api/conductores.js`

**Propósito:** CRUD completo de conductores.

### **GET `/api/conductores` (líneas 9-16):**

```javascript
router.get('/', requireAuth, async (req, res) => {
  try {
    const todosConductores = await conductores().find().toArray();
    res.json(todosConductores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**MongoDB Query:**
- `find()`: Obtiene todos los documentos (sin filtro)
- `toArray()`: Convierte el cursor a array

### **POST `/api/conductores` (líneas 19-68):**

```javascript
router.post('/', requireAuth, async (req, res) => {
  try {
    // 1. Crear instancia del schema
    const instanciaConductor = ConductorSchema.crearDesdeRequest(req.body);
    
    // 2. Validar el schema
    const errores = instanciaConductor.validar();
    if (errores.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: errores.join(', ') 
      });
    }

    // 3. Verificar si ya existe un conductor con este DNI
    const conductorExistente = await conductores().findOne({ dni: instanciaConductor.dni });
    if (conductorExistente) {
      return res.status(400).json({ 
        success: false,
        error: 'Ya existe un conductor con este DNI' 
      });
    }

    // 4. Verificar si ya existe un conductor con esta licencia
    const licenciaExistente = await conductores().findOne({ licencia: instanciaConductor.licencia });
    if (licenciaExistente) {
      return res.status(400).json({ 
        success: false,
        error: 'Ya existe un conductor con esta licencia' 
      });
    }

    // 5. Guardar en la base de datos
    const resultado = await conductores().insertOne(instanciaConductor);
    
    console.log('Conductor creado con ID:', resultado.insertedId);
    res.json({ 
      success: true,
      message: 'Conductor registrado exitosamente',
      conductorId: resultado.insertedId
    });
    
  } catch (error) {
    console.error('Error creando conductor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor: ' + error.message 
    });
  }
});
```

**Flujo de validación:**
1. Crear instancia desde el request (usando Factory Method)
2. Validar campos con el método `validar()`
3. Verificar unicidad de DNI (query a BD)
4. Verificar unicidad de licencia (query a BD)
5. Insertar en MongoDB con `insertOne()`

**MongoDB Queries:**
- `findOne({ dni })`: Busca un documento por DNI
- `insertOne(objeto)`: Inserta un nuevo documento

### **GET `/api/conductores/buscar/:dni` (líneas 71-93):**

```javascript
router.get('/buscar/:dni', requireAuth, async (req, res) => {
  try {
    const { dni } = req.params;
    const conductor = await conductores().findOne({ dni: dni });
    
    if (!conductor) {
      return res.json({ 
        success: false,
        conductor: null 
      });
    }

    res.json({
      success: true,
      conductor
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});
```

**Uso:** Cuando se crea una multa, se busca el conductor por DNI para verificar que existe.

### **DELETE `/api/conductores/:id` (líneas 96-143):**

```javascript
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID no sea undefined o inválido
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        success: false, 
        error: 'ID inválido' 
      });
    }

    // Convertir string ID a ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Formato de ID inválido' 
      });
    }

    // Eliminar de MongoDB
    const result = await conductores().deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conductor no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Conductor eliminado exitosamente' 
    });
    
  } catch (error) {
    console.error('Error eliminando conductor:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor: ' + error.message 
    });
  }
});
```

**MongoDB Queries:**
- `new ObjectId(id)`: Convierte string a ObjectId de MongoDB
- `deleteOne({ _id })`: Elimina un documento por ID

**Para presentación:**
- Destacar el uso de `findOne()` para verificar existencia antes de insertar
- Explicar la diferencia entre `insertOne()` y `insertMany()`
- Mencionar `deletedCount` para verificar si se eliminó algo
- Explicar `ObjectId` de MongoDB (ID hexadecimal de 24 caracteres)

---

## 🔟 `routes/api/vehiculos.js`

**Propósito:** CRUD completo de vehículos.

### **Estructura similar a conductores:**

**GET `/api/vehiculos` (líneas 8-15):**
```javascript
router.get('/', requireAuth, async (req, res) => {
  try {
    const todosVehiculos = await vehiculos().find().toArray();
    res.json(todosVehiculos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### **POST `/api/vehiculos` (líneas 18-58):**

**Diferencia clave:** Verificación de placa única

```javascript
// Verificar si ya existe un vehículo con esta placa
const vehiculoExistente = await vehiculos().findOne({ placa: instanciaVehiculo.placa });
if (vehiculoExistente) {
  return res.status(400).json({ 
    success: false,
    error: 'Ya existe un vehículo con esta placa' 
  });
}
```

### **GET `/api/vehiculos/buscar/:placa` (líneas 61-83):**

**Importante:** Normalización de la placa a mayúsculas

```javascript
router.get('/buscar/:placa', requireAuth, async (req, res) => {
  try {
    const { placa } = req.params;
    // Convertir a mayúsculas para búsqueda case-insensitive
    const vehiculo = await vehiculos().findOne({ placa: placa.toUpperCase() });
    
    if (!vehiculo) {
      return res.json({ 
        success: false,
        vehiculo: null 
      });
    }

    res.json({
      success: true,
      vehiculo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});
```

**Para presentación:**
- Destacar la normalización automática de placas (ABC123 = abc123)
- Explicar cómo el índice único previene duplicados a nivel de BD
- Mencionar el problema resuelto del índice `patente_1` (ver script)

---

## 1️⃣1️⃣ `routes/api/multas.js`

**Propósito:** CRUD de multas con lógica compleja de validación.

### **GET `/api/multas` (líneas 9-16):**

```javascript
router.get('/', requireAuth, async (req, res) => {
  try {
    const todasMultas = await multas()
      .find()
      .sort({ fechaInfraccion: -1 })  // Ordenar por fecha descendente
      .toArray();
    res.json(todasMultas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**MongoDB Query:**
- `sort({ fechaInfraccion: -1 })`: Ordena por fecha, más recientes primero

### **POST `/api/multas` (líneas 19-80):**

**LÓGICA COMPLEJA - Validación de relaciones y actualización de puntos**

```javascript
router.post('/', requireAuth, async (req, res) => {
  try {
    // 1. Crear instancia del schema
    const instanciaMulta = MultaSchema.crearDesdeRequest(req.body);
    
    // 2. Validar el schema
    const errores = instanciaMulta.validar();
    if (errores.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: errores.join(', ') 
      });
    }

    // 3. Verificar que el conductor existe por DNI
    const conductor = await conductores().findOne({ dni: instanciaMulta.dniConductor });
    if (!conductor) {
      return res.status(404).json({ 
        success: false,
        error: 'Conductor no encontrado. Verifique el DNI.' 
      });
    }

    // 4. Verificar que el vehículo existe por placa
    const vehiculo = await vehiculos().findOne({ placa: instanciaMulta.placaVehiculo });
    if (!vehiculo) {
      return res.status(404).json({ 
        success: false,
        error: 'Vehículo no encontrado. Verifique la placa.' 
      });
    }

    // 5. Actualizar puntos del conductor (¡IMPORTANTE!)
    const nuevosPuntos = conductor.puntos - instanciaMulta.puntosDescontados;
    await conductores().updateOne(
      { dni: instanciaMulta.dniConductor },
      { 
        $set: { 
          puntos: Math.max(0, nuevosPuntos),    // No puede ser negativo
          habilitado: nuevosPuntos > 0           // Si puntos <= 0, inhabilitado
        } 
      }
    );

    // 6. Guardar la multa en la base de datos
    const resultado = await multas().insertOne(instanciaMulta);
    
    console.log('Multa creada con ID:', resultado.insertedId);
    res.json({ 
      success: true,
      message: 'Multa registrada exitosamente',
      multaId: resultado.insertedId
    });
    
  } catch (error) {
    console.error('Error creando multa:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor: ' + error.message 
    });
  }
});
```

**Flujo completo:**
1. Validar campos de la multa
2. **Verificar que el conductor existe** (buscar por DNI)
3. **Verificar que el vehículo existe** (buscar por placa)
4. **Calcular nuevos puntos** del conductor
5. **Actualizar puntos y estado** del conductor en BD
6. **Insertar la multa**

**MongoDB Queries clave:**
- `findOne({ dni })`: Buscar conductor
- `findOne({ placa })`: Buscar vehículo
- `updateOne({ dni }, { $set: { ... } })`: Actualizar puntos
- `Math.max(0, nuevosPuntos)`: Asegurar que puntos no sean negativos

### **POST `/api/multas/:id/pagar` (líneas 83-146):**

```javascript
router.post('/:id/pagar', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar ID
        if (!id || id === 'undefined') {
            return res.status(400).json({ 
                success: false, 
                error: 'ID inválido' 
            });
        }

        // Convertir a ObjectId
        let objectId;
        try {
            objectId = new ObjectId(id);
        } catch (error) {
            return res.status(400).json({ 
                success: false, 
                error: 'Formato de ID inválido' 
            });
        }

        // Actualizar multa
        const result = await multas().updateOne(
            { _id: objectId },
            { 
                $set: { 
                    pagada: true,
                    fechaPago: new Date()
                } 
            }
        );

        // Verificar resultados
        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Multa no encontrada' 
            });
        }

        if (result.modifiedCount === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'La multa ya estaba marcada como pagada',
                alreadyPaid: true
            });
        }

        res.json({ 
            success: true, 
            message: 'Multa marcada como pagada exitosamente' 
        });
        
    } catch (error) {
        console.error('Error marcando multa como pagada:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor: ' + error.message 
        });
    }
});
```

**MongoDB Update:**
- `matchedCount`: Número de documentos que coincidieron con el filtro
- `modifiedCount`: Número de documentos realmente modificados
- Si `modifiedCount === 0` pero `matchedCount > 0` → ya estaba pagada

**Para presentación:**
- **MUY IMPORTANTE**: Destacar la lógica de validación de relaciones
- Explicar cómo se actualizan los puntos del conductor automáticamente
- Mostrar el uso de `$set` para actualizaciones parciales
- Mencionar la diferencia entre `matchedCount` y `modifiedCount`

---

# 🎨 **FRONTEND**

## 1️⃣2️⃣ `public/js/app.js`

**Propósito:** JavaScript del cliente para interactividad.

### **Sistema de Toasts (líneas 8-68):**

```javascript
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 5000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Iconos SVG según tipo
        const icons = {
            success: '<svg>...</svg>',
            error: '<svg>...</svg>',
            warning: '<svg>...</svg>',
            info: '<svg>...</svg>'
        };
        
        toast.innerHTML = `
            ${icons[type] || icons.info}
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg>...</svg>
            </button>
        `;
        
        this.container.appendChild(toast);
        
        // Auto-cerrar después de 'duration' milisegundos
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    },
    
    // Métodos auxiliares
    success(message, duration) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration) {
        this.show(message, 'error', duration);
    }
};
```

**Uso:** `Toast.success('Conductor registrado exitosamente');`

### **Sistema de Modales (líneas 73-135):**

```javascript
const Modal = {
    show(title, message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        
        overlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    ${message}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-cancel" id="modal-cancel">Cancelar</button>
                    <button class="btn btn-danger" id="modal-confirm">Confirmar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Event listeners
        const confirmBtn = overlay.querySelector('#modal-confirm');
        const cancelBtn = overlay.querySelector('#modal-cancel');
        
        confirmBtn.addEventListener('click', () => {
            overlay.remove();
            if (onConfirm) onConfirm();
        });
        
        cancelBtn.addEventListener('click', () => {
            overlay.remove();
            if (onCancel) onCancel();
        });
    }
};
```

**Uso:**
```javascript
Modal.show('Confirmar Eliminación', '¿Estás seguro?', () => {
    // Código si confirma
}, () => {
    // Código si cancela
});
```

### **Manejo de autenticación (líneas 140-149):**

```javascript
function handleAuthError(data) {
    if (data.redirectTo === '/login') {
        Toast.error('Sesión expirada. Redirigiendo al login...');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return true;
    }
    return false;
}
```

### **Eliminación de conductores (líneas 154-189):**

```javascript
function eliminarConductor(id, nombre) {
    // Mostrar modal de confirmación
    Modal.show(
        'Confirmar Eliminación',
        `¿Estás seguro de que deseas eliminar al conductor "${nombre}"?`,
        () => {
            // Si confirma, hacer fetch DELETE
            fetch(`/api/conductores/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin'  // Enviar cookies de sesión
            })
            .then(response => {
                if (response.status === 401) {
                    return response.json().then(data => {
                        handleAuthError(data);
                        throw new Error('No autorizado');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    Toast.success('Conductor eliminado exitosamente');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Toast.error(data.error || 'Error al eliminar el conductor');
                }
            })
            .catch(error => {
                if (error.message !== 'No autorizado') {
                    console.error('Error:', error);
                    Toast.error('Error de conexión');
                }
            });
        }
    );
}
```

**Flujo:**
1. Usuario hace clic en "Eliminar"
2. Se muestra modal de confirmación
3. Si confirma → `fetch DELETE` a la API
4. Si respuesta es 401 → redirigir a login
5. Si es exitoso → mostrar toast y recargar página

### **Autosugerencia de gravedad y monto (líneas 369-419):**

```javascript
function sugerirGravedadYMonto() {
    const motivoSelect = document.getElementById('motivo');
    const gravedadSelect = document.getElementById('gravedad');
    const montoInput = document.getElementById('monto');
    
    const motivo = motivoSelect.value;
    
    // Mapeo de motivos a gravedad y monto
    const sugerencias = {
        'Estacionamiento indebido': { gravedad: 'leve', monto: 5000 },
        'Exceso de velocidad moderado': { gravedad: 'media', monto: 15000 },
        'Pasarse semáforo en rojo': { gravedad: 'grave', monto: 25000 },
        'Conducir en estado de ebriedad': { gravedad: 'muy_grave', monto: 80000 },
        // ... más motivos
    };
    
    const sugerencia = sugerencias[motivo];
    
    if (sugerencia) {
        gravedadSelect.value = sugerencia.gravedad;
        montoInput.value = sugerencia.monto;
        actualizarInfoPuntos();
    }
}
```

**Para presentación:**
- Explicar el uso de `fetch` API para peticiones AJAX
- Destacar `credentials: 'same-origin'` para enviar cookies de sesión
- Mostrar cómo se manejan errores 401 (sesión expirada)
- Explicar el patrón de confirmación con modales

---

# 🖼️ **VISTAS (HANDLEBARS)**

## 1️⃣3️⃣ `routes/views/layouts/main.hbs`

**Propósito:** Layout principal de la aplicación.

```handlebars
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    {{> header}}
    {{> nav}}
    
    <main class="main-content">
        {{{body}}}
    </main>
    
    {{> footer}}
    
    <script src="/js/app.js"></script>
</body>
</html>
```

**Elementos clave:**
- `{{title}}`: Variable dinámica
- `{{> header}}`: Partial de header
- `{{{body}}}`: Contenido de cada vista (sin escapar HTML)
- `{{> footer}}`: Partial de footer

## 1️⃣4️⃣ `routes/views/dashboard.hbs`

**Propósito:** Vista principal del sistema con estadísticas.

```handlebars
<div class="dashboard-page">
    <h1>
        <svg>...</svg>
        Dashboard
    </h1>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon">
                <svg>...</svg>
            </div>
            <div class="stat-info">
                <h3>{{totalConductores}}</h3>
                <p>Total Conductores</p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">
                <svg>...</svg>
            </div>
            <div class="stat-info">
                <h3>{{multasPendientes}}</h3>
                <p>Multas Pendientes</p>
            </div>
        </div>
        
        <!-- Más cards... -->
    </div>
</div>
```

**Datos dinámicos:**
- `{{totalConductores}}`
- `{{totalVehiculos}}`
- `{{totalMultas}}`
- `{{multasPendientes}}`
- `{{multasPagas}}`
- `{{tasaPago}}`

---

## 1️⃣5️⃣ `routes/views/multas.hbs`

**Select de motivos predefinidos:**

```handlebars
<select id="motivo" name="motivo" required>
    <option value="">Seleccione el motivo</option>
    
    <optgroup label="🟢 Infracciones Leves">
        <option value="Estacionamiento indebido">Estacionamiento indebido</option>
        <option value="No usar cinturón de seguridad">No usar cinturón de seguridad</option>
        <option value="Luces apagadas de noche">Luces apagadas de noche</option>
        <option value="Documentación vencida">Documentación vencida</option>
    </optgroup>
    
    <optgroup label="🟡 Infracciones Medias">
        <option value="Exceso de velocidad moderado">Exceso de velocidad moderado</option>
        <option value="Usar celular mientras conduce">Usar celular mientras conduce</option>
        <option value="No respetar semáforo en amarillo">No respetar semáforo en amarillo</option>
        <option value="Giro prohibido">Giro prohibido</option>
    </optgroup>
    
    <optgroup label="🟠 Infracciones Graves">
        <option value="Exceso de velocidad grave">Exceso de velocidad grave</option>
        <option value="Pasarse semáforo en rojo">Pasarse semáforo en rojo</option>
        <option value="Conducir sin licencia">Conducir sin licencia</option>
        <option value="Maniobra peligrosa">Maniobra peligrosa</option>
    </optgroup>
    
    <optgroup label="🔴 Infracciones Muy Graves">
        <option value="Conducir en estado de ebriedad">Conducir en estado de ebriedad</option>
        <option value="Exceso de velocidad extremo">Exceso de velocidad extremo</option>
        <option value="Conducir bajo efectos de drogas">Conducir bajo efectos de drogas</option>
        <option value="Fuga del lugar del accidente">Fuga del lugar del accidente</option>
    </optgroup>
</select>
```

**Para presentación:**
- Destacar el uso de `<optgroup>` para agrupar opciones
- Explicar cómo el frontend sugiere automáticamente gravedad y monto

---

# 🔧 **SCRIPTS DE MANTENIMIENTO**

## 1️⃣6️⃣ `scripts/fix-vehiculos-index.js`

**Propósito:** Solucionar el problema del índice legacy `patente_1`.

### **Problema:**
El sistema original usaba el campo `patente`, pero se cambió a `placa`. MongoDB tenía un índice único en `patente`, causando errores al insertar vehículos nuevos.

### **Solución:**

```javascript
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixVehiculosIndex() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const dbName = new URL(process.env.MONGODB_URI).pathname.substring(1);
        const db = client.db(dbName);
        
        // 1. Listar índices actuales
        const indexes = await db.collection('vehiculos').indexes();
        console.log('Índices actuales:', indexes);
        
        // 2. Eliminar índice antiguo "patente_1"
        try {
            await db.collection('vehiculos').dropIndex('patente_1');
            console.log('✅ Índice "patente_1" eliminado');
        } catch (error) {
            console.log('ℹ️  El índice "patente_1" no existe');
        }
        
        // 3. Crear índice correcto en "placa"
        try {
            await db.collection('vehiculos').createIndex({ placa: 1 }, { unique: true });
            console.log('✅ Índice "placa_1" creado');
        } catch (error) {
            console.log('ℹ️  El índice en "placa" ya existe');
        }
        
        console.log('✅ ¡Índices corregidos!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

fixVehiculosIndex();
```

**Ejecución:**
```bash
cd scripts
node fix-vehiculos-index.js
```

**Para presentación:**
- Explicar el concepto de índices en MongoDB
- Mostrar cómo los índices únicos previenen duplicados
- Destacar la importancia de mantener los índices sincronizados con el código

---

# 📝 **ARCHIVO PRINCIPAL**

## 1️⃣7️⃣ `app.js`

**Propósito:** Punto de entrada y configuración de la aplicación.

### **Configuración de Handlebars (líneas 21-43):**

```javascript
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "routes/views/layouts"),
    partialsDir: path.join(__dirname, "routes/views/partials"),
    helpers: {
      // Helper para comparar igualdad
      eq: function (a, b) {
        return a === b;
      },
      // Helper para comparar mayor que
      gt: function (a, b) {
        return a > b;
      },
      // Helper para formatear fechas
      formatDate: function (date) {
        return date ? new Date(date).toLocaleDateString("es-AR") : "N/A";
      },
      // Helper para formatear montos
      formatCurrency: function (amount) {
        return amount ? "$" + parseFloat(amount).toLocaleString("es-AR") : "$0";
      },
    },
  })
);
```

**Handlebars Helpers:**
- `eq`: Para comparaciones en templates (ej: `{{#if (eq status 'activo')}}`)
- `gt`: Para comparar si un número es mayor que otro
- `formatDate`: Formatea fechas en formato argentino
- `formatCurrency`: Formatea números como moneda argentina

### **Configuración de sesiones (líneas 59-69):**

```javascript
app.use(
  session({
    secret: process.env.SESSION_SECRET || "sistema-multas-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,          // true en producción con HTTPS
      maxAge: 24 * 60 * 60 * 1000,  // 24 horas
    },
  })
);
```

**Configuración:**
- `secret`: Clave para firmar las cookies de sesión
- `resave: false`: No guardar sesión si no cambió
- `saveUninitialized: false`: No crear sesión hasta que se almacene algo
- `maxAge`: Duración de la sesión (24 horas)

### **Middleware para prevenir caché (líneas 79-84):**

```javascript
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
```

**Propósito:** Evitar que el navegador cachee respuestas de API, especialmente importante para el endpoint de pagar multas.

### **Rutas de vistas (líneas 113-224):**

**Dashboard con estadísticas:**
```javascript
app.get("/", requireAuth, async (req, res) => {
  try {
    const { conductores, vehiculos, multas } = require("./models/collections");

    const totalConductores = await conductores().countDocuments();
    const totalVehiculos = await vehiculos().countDocuments();
    const totalMultas = await multas().countDocuments();
    const multasPendientes = await multas().countDocuments({ pagada: false });
    const multasPagas = await multas().countDocuments({ pagada: true });
    const tasaPago = totalMultas > 0 ? Math.round((multasPagas / totalMultas) * 100) : 0;

    res.render("dashboard", {
      title: "Dashboard - Sistema de Multas",
      totalConductores,
      totalVehiculos,
      totalMultas,
      multasPendientes,
      multasPagas,
      tasaPago,
    });
  } catch (error) {
    console.error("Error cargando dashboard:", error);
    // Renderizar con valores por defecto en caso de error
  }
});
```

**MongoDB Queries:**
- `countDocuments()`: Contar todos los documentos
- `countDocuments({ pagada: false })`: Contar con filtro
- `Math.round((multasPagas / totalMultas) * 100)`: Calcular porcentaje

**Para presentación:**
- Explicar la estructura MVC completa
- Destacar el uso de middleware para funcionalidad transversal
- Mostrar cómo se protegen las rutas con `requireAuth`
- Explicar las queries de agregación para el dashboard

---

# 🎯 **PUNTOS CLAVE PARA LA PRESENTACIÓN**

## **Aspectos de Base de Datos:**

1. **MongoDB sin Mongoose**
   - Driver nativo para control total
   - Queries directas a la BD

2. **Índices únicos**
   - `email` en conductores
   - `placa` en vehículos
   - Prevención de duplicados a nivel de BD

3. **Relaciones entre colecciones**
   - Sin JOINs (NoSQL)
   - Referencias por campos (DNI, placa)
   - Validación manual de relaciones

4. **Operaciones CRUD completas**
   - `find()`, `findOne()`: Lectura
   - `insertOne()`: Creación
   - `updateOne()`, `$set`: Actualización
   - `deleteOne()`: Eliminación

5. **Agregaciones y estadísticas**
   - `countDocuments()`: Conteo
   - `sort()`: Ordenamiento
   - Cálculos en el backend

## **Aspectos de API:**

1. **APIs RESTful**
   - GET: Listar y buscar
   - POST: Crear
   - DELETE: Eliminar
   - Códigos HTTP correctos (200, 400, 401, 404, 500)

2. **Validaciones en múltiples capas**
   - Nivel 1: Schema (ConductorSchema.validar())
   - Nivel 2: API (verificar existencia)
   - Nivel 3: Base de datos (índices únicos)

3. **Manejo de sesiones**
   - `express-session`
   - Autenticación stateful
   - Middleware `requireAuth`

4. **Respuestas consistentes**
   - JSON con `success: true/false`
   - Mensajes de error descriptivos
   - Códigos de estado apropiados

---

**¡Éxito en la presentación! 🚀**

