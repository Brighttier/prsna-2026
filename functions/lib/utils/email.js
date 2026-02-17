"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSecureLinkEmail = void 0;
const resend_1 = require("resend");
const sendSecureLinkEmail = async ({ to, link, type, role, name, apiKey, jobTitle, companyName }) => {
    const resend = new resend_1.Resend(apiKey);
    let subject = '';
    let headline = '';
    let message = '';
    let buttonText = '';
    if (type === 'INVITATION') {
        subject = `You've been invited to join RecruiteAI`;
        headline = 'Welcome to the Team';
        message = `You have been invited to join the <strong>${role || 'Team'}</strong> workspace on RecruiteAI. Click the button below to seek your password and get started.`;
        buttonText = 'Accept Invitation';
    }
    else if (type === 'OFFER') {
        subject = `Offer of Employment at ${companyName || 'RecruiteAI'}`;
        headline = 'Congratulations! You have an Offer';
        message = `We are pleased to offer you the position of <strong>${jobTitle || 'Team Member'}</strong> at ${companyName || 'our company'}. Click the link below to view your offer letter and details.`;
        buttonText = 'View Offer';
    }
    else if (type === 'INTERVIEW_INVITE') {
        subject = `AI Interview Invitation: ${jobTitle}`;
        headline = 'Invitation to AI Interview';
        message = `You have been selected for an AI-powered interview for the <strong>${jobTitle}</strong> role. You can complete this interview at your convenience. Click the link when you are ready to begin.`;
        buttonText = 'Start Interview';
    }
    else if (type === 'APPLICATION_RECEIPT') {
        subject = `Application Received: ${jobTitle}`;
        headline = 'Application Received';
        message = `Thank you for applying for the position of <strong>${jobTitle}</strong>. We have received your application and will review it shortly.`;
        buttonText = 'View Career Page'; // Or no button?
    }
    else if (type === 'REJECTION') {
        subject = `Update on your application for ${jobTitle}`;
        headline = 'Application Status Update';
        message = `Thank you for your interest in the <strong>${jobTitle}</strong> position. After careful consideration, we have decided to move forward with other candidates who more closely align with our current needs. We appreciate your time and wish you the best in your job search.`;
        buttonText = 'View Other Openings';
    }
    else if (type === 'ONBOARDING_INVITE') {
        subject = `Welcome Aboard! Start your Onboarding for ${jobTitle}`;
        headline = 'Welcome to the Team!';
        message = `We are thrilled to have you join us as a <strong>${jobTitle}</strong>! Please click the link below to access your secure onboarding portal and upload your required documents.`;
        buttonText = 'Start Onboarding';
    }
    else {
        subject = 'Reset your password for RecruiteAI';
        headline = 'Reset Your Password';
        message = 'We received a request to reset your password. If you didn\'t make this request, you can safely ignore this email.';
        buttonText = 'Reset Password';
    }
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; color: white; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
        .content { padding: 40px 32px; text-align: center; }
        .headline { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
        .message { font-size: 16px; color: #475569; margin-bottom: 32px; }
        .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: opacity 0.2s; }
        .button:hover { opacity: 0.9; }
        .footer { padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f1f5f9; }
        .link-text { word-break: break-all; color: #059669; font-size: 12px; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                ✨ RecruiteAI
            </div>
        </div>
        <div class="content">
            <h1 class="headline">${headline}</h1>
            <p class="message">${message}</p>
            ${link ? `<a href="${link}" class="button">${buttonText}</a>` : ''}
            ${link ? `<p class="link-text">Or copy this link: <br>${link}</p>` : ''}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} RecruiteAI. All rights reserved.</p>
            <p>If you didn't request this email, please ignore it.</p>
        </div>
    </div>
</body>
</html>
    `;
    return resend.emails.send({
        from: 'RecruiteAI <onboarding@resend.dev>', // Should update this later if they have a domain
        to: [to],
        subject: subject,
        html: html
    });
};
exports.sendSecureLinkEmail = sendSecureLinkEmail;
//# sourceMappingURL=email.js.map