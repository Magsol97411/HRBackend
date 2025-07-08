const express =require("express");
const mongoose =require("mongoose");
const cors =require("cors");
const nodemailer = require("nodemailer");
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const bcrypt = require('bcryptjs');
let app=express();
app.use(cors());
app.use(express.json());  // Make sure this line is included

app.listen(8000,()=>{
    console.log(`Listening to Port 8000`)
})

let ConnectToMDB= async ()=>{
    try {
       await mongoose.connect("mongodb+srv://HRSalaryApplication:HRSalaryApplication@hrsalaryapplication.skbc07g.mongodb.net/")
        console.log("Connected to MDB ✅")
    } catch (error) {
        console.log("Failed to Connect to MDB")    
    }
}
ConnectToMDB();

const EmployeeSalarySchema = new mongoose.Schema({
  employeeId:{
    type:String,
  },
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    joiningDate: {
      type: String,  // Storing in "dd/mm/yyyy" format as a string
     },
    basicPay: {
      type: Number
        },
    hra: {
      type: Number
        },
    conveyanceAllowances: {
      type: Number
        },
    medicalAllowances: {
      type: Number
        },
    ltaEducation: {
      type: Number
        },
    uan: {
      type: String,
      unique: true,
      trim: true
    },
    pf:{
      type:Number,
    },
    pt:{
      type:Number,
    },
    password:{
      type:String,
    },
    grossSalary: {
      type: Number,
        },
        otp: { type: String }, // Store OTP temporarily
        otpExpires: { type: Date }, // OTP expiration time
        employeeType:{
          type:String,
        },
        esi:{
          type:Number,
          default:0,
        }
  }, { timestamps: true });
  
  const EmployeeSalary = mongoose.model("EmployeeSalary", EmployeeSalarySchema);
  
  // Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "magsolengineering@gmail.com", // Replace with your email
    pass: "boar buzo caiw jpfq",  // Use an App Password if using Gmail
  },
});
//   / POST: Create a new employee salary record
app.post("/add-salary", async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      designation,
      joiningDate,
      basicPay,
      hra,
      conveyanceAllowances,
      medicalAllowances,
      ltaEducation,
      uan,
      grossSalary,
      employeeType,
      pf,
      pt,
      esi
    } = req.body;

    // Check if the email already exists
    const existingEmployee = await EmployeeSalary.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: "Email already exists. Please use a different email." });
    }

    // Set password as UAN
    const password = uan;

    // Email content
    const mailOptions = {
      from: "magsolengineering@gmail.com", // Replace with your email
      to: email,
      subject: "Welcome to Magsol Technologies",
      text: `Dear ${name},\n\nWelcome to Magsol Technologies! We are excited to have you on board.\n\nYou will receive all your payslips at this email every month.\n\nBest regards,\nMagsol Technologies`,
    };

    // Send email before saving data
    await transporter.sendMail(mailOptions);

    // Create a new employee salary document
    const newSalary = new EmployeeSalary({
      employeeId,
      name,
      email,
      designation,
      joiningDate,
      basicPay,
      hra,
      conveyanceAllowances,
      medicalAllowances,
      ltaEducation,
      uan,
      grossSalary,
      password, // Storing UAN as password
      employeeType,
      pf,
      pt,
      esi
    });

    // Save the document to MongoDB
    await newSalary.save();

    res.status(201).json({ message: "Salary record added successfully, and email sent.", data: newSalary });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Employee Details
app.get("/getEmployeeDetails",async(req, res)=>{
    try {
        const employeeDetails = await EmployeeSalary.find();
        res.status(200).json({ message: "Employee details fetched successfully", data:employeeDetails});
    }catch(err){
        console.log(err);
    }
})
// Update Employee Data
app.put("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { basicPay, hra, conveyanceAllowances, medicalAllowances, ltaEducation, ...otherDetails } = req.body;

    // Convert values to numbers to avoid NaN issues
    basicPay = parseFloat(basicPay) || 0;
    hra = parseFloat(hra) || 0;
    conveyanceAllowances = parseFloat(conveyanceAllowances) || 0;
    medicalAllowances = parseFloat(medicalAllowances) || 0;
    ltaEducation = parseFloat(ltaEducation) || 0;

    // Calculate Gross Salary
    const grossSalary = basicPay + hra + conveyanceAllowances + medicalAllowances + ltaEducation;

    // Calculate PF (Provident Fund)
    const pf = basicPay > 15000 ? 1800 : (basicPay * 0.12);

    // Calculate PT (Professional Tax)
    const pt = grossSalary > 25000 ? 200 : 0;

    // Update Employee Data in the Database
    const updatedEmployee = await EmployeeSalary.findByIdAndUpdate(
      id,
      { basicPay, hra, conveyanceAllowances, medicalAllowances, ltaEducation, grossSalary, pf, pt, ...otherDetails },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ message: "Error updating employee", error });
  }
});

  // Get Employee Details by EmpliyeeId
  app.get("/getEmployeeDetailsbyemployeeId/:id",async(req,res)=>{
    try {
      const employeeDetails = await EmployeeSalary.findOne({employeeId:req.params.id});
      res.status(200).json({ message: "Employee details fetched successfully", data:employeeDetails});
    }catch(err){
      console.log(err);
    }
  })
  // Get Employee Details by Id
  app.get("/getEmployeeDetailsbyId/:id",async(req,res)=>{
    try {
      const employeeDetails = await EmployeeSalary.findOne({_id:req.params.id});
      res.status(200).json({ message: "Employee details fetched successfully", data:employeeDetails});
    }catch(err){
      console.log(err);
    }
  })
  // / Send OTP
  app.post("/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
  
      // Validate that email is provided
      if (!email || typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({ message: "Email is required and must be a valid string" });
      }
  
      // Check if the email exists in the database
      const user = await EmployeeSalary.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Generate and store OTP
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
      await user.save();
  
      // Send OTP via email
      await transporter.sendMail({
        from: "magsolengineering@gmail.com",
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}`,
      });
  
      res.json({ success: true, message: "OTP sent to email" });
    } catch (error) {
      res.status(500).json({ message: "Error sending OTP", error });
    }
  });
   
  // Verify OTP
  app.post("/verify-otp", async (req, res) => {
    try {
      console.log("Received Request:", req.body);
  
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email and OTP are required" });
      }
  
      const user = await EmployeeSalary.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      if (user.otp !== otp || Date.now() > user.otpExpires) {
        return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      }
  
      res.json({ success: true, message: "OTP verified" });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  
  // Reset Password
  app.post("/reset-password", async (req, res) => {
    try {
      const { email, newPassword, otp } = req.body;
  
      if (!email || !newPassword || !otp) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }
  
      const user = await EmployeeSalary.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      // Validate OTP
      if (!user.otp || user.otp.toString() !== otp.toString()) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }
  
      if (user.otpExpires && new Date() > new Date(user.otpExpires)) {
        return res.status(400).json({ success: false, message: "OTP expired" });
      }
  
      console.log("Before Update:", user.password); // Debugging
  
      // Hash new password
      // const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = newPassword;
  
      // console.log("After Hashing:", hashedPassword); // Debugging
  
      // Clear OTP fields
      user.otp = null;
      user.otpExpires = null;
  
      // Save updated user
      await user.save();
  
      // Fetch user again to confirm update
      const updatedUser = await EmployeeSalary.findOne({ email });
      console.log("After Save:", updatedUser.password); // Debugging
  
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ success: false, message: "Error resetting password", error });
    }
  });
  // Pay Slip Schema
  const PayslipSchema = new mongoose.Schema(
    {
      employeeId: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      designation: {
        type: String,
        required: true,
        trim: true,
      },
      joiningDate: {
        type: Date, // Storing as Date type for better operations
        required: true,
      },
      basicPay: {
        type: Number,
        required: true,
        default: 0,
      },
      hra: {
        type: Number,
        required: true,
        default: 0,
      },
      conveyanceAllowances: {
        type: Number,
        required: true,
        default: 0,
      },
      medicalAllowances: {
        type: Number,
        required: true,
        default: 0,
      },
      ltaEducation: {
        type: Number,
        required: true,
        default: 0,
      },
      grossSalary: {
        type: Number,
        required: true,
        default: 0,
      },
      totalDays: {
        type: Number,
        required: true,
        default: 0,
      },
      daysPresent: {
        type: Number,
        required: true,
        default: 0,
      },
      pf:{
        type:Number,
        default: 0,

      },
      pt:{
        type:Number,
        default: 0,

      },
      otHours: {
        type: Number,
        default: 0,
      },
      otRate: {
        type: Number,
        default: 0,
      },
      otTotal: {
        type: Number,
        default: 0,
      },
      netTakeHome: {
        type: Number,
        required: true,
        default: 0,
      },
      esi:{
        type:Number,
        default:0
      }
      
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt
  );
  
  const Payslip = mongoose.model("Payslip", PayslipSchema);
  
  // Create Payslip and Send Email
  app.post("/payslips", async (req, res) => {
    console.log(req.body);
  
    try {
      let { employeeId, basicPay, hra, conveyanceAllowances, medicalAllowances, ltaEducation, otHours, otRate, totalDays, daysPresent , name , designation , joiningDate , email,esi } = req.body;
  
      // Validate and convert fields
      totalDays = Number(totalDays) || 0;
      daysPresent = Number(daysPresent) || 0;
      basicPay = Number(basicPay) || 0;
      hra = Number(hra) || 0;
      conveyanceAllowances = Number(conveyanceAllowances) || 0;
      medicalAllowances = Number(medicalAllowances) || 0;
      ltaEducation = Number(ltaEducation) || 0;
      otHours = Number(otHours) || 0;
      otRate = Number(otRate) || 0;
  
      // Ensure valid days count
      if (totalDays <= 0 || daysPresent < 0 || daysPresent > totalDays) {
        return res.status(400).json({ message: "Invalid totalDays or daysPresent value" });
      }
  
      // Fetch employee details
      const employee = await EmployeeSalary.findOne({ employeeId });
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      // Get the first day of the current month
const startOfMonth = new Date();
startOfMonth.setDate(1); // Set to the first day of the month
startOfMonth.setHours(0, 0, 0, 0); // Reset time to start of the day

// Get the first day of the next month
const startOfNextMonth = new Date(startOfMonth);
startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1); // Move to the next month

// Check if a payslip already exists for this employee in the current month
const existingPayslip = await Payslip.findOne({
  employeeId,
  createdAt: {
    $gte: startOfMonth, // From the beginning of the current month
    $lt: startOfNextMonth // Before the start of the next month
  }
});

if (existingPayslip) {
  return res.status(400).json({ message: "Payslip for this month already exists" });
}

  
      // Calculate Gross Salary
      const grossSalary = Math.round(basicPay + hra + conveyanceAllowances + medicalAllowances + ltaEducation);
  
      // Calculate PF (Provident Fund)
      const pf = basicPay > 15000 ? 1800 : Math.round(basicPay * 0.12);
  
      // Calculate PT (Professional Tax)
      const pt = grossSalary > 25000 ? 200 : 0;

      // // Calculate Esi (Professional Tax)
      // const Esi = grossSalary > 21000 ? 0 : (grossSalary * 0.0075);
  
      // Calculate Overtime Pay
      const otTotal = Math.round(otHours * otRate);
  
      // Calculate Net Take Home Salary
      const netTakeHome = Math.round(grossSalary - pf - pt - esi + otTotal);

      // Const Total Deductions
      const totalDeductions = pf + pt + esi;
  
      // Create Payslip
      const newPayslip = new Payslip({
        employeeId,
        basicPay,
        hra,
        conveyanceAllowances,
        medicalAllowances,
        ltaEducation,
        otHours,
        otRate,
        totalDays,
        daysPresent,
        grossSalary,
        pf,
        pt,
        otTotal,
        netTakeHome,
        name,
        joiningDate,
        designation,
        email,
        esi
      });
  
      await newPayslip.save();
  
      // Email Options
      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' }); // Full month name
      const year = currentDate.getFullYear();
      const date = currentDate.getDate();
      
      const mailOptions = {
        from: "magsolengineering@gmail.com",
        to: employee.email,
        subject: `Payslip for ${employee.name} - Employee ID: ${employeeId} (${month} ${year})`,
        html: `
          <h2 style="color: #2c3e50;">Payslip Details - ${employee.name}</h2>
          <p><strong>Company:</strong> Magsol Technologies</p>
          <p><strong>Date:</strong> ${date} ${month} ${year}</p>
          <p><strong>Employee ID:</strong> ${employeeId}</p>
          <p><strong>Employee Name:</strong> ${employee.name}</p>
          <p><strong>Email:</strong> ${employee.email}</p>
          <p><strong>Designation:</strong> ${employee.designation}</p>
          <p><strong>UAN Number:</strong> ${employee.uan || "Not Available"}</p>
          <p><strong>Total Working Days:</strong> ${totalDays}</p>
          <p><strong>Days Present:</strong> ${daysPresent}</p>
      
          <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; text-align: left; font-family: Arial, sans-serif;">
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px;">Salary Component</th>
              <th style="padding: 10px;">Amount (₹)</th>
            </tr>
            <tr><td>Basic Pay</td><td>${basicPay}</td></tr>
            <tr><td>HRA</td><td>${hra}</td></tr>
            <tr><td>Conveyance Allowance</td><td>${conveyanceAllowances}</td></tr>
            <tr><td>Medical Allowance</td><td>${medicalAllowances}</td></tr>
            <tr><td>LTA / Education</td><td>${ltaEducation}</td></tr>
            <tr style="background-color: #d9edf7; font-weight: bold;">
              <td>Gross Salary</td><td>${grossSalary}</td>
            </tr>
            <tr><td>PF Deduction</td><td>${pf}</td></tr>
            <tr><td>PT Deduction</td><td>${pt}</td></tr>
            <tr><td>ESI Deduction</td><td>${esi}</td></tr>
            <tr style="background-color:rgb(248, 248, 159); font-weight: bold;">
              <td>Net Total Deductions</td><td>${totalDeductions}</td>
            </tr>
            <tr><td>Overtime Pay</td><td>${otHours}*${otRate}=${otTotal}</td></tr>
            <tr style="background-color: #dff0d8; font-weight: bold;">
              <td>Net Take Home</td><td>${netTakeHome}</td>
            </tr>
          </table>
      
          <p style="margin-top: 20px;">For any discrepancies, please contact HR.</p>
          <p>Thank you!</p>
          <p><strong>Magsol Technologies</strong></p>
        `,
      };
      // Send Payslip Email
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Email sending failed:", err);
          return res.status(201).json({
            message: "Payslip generated, but email sending failed",
            newPayslip,
          });
        }
        res.status(201).json({
          message: "Payslip generated and email sent successfully!",
          newPayslip,
        });
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating payslip", error });
    }
  });
  // Get All Payslips
  app.get("/getAllPayslips",async (req,res)=>{
    try {
      const data = await Payslip.find();
      res.status(200).json(data);
      
    } catch (error) {
      console.log(error);
    }
  })
  // Get PaySlips For presentMonth
  app.get("/getPayslipsByMonth", async (req, res) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
      const data = await Payslip.find({
        createdAt: { $gte: firstDayOfMonth, $lt: lastDayOfMonth },
      });
  
      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching payslips" });
    }
  });

 // Login API (without password encryption)
 app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);

    // Check if user exists
    const user = await EmployeeSalary.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare plain text password
    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Exclude password and send full user details
    const { password: _, ...userDetails } = user.toObject();

    res.status(200).json({ 
      message: "Login successful", 
      user: userDetails  // Send full user details except password
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

  

  
  
  
  
