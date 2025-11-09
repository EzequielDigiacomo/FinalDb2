// models/MultaSchema.js
class MultaSchema {
    constructor(dniConductor, placaVehiculo, motivo, monto, gravedad = 'leve') {
        this.dniConductor = dniConductor;
        this.placaVehiculo = placaVehiculo.toUpperCase();
        this.motivo = motivo;
        this.monto = parseFloat(monto);
        this.gravedad = gravedad;
        this.fechaInfraccion = new Date();
        this.fechaCreacion = new Date();
        this.pagada = false;
        this.puntosDescontados = this.calcularPuntosDescontados(gravedad);
    }

    calcularPuntosDescontados(gravedad) {
        const puntos = {
            'leve': 1,
            'media': 3,
            'grave': 5,
            'muy_grave': 10
        };
        return puntos[gravedad] || 1;
    }

    validar() {
        const errores = [];
        
        if (!this.dniConductor) {
            errores.push('DNI del conductor requerido');
        }
        
        if (!this.placaVehiculo || this.placaVehiculo.length < 6) {
            errores.push('Placa del vehículo requerida');
        }
        
        if (!this.motivo || this.motivo.length < 5) {
            errores.push('Motivo de la multa requerido');
        }
        
        if (!this.monto || this.monto <= 0) {
            errores.push('Monto válido requerido');
        }
        
        if (!this.gravedad) {
            errores.push('Gravedad de la multa requerida');
        }
        
        return errores;
    }

    static crearDesdeRequest(body) {
        return new MultaSchema(
            body.dniConductor,
            body.placaVehiculo,
            body.motivo,
            body.monto,
            body.gravedad
        );
    }
}

module.exports = MultaSchema;