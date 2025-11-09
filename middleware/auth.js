// Middleware de autenticación
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Acceso no autorizado. Debe iniciar sesión.' });
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
