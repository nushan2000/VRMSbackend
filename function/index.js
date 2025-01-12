const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendNotificationToDriver = functions.firestore
    .document('requests/{requestId}')
    .onCreate((snap, context) => {
        const requestData = snap.data();

        // Extract relevant data from the request document
        const { driverId, reason, destination } = requestData;

        // Retrieve driver's FCM token from Firestore or any other data source
        const driverFCMToken = '...'; // Retrieve the driver's FCM token

        // Construct the notification payload
        const payload = {
            notification: {
                title: 'New Request',
                body: `New request: ${reason} to ${destination}`
            }
        };

        // Send the notification to the driver
        return admin.messaging().sendToDevice(driverFCMToken, payload);
    });