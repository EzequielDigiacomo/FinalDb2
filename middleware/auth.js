// Middleware de autenticación para API
const requireAuth = (req, res, next) => {
  // Verificar sesión
  if (req.session && req.session.user) {
    return next();
  }
  
  // Si es una petición AJAX, devolver JSON
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(401).json({ 
      success: false,
      error: 'Acceso no autorizado. Debe iniciar sesión.',
      redirectTo: '/login'
    });
  }
  
  // Si es una petición normal, redirigir
  res.redirect('/login');
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === role) {
      return next();
    }
    res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
  };
};

module.exports = { requireAuth, requireRole };
