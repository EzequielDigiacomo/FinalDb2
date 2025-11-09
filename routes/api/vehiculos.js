const express = require('express');
const { vehiculos } = require('../../models/collections');
const { requireAuth } = require('../../middleware/auth');
const VehiculoSchema = require('../../models/VehiculoSchema');
const router = express.Router();

// Obtener todos los vehículos
router.get('/', requireAuth, async (req, res) => {
  try {
    const todosVehiculos = await vehiculos().find().toArray();
    res.json(todosVehiculos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar nuevo vehículo - ACTUALIZADO CON SCHEMA
router.post('/', requireAuth, async (req, res) => {
  try {
    // 1. Crear instancia del schema
    const instanciaVehiculo = VehiculoSchema.crearDesdeRequest(req.body);
    
    // 2. Validar el schema
    const errores = instanciaVehiculo.validar();
    if (errores.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: errores.join(', ') 
      });
    }

    // 3. Verificar si ya existe un vehículo con esta placa
    const vehiculoExistente = await vehiculos().findOne({ placa: instanciaVehiculo.placa });
    if (vehiculoExistente) {
      return res.status(400).json({ 
        success: false,
        error: 'Ya existe un vehículo con esta placa' 
      });
    }

    // 4. Guardar en la base de datos
    const resultado = await vehiculos().insertOne(instanciaVehiculo);
    
    console.log('Vehículo creado con ID:', resultado.insertedId);
    res.redirect('/vehiculos');
    
  } catch (error) {
    console.error('Error creando vehículo:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor: ' + error.message 
    });
  }
});

module.exports = router;