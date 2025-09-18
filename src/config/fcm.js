const admin = require('firebase-admin');
const serviceAccount = require('../../storage-management-646a1-firebase-adminsdk-fbsvc-0aa43f1f40.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin; 