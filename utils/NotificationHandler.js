import FCM from 'fcm-node'
import Notification from '../models/notification.js';
import admin from 'firebase-admin';
import serviceAccount from '../config/ServiceAccount.js';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sendNotification = (userToken, userId, title, body, data) => {
    // console.log(userToken);
    Notification.create({
        userId: userId,
        title: title,
        body: body,
        data: data
    }).then(result => {
        let message = {
            to: userToken,
            collapse_key: 'xxxxxx-xxxxxx-xxxxxx',

            notification: {
                title: title,
                body: body,
            },
            data: { ...data, notificationid: result._id }
        };
        fcm.send(message, function (err, response) {
            if (err) {
                console.log(err, "Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });
        console.log("notification inserted")
    }).catch(error => console.log(error))
}

const sendNotificationMultiple = (userToken, title, body, data = null, userids, image) => {
    let message = {
        registration_ids: userToken,
        collapse_key: 'xxxxxx-xxxxxx-xxxxxx',
        notification: {
            title: title,
            body: body,
        },
        data: data
    };
    fcm.send(message, function (err, response) {
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
            console.log(`${process.env.DOMAIN}${image}`);
        }
    });
    userids.map(id => {
        Notification.create({
            title: title,
            body: body,
            userid: id,
            image: image,
            payload: data
        }).then(result => console.log(result))
            .catch(error => console.log(error))
    })
}

const sendChatNotification = (userToken, userId, typeId, title, body, data) => {
    // console.log(userToken);
    Notification.create({
        userId: userId,
        typeId,
        title: title,
        body: body,
        data: data
    }).then(result => {
        let message = {
            to: userToken,
            collapse_key: 'xxxxxx-xxxxxx-xxxxxx',

            notification: {
                title: title,
                body: body,
            },
            data: { ...data, notificationid: result._id }
        };
        fcm.send(message, function (err, response) {
            if (err) {
                console.log(err, "Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });
        console.log("notification inserted")
    }).catch(error => console.log(error))
}

export default {
    sendNotification,
    sendNotificationMultiple,
    sendChatNotification
}