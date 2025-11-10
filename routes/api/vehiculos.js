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
    res.json({ 
      success: true,
      message: 'Vehículo registrado exitosamente',
      vehiculoId: resultado.insertedId
    });
    
  } catch (error) {
    console.error('Error creando vehículo:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor: ' + error.message 
    });
  }
});

// Buscar vehículo por placa
router.get('/buscar/:placa', requireAuth, async (req, res) => {
  try {
    const { placa } = req.params;
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

// Eliminar vehículo por ID
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = require('mongodb');
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        success: false, 
        error: 'ID inválido' 
      });
    }

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Formato de ID inválido' 
      });
    }

    const result = await vehiculos().deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Vehículo no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Vehículo eliminado exitosamente' 
    });
    
  } catch (error) {
    console.error('Error eliminando vehículo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor: ' + error.message 
    });
  }
});

module.exports = router;