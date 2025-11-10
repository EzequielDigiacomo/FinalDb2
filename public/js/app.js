// ==========================================
// SISTEMA DE GESTIÓN DE MULTAS - FRONTEND
// ==========================================

/**
 * SISTEMA DE TOAST NOTIFICATIONS
 */
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 5000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            error: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
            info: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };
        
        toast.innerHTML = `
            ${icons[type] || icons.info}
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        
        this.container.appendChild(toast);
        
        // Auto-cerrar
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    },
    
    success(message, duration) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration) {
        this.show(message, 'error', duration);
    },
    
    warning(message, duration) {
        this.show(message, 'warning', duration);
    },
    
    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

/**
 * SISTEMA DE MODAL DE CONFIRMACIÓN
 */
const Modal = {
    show(title, message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        
        overlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        ${title}
                    </h3>
                </div>
                <div class="modal-body">
                    ${message}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-cancel" id="modal-cancel">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancelar
                    </button>
                    <button class="btn btn-danger" id="modal-confirm">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Confirmar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Event listeners
        const confirmBtn = overlay.querySelector('#modal-confirm');
        const cancelBtn = overlay.querySelector('#modal-cancel');
        
        confirmBtn.addEventListener('click', () => {
            overlay.remove();
            if (onConfirm) onConfirm();
        });
        
        cancelBtn.addEventListener('click', () => {
            overlay.remove();
            if (onCancel) onCancel();
        });
        
        // Cerrar al hacer click fuera del modal
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                if (onCancel) onCancel();
            }
        });
    }
};

/**
 * MANEJO DE ERRORES DE AUTENTICACIÓN
 */
function handleAuthError(data) {
    if (data.redirectTo === '/login') {
        Toast.error('Sesión expirada. Redirigiendo al login...');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return true;
    }
    return false;
}

/**
 * GESTIÓN DE CONDUCTORES
 */
function eliminarConductor(id, nombre) {
    Modal.show(
        'Confirmar Eliminación',
        `¿Estás seguro de que deseas eliminar al conductor <strong>"${nombre}"</strong>?<br><br>Esta acción no se puede deshacer.`,
        () => {
            fetch(`/api/conductores/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin' // Importante: enviar cookies de sesión
            })
            .then(response => {
                if (response.status === 401) {
                    return response.json().then(data => {
                        handleAuthError(data);
                        throw new Error('No autorizado');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    Toast.success('Conductor eliminado exitosamente');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Toast.error(data.error || 'Error al eliminar el conductor');
                }
            })
            .catch(error => {
                if (error.message !== 'No autorizado') {
                    console.error('Error:', error);
                    Toast.error('Error de conexión al eliminar el conductor');
                }
            });
        }
    );
}

/**
 * GESTIÓN DE VEHÍCULOS
 */
function eliminarVehiculo(id, placa) {
    Modal.show(
        'Confirmar Eliminación',
        `¿Estás seguro de que deseas eliminar el vehículo con placa <strong>"${placa}"</strong>?<br><br>Esta acción no se puede deshacer.`,
        () => {
            fetch(`/api/vehiculos/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin'
            })
            .then(response => {
                if (response.status === 401) {
                    return response.json().then(data => {
                        handleAuthError(data);
                        throw new Error('No autorizado');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    Toast.success('Vehículo eliminado exitosamente');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Toast.error(data.error || 'Error al eliminar el vehículo');
                }
            })
            .catch(error => {
                if (error.message !== 'No autorizado') {
                    console.error('Error:', error);
                    Toast.error('Error de conexión al eliminar el vehículo');
                }
            });
        }
    );
}

/**
 * GESTIÓN DE MULTAS
 */
function confirmarPagoMulta(id, monto) {
    Modal.show(
        'Confirmar Pago de Multa',
        `¿Deseas marcar esta multa de <strong>$${monto}</strong> como pagada?`,
        () => {
            fetch(`/api/multas/${id}/pagar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin'
            })
            .then(response => {
                if (response.status === 401) {
                    return response.json().then(data => {
                        handleAuthError(data);
                        throw new Error('No autorizado');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    Toast.success('Multa marcada como pagada');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Toast.error(data.error || 'Error al procesar el pago');
                }
            })
            .catch(error => {
                if (error.message !== 'No autorizado') {
                    console.error('Error:', error);
                    Toast.error('Error de conexión al procesar el pago');
                }
            });
        }
    );
}

// Buscar conductor por DNI
async function buscarConductor(dni) {
    if (!dni || dni.length < 7) {
        document.getElementById('info-conductor').innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`/api/conductores/buscar/${dni}`);
        const data = await response.json();
        
        const infoDiv = document.getElementById('info-conductor');
        if (data.conductor) {
            infoDiv.innerHTML = `
                <div class="alert alert-info" style="margin-top: 8px;">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <strong>Encontrado:</strong> ${data.conductor.nombre} - Puntos: ${data.conductor.puntos}
                </div>
            `;
        } else {
            infoDiv.innerHTML = `
                <div class="alert alert-warning" style="margin-top: 8px;">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Conductor no encontrado
                </div>
            `;
        }
    } catch (error) {
        console.error('Error buscando conductor:', error);
    }
}

// Buscar vehículo por placa
async function buscarVehiculo(placa) {
    if (!placa || placa.length < 3) {
        document.getElementById('info-vehiculo').innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`/api/vehiculos/buscar/${placa}`);
        const data = await response.json();
        
        const infoDiv = document.getElementById('info-vehiculo');
        if (data.vehiculo) {
            infoDiv.innerHTML = `
                <div class="alert alert-info" style="margin-top: 8px;">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"></path>
                        <circle cx="6.5" cy="16.5" r="2.5"></circle>
                        <circle cx="16.5" cy="16.5" r="2.5"></circle>
                    </svg>
                    <strong>Encontrado:</strong> ${data.vehiculo.marca} ${data.vehiculo.modelo} - ${data.vehiculo.color} (${data.vehiculo.año})
                </div>
            `;
        } else {
            infoDiv.innerHTML = `
                <div class="alert alert-warning" style="margin-top: 8px;">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Vehículo no encontrado
                </div>
            `;
        }
    } catch (error) {
        console.error('Error buscando vehículo:', error);
    }
}

// Actualizar información de puntos según gravedad
function actualizarInfoPuntos() {
    const gravedadSelect = document.getElementById('gravedad');
    const infoPuntos = document.getElementById('info-puntos');
    
    if (gravedadSelect && infoPuntos && gravedadSelect.value) {
        const puntos = {
            'leve': 1,
            'media': 3,
            'grave': 5,
            'muy_grave': 8
        };
        
        infoPuntos.textContent = `Puntos a descontar: ${puntos[gravedadSelect.value] || 1}`;
        infoPuntos.className = `badge gravedad-${gravedadSelect.value}`;
        infoPuntos.style.display = 'inline-flex';
    }
}

// Sugerir gravedad y monto según motivo de la multa
function sugerirGravedadYMonto() {
    const motivoSelect = document.getElementById('motivo');
    const gravedadSelect = document.getElementById('gravedad');
    const montoInput = document.getElementById('monto');
    
    if (!motivoSelect || !gravedadSelect || !montoInput) return;
    
    const motivo = motivoSelect.value;
    
    // Mapeo de motivos a gravedad y monto sugerido
    const sugerencias = {
        // Leves
        'Estacionamiento indebido': { gravedad: 'leve', monto: 5000 },
        'No usar cinturón de seguridad': { gravedad: 'leve', monto: 8000 },
        'Luces apagadas de noche': { gravedad: 'leve', monto: 6000 },
        'Documentación vencida': { gravedad: 'leve', monto: 7000 },
        
        // Medias
        'Exceso de velocidad moderado': { gravedad: 'media', monto: 15000 },
        'Usar celular mientras conduce': { gravedad: 'media', monto: 12000 },
        'No respetar semáforo en amarillo': { gravedad: 'media', monto: 10000 },
        'Giro prohibido': { gravedad: 'media', monto: 9000 },
        
        // Graves
        'Exceso de velocidad grave': { gravedad: 'grave', monto: 30000 },
        'Pasarse semáforo en rojo': { gravedad: 'grave', monto: 25000 },
        'Conducir sin licencia': { gravedad: 'grave', monto: 35000 },
        'Maniobra peligrosa': { gravedad: 'grave', monto: 28000 },
        
        // Muy Graves
        'Conducir en estado de ebriedad': { gravedad: 'muy_grave', monto: 80000 },
        'Exceso de velocidad extremo': { gravedad: 'muy_grave', monto: 60000 },
        'Conducir bajo efectos de drogas': { gravedad: 'muy_grave', monto: 100000 },
        'Fuga del lugar del accidente': { gravedad: 'muy_grave', monto: 90000 }
    };
    
    const sugerencia = sugerencias[motivo];
    
    if (sugerencia) {
        gravedadSelect.value = sugerencia.gravedad;
        montoInput.value = sugerencia.monto;
        actualizarInfoPuntos();
        
        // Resaltar que son valores sugeridos
        montoInput.style.borderColor = 'var(--color-accent)';
        setTimeout(() => {
            montoInput.style.borderColor = '';
        }, 2000);
    }
}

/**
 * INTERCEPTAR ENVÍOS DE FORMULARIOS
 */
function interceptarFormularios() {
    // Formulario de conductores
    const formConductor = document.getElementById('form-conductor');
    if (formConductor) {
        formConductor.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(formConductor);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/api/conductores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(data)
                });
                
                if (response.status === 401) {
                    const result = await response.json();
                    handleAuthError(result);
                    return;
                }
                
                const result = await response.json();
                
                if (result.success) {
                    Toast.success('Conductor registrado exitosamente');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Toast.error(result.error || 'Error al registrar el conductor');
                }
            } catch (error) {
                console.error('Error:', error);
                Toast.error('Error de conexión al registrar el conductor');
            }
        });
    }
    
    // Formulario de vehículos
    const formVehiculo = document.querySelector('form[action="/api/vehiculos"]');
    if (formVehiculo) {
        formVehiculo.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(formVehiculo);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/api/vehiculos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(data)
                });
                
                if (response.status === 401) {
                    const result = await response.json();
                    handleAuthError(result);
                    return;
                }
                
                const result = await response.json();
                
                if (result.success) {
                    Toast.success('Vehículo registrado exitosamente');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Toast.error(result.error || 'Error al registrar el vehículo');
                }
            } catch (error) {
                console.error('Error:', error);
                Toast.error('Error de conexión al registrar el vehículo');
            }
        });
    }
    
    // Formulario de multas
    const formMulta = document.getElementById('form-multa');
    if (formMulta) {
        formMulta.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(formMulta);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/api/multas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(data)
                });
                
                if (response.status === 401) {
                    const result = await response.json();
                    handleAuthError(result);
                    return;
                }
                
                const result = await response.json();
                
                if (result.success) {
                    Toast.success('Multa registrada exitosamente');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Toast.error(result.error || 'Error al registrar la multa');
                }
            } catch (error) {
                console.error('Error:', error);
                Toast.error('Error de conexión al registrar la multa');
            }
        });
    }
}

/**
 * INICIALIZACIÓN
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('✨ Sistema de Multas - Cargado');
    
    // Interceptar formularios
    interceptarFormularios();
    
    // Eventos para multas
    const gravedadSelect = document.getElementById('gravedad');
    if (gravedadSelect) {
        gravedadSelect.addEventListener('change', actualizarInfoPuntos);
    }
    
    const motivoSelect = document.getElementById('motivo');
    if (motivoSelect) {
        motivoSelect.addEventListener('change', sugerirGravedadYMonto);
    }
    
    // Búsqueda en tiempo real de conductores
    const dniInput = document.getElementById('dni-buscar');
    if (dniInput) {
        let dniTimer;
        dniInput.addEventListener('input', function() {
            clearTimeout(dniTimer);
            dniTimer = setTimeout(() => buscarConductor(this.value), 500);
        });
    }
    
    // Búsqueda en tiempo real de vehículos
    const placaInput = document.getElementById('placa-buscar');
    if (placaInput) {
        let placaTimer;
        placaInput.addEventListener('input', function() {
            clearTimeout(placaTimer);
            placaTimer = setTimeout(() => buscarVehiculo(this.value), 500);
        });
    }
});

// Exportar funciones globalmente
window.Toast = Toast;
window.Modal = Modal;
window.eliminarConductor = eliminarConductor;
window.eliminarVehiculo = eliminarVehiculo;
window.confirmarPagoMulta = confirmarPagoMulta;
window.buscarConductor = buscarConductor;
window.buscarVehiculo = buscarVehiculo;
