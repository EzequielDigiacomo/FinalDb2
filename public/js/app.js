const express = require('express');
const session = require('express-session');
const path = require('path');
const { engine } = require('express-handlebars');
require('dotenv').config();

// Importar conexión a BD
const { connectDB } = require('./config/db');

// Importar rutas
const authRoutes = require('./routes/auth');
const conductoresRoutes = require('./routes/conductores');
const vehiculosRoutes = require('./routes/vehiculos');
const multasRoutes = require('./routes/multas');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Handlebars
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        eq: (a, b) => a === b,
        formatDate: (date) => new Date(date).toLocaleDateString('es-AR'),
        formatCurrency: (amount) => '$' + parseFloat(amount).toLocaleString('es-AR'),
        ifCond: function (v1, operator, v2, options) {
            switch (operator) {
                case '==':
                    return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case '===':
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case '!=':
                    return (v1 != v2) ? options.fn(this) : options.inverse(this);
                case '!==':
                    return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                case '<':
                    return (v1 < v2) ? options.fn(this) : options.inverse(this);
                case '<=':
                    return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                case '>':
                    return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case '>=':
                    return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                case '&&':
                    return (v1 && v2) ? options.fn(this) : options.inverse(this);
                case '||':
                    return (v1 || v2) ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Conectar a la base de datos
connectDB().then(() => {
    console.log('📦 Sistema de Multas inicializado correctamente');
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'sistema-multas-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Middleware para inyectar usuario en todas las vistas
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.currentPath = req.path;
    next();
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/conductores', conductoresRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/multas', multasRoutes);

// ================= RUTAS DE VISTAS =================

// Página de login
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { 
        title: 'Iniciar Sesión - Sistema de Multas',
        layout: false 
    });
});

// Página principal (requiere autenticación)
app.get('/', requireAuth, async (req, res) => {
    try {
        // Obtener datos para el dashboard
        const { getCollection } = require('./config/db');
        const db = getCollection;
        
        const totalConductores = await db('conductores').countDocuments();
        const totalVehiculos = await db('vehiculos').countDocuments();
        const totalMultas = await db('multas').countDocuments();
        const multasPendientes = await db('multas').countDocuments({ pagada: false });

        res.render('dashboard', {
            title: 'Dashboard - Sistema de Multas',
            totalConductores,
            totalVehiculos,
            totalMultas,
            multasPendientes
        });
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        res.render('dashboard', {
            title: 'Dashboard - Sistema de Multas',
            totalConductores: 0,
            totalVehiculos: 0,
            totalMultas: 0,
            multasPendientes: 0
        });
    }
});

// Página de conductores
app.get('/conductores', requireAuth, async (req, res) => {
    try {
        const { conductores } = require('./models/collections');
        const listaConductores = await conductores().find().toArray();
        
        res.render('conductores', {
            title: 'Gestión de Conductores',
            conductores: listaConductores
        });
    } catch (error) {
        console.error('Error cargando conductores:', error);
        res.render('conductores', {
            title: 'Gestión de Conductores',
            conductores: []
        });
    }
});

// Página de vehículos
app.get('/vehiculos', requireAuth, async (req, res) => {
    try {
        const { vehiculos } = require('./models/collections');
        const listaVehiculos = await vehiculos().find().toArray();
        
        res.render('vehiculos', {
            title: 'Gestión de Vehículos',
            vehiculos: listaVehiculos
        });
    } catch (error) {
        console.error('Error cargando vehículos:', error);
        res.render('vehiculos', {
            title: 'Gestión de Vehículos',
            vehiculos: []
        });
    }
});

// Página de multas
app.get('/multas', requireAuth, async (req, res) => {
    try {
        const { multas, conductores, vehiculos } = require('./models/collections');
        const listaMultas = await multas().find().sort({ fechaInfraccion: -1 }).toArray();
        const listaConductores = await conductores().find().toArray();
        const listaVehiculos = await vehiculos().find().toArray();
        
        res.render('multas', {
            title: 'Gestión de Multas',
            multas: listaMultas,
            conductores: listaConductores,
            vehiculos: listaVehiculos
        });
    } catch (error) {
        console.error('Error cargando multas:', error);
        res.render('multas', {
            title: 'Gestión de Multas',
            multas: [],
            conductores: [],
            vehiculos: []
        });
    }
});

// Página de estadísticas
app.get('/estadisticas', requireAuth, async (req, res) => {
    try {
        const { multas } = require('./models/collections');
        
        const totalMultas = await multas().countDocuments();
        const multasPagadas = await multas().countDocuments({ pagada: true });
        const multasPendientes = await multas().countDocuments({ pagada: false });
        
        const multasPorGravedad = await multas().aggregate([
            {
                $group: {
                    _id: '$gravedad',
                    count: { $sum: 1 },
                    totalRecaudado: { $sum: '$monto' }
                }
            }
        ]).toArray();

        res.render('estadisticas', {
            title: 'Estadísticas del Sistema',
            totalMultas,
            multasPagadas,
            multasPendientes,
            multasPorGravedad,
            recaudacionTotal: multasPorGravedad.reduce((sum, item) => sum + item.totalRecaudado, 0)
        });
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        res.render('estadisticas', {
            title: 'Estadísticas del Sistema',
            totalMultas: 0,
            multasPagadas: 0,
            multasPendientes: 0,
            multasPorGravedad: [],
            recaudacionTotal: 0
        });
    }
});

// Middleware de autenticación para vistas
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Ruta para verificar estado del sistema
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        system: 'Sistema de Gestión de Multas',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.listen(PORT, () => {
    console.log(`🚓 Servidor de Multas corriendo en puerto ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`👤 Usuario de prueba: alumno / alu123`);
});

// public/js/app.js - Todas las funcionalidades JavaScript del cliente

/**
 * FUNCIONES PARA GESTIÓN DE CONDUCTORES
 */

// Eliminar conductor con confirmación
function eliminarConductor(id, nombre) {
    if (confirm(`¿Estás seguro de que quieres eliminar al conductor "${nombre}"? Esta acción no se puede deshacer.`)) {
        fetch(`/api/conductores/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarMensaje('Conductor eliminado exitosamente', 'success');
                setTimeout(() => {
                    location.reload(); // Recargar la página para actualizar la lista
                }, 1500);
            } else {
                mostrarMensaje('Error: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarMensaje('Error al eliminar el conductor', 'error');
        });
    }
}

// Editar conductor (si necesitas esta funcionalidad)
function editarConductor(id) {
    // Implementar lógica de edición
    console.log('Editando conductor:', id);
}

/**
 * FUNCIONES PARA GESTIÓN DE VEHÍCULOS
 */

// Eliminar vehículo con confirmación
function eliminarVehiculo(id, placa) {
    if (confirm(`¿Estás seguro de que quieres eliminar el vehículo con placa "${placa}"? Esta acción no se puede deshacer.`)) {
        fetch(`/api/vehiculos/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarMensaje('Vehículo eliminado exitosamente', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                mostrarMensaje('Error: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarMensaje('Error al eliminar el vehículo', 'error');
        });
    }
}

// Validar formato de placa
function validarPlaca(placa) {
    const regexPlaca = /^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{3}[A-Z]{2}$/;
    return regexPlaca.test(placa.toUpperCase());
}

// Auto-formatear placa mientras se escribe
function formatearPlaca(input) {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * FUNCIONES PARA GESTIÓN DE MULTAS
 */

// Confirmar pago de multa
function confirmarPagoMulta(id, monto) {
    if (confirm(`¿Marcar esta multa de $${monto} como pagada?`)) {
        fetch(`/api/multas/${id}/pagar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
            } else {
                return response.json();
            }
        })
        .then(data => {
            if (data && data.success) {
                mostrarMensaje('Multa marcada como pagada', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else if (data && data.error) {
                mostrarMensaje('Error: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarMensaje('Error al procesar el pago', 'error');
        });
    }
    return false; // Prevenir envío del formulario
}

// Buscar conductor por DNI para multas
async function buscarConductor(dni) {
    if (!dni) return;
    
    try {
        const response = await fetch(`/api/conductores/${dni}`);
        const data = await response.json();
        
        if (data.conductor) {
            document.getElementById('info-conductor').innerHTML = `
                <div class="alert alert-info">
                    <strong>Conductor encontrado:</strong> ${data.conductor.nombre} 
                    - Puntos: ${data.conductor.puntos}
                </div>
            `;
        } else {
            document.getElementById('info-conductor').innerHTML = `
                <div class="alert alert-warning">
                    Conductor no encontrado
                </div>
            `;
        }
    } catch (error) {
        console.error('Error buscando conductor:', error);
    }
}

// Buscar vehículo por placa para multas
async function buscarVehiculo(placa) {
    if (!placa) return;
    
    try {
        const response = await fetch(`/api/vehiculos/${placa}`);
        const data = await response.json();
        
        if (data.vehiculo) {
            document.getElementById('info-vehiculo').innerHTML = `
                <div class="alert alert-info">
                    <strong>Vehículo encontrado:</strong> ${data.vehiculo.marca} ${data.vehiculo.modelo} 
                    - ${data.vehiculo.color} (${data.vehiculo.año})
                </div>
            `;
        } else {
            document.getElementById('info-vehiculo').innerHTML = `
                <div class="alert alert-warning">
                    Vehículo no encontrado
                </div>
            `;
        }
    } catch (error) {
        console.error('Error buscando vehículo:', error);
    }
}

// Calcular puntos a descontar según gravedad
function calcularPuntosDescontados(gravedad) {
    const puntos = {
        'leve': 1,
        'media': 3,
        'grave': 5,
        'muy_grave': 10
    };
    return puntos[gravedad] || 1;
}

// Actualizar información de puntos al cambiar gravedad
function actualizarInfoPuntos() {
    const gravedadSelect = document.getElementById('gravedad');
    const infoPuntos = document.getElementById('info-puntos');
    
    if (gravedadSelect && infoPuntos) {
        const puntos = calcularPuntosDescontados(gravedadSelect.value);
        infoPuntos.textContent = `Puntos a descontar: ${puntos}`;
        infoPuntos.className = `badge gravedad-${gravedadSelect.value}`;
    }
}

/**
 * FUNCIONES GENERALES Y UTILIDADES
 */

// Mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear elemento de mensaje
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `alert alert-${tipo} mensaje-flotante`;
    mensajeDiv.textContent = mensaje;
    
    // Estilos para mensaje flotante
    mensajeDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        min-width: 300px;
        animation: fadeInOut 5s ease-in-out;
    `;
    
    document.body.appendChild(mensajeDiv);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        mensajeDiv.remove();
    }, 5000);
}

// Confirmación antes de enviar formularios
function confirmarEnvio(formId, mensaje = '¿Estás seguro de que quieres realizar esta acción?') {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!confirm(mensaje)) {
                e.preventDefault();
            }
        });
    }
}

// Validar formularios
function validarFormulario(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;
    
    const inputs = form.querySelectorAll('input[required], select[required]');
    let valido = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--danger-color)';
            valido = false;
        } else {
            input.style.borderColor = '';
        }
    });
    
    return valido;
}

// Cargar datos automáticamente
async function cargarDatos(url, elementoId) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const elemento = document.getElementById(elementoId);
        if (elemento) {
            // Aquí puedes procesar y mostrar los datos
            console.log('Datos cargados:', data);
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Inicializar funcionalidades cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Multas - JavaScript cargado');
    
    // Inicializar eventos para multas
    const gravedadSelect = document.getElementById('gravedad');
    if (gravedadSelect) {
        gravedadSelect.addEventListener('change', actualizarInfoPuntos);
        actualizarInfoPuntos(); // Ejecutar una vez al cargar
    }
    
    // Inicializar búsquedas en tiempo real
    const dniInput = document.getElementById('dni-buscar');
    if (dniInput) {
        dniInput.addEventListener('input', function() {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => buscarConductor(this.value), 500);
        });
    }
    
    const placaInput = document.getElementById('placa-buscar');
    if (placaInput) {
        placaInput.addEventListener('input', function() {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => buscarVehiculo(this.value), 500);
        });
    }
    
    // Agregar estilos CSS para animaciones
    const styles = document.createElement('style');
    styles.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
        
        .mensaje-flotante {
            animation: fadeInOut 5s ease-in-out;
        }
        
        /* Mejoras para formularios */
        input:invalid, select:invalid {
            border-color: var(--danger-color) !important;
        }
        
        input:valid, select:valid {
            border-color: var(--success-color) !important;
        }
        
        /* Efectos hover para tablas */
        tr {
            transition: background-color 0.3s ease;
        }
        
        tr:hover {
            background-color: #f8f9fa;
        }
    `;
    document.head.appendChild(styles);
});

// Exportar funciones para uso global (si es necesario)
window.eliminarConductor = eliminarConductor;
window.eliminarVehiculo = eliminarVehiculo;
window.confirmarPagoMulta = confirmarPagoMulta;
window.buscarConductor = buscarConductor;
window.buscarVehiculo = buscarVehiculo;
window.mostrarMensaje = mostrarMensaje;
window.validarFormulario = validarFormulario;