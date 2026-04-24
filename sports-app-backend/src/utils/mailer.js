const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendTeamApprovalEmail = async (repEmail, repName, teamName, tournamentName) => {
  await transporter.sendMail({
    from: `"Sports Competition App" <${process.env.MAIL_USER}>`,
    to: repEmail,
    subject: `✅ Your team "${teamName}" has been approved!`,
    html: `
      <h2>Congratulations, ${repName}!</h2>
      <p>Your team <strong>${teamName}</strong> has been approved for <strong>${tournamentName}</strong>.</p>
      <p>You can now log in to manage your squad before the tournament begins.</p>
    `,
  });
};

const sendTeamRejectionEmail = async (repEmail, repName, teamName, tournamentName) => {
  await transporter.sendMail({
    from: `"Sports Competition App" <${process.env.MAIL_USER}>`,
    to: repEmail,
    subject: `Team Registration Update - ${teamName}`,
    html: `
      <h2>Hello ${repName},</h2>
      <p>Unfortunately, your team <strong>${teamName}</strong> was not approved for <strong>${tournamentName}</strong>.</p>
      <p>Please contact the tournament admin for more information.</p>
    `,
  });
};

module.exports = { sendTeamApprovalEmail, sendTeamRejectionEmail };
