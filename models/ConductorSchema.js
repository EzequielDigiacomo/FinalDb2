// models/ConductorSchema.js
class ConductorSchema {
    constructor(nombre, email, dni, licencia, telefono = '', direccion = '') {
        this.nombre = nombre;
        this.email = email;
        this.dni = dni;
        this.licencia = licencia;
        this.telefono = telefono;
        this.direccion = direccion;
        this.puntos = 20;
        this.habilitado = true;
        this.fechaRegistro = new Date();
    }

    validar() {
        const errores = [];
        
        if (!this.nombre || this.nombre.length < 3) {
            errores.push('El nombre debe tener al menos 3 caracteres');
        }
        
        if (!this.email || !this.email.includes('@')) {
            errores.push('Email válido requerido');
        }
        
        if (!this.dni || this.dni.length < 7) {
            errores.push('DNI válido requerido');
        }
        
        if (!this.licencia || this.licencia.length < 5) {
            errores.push('Licencia válida requerida');
        }
        
        return errores;
    }

    static crearDesdeRequest(body) {
        return new ConductorSchema(
            body.nombre,
            body.email,
            body.dni,
            body.licencia,
            body.telefono,
            body.direccion
        );
    }
}

module.exports = ConductorSchema;