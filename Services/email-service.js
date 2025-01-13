const { createTransport } = require("nodemailer");

class EmailService {
    constructor() {
       this.transporter = createTransport({
          host: process.env.MAIL_HOST,
          port: process.env.MAIL_PORT,
          secure: false,
          auth: {
             user: process.env.MAIL_USERNAME,
             pass: process.env.MAIL_PASSWORD,
          },
       });
    }
 
    async sendEmail(to, subject, html) {
       try {
          const message = {
             from: process.env.MAIL_FROM_ADDRESS,
             to: to,
             subject: subject,
             html: html,
          };
 
          await this.transporter.sendMail(message);
          return {
             success: true,
             message: "Email sent succesfully!",
             data: null,
          };
       } catch (err) {
          return {
             success: false,
             message: err,
             data: null,
          };
       }
    }
 
    async createEmailRecord(inputs) {
       try {
          const newRecord = new EmailRecord(inputs);
          const createdRecord = await newRecord.save();
 
          return {
             success: true,
             message: "Record created successfully!",
             data: createdRecord,
          };
       } catch (error) {
          console.log(error);
          return {
             success: false,
             message: error.message,
             data: null,
          };
       }
    }
 
    async getEmailRecords(filters) {
       try {
          const emailRecords = await EmailRecord.find(filters).lean();
 
          return {
             success: true,
             message: "Records found successfully!",
             data: emailRecords,
          };
       } catch (error) {
          return {
             success: false,
             message: error.message,
             data: null,
          };
       }
    }
 }

 module.exports = EmailService