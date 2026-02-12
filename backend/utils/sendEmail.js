import nodemailer from 'nodemailer';

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM) {
    console.warn('Email not sent: SMTP environment variables are not configured');
    return;
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Academix" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    text,
    html: html || text,
  });
};

