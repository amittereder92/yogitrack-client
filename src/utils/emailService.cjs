const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = "amittereder92@gmail.com";
const FROM_NAME  = "Yoga H'Om";
const STUDIO_EMAIL = "amittereder92@gmail.com";

// ── Welcome Email ─────────────────────────────────────────────────────────────
exports.sendWelcomeEmail = async ({ firstName, lastName, email, customerId }) => {
  const msg = {
    to:   email,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Welcome to Yoga H'Om, ${firstName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background:#f7f3ee; font-family:'Lato',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ee; padding:40px 20px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e8e0d5;">
              <!-- Header -->
              <tr>
                <td style="background:#3d3028; padding:32px 40px; text-align:center;">
                  <p style="margin:0; font-family:Georgia,serif; font-size:26px; font-weight:300; color:#f7f3ee; letter-spacing:0.05em;">Yoga H'Om</p>
                  <p style="margin:6px 0 0; font-size:11px; color:#c2b9a7; letter-spacing:0.15em; text-transform:uppercase;">Studio Management</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  <p style="margin:0 0 16px; font-size:22px; font-family:Georgia,serif; font-weight:300; color:#3d3028;">Welcome, ${firstName}!</p>
                  <p style="margin:0 0 16px; font-size:14px; line-height:1.7; color:#5a4e46;">
                    Thank you for joining Yoga H'Om. We're so glad you're here. Your member account has been created and you're ready to start your practice with us.
                  </p>
                  <table cellpadding="0" cellspacing="0" style="background:#f7f3ee; border-radius:6px; padding:16px 20px; margin:24px 0; width:100%;">
                    <tr><td style="font-size:12px; color:#9a8e84; letter-spacing:0.1em; text-transform:uppercase; padding-bottom:8px;">Your Account Details</td></tr>
                    <tr><td style="font-size:14px; color:#3d3028; padding:4px 0;"><strong>Name:</strong> ${firstName} ${lastName}</td></tr>
                    <tr><td style="font-size:14px; color:#3d3028; padding:4px 0;"><strong>Email:</strong> ${email}</td></tr>
                    <tr><td style="font-size:14px; color:#3d3028; padding:4px 0;"><strong>Member ID:</strong> ${customerId}</td></tr>
                  </table>
                  <p style="margin:0 0 16px; font-size:14px; line-height:1.7; color:#5a4e46;">
                    You can log in to your member portal to view the class schedule, check your balance, and see your attendance history.
                  </p>
                  <p style="margin:0; font-size:14px; line-height:1.7; color:#5a4e46;">
                    We look forward to seeing you on the mat. Namaste 🙏
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f7f3ee; padding:20px 40px; border-top:1px solid #e8e0d5; text-align:center;">
                  <p style="margin:0; font-size:11px; color:#9a8e84;">Yoga H'Om • 7053 Steubenville Pike, Oakdale, PA 15071</p>
                  <p style="margin:4px 0 0; font-size:11px; color:#9a8e84;">412-334-1741 • <a href="https://www.yogahom.com" style="color:#b5724a; text-decoration:none;">yogahom.com</a></p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  // Also notify admin
  const adminMsg = {
    to:      STUDIO_EMAIL,
    from:    { email: FROM_EMAIL, name: FROM_NAME },
    subject: `New Member Registration — ${firstName} ${lastName}`,
    html: `
      <p style="font-family:Arial,sans-serif; font-size:14px; color:#3d3028;">
        A new member has registered on YogiTrack.<br><br>
        <strong>Name:</strong> ${firstName} ${lastName}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Member ID:</strong> ${customerId}<br>
        <strong>Date:</strong> ${new Date().toLocaleString()}
      </p>
    `,
  };

  await sgMail.send(msg);
  await sgMail.send(adminMsg);
};

// ── Check-in Confirmation Email ───────────────────────────────────────────────
exports.sendCheckinEmail = async ({ firstName, email, className, checkinDatetime, newBalance }) => {
  const dt = new Date(checkinDatetime).toLocaleString([], {
    weekday: "long", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  let balanceNote = "";
  if (newBalance < 0) {
    balanceNote = `<p style="margin:16px 0 0; padding:12px 16px; background:#f8e8e8; border-radius:6px; font-size:13px; color:#842029;">
      Your class balance is currently <strong>${newBalance}</strong>. Please purchase a package soon to continue attending classes.
    </p>`;
  } else if (newBalance === 0) {
    balanceNote = `<p style="margin:16px 0 0; padding:12px 16px; background:#fff3cd; border-radius:6px; font-size:13px; color:#856404;">
      You have <strong>no classes remaining</strong>. Consider purchasing a package to keep your practice going!
    </p>`;
  } else if (newBalance <= 2) {
    balanceNote = `<p style="margin:16px 0 0; padding:12px 16px; background:#fff3cd; border-radius:6px; font-size:13px; color:#856404;">
      You have only <strong>${newBalance} class${newBalance !== 1 ? "es" : ""} remaining</strong> — consider renewing your package soon.
    </p>`;
  }

  const msg = {
    to:   email,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Thanks for practicing with us, ${firstName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background:#f7f3ee; font-family:'Lato',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ee; padding:40px 20px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e8e0d5;">
              <tr>
                <td style="background:#3d3028; padding:32px 40px; text-align:center;">
                  <p style="margin:0; font-family:Georgia,serif; font-size:26px; font-weight:300; color:#f7f3ee; letter-spacing:0.05em;">Yoga H'Om</p>
                  <p style="margin:6px 0 0; font-size:11px; color:#c2b9a7; letter-spacing:0.15em; text-transform:uppercase;">Class Check-In</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 40px 32px;">
                  <p style="margin:0 0 16px; font-size:22px; font-family:Georgia,serif; font-weight:300; color:#3d3028;">See you on the mat, ${firstName}! 🙏</p>
                  <p style="margin:0 0 24px; font-size:14px; line-height:1.7; color:#5a4e46;">
                    Your check-in has been recorded. Thank you for practicing with us today.
                  </p>
                  <table cellpadding="0" cellspacing="0" style="background:#f7f3ee; border-radius:6px; padding:16px 20px; margin:0 0 16px; width:100%;">
                    <tr><td style="font-size:12px; color:#9a8e84; letter-spacing:0.1em; text-transform:uppercase; padding-bottom:8px;">Check-In Details</td></tr>
                    <tr><td style="font-size:14px; color:#3d3028; padding:4px 0;"><strong>Class:</strong> ${className}</td></tr>
                    <tr><td style="font-size:14px; color:#3d3028; padding:4px 0;"><strong>Date:</strong> ${dt}</td></tr>
                    <tr><td style="font-size:14px; color:#3d3028; padding:4px 0;"><strong>Remaining Balance:</strong> ${newBalance} class${newBalance !== 1 ? "es" : ""}</td></tr>
                  </table>
                  ${balanceNote}
                </td>
              </tr>
              <tr>
                <td style="background:#f7f3ee; padding:20px 40px; border-top:1px solid #e8e0d5; text-align:center;">
                  <p style="margin:0; font-size:11px; color:#9a8e84;">Yoga H'Om • 7053 Steubenville Pike, Oakdale, PA 15071</p>
                  <p style="margin:4px 0 0; font-size:11px; color:#9a8e84;">412-334-1741 • <a href="https://www.yogahom.com" style="color:#b5724a; text-decoration:none;">yogahom.com</a></p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  await sgMail.send(msg);
};

// ── Password Reset Email ──────────────────────────────────────────────────────
exports.sendPasswordResetEmail = async ({ firstName, email, resetUrl }) => {
  const msg = {
    to:   email,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Reset Your YogiTrack Password",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background:#f7f3ee; font-family:'Lato',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ee; padding:40px 20px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e8e0d5;">
              <tr>
                <td style="background:#3d3028; padding:32px 40px; text-align:center;">
                  <p style="margin:0; font-family:Georgia,serif; font-size:26px; font-weight:300; color:#f7f3ee; letter-spacing:0.05em;">Yoga H'Om</p>
                  <p style="margin:6px 0 0; font-size:11px; color:#c2b9a7; letter-spacing:0.15em; text-transform:uppercase;">Password Reset</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 40px 32px;">
                  <p style="margin:0 0 16px; font-size:22px; font-family:Georgia,serif; font-weight:300; color:#3d3028;">Hi ${firstName},</p>
                  <p style="margin:0 0 24px; font-size:14px; line-height:1.7; color:#5a4e46;">
                    We received a request to reset your YogiTrack password. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
                  </p>
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                    <tr>
                      <td style="background:#7a8c6e; border-radius:4px; padding:14px 32px; text-align:center;">
                        <a href="${resetUrl}" style="font-family:Arial,sans-serif; font-size:13px; font-weight:600; color:#ffffff; text-decoration:none; letter-spacing:0.1em; text-transform:uppercase;">Reset My Password</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 8px; font-size:12px; color:#9a8e84; text-align:center;">Or copy this link into your browser:</p>
                  <p style="margin:0 0 24px; font-size:11px; color:#b5724a; text-align:center; word-break:break-all;">${resetUrl}</p>
                  <p style="margin:0; font-size:13px; color:#9a8e84;">
                    If you didn't request a password reset, you can ignore this email — your password will not change.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f7f3ee; padding:20px 40px; border-top:1px solid #e8e0d5; text-align:center;">
                  <p style="margin:0; font-size:11px; color:#9a8e84;">Yoga H'Om • 7053 Steubenville Pike, Oakdale, PA 15071</p>
                  <p style="margin:4px 0 0; font-size:11px; color:#9a8e84;">412-334-1741 • <a href="https://www.yogahom.com" style="color:#b5724a; text-decoration:none;">yogahom.com</a></p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  await sgMail.send(msg);
};
