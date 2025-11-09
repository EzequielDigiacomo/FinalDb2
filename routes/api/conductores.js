const express = require('express');
const { ObjectId } = require('mongodb');
const { conductores } = require('../../models/collections');
const { requireAuth } = require('../../middleware/auth');
const ConductorSchema = require('../../models/ConductorSchema');
const router = express.Router();

// Obtener todos los conductores
router.get('/', requireAuth, async (req, res) => {
  try {
    const todosConductores = await conductores().find().toArray();
    res.json(todosConductores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo conductor - 
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
    res.redirect('/conductores');
    
  } catch (error) {
    console.error('Error creando conductor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor: ' + error.message 
    });
  }
});

// Obtener conductor por DNI
router.get('/:dni', requireAuth, async (req, res) => {
  try {
    const { dni } = req.params;
    const conductor = await conductores().findOne({ dni: dni });
    
    if (!conductor) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    res.json({
      conductor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ELIMINAR conductor por ID
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('ID recibido para eliminar:', id);
    
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

    const result = await conductores().deleteOne({ _id: objectId });

    console.log('Resultado de eliminación:', result);

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

module.exports = router;