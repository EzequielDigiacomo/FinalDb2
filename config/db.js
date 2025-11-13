const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;
const client = new MongoClient(process.env.MONGODB_URI);

const connectDB = async () => {
  try {
    await client.connect();
    const dbName = new URL(process.env.MONGODB_URI).pathname.substring(1) || 'sistema_multas';
    db = client.db(dbName);
    console.log(`✅ Conectado a MongoDB Atlas - Base de datos: ${dbName}`);
    
    // Crear índices para mejor performance
    await db.collection('conductores').createIndex({ email: 1 }, { unique: true });
    await db.collection('vehiculos').createIndex({ placa: 1 }, { unique: true });
    await db.collection('multas').createIndex({ conductorId: 1 });
    
    return db;
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) throw new Error('No hay conexión a la base de datos. Llama a connectDB() primero.');
  return db;
};

const getCollection = (collectionName) => {
  return getDB().collection(collectionName);
};

// Cerrar conexión de forma segura
const closeConnection = async () => {
  try {
    await client.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar la conexión:', error.message);
  }
};

module.exports = { connectDB, getDB, getCollection, closeConnection };