const express = require('express');
const router = express.Router();

// Credenciales por defecto según consigna
const DEFAULT_USER = {
  usuario: 'alumno',
  password: 'alu123'
};

// Login 
router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      // Renderizar la página de login con error
      return res.render('login', {
        title: 'Iniciar Sesión',
        layout: 'login',
        error: 'Usuario y contraseña son requeridos'
      });
    }

    // Verificar credenciales por defecto
    if (usuario === DEFAULT_USER.usuario && password === DEFAULT_USER.password) {
      req.session.user = {
        usuario: DEFAULT_USER.usuario,
        role: 'admin',
        loginTime: new Date()
      };
      
      // REDIRIGIR AL DASHBOARD
      return res.redirect('/');
    }

    // Si no coinciden las credenciales - renderizar con error
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

// Logout - 
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error cerrando sesión:', err);
    }
    // Redirigir al login después del logout
    res.redirect('/login');
  });
});

// Verificar sesión (mantener para API si es necesario)
router.get('/check', (req, res) => {
  if (req.session.user) {
    res.json({ 
      authenticated: true, 
      user: req.session.user 
    });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;