// Script para corregir el índice de vehículos
// Elimina el índice antiguo "patente" y crea el correcto "placa"

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixVehiculosIndex() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const dbName = new URL(process.env.MONGODB_URI).pathname.substring(1) || 'sistema_multas';
        const db = client.db(dbName);
        
        console.log('🔧 Conectado a la base de datos:', dbName);
        
        // 1. Listar índices actuales
        console.log('\n📋 Índices actuales en la colección vehiculos:');
        const indexes = await db.collection('vehiculos').indexes();
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });
        
        // 2. Intentar eliminar el índice antiguo "patente_1"
        try {
            console.log('\n🗑️  Eliminando índice antiguo "patente_1"...');
            await db.collection('vehiculos').dropIndex('patente_1');
            console.log('✅ Índice "patente_1" eliminado exitosamente');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  El índice "patente_1" no existe (esto está bien)');
            } else {
                console.log('⚠️  Error al eliminar índice:', error.message);
            }
        }
        
        // 3. Crear el índice correcto en "placa"
        try {
            console.log('\n✨ Creando índice correcto en "placa"...');
            await db.collection('vehiculos').createIndex({ placa: 1 }, { unique: true });
            console.log('✅ Índice "placa_1" creado exitosamente');
        } catch (error) {
            if (error.code === 85 || error.code === 86) {
                console.log('ℹ️  El índice en "placa" ya existe (esto está bien)');
            } else {
                throw error;
            }
        }
        
        // 4. Listar índices finales
        console.log('\n📋 Índices actualizados:');
        const newIndexes = await db.collection('vehiculos').indexes();
        newIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });
        
        console.log('\n✅ ¡Índices corregidos! Ya puedes agregar vehículos.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
        console.log('\n👋 Conexión cerrada');
    }
}

// Ejecutar
fixVehiculosIndex();

