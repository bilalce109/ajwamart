import job from "../models/job.js";
import employeesData from "../models/employees.js";
import users from "../models/users.js";
import userService from "../service/userService.js";
import attendanceData from "../models/attendance.js";
import invoice from "../models/invoice.js";
import closeProcedure from '../models/closingProcedure.js';
import moment from "moment";

const employeePerformance = async (req, res) => {
    try {
        // Fetch the user to determine their role
        let user = await users.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        // Find employees based on the company ID
        let employees = await employeesData.find({ companyId: user.companyId })
            .select({ _id: 1, fullName: 1, email: 1, employeeType: 1, userId: 1, assignedTechnician: 1, createdAt: 1 })
            .lean();

        // Extract emails from the employees array
        const employeeEmails = employees.map(employee => employee.email);

        // Find attendance data based on employee emails
        let attendanceUsers = await users.find({ email: { $in: employeeEmails } }).lean();

        // Iterate through employees
        for (let employee of employees) {
            let jobIds;
            if (employee.employeeType === 'csr') {
                jobIds = await job.find({ userId: employee._id }, { _id: 1 });
            } else if (employee.employeeType === 'technician') {
                jobIds = await job.find({ assignedTechnician: employee._id }, { _id: 1 });
            }

            if (jobIds) {
                employee.jobCount = jobIds.length;
                employee.jobIds = jobIds.map(job => job._id);
            } else {
                employee.jobCount = 0;
                employee.jobIds = [];
            }

            // Fetch user details for the userId or assignedTechnician
            employee.userId = await userService.getUserDetails(employee.userId); // Assuming userService.getUserDetails is a function to fetch user details

            // Iterate through attendance users
            for (let attendanceUser of attendanceUsers) {
                // Fetch attendance data for the current user
                let attendance = await attendanceData.find({ userId: attendanceUser._id }).lean();

                // Find the corresponding employee
                let employee = employees.find(employee => employee.email === attendanceUser.email);
                if (employee) {
                    // Assign attendance data to the employee
                    employee.attendance = attendance;
                }
            }
        }

        return res.status(200).json({
            status: 'success',
            message: 'Employees List with Job Counts',
            data: employees
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

const salesChart = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        // Fetch records for cash drawer and sales data
        const [cashDrawerRecords, salesDataRecords, weeklySalesDataRecords, monthlySalesDataRecords] = await Promise.all([
            closeProcedure.find({ companyId }),
            invoice.find({ companyId }),
            invoice.find({
                companyId,
                date: {
                    $gte: moment().startOf('week').toDate(),
                    $lte: moment().endOf('week').toDate(),
                },
            }),
            invoice.find({
                companyId,
                date: {
                    $gte: moment().startOf('month').toDate(),
                    $lte: moment().endOf('month').toDate(),
                },
            }),
        ]);

        // Calculate totals
        const totalCashDrawer = cashDrawerRecords.reduce((acc, record) => acc + record.amount, 0);
        const totalSales = salesDataRecords.reduce((acc, record) => acc + record.totalPrice, 0);

        // Calculate daily totals for the current week
        const dailyTotals = Array.from({ length: 7 }, () => 0);
        weeklySalesDataRecords.forEach(record => {
            const dayOfWeek = moment(record.date).day();
            dailyTotals[dayOfWeek === 0 ? 6 : dayOfWeek - 1] += record.totalPrice;
        });

        // Calculate weekly totals for the current month
        const weeklyTotals = Array.from({ length: 4 }, () => 0);
        const weeks = [...Array(4).keys()].map(i => ({
            start: moment().startOf('month').add(i * 7, 'days'),
            end: moment().startOf('month').add(i * 7 + 6, 'days'),
        }));
        monthlySalesDataRecords.forEach(record => {
            const recordDate = moment(record.date);
            weeks.some((week, i) => {
                if (recordDate.isBetween(week.start, week.end, 'day', '[]')) {
                    weeklyTotals[i] += record.totalPrice;
                    return true;
                }
                return false;
            });
        });

        // Respond with sales data
        return res.status(200).json({
            status: 200,
            message: 'Manager reports Sales data',
            data: {
                cashDrawer: totalCashDrawer,
                sales: totalSales,
                fleet: 5411,
                weeklySalesdata: dailyTotals,
                monthlySalesData: weeklyTotals,
                weeklyCustomerdata: [50, 50],
                monthlyCustomerdata: [25, 75],
            },
        });
    } catch (error) {
        console.error('Error in salesChart:', error);
        return res.status(500).json({ message: error.message, data: {} });
    }
};


// Function to fetch weekly sales data for each week in a month
async function getWeeklySalesTotal() {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Calculate the start date of the current month
        const startDate = new Date(currentYear, currentMonth, 1);

        // Initialize an array to store weekly sales data
        const weeklySalesData = [];

        // Iterate over each week in the month
        while (startDate.getMonth() === currentMonth) {
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6); // Set end date to 6 days after start date (a week)
            // Query invoices within the current week and calculate total sales
            const weeklyTotal = await invoice.aggregate([
                {
                    $match: {
                        date: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$totalPrice" }
                    }
                }
            ]);

            // Extract the total sales for the current week
            const weeklySalesTotal = weeklyTotal.length > 0 ? weeklyTotal[0].total : 0;

            // Add the weekly sales total to the array
            weeklySalesData.push(weeklySalesTotal);

            // Move to the next week
            startDate.setDate(startDate.getDate() + 7);
        }

        return weeklySalesData;
    } catch (error) {
        throw new Error("Failed to fetch weekly sales report");
    }
}


// Function to fetch total sales for the past month
async function getMonthlySalesTotal() {
    try {
        // Calculate start and end dates for the past month
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);

        // Query invoices within the past month and calculate total sales
        const monthlyTotal = await invoice.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPrice" }
                }
            }
        ]);

        // Extract the total sales for the month
        const monthlySalesTotal = monthlyTotal.length > 0 ? monthlyTotal[0].total : 0;

        return monthlySalesTotal;
    } catch (error) {
        throw new Error("Failed to fetch monthly sales report");
    }
}

// API endpoint to fetch both weekly and monthly sales totals
const salesData = async (req, res) => {
    try {
        // Fetch total sales for the past week
        const weeklySalesTotal = await getWeeklySalesTotal();

        // Fetch total sales for the past month
        const monthlySalesTotal = await getMonthlySalesTotal();

        // Return both weekly and monthly sales totals in the response
        return res.status(200).json({
            status: "success",
            message: "Sales data fetched successfully",
            data: {
                weeklySalesTotal,
                monthlySalesTotal
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
            data: {}
        });
    }
};





export default {
    employeePerformance,
    salesChart,
    salesData
}