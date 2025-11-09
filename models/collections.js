const { getCollection } = require('../config/db');

module.exports = {
  usuarios: () => getCollection('usuarios'),
  conductores: () => getCollection('conductores'),
  multas: () => getCollection('multas'),
  vehiculos: () => getCollection('vehiculos'),
  antecedentes: () => getCollection('antecedentes')
};