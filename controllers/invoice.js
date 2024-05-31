import invoice from "../models/invoice.js";
import job from "../models/job.js";
import vehicle from "../models/vehicle.js";
import jobService from "../service/job.js";
import helpers from "../utils/helpers.js";

const store = async (req, res) => {
    let { id } = req.params;
    let services = [];
    try {

        let checkInvoice = await invoice.findOne({
            jobId: id
        })

        if (checkInvoice) {
            return res.json({
                status: 'success',
                message: 'already created',
                data: { _id: checkInvoice._id }
            })
        }

        // Check Job 
        let checkJob = await jobService.getJobById(id);
        if (!checkJob) {
            return res.json({
                status: 'error',
                message: 'no Job Found',
                data: {}
            })
        }
        req.body.userId = req.user._id;
        req.body.companyId = checkJob._id;
        req.body.jobId = id;
        req.body.customerId = checkJob.customer?._id;
        req.body.vehicleId = checkJob.vehicle;
        req.body.assignedTechnician = checkJob.assignedTechnician
        req.body.totalPrice = checkJob.totalPrice;
        req.body.totalQty = checkJob.totalQty;


        req.body.invoiceNumber = helpers.generateSixDigitRandomNumber();

        req.body.service.map((e) => {

            services.push({ id: e.id._id , price : e.id.price , qty : e.id.qty })
        })



        req.body.service = services
        let createInvoice = new invoice(req.body);
        await createInvoice.save();


        // // Update Job Invoice
        // // console.log(createInvoice._id);

        await job.findByIdAndUpdate({
            _id: req.params.id
        }, {
            $push: { "invoice": createInvoice._id }
        })

        return res.json({
            status: 'success',
            message: "success",
            data: createInvoice
        })


    }
    catch (error) {
        console.log(error);
        return res.json({
            status: 'error',
            message: error.message,
            data: {}
        })

    }
}


const update = async (req, res) => {
    let { id } = req.params;
    try {

        let checkInvoice = await invoice.findOne({
            _id: id
        })

        if (!checkInvoice) {
            return res.json({
                status: 'error',
                message: 'Invoice not found',
                data: {}
            })
        }

        // // Check Job 
        // // let checkJob  = await jobService.getJobById(id);

        // // // 
        // req.body.userId = req.user._id;
        // req.body.companyId = checkJob._id;
        // req.body.jobId = id;
        // req.body.customer = checkJob.customer;

        // req.body.invoiceNumber  = helpers.generateSixDigitRandomNumber();


        // console.log(req.body);


        let createInvoice = await invoice.findByIdAndUpdate({
            _id: id
        }, {
            $set: req.body
        }, {
            new: true
        })

        let data = await jobService.getInvoice(id)

        // let newInvoice = new invoice(req.body);
        // await newInvoice.save()


        // please create a helper

        return res.json({
            status: 'success',
            message: "success",
            data: data
        })


    }
    catch (error) {
        return res.json({
            status: 'error',
            message: error.message,
            data: {}
        })

    }
}


const view = async (req, res) => {
    let { id } = req.params;
    try {
        let data = await jobService.getInvoice(id)
        return res.json({
            status: 'success',
            message: "success",
            data: data
        })
    }
    catch (error) {
        return res.json({
            status: 'error',
            message: error.message,
            data: {}
        })
    }
}

const all = async (req, res) => {
    let query = {};
    try {
        // Assuming user role is stored in req.user.role
        if (req.user.role === 'manager') { 
            // If user is a manager, filter invoices by companyId
            if (req.query.startDate && req.query.endDate) {
                let startDate = new Date(req.query.startDate);
                let endDate = new Date(req.query.endDate);

                query = {
                    companyId: req.user.companyId, // Assuming companyId is associated with manager
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                };
            }
        } else if (req.user.role === 'CSR') {
            // If user is a CSR, filter invoices by userId
            query = { userId: req.user._id }; // Assuming userId is associated with CSR
        } else if (req.user.role === 'technician') {
            // If user is a technician, filter invoices by jobId
            // Assuming jobId is associated with technician through jobs
            let jobs = await jobService.getJobsByTechnicianId(req.user._id);
            let jobIds = jobs.map(job => job._id);

            query = { jobId: { $in: jobIds } };
        }

        let data = await invoice.find(query);

        // Assuming jobService.getInvoice(e._id) is to fetch additional data for each invoice
        data = await Promise.all(data.map(async (e) => {
            return await jobService.getInvoice(e._id);
        }));

        return res.json({
            status: 'success',
            message: 'success',
            data
        });
    } catch (error) {
        return res.json({
            status: 'error',
            message: error.message,
            data: {}
        });
    }
};



const getInvoiceByVin = async (req, res) => {
    let { vin } = req.query;
    try {
        let checkVin = await vehicle.findOne({
            vinNumber: vin
        })
        if (!checkVin) {
            return res.json({
                status: 'success',
                message: 'not found',
                data: {}
            })
        }
        let data = await invoice.find({
            vehicleId: checkVin._id
        })
        if (data) {
            data = await Promise.all(data.map(async (e) => {
                return await jobService.getInvoice(e._id)
            }))
        }
        return res.json({
            status: 'success',
            message: 'success',
            data: data
        })
    }
    catch (error) {

        return res.json({
            status: 'error',
            message: error.message,
            data: {}
        })
    }
}

const updatePayment = async (req, res) => {
    try {
        let data = await invoice.findByIdAndUpdate({
            _id: req.params.id
        }, {
            $set: {
                paymentStatus: 'paid'
            }
        }, {
            new: true
        });

        return res.json({
            status: 'success',
            message: 'success',
            data: data
        })
    }
    catch (error) {
        return res.json({
            status: 'error',
            message: error.message,
            data: {}
        })
    }
}

export default
    {
        store,
        update,
        view,
        all,
        getInvoiceByVin,
        updatePayment
    }