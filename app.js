const express = require('express');
const session = require('express-session');
const path = require('path');
const { engine } = require('express-handlebars');
require('dotenv').config();

// Importar conexión a BD
const { connectDB } = require('./config/db');

// Importar rutas de API
const apiAuth = require('./routes/api/auth');
const apiConductores = require('./routes/api/conductores');
const apiVehiculos = require('./routes/api/vehiculos');
const apiMultas = require('./routes/api/multas');

const app = express();
const PORT = process.env.PORT || 3000;

// ================= CONFIGURACIÓN =================
// Configurar Handlebars - CORREGIDO
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'routes/views/layouts'),
    partialsDir: path.join(__dirname, 'routes/views/partials'),
    helpers: {
        eq: function(a, b) {
            return a === b;
        },
        formatDate: function(date) {
            return date ? new Date(date).toLocaleDateString('es-AR') : 'N/A';
        },
        formatCurrency: function(amount) {
            return amount ? '$' + parseFloat(amount).toLocaleString('es-AR') : '$0';
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'routes/views')); // ← CAMBIADO

// Conectar a la base de datos
connectDB().then(() => {
    console.log('📦 Sistema de Multas inicializado correctamente');
});

// ================= MIDDLEWARE =================
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

// Middleware para inyectar usuario en vistas
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.currentPath = req.path;
    next();
});

// Middleware de autenticación para vistas
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// ================= RUTAS DE API =================
app.use('/api/auth', apiAuth);
app.use('/api/conductores', apiConductores);
app.use('/api/vehiculos', apiVehiculos);
app.use('/api/multas', apiMultas);

// ================= RUTAS DE VISTAS SIMPLES =================
// Login (pública)
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { 
        title: 'Iniciar Sesión - Sistema de Multas',
        layout: false 
    });
});

// Dashboard principal
app.get('/', requireAuth, async (req, res) => {
    try {
        const { conductores, vehiculos, multas } = require('./models/collections');
        
        const totalConductores = await conductores().countDocuments();
        const totalVehiculos = await vehiculos().countDocuments();
        const totalMultas = await multas().countDocuments();
        const multasPendientes = await multas().countDocuments({ pagada: false });

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
        const { multas } = require('./models/collections');
        const listaMultas = await multas().find().sort({ fechaInfraccion: -1 }).toArray();
        
        res.render('multas', {
            title: 'Gestión de Multas',
            multas: listaMultas
        });
    } catch (error) {
        console.error('Error cargando multas:', error);
        res.render('multas', {
            title: 'Gestión de Multas',
            multas: []
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

        res.render('estadisticas', {
            title: 'Estadísticas del Sistema',
            totalMultas,
            multasPagadas,
            multasPendientes
        });
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        res.render('estadisticas', {
            title: 'Estadísticas del Sistema',
            totalMultas: 0,
            multasPagadas: 0,
            multasPendientes: 0
        });
    }
});

// ================= RUTAS GLOBALES =================
// Estado del sistema (API pública)
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        system: 'Sistema de Gestión de Multas',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// ================= INICIAR SERVIDOR =================
app.listen(PORT, () => {
    console.log(`🚓 Servidor de Multas corriendo en puerto ${PORT}`);
    console.log(`📍 Frontend: http://localhost:${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`📍 Status: http://localhost:${PORT}/api/status`);
    console.log(`👤 Usuario: alumno | Contraseña: alu123`);
});