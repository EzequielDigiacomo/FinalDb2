// models/VehiculoSchema.js
class VehiculoSchema {
    constructor(placa, marca, modelo, año, color) {
        this.placa = placa.toUpperCase();
        this.marca = marca;
        this.modelo = modelo;
        this.año = parseInt(año);
        this.color = color;
        this.fechaRegistro = new Date();
        this.activo = true;
    }

    validar() {
        const errores = [];
        
        if (!this.placa || this.placa.length < 6) {
            errores.push('La placa debe tener al menos 6 caracteres');
        }
        
        if (!this.marca || this.marca.length < 2) {
            errores.push('La marca es requerida');
        }
        
        if (!this.modelo || this.modelo.length < 1) {
            errores.push('El modelo es requerido');
        }
        
        if (!this.año || this.año < 1900 || this.año > new Date().getFullYear() + 1) {
            errores.push('El año debe ser válido');
        }
        
        if (!this.color || this.color.length < 2) {
            errores.push('El color es requerido');
        }
        
        return errores;
    }

    static crearDesdeRequest(body) {
        return new VehiculoSchema(
            body.placa,
            body.marca,
            body.modelo,
            body.año,
            body.color
        );
    }
}

module.exports = VehiculoSchema;