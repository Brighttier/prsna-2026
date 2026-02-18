"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSecureLinkEmail = void 0;
const resend_1 = require("resend");
function getEmailContent(type, { name, role, jobTitle, companyName }) {
    const greeting = name ? name : 'there';
    const company = companyName || 'our team';
    switch (type) {
        case 'INVITATION':
            return {
                subject: `You've been invited to join ${company} on RecruiteAI`,
                preheader: `${company} wants you on the team. Accept your invitation to get started.`,
                icon: '&#128640;',
                iconBg: '#ecfdf5',
                headline: `You're Invited`,
                message: `Hi ${greeting},<br><br>You've been invited to join the <strong>${role || 'Team'}</strong> workspace on RecruiteAI. Set up your account in just a few clicks.`,
                detail: `<strong>Organization:</strong> ${company}`,
                buttonText: 'Accept Invitation',
                accentColor: '#059669',
                accentLight: '#ecfdf5',
            };
        case 'OFFER':
            return {
                subject: `Congratulations! Offer from ${company} — ${jobTitle}`,
                preheader: `Great news! You've received an offer for the ${jobTitle} position at ${company}.`,
                icon: '&#127881;',
                iconBg: '#fef3c7',
                headline: `You've Got an Offer!`,
                message: `Hi ${greeting},<br><br>We are delighted to extend an offer for the position of <strong>${jobTitle || 'Team Member'}</strong> at <strong>${company}</strong>. Your skills and experience stood out, and we'd love for you to join us.`,
                detail: `<strong>Position:</strong> ${jobTitle}<br><strong>Company:</strong> ${company}`,
                buttonText: 'Review Your Offer',
                accentColor: '#d97706',
                accentLight: '#fffbeb',
            };
        case 'INTERVIEW_INVITE':
            return {
                subject: `Interview Invitation — ${jobTitle} at ${company}`,
                preheader: `You've been selected for an AI interview for the ${jobTitle} role. Complete it at your convenience.`,
                icon: '&#127908;',
                iconBg: '#ede9fe',
                headline: `Your Interview Awaits`,
                message: `Hi ${greeting},<br><br>Congratulations on moving forward! You've been selected for an AI-powered interview for the <strong>${jobTitle}</strong> role. The interview is conversational and can be completed at your own pace.`,
                detail: `<strong>Role:</strong> ${jobTitle}<br><strong>Format:</strong> AI Video Interview<br><strong>Duration:</strong> ~15 minutes`,
                buttonText: 'Start Your Interview',
                accentColor: '#7c3aed',
                accentLight: '#f5f3ff',
            };
        case 'APPLICATION_RECEIPT':
            return {
                subject: `Application Received — ${jobTitle}`,
                preheader: `Thanks for applying! We've received your application for ${jobTitle} and will be in touch.`,
                icon: '&#9989;',
                iconBg: '#ecfdf5',
                headline: `Application Received`,
                message: `Hi ${greeting},<br><br>Thank you for your interest in the <strong>${jobTitle}</strong> position. We've successfully received your application and our team will review it carefully.`,
                detail: `<strong>Position:</strong> ${jobTitle}<br><strong>Status:</strong> Under Review`,
                buttonText: 'View Career Page',
                accentColor: '#059669',
                accentLight: '#ecfdf5',
                footerNote: 'You will receive updates on your application status via email.',
            };
        case 'REJECTION':
            return {
                subject: `Update on Your Application — ${jobTitle}`,
                preheader: `An update regarding your application for the ${jobTitle} position.`,
                icon: '&#128172;',
                iconBg: '#f1f5f9',
                headline: `Application Update`,
                message: `Hi ${greeting},<br><br>Thank you for taking the time to apply for the <strong>${jobTitle}</strong> position and for your interest in joining ${company}.<br><br>After careful review, we've decided to move forward with candidates whose experience more closely aligns with our current needs. This was a difficult decision — your background is impressive, and we encourage you to apply for future openings.`,
                buttonText: 'View Open Positions',
                accentColor: '#475569',
                accentLight: '#f8fafc',
                footerNote: 'We appreciate your time and wish you the very best in your career.',
            };
        case 'ONBOARDING_INVITE':
            return {
                subject: `Welcome to ${company}! Start Your Onboarding — ${jobTitle}`,
                preheader: `Exciting times ahead! Complete your onboarding to get started as ${jobTitle} at ${company}.`,
                icon: '&#127775;',
                iconBg: '#ecfdf5',
                headline: `Welcome Aboard!`,
                message: `Hi ${greeting},<br><br>We're thrilled to officially welcome you to <strong>${company}</strong> as our new <strong>${jobTitle}</strong>! Please complete your onboarding by uploading the required documents through your secure portal.`,
                detail: `<strong>Position:</strong> ${jobTitle}<br><strong>Company:</strong> ${company}`,
                buttonText: 'Start Onboarding',
                accentColor: '#059669',
                accentLight: '#ecfdf5',
            };
        default: // RESET_PASSWORD
            return {
                subject: 'Reset Your Password — RecruiteAI',
                preheader: 'A password reset was requested for your RecruiteAI account.',
                icon: '&#128274;',
                iconBg: '#f0f9ff',
                headline: `Reset Your Password`,
                message: `Hi ${greeting},<br><br>We received a request to reset the password for your RecruiteAI account. Click the button below to choose a new password.`,
                buttonText: 'Reset Password',
                accentColor: '#0284c7',
                accentLight: '#f0f9ff',
                footerNote: 'If you didn\'t request this, you can safely ignore this email. Your password will remain unchanged.',
            };
    }
}
function buildEmailHtml(content, link) {
    const { subject, preheader, icon, iconBg, headline, message, detail, buttonText, accentColor, accentLight, footerNote } = content;
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>${subject}</title>
    <!--[if mso]>
    <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
    <![endif]-->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        td { border-collapse: collapse; }
        @media only screen and (max-width: 620px) {
            .container { width: 100% !important; padding: 0 16px !important; }
            .content-cell { padding: 32px 24px !important; }
            .headline { font-size: 24px !important; }
            .button-td { padding: 0 24px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

    <!-- Preheader (hidden preview text) -->
    <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
        ${preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>

    <!-- Outer wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
        <tr>
            <td align="center" style="padding: 40px 16px 48px;">

                <!-- Main card -->
                <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06);">

                    <!-- Header bar -->
                    <tr>
                        <td style="height:4px; background: linear-gradient(90deg, ${accentColor} 0%, #0d9488 50%, #0284c7 100%); font-size:0; line-height:0;">&nbsp;</td>
                    </tr>

                    <!-- Logo -->
                    <tr>
                        <td align="center" style="padding: 32px 40px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #059669, #0d9488); border-radius:10px; padding:8px 10px; line-height:1;">
                                        <span style="font-size:16px; color:#ffffff;">&#10024;</span>
                                    </td>
                                    <td style="padding-left:10px;">
                                        <span style="font-size:18px; font-weight:700; color:#0f172a; letter-spacing:-0.3px;">Recruite</span><span style="font-size:18px; font-weight:700; color:${accentColor};">AI</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 24px 40px 0;">
                            <div style="height:1px; background-color:#e2e8f0;"></div>
                        </td>
                    </tr>

                    <!-- Icon -->
                    <tr>
                        <td align="center" class="content-cell" style="padding: 36px 40px 0;">
                            <div style="width:64px; height:64px; border-radius:16px; background-color:${iconBg}; display:inline-block; text-align:center; line-height:64px;">
                                <span style="font-size:28px;">${icon}</span>
                            </div>
                        </td>
                    </tr>

                    <!-- Headline -->
                    <tr>
                        <td align="center" style="padding: 20px 40px 0;">
                            <h1 class="headline" style="margin:0; font-size:26px; font-weight:700; color:#0f172a; line-height:1.3; letter-spacing:-0.5px;">${headline}</h1>
                        </td>
                    </tr>

                    <!-- Message -->
                    <tr>
                        <td align="center" style="padding: 16px 40px 0;">
                            <p style="margin:0; font-size:15px; line-height:1.7; color:#475569; text-align:center;">${message}</p>
                        </td>
                    </tr>

                    <!-- Detail card (optional) -->
                    ${detail ? `
                    <tr>
                        <td style="padding: 24px 40px 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="background-color:${accentLight}; border-radius:12px; padding:16px 20px; border-left:3px solid ${accentColor};">
                                        <p style="margin:0; font-size:13px; line-height:1.8; color:#334155;">${detail}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>` : ''}

                    <!-- Button -->
                    ${link ? `
                    <tr>
                        <td align="center" class="button-td" style="padding: 28px 40px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="border-radius:10px; background-color:${accentColor};">
                                        <a href="${link}" target="_blank" style="display:inline-block; padding:14px 36px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px; min-width:180px; text-align:center;">${buttonText}</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Fallback link -->
                    <tr>
                        <td align="center" style="padding: 16px 40px 0;">
                            <p style="margin:0; font-size:12px; color:#94a3b8; line-height:1.5;">Or copy and paste this link into your browser:</p>
                            <p style="margin:4px 0 0; font-size:12px; color:${accentColor}; word-break:break-all; line-height:1.5;">${link}</p>
                        </td>
                    </tr>` : ''}

                    <!-- Footer note (optional) -->
                    ${footerNote ? `
                    <tr>
                        <td align="center" style="padding: 24px 40px 0;">
                            <p style="margin:0; font-size:13px; color:#64748b; line-height:1.6; font-style:italic;">${footerNote}</p>
                        </td>
                    </tr>` : ''}

                    <!-- Spacer before footer -->
                    <tr>
                        <td style="padding-top:32px;"></td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc; padding: 24px 40px; border-top:1px solid #e2e8f0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <p style="margin:0 0 4px; font-size:12px; font-weight:600; color:#64748b;">RecruiteAI</p>
                                        <p style="margin:0; font-size:11px; color:#94a3b8; line-height:1.6;">AI-powered recruitment, simplified.</p>
                                        <p style="margin:12px 0 0; font-size:11px; color:#cbd5e1;">&copy; ${new Date().getFullYear()} RecruiteAI. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                <!-- /Main card -->

            </td>
        </tr>
    </table>

</body>
</html>`;
}
const sendSecureLinkEmail = async ({ to, link, type, role, name, apiKey, jobTitle, companyName }) => {
    const resend = new resend_1.Resend(apiKey);
    const content = getEmailContent(type, { name, role, jobTitle, companyName });
    const html = buildEmailHtml(content, link);
    return resend.emails.send({
        from: 'RecruiteAI <noreply@updates.personarecruit.ai>',
        to: [to],
        subject: content.subject,
        html: html
    });
};
exports.sendSecureLinkEmail = sendSecureLinkEmail;
//# sourceMappingURL=email.js.map