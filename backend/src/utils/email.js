const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const templates = {
  emailVerification: (data) => ({
    subject: 'Verify your Zenvio account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:30px;border-radius:10px">
        <div style="text-align:center;margin-bottom:30px">
          <h1 style="color:#1a56db;margin:0">Zenvio</h1>
          <p style="color:#6b7280;font-size:14px">Send Money Globally, Instantly</p>
        </div>
        <div style="background:white;padding:30px;border-radius:8px">
          <h2 style="color:#111827">Hi ${data.name}!</h2>
          <p style="color:#374151">Thank you for registering. Please verify your email address to activate your account.</p>
          <div style="text-align:center;margin:30px 0">
            <a href="${data.verifyUrl}" style="background:#1a56db;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">
              Verify Email Address
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>
      </div>
    `,
  }),
  passwordReset: (data) => ({
    subject: 'Password Reset - Zenvio',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:30px;border-radius:10px">
        <div style="text-align:center;margin-bottom:30px">
          <h1 style="color:#1a56db">Zenvio</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:8px">
          <h2 style="color:#111827">Password Reset Request</h2>
          <p style="color:#374151">Hi ${data.name}, we received a request to reset your password.</p>
          <div style="text-align:center;margin:30px 0">
            <a href="${data.resetUrl}" style="background:#dc2626;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">
              Reset Password
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">This link expires in 1 hour. If you didn't request this, please secure your account immediately.</p>
        </div>
      </div>
    `,
  }),
};

exports.sendEmail = async ({ to, subject, template, data, html }) => {
  const tmpl = templates[template] ? templates[template](data) : { subject, html };
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject: tmpl.subject,
    html: tmpl.html,
  });
};
