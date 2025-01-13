function requestApprovedEmail(destination, date) {
    const subject = "Vehicle Request Approved";
    const html = `
       <p>Dear Sir/Madam,</p>
       <p>Your Request for vehicle reservation to ${destination} on ${date} has been approved.</p>
       <p>Thank you!</p>
   `;
    return { subject, html };
}

module.exports = { requestApprovedEmail };
