import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helper from '../utils/helpers.js';
import User from '../models/users.js';
import mongoose from 'mongoose';
import SimpleSchema from 'simpl-schema';

const home = (req, res) => {
    res.send('Hello From Home');
}

const updateUser = async (req, res) => {
    try {
        let body = req.body;

        if (body.password !== undefined) body.password = await bcrypt.hash(body.password, 10);
        if (body.verificationToken !== undefined) return res.status(400).json({
            status: "error",
            message: "Sorry! You can't update verification token.",
            data: null,
            trace: body
        });
        if (body.email !== undefined) return res.status(400).json({
            status: "error",
            message: "Sorry! You can't update your email address"
        });

        if (req.files) {
            let picture = req.files.profile_picture;
            let fileName = `public/profiles/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
            await picture.mv(fileName);
            picture = fileName.replace("public", "");
            body.profile_picture = picture;
        }

        const updatedUser = await User.findOneAndUpdate({ _id: req.user._id }, { $set: body }, { new: true }).lean();

        return res.status(200).json({
            status: "success",
            message: "Your Profile has been updated!",
            data: updatedUser
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const homePage = async (req, res) => {
    try {
        console.log(req.body);
        let userId = req.user._id;
        let userLocation = await User.findById(userId);
        let long = userLocation.location.coordinates[0];
        let lat = userLocation.location.coordinates[1];
        let result = await promotion.find({
            $and: [
                {
                    location: {
                        $near: {
                            $geometry: { type: "Point", coordinates: [long, lat] },
                            $minDistance: 0,
                            $maxDistance: 1000
                        }
                    }

                }, { paymentStatus: "Pending" }
            ]
        }).populate({ path: 'user', select: '_id username profile_picture' }).lean();

        // return res.json({
        //     message: result
        // })


        let posts = [];
        let events = [];
        let classes = [];
        let casting = [];

        if (req.body.feedType == "foryou") {

            let foryou = await User.findById(userId).select({ _id: 1, username: 1, profile_picture: 1, favorited_by: 1, posts: 1 }).lean();

            // Getting Users which favorited a Online User

            if (foryou.favorited_by.length) {
                foryou = await Promise.all(foryou.favorited_by.map(async (f) => {
                    f = await User.findById(f._id).lean();
                    if (f.posts) {
                        f.posts = await Promise.all(f.posts.slice(0, 9).map(async (p) => {

                            p.posts = await Post.findById(p)
                                .populate({ path: 'user', select: '_id username profile_picture' })
                                .populate({ path: 'guest', select: '_id username profile_picture' })
                                .lean();

                            // if Post is class


                            // check if data is a feed
                            if (p.posts) {
                                if (p.posts.postType.toString() === "64087c1730318d8f2b728d29") {
                                    // p.posts.user = await helper.getUserProfileHelper(p.posts.user);
                                    posts.push(p.posts);
                                    return p.posts;
                                }
                                else if (p.posts.postType.toString() === "640988355696247a61f6548e") {
                                    // p.posts.user = await helper.getUserProfileHelper(p.posts.user);
                                    events.push(p.posts);
                                    return p.posts
                                }
                                else if (p.posts.postType.toString() === "6439e95f138137281ac631c6") {
                                    // p.posts.user = await helper.getUserProfileHelper(p.posts.user);
                                    classes.push(p.posts);
                                    let classId = classes.map((e) => { return e._id });
                                    let specifyTimeDetail = await specifyTime.find({ classId: { $in: classId } });


                                    if (specifyTimeDetail) {
                                        specifyTimeDetail.map(async (specifyTimeDetail) => {

                                            if (specifyTimeDetail.type == "bi-weekly") {
                                                p.posts.recurringDetails = helper.biweeklyCalculator(specifyTimeDetail.type, specifyTimeDetail.days);
                                            }
                                            if (specifyTimeDetail.type == "weekly") {
                                                p.posts.recurringDetails = helper.weeklyCalculator(specifyTimeDetail.type, specifyTimeDetail.days);
                                            }
                                            if (specifyTimeDetail.type == "monthly") {
                                                p.posts.recurringDetails = helper.monthlyCalculator(specifyTimeDetail.type, specifyTimeDetail.start);
                                            }

                                            return specifyTimeDetail;

                                        })

                                    }

                                    return p.posts
                                } else if (p.posts.postType.toString() === "64803369f22711b79071fd93") {
                                    casting.push(p.posts);
                                    return p.posts;
                                } else {
                                    return null;
                                }
                            }


                        }));
                        f.posts = f.posts.filter(post => post !== null)
                    }
                    return f
                }))
            }



        } else {

            let explore = await User.find({
                _id: { $ne: userId }, location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [long, lat] },
                        $minDistance: 0,
                        $maxDistance: 1000
                    }
                }
            }).select({ _id: 1, username: 1, profile_picture: 1, favorited_by: 1, posts: 1 }).lean();
            explore = await Promise.all(explore.map(async (user) => {
                if (user.posts) {
                    user.posts = await Promise.all(user.posts.map(async (postId) => {
                        const post = await Post.findById(postId)
                            .populate({ path: 'user', select: '_id username profile_picture' })
                            .populate({ path: 'guest', select: '_id username profile_picture' })
                            .lean();

                        if (post && post.postType) {
                            if (post.postType.toString() === "64087c1730318d8f2b728d29") {
                                // post.user = await helper.getUserProfileHelper(post.user);
                                posts.push(post);
                                return post;
                            } else if (post.postType.toString() === "640988355696247a61f6548e") {
                                // post.user = await helper.getUserProfileHelper(post.user);
                                events.push(post);
                                return post;
                            } else if (post.postType.toString() === "6439e95f138137281ac631c6") {
                                // post.user = await helper.getUserProfileHelper(post.user);
                                classes.push(post);
                                let classId = classes.map((e) => { return e._id });
                                let specifyTimeDetail = await specifyTime.find({ classId: { $in: classId } });


                                if (specifyTimeDetail) {
                                    specifyTimeDetail.map(async (specifyTimeDetail) => {

                                        if (specifyTimeDetail.type == "bi-weekly") {
                                            post.recurringDetails = helper.biweeklyCalculator(specifyTimeDetail.type, specifyTimeDetail.days);
                                        }
                                        if (specifyTimeDetail.type == "weekly") {
                                            post.recurringDetails = helper.weeklyCalculator(specifyTimeDetail.type, specifyTimeDetail.days);
                                        }
                                        if (specifyTimeDetail.type == "monthly") {
                                            post.recurringDetails = helper.monthlyCalculator(specifyTimeDetail.type, specifyTimeDetail.start);
                                        }

                                        return specifyTimeDetail;

                                    })

                                }

                                return post;
                            } else if (post.postType.toString() === "64803369f22711b79071fd93") {
                                casting.push(post);
                                return post;
                            }
                        } else {
                            return null;
                        }
                    }));
                    user.posts = user.posts.filter(post => post !== null);
                }
                return user;
            }));
        }

        console.log(result);



        return res.json({
            status: "success",
            message: "Promo Post",
            data: {
                promotions: result,
                events,
                posts,
                classes,
                casting
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: error.message
        });
    }
}

const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find the user's profile and populate their posts and promo
        let user = await User.findOne({ _id: req.user._id }).lean();

        return res.status(200).json({
            status: "success",
            message: "User retrieve Successfully",
            data: user
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user profile.' });
    }
};

const search = async (req, res) => {
    try {
        const q = req.query.q;
        const searchedUsers = await User.find({ fullname: { $regex: '^' + q } }, { location: 0 });
        return res.json({
            status: "success",
            message: "Testing...",
            data: searchedUsers
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error",
            trace: error.message
        })
    }
}

const getProfile = async (req, res) => {
    try {
        let userId = req.params.id;
        let result = await User.findOne({_id: userId});
        return res.status(200).json({
            status: "success",
            message: `successfully retrieve ${result.fullName}`,
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error",
            trace: error.message
        })
    }
}

const pushGallery = async (req, res) => {
    try {
        let result = await User.updateMany({}, { $unset: { profile_pictures: 1 } });
        return res.status(200).json({
            status: "success",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error",
            trace: error.message
        })
    }
}

const addNewCard = async (req, res) => {

    let { cardnumber, cvc, cardholdername, expiry, cardtype, stripe_customer_id } = req.body
    try {

        let cardSchema = new SimpleSchema({
            cardnumber: { type: String, required: true },
            cvc: { type: String, required: true },
            cardholdername: { type: String, required: true },
            expiry: { type: String, required: true },
            cardtype: { type: String, required: true },
            stripe_customer_id: { type: String, required: false }
        }).newContext();

        cardSchema.validate(req.body);

        if (!cardSchema.isValid()) {
            return res.status(400).json({
                status: 400,
                message: "Please fill all the fields to proceed further!",
                trace: cardSchema.validationErrors()
            })
        }


        let checkCardExist = await User.findOne({ _id: req.user._id, "cards.cardnumber": cardnumber }).lean()
        if (checkCardExist) return res.status(409).json({ message: "Card Already Exist", data: {} });

        let user = await User.findByIdAndUpdate({ _id: req.user._id }, {
            $push: {
                "cards": [{
                    "cardnumber": cardnumber,
                    'cvc': cvc,
                    "cardholdername": cardholdername,
                    "expiry": expiry,
                    "cardtype": cardtype,
                    "stripe_customer_id": stripe_customer_id
                }]
            }
        }, { new: true })
        const data = await helper.loginUser(req.user._id);
        return res.status(200).json({
            status: "success",
            message: "Card added successfully",
            data: data
        })
    }
    catch (error) {
        return res.status(200).json({
            status: "error",
            message: error.message
        })
    }


}

const removeCard = async (req, res) => {
    let { cardId } = req.params
    try {
        let data = await User.findByIdAndUpdate({ _id: req.user._id }, { $pull: { cards: { _id: cardId } } });
        return res.status(200).json({
            status: "success",
            message: "card removed"
        })
    }
    catch (error) {
        return res.status(500).json({
            message: error.message,
            data: {}
        })
    }
}

const getUserList = async (req, res) => {
    try {
        let result = await User.find({}).select({ _id: 1, username: 1, profile_picture: 1 });
        return res.status(200).json({
            status: "success",
            message: "User List Successfully retrieve",
            data: result
        })
    } catch (error) {
        return res(200).json({
            status: "error",
            message: "something went wrong",
        })
    }
}

const updateSettings = async (req, res) => {
    try {
        let settingSchema = new SimpleSchema({
            pushNotificationSettings: { type: String, required: false },
            aboutAppUpdate: { type: String, required: false },
            newsletterSettings: { type: String, required: false }
        }).newContext();

        if (!settingSchema.validate(req.body)) {
            return res.status(200).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: settingSchema.validationErrors()
            })
        }

        let checkUser = await User.findOne({ _id: req.user._id }).lean();
        if (!checkUser) {
            return res.status(404).json({
                message: "User not found",
                data: {}
            })
        }
        await User.findByIdAndUpdate({ _id: req.user._id }, { $set: { "setting": req.body } }, { new: true })

        const data = await helper.loginUser(req.user._id);

        return res.status(200).json({
            status: "success",
            message: "successfully Updated",
            data: data
        })
    }
    catch (error) {
        return res.status(200).json({
            status: "error",
            message: error.message
        })
    }
}

export default {
    home,
    updateUser,
    homePage,
    getUserProfile,
    getProfile,
    search,
    pushGallery,
    addNewCard,
    removeCard,
    getUserList,
    updateSettings
};