const express = require('express');
const { ObjectId } = require('mongodb');
const { multas, conductores, vehiculos } = require('../../models/collections');
const { requireAuth } = require('../../middleware/auth');
const MultaSchema = require('../../models/MultaSchema');
const router = express.Router();

// Obtener todas las multas
router.get('/', requireAuth, async (req, res) => {
  try {
    const todasMultas = await multas().find().sort({ fechaInfraccion: -1 }).toArray();
    res.json(todasMultas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva multa - ACTUALIZADO CON SCHEMA
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

    // 5. Actualizar puntos del conductor
    const nuevosPuntos = conductor.puntos - instanciaMulta.puntosDescontados;
    await conductores().updateOne(
      { dni: instanciaMulta.dniConductor },
      { 
        $set: { 
          puntos: Math.max(0, nuevosPuntos),
          habilitado: nuevosPuntos > 0
        } 
      }
    );

    // 6. Guardar en la base de datos
    const resultado = await multas().insertOne(instanciaMulta);
    
    console.log('Multa creada con ID:', resultado.insertedId);
    res.redirect('/multas');
    
  } catch (error) {
    console.error('Error creando multa:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor: ' + error.message 
    });
  }
});

// Ruta para marcar multa como pagada
router.post('/:id/pagar', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('ID recibido para pago:', id);
        
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

        const result = await multas().updateOne(
            { _id: objectId },
            { 
                $set: { 
                    pagada: true,
                    fechaPago: new Date()
                } 
            }
        );

        console.log('Resultado de update:', result);

        if (result.modifiedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Multa no encontrada' 
            });
        }

        res.redirect('/multas');
        
    } catch (error) {
        console.error('Error marcando multa como pagada:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor: ' + error.message 
        });
    }
});

// Obtener multas por conductor (por DNI)
router.get('/conductor/:dniConductor', requireAuth, async (req, res) => {
  try {
    const { dniConductor } = req.params;
    const multasConductor = await multas().find({ 
      dniConductor: dniConductor 
    }).sort({ fechaInfraccion: -1 }).toArray();
    
    res.json(multasConductor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;