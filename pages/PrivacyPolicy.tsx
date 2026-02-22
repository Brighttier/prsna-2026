import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Privacy Policy</h1>
                            <p className="text-xs text-slate-500">Last updated: February 2026</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 space-y-8 text-sm text-slate-600 leading-relaxed">

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introduction</h2>
                        <p>
                            Presona Recruit ("we", "us", "our") is an AI-powered recruitment platform. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our services, whether as a recruiter (data controller) or a candidate (data subject).
                        </p>
                        <p className="mt-2">
                            We act as a <strong>data processor</strong> on behalf of the recruiting organization (the data controller) that uses our platform to manage their hiring process.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. Data We Collect</h2>
                        <h3 className="font-semibold text-slate-800 mt-4 mb-2">From Candidates:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Identity data:</strong> Name, email address</li>
                            <li><strong>Application data:</strong> Resume/CV file, 10-second video pitch, availability, application source</li>
                            <li><strong>Interview data:</strong> Video and audio recordings of AI interviews, transcripts generated via speech recognition</li>
                            <li><strong>Verification data:</strong> Selfie photo for identity verification during interviews</li>
                            <li><strong>AI-generated data:</strong> Resume screening scores, interview performance scores, proctoring integrity reports</li>
                        </ul>
                        <h3 className="font-semibold text-slate-800 mt-4 mb-2">From Recruiters:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Account data:</strong> Name, email, password (hashed), organization name</li>
                            <li><strong>Configuration data:</strong> Branding settings, AI persona configuration, assessment templates</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. How We Process Your Data</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Resume screening:</strong> Your resume is analyzed by Google Gemini AI to extract key information (skills, experience, education) and generate a compatibility score for the role.</li>
                            <li><strong>AI interviews:</strong> During live AI interviews, your audio is streamed to Google Gemini for real-time conversation. Your video feed is monitored for session integrity (eye gaze, environment, behavior, third-party presence). Recordings are stored for recruiter review.</li>
                            <li><strong>Identity verification:</strong> Your lobby selfie is compared with a frame captured during the interview using AI to verify identity consistency.</li>
                            <li><strong>Proctoring:</strong> AI monitors for: looking away from camera, environmental distractions, behavioral anomalies (e.g. reading from hidden sources), and third-party interference. You will be informed of monitored categories before the interview begins.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">4. Legal Basis for Processing</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Consent (GDPR Art. 6(1)(a)):</strong> Candidates provide explicit consent before submitting applications and before starting AI interviews.</li>
                            <li><strong>Legitimate interest (GDPR Art. 6(1)(f)):</strong> Recruiters process candidate data for hiring decisions.</li>
                            <li><strong>Contract performance (GDPR Art. 6(1)(b)):</strong> Processing necessary to evaluate job applications.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">5. Third-Party Processors</h2>
                        <p>We use the following sub-processors to deliver our services:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li><strong>Google Cloud / Firebase:</strong> Data storage, authentication, serverless functions (US region)</li>
                            <li><strong>Google Gemini AI:</strong> Resume analysis, interview conversation, proctoring analysis</li>
                            <li><strong>Resend:</strong> Transactional email delivery (invitations, notifications)</li>
                        </ul>
                        <p className="mt-2">All sub-processors are bound by data processing agreements. We use the paid Gemini API tier to ensure candidate data is not used for model training.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">6. Data Retention</h2>
                        <p>
                            Candidate data is retained according to the recruiting organization's configured retention policy. By default, data for rejected candidates is retained for up to 12 months. Organizations can configure auto-deletion periods of 6, 12, or 24 months in their settings.
                        </p>
                        <p className="mt-2">
                            Selfie images used for identity verification are stored only for the duration of the interview session review and are included in any deletion request.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">7. Your Rights</h2>
                        <p>Under GDPR, you have the right to:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li><strong>Access:</strong> Request a copy of your personal data held by the recruiting organization</li>
                            <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                            <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format (JSON)</li>
                            <li><strong>Objection:</strong> Object to automated decision-making based solely on AI analysis</li>
                            <li><strong>Withdraw consent:</strong> Withdraw your consent at any time without affecting prior processing</li>
                        </ul>
                        <p className="mt-2">
                            To exercise these rights, contact the recruiting organization that collected your data. They are the data controller responsible for responding to your requests within 30 days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">8. AI & Automated Decisions</h2>
                        <p>
                            AI-generated scores and analyses are provided as decision-support tools for human recruiters. No hiring decision is made solely by AI — all final decisions involve human review. Candidates have the right to request human intervention in any automated assessment under GDPR Article 22.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">9. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your data, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li>Encryption in transit (TLS/HTTPS) and at rest (Firebase default encryption)</li>
                            <li>Organization-level data isolation via Firebase custom claims</li>
                            <li>Role-based access control for team members</li>
                            <li>Anonymous authentication for candidate uploads (no account required)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">10. Contact</h2>
                        <p>
                            For privacy inquiries about the Presona Recruit platform, contact us at: <strong>privacy@personarecruit.ai</strong>
                        </p>
                        <p className="mt-2">
                            For inquiries about how a specific organization processes your data, contact that organization directly.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
};
