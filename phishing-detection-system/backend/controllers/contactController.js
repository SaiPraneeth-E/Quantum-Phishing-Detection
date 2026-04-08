const nodemailer = require('nodemailer');

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'saipraneeth080805@gmail.com';

function getTransporter() {
  const user = process.env.GMAIL_USER || process.env.CONTACT_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

exports.sendContact = async (req, res) => {
  try {
    const { name, mobile, email, description } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const transporter = getTransporter();
    if (!transporter) {
      return res.status(503).json({
        message: 'Contact form is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in server env.',
      });
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER || CONTACT_EMAIL,
      to: CONTACT_EMAIL,
      subject: `Connect: ${name} (${email})`,
      text: `Name: ${name}\nMobile: ${mobile || '-'}\nEmail: ${email}\nDescription: ${description || '-'}`,
      html: `
        <h2>New Connect Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Mobile:</strong> ${mobile || '-'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Description:</strong> ${description || '-'}</p>
      `,
    });

    res.json({ message: 'Message sent successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to send message.' });
  }
};
