// libs/mongodb.ts
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MONGODB_URI to .env.local');
}

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cachedMongoose = global.mongoose;
let cachedClient = global.mongoClient;

if (!cachedMongoose) {
  cachedMongoose = global.mongoose = { conn: null, promise: null };
}

if (!cachedClient) {
  cachedClient = global.mongoClient = { conn: null, promise: null };
}

// Mongoose connection for schema usage
export async function connectToDatabase() {
  if (cachedMongoose.conn) {
    return cachedMongoose.conn;
  }

  if (!cachedMongoose.promise) {
    const opts = {
      bufferCommands: false,
    };

    cachedMongoose.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cachedMongoose.conn = await cachedMongoose.promise;
  } catch (e) {
    cachedMongoose.promise = null;
    throw e;
  }

  return cachedMongoose.conn;
}

// MongoClient connection for NextAuth
export async function getMongoClient() {
  if (cachedClient.conn) {
    return cachedClient.conn;
  }

  if (!cachedClient.promise) {
    cachedClient.promise = MongoClient.connect(MONGODB_URI).then((client) => {
      return client;
    });
  }

  try {
    cachedClient.conn = await cachedClient.promise;
  } catch (e) {
    cachedClient.promise = null;
    throw e;
  }

  return cachedClient.conn;
}

export default connectToDatabase;