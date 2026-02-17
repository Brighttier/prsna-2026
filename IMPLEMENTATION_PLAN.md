
# Implementation Plan: Resend Email Integration

## Overview
We have integrated **Resend** to handle secure email delivery for:
1.  **Team Invitations**: Sending secure setup links to new team members.
2.  **Password Resets**: Sending branded password reset emails to existing users.

This replaces the default, unbranded Firebase template emails and moves the logic to the backend for better security and control.

## Changes Made

### Backend (`functions/`)
- **Dependencies**: Added `resend` package.
- **Secrets**: Defined `RESEND_API_KEY` using Firebase Secrets Manager.
- **Utility**: Created `src/utils/email.ts` with a responsive, branded HTML email template.
- **Functions**:
    - Updated `inviteTeamMember`: Generates a secure link and sends it via Resend.
    - Added `requestPasswordReset`: A new function to handle password resets via Resend.

### Frontend (`src/`)
- **Store (`services/store.ts`)**: Updated `inviteTeamMember` to rely on the backend for email sending.
- **Auth (`services/auth.ts`)**: Updated `resetPassword` to call the new `requestPasswordReset` Cloud Function.

## 🚀 Action Required: Set Up Secrets
Before deploying, you **MUST** set the Resend API Key in your Firebase project.

Run this command in your terminal:
```bash
firebase functions:secrets:set RESEND_API_KEY
```
*Paste your Resend API Key when prompted.*

## Deployment
Deploy the updated functions and frontend:
```bash
# Deploy Functions
firebase deploy --only functions

# Deploy Frontend (if hosted on Firebase Hosting)
npm run build
firebase deploy --only hosting
```

## Testing
1.  **Invite**: Go to Settings > Team and invite a new email. Check your inbox for the branded email.
2.  **Reset Password**: Go to the Login page, click "Forgot Password", and enter your email.

## Notes
- The emails are currently sent from `onboarding@resend.dev` (Resend's testing domain).
- To send from your own domain (e.g., `team@renovatemysite.com`), verify your domain in the Resend Dashboard and update `functions/src/utils/email.ts`.
