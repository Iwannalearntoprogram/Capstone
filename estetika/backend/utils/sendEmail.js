// utils/sendEmail.js

const SibApiV3Sdk = require("sib-api-v3-sdk");

const sendEmail = async (email, otp) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  if (!apiKey || !senderEmail || !senderName) {
    throw new Error("Missing Brevo environment variables");
  }

  SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey = apiKey;
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email }],
    subject: "Your OTP Code",
    textContent: `Your OTP is ${otp}. It expires in 5 minutes.`,
  };

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

module.exports = sendEmail;
