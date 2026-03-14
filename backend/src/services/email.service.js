const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendBookingConfirmation = async ({ to, customerName, serviceName, staffName, bookingDate, startTime, bookingRef, tenantName }) => {
    const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed! ✅</h1>
        <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">${tenantName}</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #374151; font-size: 16px;">Hi <strong>${customerName}</strong>,</p>
        <p style="color: #374151;">Your appointment has been confirmed. Here are your details:</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <p style="margin: 4px 0;"><strong>Service:</strong> ${serviceName}</p>
          <p style="margin: 4px 0;"><strong>Staff:</strong> ${staffName}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(bookingDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${startTime}</p>
          <p style="margin: 4px 0;"><strong>Booking Ref:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${bookingRef}</code></p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Please arrive 5 minutes early. To cancel, contact us at least 24 hours before your appointment.</p>
      </div>
    </div>
  `;

    await transporter.sendMail({
        from: `"${tenantName}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Booking Confirmed – ${bookingRef}`,
        html,
    });
};

const sendBookingCancellation = async ({ to, customerName, bookingRef, tenantName, reason }) => {
    const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #ef4444, #f97316); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0;">Booking Cancelled</h1>
        <p style="color: rgba(255,255,255,0.8);">${tenantName}</p>
      </div>
      <div style="padding: 32px;">
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Your booking <strong>${bookingRef}</strong> has been cancelled.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact us directly.</p>
      </div>
    </div>
  `;

    await transporter.sendMail({
        from: `"${tenantName}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Booking Cancelled – ${bookingRef}`,
        html,
    });
};

module.exports = { sendBookingConfirmation, sendBookingCancellation };
