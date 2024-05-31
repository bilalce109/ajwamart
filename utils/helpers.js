import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer";
import User from '../models/users.js';
import Admin from '../models/admin.js';
import mongoose from 'mongoose';
import Randomstring from 'randomstring';


function validateUsername(username) {
    /* 
      Usernames can only have: 
      - Lowercase Letters (a-z) 
      - Numbers (0-9)
      - Dots (.)
      - Underscores (_)
    */
    const res = /^[a-z0-9_\.]+$/.exec(username);
    const valid = !!res;
    return valid;
}

function validateNIC(value) {
    const regex = /^\d{4}-\d{4}-\d{4}$/.exec(value);
    return !!regex;
}

function validatePassportNo(value) {
    const regex = /^[A-Z]{2}\d{7}$/.exec(value);
    return !!regex;
}

function validateTIN(value) {
    const regex = /^\d{3}-\d{3}-\d{3}$/.exec(value);
    return !!regex;
}

function validateEmail(email) {
    let pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(email);
}

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== "undefined") {
        const bearerToken = bearerHeader.split(" ");
        req.token = bearerToken[1];
        next();
    } else {
        res.status(401).json({ message: "Please use a sign-in token to access this request.", data: null });
    }
}

async function verifyAdminAuthToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== "undefined") {
        req.token = bearerHeader.split(" ")[1];

        // Validating Token
        let invalidToken = false;
        jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
            if (err) {
                invalidToken = true;
                return res.status(401).json({ status: "error", message: "Malformed sign-in token! Please use a valid sign-in token to continue.", data: null });
            }
        });
        if (invalidToken) return;

        // Checking and Adding user to req object.
        req.user = await User.findOne({ name: "admin", verificationToken: req.token }).lean();
        if (!req.user) return res.status(404).json({
            status: "error",
            message: "Invalid sign-in token! Please log-in again to continue.",
            data: null
        });
        // req.user.preferences = await preferredTags(req.user._id);
        // req.user.followedChannels = await followedChannels(req.user._id);
        next();
    } else {
        return res.status(401).json({ status: "error", message: "Please use a sign-in token to access this request.", data: null });
    }
}

async function verifyAuthToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== "undefined") {
        req.token = bearerHeader.split(" ")[1];

        // Validating Token
        let invalidToken = false;
        jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
            if (err) {
                invalidToken = true;
                return res.status(401).json({ status: "error", message: "Malformed sign-in token! Please use a valid sign-in token to continue.", data: null });
            }
        });
        if (invalidToken) return;

        // Checking and Adding user to req object.
        req.user = await User.findOne({ verificationToken: req.token }).lean();
        if (!req.user) return res.status(403).json({
            status: "error",
            message: "Invalid sign-in token! Please log-in again to continue.",
            data: null
        });
        // req.user.preferences = await preferredTags(req.user._id);
        // req.user.followedChannels = await followedChannels(req.user._id);
        next();
    } else {
        return res.status(401).json({ status: "error", message: "Please use a sign-in token to access this request.", data: null });
    }
}

async function verifyOwnerAuthToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== "undefined") {
        req.token = bearerHeader.split(" ")[1];

        // Validating Token
        let invalidToken = false;
        jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
            if (err) {
                invalidToken = true;
                return res.status(401).json({ status: "error", message: "Malformed sign-in token! Please use a valid sign-in token to continue.", data: null });
            }
        });
        if (invalidToken) return;

        // Checking and Adding user to req object.
        req.user = await User.findOne({ role: "owner", verificationToken: req.token }).lean();
        if (!req.user) return res.status(404).json({
            status: "error",
            message: "Invalid sign-in token! Please log-in again to continue.",
            data: null
        });
        next();
    } else {
        return res.status(401).json({ status: "error", message: "Please use a sign-in token to access this request.", data: null });
    }
}

async function verifyAdmin(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== "undefined") {
        req.token = bearerHeader.split(" ")[1];

        // Validating Token
        let invalidToken = false;
        jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
            if (err) {
                invalidToken = true;
                return res.status(403).json({ status: "error", message: "Malformed sign-in token! Please use a valid sign-in token to continue.", data: null });
            }
        });
        if (invalidToken) return;

        // Checking and Adding user to req object.
        req.user = await User.findOne({role: "admin", verificationToken: req.token }).lean();
        if (!req.user) return res.status(403).json({
            status: "error",
            message: "Invalid sign-in token! Please log-in again to continue.",
            data: null
        });
        // req.user.preferences = await preferredTags(req.user._id);
        // req.user.followedChannels = await followedChannels(req.user._id);
        next();
    } else {
        return res.status(403).json({ status: "error", message: "Please use a sign-in token to access this request.", data: null });
    }
}
async function verifyManager(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== "undefined") {
        req.token = bearerHeader.split(" ")[1];

        // Validating Token
        let invalidToken = false;
        jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
            if (err) {
                invalidToken = true;
                return res.status(403).json({ status: "error", message: "Malformed sign-in token! Please use a valid sign-in token to continue.", data: null });
            }
        });
        if (invalidToken) return;

        // Checking and Adding user to req object.
        req.user = await User.findOne({role: "manager", verificationToken: req.token }).lean();
        if (!req.user) return res.status(403).json({
            status: "error",
            message: "Invalid sign-in token! Please log-in again to continue.",
            data: null
        });
        // req.user.preferences = await preferredTags(req.user._id);
        // req.user.followedChannels = await followedChannels(req.user._id);
        next();
    } else {
        return res.status(403).json({ status: "error", message: "Please use a sign-in token to access this request.", data: null });
    }
}

async function checkPayment(id) {
    let paymentStatus = await payment.findOne({ _id: mongoose.Types.ObjectId(id) }) || await payment.findOne({ _id: id });
    return paymentStatus.paymentStatus;
}


function regexSearch(query) {
    let search = '.*' + query + '.*';
    let value = new RegExp(["^", search, "$"].join(""), "i");
    return value;
}

function distance(lat1, lon1, lat2, lon2, unit) {

    var radlat1 = Math.PI * lat1 / 180
    var radlat2 = Math.PI * lat2 / 180
    var theta = lon1 - lon2
    var radtheta = Math.PI * theta / 180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
        dist = 1;
    }
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == "K") { dist = dist * 1.609344 }
    if (unit == "N") { dist = dist * 0.8684 }
    return dist
}

function sort(arr, property, sortType) {
    if (!Array.isArray(arr)) throw new Error(`Expected array in arr but got ${typeof arr}`);
    if (typeof property !== "string") throw new Error(`Expected string in property but got ${typeof property}`);
    if (typeof sortType !== "number") throw new Error(`Expected number in sortType but got ${typeof sortType}`);
    let result = _.sortBy(arr, property);
    if (sortType < 0) result = result.reverse();
    return result;
}

function filterCoordinates(poslat, poslng, range_in_meter, data) {
    var cord = [];
    for (var i = 0; i < data.length; i++) {
        if (distance(poslat, poslng, data[i].location.lat, data[i].location.lng, "K") <= range_in_meter) {
            cord.push(data[i]._id);
        }
    }
    return cord;
}

function sendResetPasswordEmail(num, email, name, callback) {
    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });
    var mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: email,
        subject: "Code for reset password",
        html: " Hi <strong>" + `${name}` + "</strong> <br /><br /> Your verification code is <strong>" + `${num}` + "</strong>. <br /> Enter this code in our app to reset your password.",
    };
    return transporter.sendMail(mailOptions, callback)
}

function sendPassword(code, email, name, callback) {
    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });
    var mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: email,
        subject: "Code for reset password",
        html: " Hi <strong>" + `${name}` + "</strong> <br /><br /> Your verification code is <strong>" + `${code}` + "</strong>. <br /> Enter this code in our app to reset your password.",
    };
    return transporter.sendMail(mailOptions, callback)
}

function paginate(records, page = 1, limit = 10) {
    page = isNaN(parseInt(page)) ? 1 : parseInt(page),
        limit = isNaN(parseInt(limit)) ? 1 : parseInt(limit);

    const results = {};
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    if (endIndex < records.length) {
        results.next = {
            page: page + 1,
            limit: limit
        }
    }
    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit
        }
    }
    results.totalPages = {
        page: Math.ceil(records.length / limit),
        limit: limit,
        totalRecords: records.length
    };

    results.result = records.slice(startIndex, endIndex);
    return results;
}



function randomCodeGenerate(profile, accountType) {
    let generatedCode = `${profile}-` + `${accountType}-` + Math.floor(100000 + Math.random() * 900000);
    return generatedCode;
}

function couponCode() {
    const alphaChars = Randomstring.generate({ length: 2, charset: 'alphabetic' });
    const numericChars = Randomstring.generate({ length: 6, charset: 'numeric' });
    const code = alphaChars + numericChars;
    return code;
}

function invoiceCode() {
    const alphaChars = Randomstring.generate({ length: 2, charset: 'alphabetic' });
    const numericChars = Randomstring.generate({ length: 3, charset: 'numeric' });
    const code = alphaChars + numericChars;
    return code;
}

function generateSixDigitRandomNumber() {
    const min = 100000; // Minimum value (inclusive)
    const max = 999999; // Maximum value (inclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function generatePassword() {
    const alphaChars = Randomstring.generate({ length: 2, charset: 'alphabetic' });
    const numericChars = Randomstring.generate({ length: 6, charset: 'numeric' });
    const code = alphaChars + numericChars;
    return code;
}

async function saveUserProfilePic(picture) {
    let fileName = `public/profiles/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
    await picture.mv(fileName);
    let modifiedName = fileName.replace("public", "");
    return modifiedName;
}

async function saveIssuerIndDocs(folderName, picture) {
    let fileName = `public/issuerIndDocs/${folderName}/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
    await picture.mv(fileName);
    let modifiedName = fileName.replace("public", "");
    return modifiedName;
}

async function saveIssuerCompDocs(folderName, picture) {
    let fileName = `public/issuerCompDocs/${folderName}/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
    await picture.mv(fileName);
    let modifiedName = fileName.replace("public", "");
    return modifiedName;
}

async function saveProjectImage(picture) {
    let fileName = `public/project/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
    await picture.mv(fileName);
    let modifiedName = fileName.replace("public", "");
    return modifiedName;
}

async function saveTopupProof(picture) {
    let fileName = `public/topup/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
    await picture.mv(fileName);
    let modifiedName = fileName.replace("public", "");
    return modifiedName;
}

async function saveTeam(picture) {
    let fileName = `public/team/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
    await picture.mv(fileName);
    let modifiedName = fileName.replace("public", "");
    return modifiedName;
}

async function saveRequest(picture) {
    let fileName = `public/request/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
    await picture.mv(fileName);
    let modifiedName = fileName.replace("public", "");
    return modifiedName;
}

async function saveDonation(picture) {
    let fileName = `public/donation/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
    await picture.mv(fileName);
    let modifiedName = fileName.replace("public", "");
    return modifiedName;
}

export default {
    validateUsername,
    validateEmail,
    verifyToken,
    verifyAuthToken,
    verifyOwnerAuthToken,
    verifyAdmin,
    verifyManager,
    checkPayment,
    regexSearch,
    filterCoordinates,
    sendResetPasswordEmail,
    sendPassword,
    paginate,
    sort,
    verifyAdminAuthToken,
    sendResetPasswordPhone,
    randomCodeGenerate,
    couponCode,
    generatePassword,
    validateNIC,
    validatePassportNo,
    validateTIN,
    saveUserProfilePic,
    saveIssuerIndDocs,
    saveIssuerCompDocs,
    saveProjectImage,
    saveTopupProof,
    saveTeam,
    saveRequest,
    saveDonation,
    generateSixDigitRandomNumber
}