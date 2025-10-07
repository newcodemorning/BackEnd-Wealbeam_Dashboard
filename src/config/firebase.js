const admin = require('firebase-admin');
const firebase = require('firebase/app');
require('firebase/auth'); // Include Firebase Auth
require('firebase/firestore'); // Include Firestore
require('dotenv').config();

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('../../serviceAccountKey.json')),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: 'gs://weallbeam-dashboard.firebasestorage.app',
  });

// Initialize Firebase Client SDK
firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const bucket = admin.storage().bucket();

const db = admin.firestore(); // Firestore instance
module.exports = { admin, firebase, db,bucket };
