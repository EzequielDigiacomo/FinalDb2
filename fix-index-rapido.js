// Script rápido para eliminar el índice patente_1
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fix() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const dbName = new URL(process.env.MONGODB_URI).pathname.substring(1);
        const db = client.db(dbName);
        
        console.log('🔧 Eliminando índice patente_1...');
        await db.collection('vehiculos').dropIndex('patente_1');
        console.log('✅ ¡Índice eliminado! Ya puedes agregar vehículos.');
    } catch (error) {
        if (error.code === 27) {
            console.log('✅ El índice ya no existe. Todo correcto.');
        } else {
            console.log('❌ Error:', error.message);
        }
    } finally {
        await client.close();
    }
}

fix();

