const nodemailer = require("nodemailer");
const SibApiV3Sdk = require("sib-api-v3-sdk");

const OTP_SUBJECT = "Your OTP Code";

const buildOtpMessage = (otp) => ({
  subject: OTP_SUBJECT,
  text: `Your OTP is ${otp}. It expires in 5 minutes.`,
  html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
});

const sendViaBrevo = async (email, otp) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  if (!apiKey || !senderEmail || !senderName) {
    throw new Error("Brevo is not fully configured");
  }

  SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey = apiKey;
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const message = buildOtpMessage(otp);

  await apiInstance.sendTransacEmail({
    sender: { email: senderEmail, name: senderName },
    to: [{ email }],
    subject: message.subject,
    textContent: message.text,
    htmlContent: message.html,
  });
};

const sendViaGmail = async (email, otp) => {
  const gmailUser = process.env.EMAIL;
  const gmailPass = process.env.EMAIL_PASS;
  const senderName = process.env.BREVO_SENDER_NAME || "Moss Design House";

  if (!gmailUser || !gmailPass) {
    throw new Error("Gmail fallback is not fully configured");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const message = buildOtpMessage(otp);

  await transporter.sendMail({
    from: `"${senderName}" <${gmailUser}>`,
    to: email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};

const sendEmail = async (email, otp) => {
  try {
    await sendViaBrevo(email, otp);
    return;
  } catch (brevoError) {
    console.error("Brevo email send failed:", brevoError.message);
  }

  try {
    await sendViaGmail(email, otp);
  } catch (gmailError) {
    console.error("Gmail fallback email send failed:", gmailError.message);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = sendEmail;
