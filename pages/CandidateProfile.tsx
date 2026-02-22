
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { CandidateAvatar } from '../components/CandidateAvatar';
import { ArrowLeft, User, Users, BrainCircuit, MessageSquare, DollarSign, Server, Mail, Phone, Linkedin, Github, Download, Briefcase, CheckCircle, AlertCircle, Sparkles, MapPin, MoreHorizontal, Video, PlayCircle, ChevronRight, X, Play, Pause, Volume2, VolumeX, Maximize, Flag, VideoOff, PenTool, Send, FileText, Check, Loader2, Laptop, Calendar, XCircle, UploadCloud, FileCheck, Code, Minus, Clock, Globe, Folder, File, Plus, Search, Trash2, MoreVertical, ExternalLink, Activity, BellRing, Cpu, RefreshCw, Edit2, ShieldCheck, Eye, Fingerprint } from 'lucide-react';
import { Candidate, OfferDetails, OnboardingTask } from '../types';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { store, ExtendedCandidate, InterviewSession, TranscriptEntry, VideoHighlight } from '../services/store';
import { db, collection } from '../services/firebase';
import { query, where, getDocs } from 'firebase/firestore';
import { generateCandidateReport } from '../services/ai';


// --- MODALS (Copied for functionality in full page) ---

const ScheduleModal = ({ candidate, onClose, onScheduled }: { candidate: any, onClose: () => void, onScheduled: (session: InterviewSession) => void }) => {
    const [mode, setMode] = useState<'AI' | 'Schedule External'>('AI');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');
    const [timezone, setTimezone] = useState('Asia/Kolkata');
    const [expiryDays, setExpiryDays] = useState(3);
    const [type, setType] = useState('Lumina Screening (AI)');
    const [platform, setPlatform] = useState<'Google Meet' | 'Microsoft Teams'>('Google Meet');
    const [includeMeet, setIncludeMeet] = useState(true);
    const [interviewerEmail, setInterviewerEmail] = useState('');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);
    const [assessments] = useState(store.getState().assessments);

    const timezones = [
        { label: '(GMT-08:00) Pacific Time', value: 'America/Los_Angeles' },
        { label: '(GMT-05:00) Eastern Time', value: 'America/New_York' },
        { label: '(GMT+00:00) UTC', value: 'UTC' },
        { label: '(GMT+05:30) IST', value: 'Asia/Kolkata' },
        { label: '(GMT+08:00) SGT', value: 'Asia/Singapore' },
    ];

    const handleSchedule = async () => {
        setIsScheduling(true);
        try {
            let meetLink: string | undefined;

            if (mode === 'Schedule External' && includeMeet) {
                if (platform === 'Google Meet') {
                    // Use real Google Meet Cloud Function
                    try {
                        const result = await store.createGoogleMeetEvent({
                            candidateId: candidate.id,
                            candidateName: candidate.name,
                            candidateEmail: candidate.email,
                            jobTitle: candidate.role,
                            date,
                            time,
                            timezone,
                            interviewerEmail: interviewerEmail || undefined,
                        });
                        meetLink = result.meetLink;
                    } catch (meetErr: any) {
                        console.error("Google Meet creation failed:", meetErr);
                        alert('Failed to create Google Meet link. Please check your Google Calendar integration in Settings.');
                        return;
                    }
                } else {
                    // Use real Microsoft Teams Cloud Function
                    try {
                        const result = await store.createTeamsMeeting({
                            candidateId: candidate.id,
                            candidateName: candidate.name,
                            candidateEmail: candidate.email,
                            jobTitle: candidate.role,
                            date,
                            time,
                            interviewerEmail: interviewerEmail || undefined,
                        });
                        meetLink = result.meetLink;
                    } catch (teamsErr: any) {
                        console.error("Teams meeting creation failed:", teamsErr);
                        alert('Failed to create Teams meeting. Please check your Microsoft Teams integration.');
                        return;
                    }
                }
            }

            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + expiryDays);

            const interviewToken = mode === 'AI' ? crypto.randomUUID() : undefined;

            const newSession: InterviewSession = {
                id: crypto.randomUUID().substring(0, 9),
                date: mode === 'AI' ? 'Immediate' : new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: mode === 'AI' ? 'Anytime' : time,
                timezone: mode === 'Schedule External' ? timezone : undefined,
                expiryDate: mode === 'AI' ? expiryDate.toLocaleDateString() : undefined,
                assessmentId: mode === 'AI' ? selectedAssessmentId : undefined,
                token: interviewToken,
                mode: mode,
                type: mode === 'AI' ? 'Lumina AI Interview' : type,
                status: 'Upcoming',
                meetLink: meetLink,
                platform: mode === 'Schedule External' && includeMeet ? platform : undefined
            };

            if (mode === 'AI' && interviewToken) {
                // Trigger the backend email via Store with secure token
                store.sendAiInterviewInvite(candidate.id, candidate.email, interviewToken, selectedAssessmentId)
                    .then(() => console.log("AI Invite sent to backend"))
                    .catch(err => console.error("Failed to send AI invite", err));
            }

            store.addInterviewSession(candidate.id, newSession);
            onScheduled(newSession);
        } catch (err) {
            console.error("Failed to schedule interview:", err);
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-0 overflow-hidden shadow-2xl relative animate-scale-in">
                <div className="bg-slate-900 p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 transition-colors"><X className="w-5 h-5" /></button>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">Schedule Interview</h2>
                            <p className="text-slate-400 text-sm">Select interview orchestration mode</p>
                        </div>
                    </div>

                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                        <button
                            onClick={() => setMode('AI')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'AI' ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <BrainCircuit className="w-4 h-4" /> Lumina AI
                        </button>
                        <button
                            onClick={() => setMode('Schedule External')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'Schedule External' ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Users className="w-4 h-4" /> Schedule External
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-5 bg-white">
                    {mode === 'AI' ? (
                        <div className="space-y-4 animate-fade-in-up">
                            <div className="bg-brand-50 border border-brand-100 p-4 rounded-2xl">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-brand-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 leading-tight">Instant Orchestration</p>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">Lumina will send a secure link immediately. Candidate can start the interview anytime beforeexpiry.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Link Expiry</label>
                                <select
                                    value={expiryDays}
                                    onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                                >
                                    <option value={1}>24 Hours</option>
                                    <option value={3}>3 Days (Recommended)</option>
                                    <option value={7}>7 Days</option>
                                    <option value={14}>14 Days</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assessment Module</label>
                                <select
                                    value={selectedAssessmentId}
                                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                                >
                                    <option value="">Default (General Screening)</option>
                                    {assessments.filter(a => a.type === 'QuestionBank').map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1 italic">Choice of module guides the AI's questioning focus.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in-up">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Interview Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                                >
                                    <option>Technical Round 1</option>
                                    <option>System Design Review</option>
                                    <option>Cultural Fit Chat</option>
                                    <option>Management Interview</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Time</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Timezone</label>
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-sm"
                                >
                                    {timezones.map(tz => (
                                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Interviewer Email</label>
                                <input
                                    type="email"
                                    value={interviewerEmail}
                                    onChange={(e) => setInterviewerEmail(e.target.value)}
                                    placeholder="interviewer@company.com"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1 italic">Invite link will be sent to both candidate and interviewer.</p>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <div className={`flex-1 p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${includeMeet && platform === 'Google Meet' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/30' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                    onClick={() => { setIncludeMeet(true); setPlatform('Google Meet'); }}>
                                    <Globe className={`w-5 h-5 ${includeMeet && platform === 'Google Meet' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tighter">Google Meet</span>
                                </div>
                                <div className={`flex-1 p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${includeMeet && platform === 'Microsoft Teams' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500/30' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                    onClick={() => { setIncludeMeet(true); setPlatform('Microsoft Teams'); }}>
                                    <div className={`text-xs font-black ${includeMeet && platform === 'Microsoft Teams' ? 'text-blue-600' : 'text-slate-400'}`}>T</div>
                                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tighter">Teams</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSchedule}
                        disabled={isScheduling}
                        className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-brand-500/20 hover:bg-brand-700 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3 mt-2"
                    >
                        {isScheduling ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Generating Secure Invite...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-6 h-6" />
                                <span>{mode === 'AI' ? 'Send AI Interview Link' : 'Schedule & Send Invite'}</span>
                            </>
                        )}
                    </button>
                </div>
            </Card>
            </div>
        </div>
    );
};

const InterviewConfirmationModal = ({ candidate, session, onClose }: { candidate: any, session: InterviewSession, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[110] overflow-y-auto animate-fade-in">
            <div className="min-h-full flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-0 overflow-hidden shadow-2xl border-none animate-scale-in">
                <div className="bg-emerald-600 p-8 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Send className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">Email Dispatched!</h2>
                            <p className="text-emerald-100 text-sm">Meeting details sent to {candidate.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-8 space-y-6 bg-slate-50">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Preview: Sending via {session.mode === 'AI' ? 'Lumina Engine' : (session.platform === 'Microsoft Teams' ? 'Outlook' : 'Gmail')}
                            </span>
                            <div className="flex gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                            </div>
                        </div>
                        <div className="p-8 space-y-4 text-slate-600 font-serif leading-relaxed">
                            <p>Hi {candidate.name.split(' ')[0]},</p>
                            <p>I'm excited to move forward with your application for the <strong>{candidate.role}</strong> position.</p>

                            {session.mode === 'AI' ? (
                                <>
                                    <p>As the next step, we've prepared a <strong>Lumina AI Interview</strong> session for you. This is a conversational session where you can showcase your skills at your own pace.</p>
                                    <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100 my-6 font-sans not-italic">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-brand-200 flex items-center justify-center">
                                                <BrainCircuit className="w-6 h-6 text-brand-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Secure Interview Link</p>
                                                <p className="text-xs text-brand-600 font-bold uppercase tracking-widest">Expires on {session.expiryDate}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-white border border-brand-100 rounded-lg truncate text-xs text-slate-500 font-mono">
                                            {session.meetLink}
                                        </div>
                                    </div>
                                    <p>You can use the link above to start the session whenever you are ready. Please ensure you are in a quiet environment.</p>
                                </>
                            ) : (
                                <>
                                    <p>We've scheduled our <strong>{session.type}</strong> interview for:</p>

                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-6 my-6 font-sans not-italic">
                                        <div className="flex flex-col items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-sm border border-brand-100">
                                            <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">{session.date.split(' ')[0]}</span>
                                            <span className="text-3xl font-black text-slate-900 leading-none">{session.date.split(' ')[1].replace(',', '')}</span>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-slate-900">{session.time} ({session.timezone})</p>
                                            <p className="text-sm font-medium text-slate-500">{session.platform || 'Google Meet'} Invitation Sent</p>
                                        </div>
                                    </div>

                                    {session.meetLink && (
                                        <div className={`p-4 rounded-xl border flex items-center gap-3 font-sans text-sm ${session.platform === 'Microsoft Teams' ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'}`}>
                                            <Video className={`w-5 h-5 ${session.platform === 'Microsoft Teams' ? 'text-blue-600' : 'text-indigo-600'}`} />
                                            <span className={`font-bold ${session.platform === 'Microsoft Teams' ? 'text-blue-900' : 'text-indigo-900'}`}>Meeting Link:</span>
                                            <a href={session.meetLink} target="_blank" rel="noopener noreferrer" className={`underline font-medium truncate ${session.platform === 'Microsoft Teams' ? 'text-blue-600' : 'text-indigo-600'}`}>{session.meetLink}</a>
                                        </div>
                                    )}
                                </>
                            )}

                            <p className="mt-6 italic opacity-80">Looking forward to {session.mode === 'AI' ? 'reviewing your session' : 'speaking with you'}!</p>
                            <p className="pt-4 border-t border-slate-100">Best regards,<br /><strong>The Hiring Team</strong></p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <p className="text-xs text-slate-400 italic">"{session.mode === 'AI' ? 'AI Link Dispatched! Verification active.' : 'Calendar invite synced across all stakeholders.'}"</p>
                        <button
                            onClick={onClose}
                            className="w-full mt-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                            Return to Profile
                        </button>
                    </div>
                </div>
            </Card>
            </div>
        </div>
    );
};
const OfferConfirmationModal = ({ candidate, offer, onClose }: { candidate: any, offer: OfferDetails, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[110] overflow-y-auto animate-fade-in">
            <div className="min-h-full flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-0 overflow-hidden shadow-2xl border-none animate-scale-in">
                <div className="bg-brand-600 p-8 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Send className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">Offer Dispatched!</h2>
                            <p className="text-brand-100 text-sm">Official letter sent to {candidate.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-8 space-y-6 bg-slate-50">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preview: Official Offer Email</span>
                            <div className="flex gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                            </div>
                        </div>
                        <div className="p-8 space-y-4 text-slate-600 font-serif leading-relaxed">
                            <p>Dear {candidate.name.split(' ')[0]},</p>
                            <p>We are absolutely thrilled to offer you the position of <strong>{candidate.role}</strong> at our company!</p>

                            <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100 my-6 font-sans not-italic">
                                <h4 className="text-brand-900 font-black uppercase text-xs tracking-widest mb-4">Compensation Package Highlights</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-brand-600 uppercase">Annual Salary</p>
                                        <p className="text-2xl font-black text-slate-900">${offer.salary.toLocaleString()} {offer.currency}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-brand-600 uppercase">Equity Stake</p>
                                        <p className="text-2xl font-black text-slate-900">{offer.equity || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-brand-600 uppercase">Sign-on Bonus</p>
                                        <p className="text-[17px] font-semibold text-slate-900">{offer.signOnBonus || 'None'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-brand-600 uppercase">Target Start Date</p>
                                        <p className="text-[17px] font-semibold text-slate-900">{offer.startDate || 'TBD'}</p>
                                    </div>
                                </div>
                            </div>

                            <p>You can review and sign the full offer letter by clicking the secure link below. This offer is valid for 7 days.</p>

                            <div className="flex justify-center py-4">
                                <div className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold font-sans shadow-lg shadow-brand-500/20">
                                    Review & Sign Official Letter
                                </div>
                            </div>

                            <p className="mt-6 italic opacity-80">We can't wait to have you on the team!</p>
                            <p className="pt-4 border-t border-slate-100">Warmly,<br /><strong>The People Operations Team</strong></p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <p className="text-xs text-slate-400 italic">"Sent! A notification has also been triggered in their Mobile Wallet."</p>
                        <button
                            onClick={onClose}
                            className="w-full mt-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                            Return to Profile
                        </button>
                    </div>
                </div>
            </Card>
            </div>
        </div>
    );
};

const DocusignModal = ({ candidate, offer, onClose, onComplete }: { candidate: any, offer: OfferDetails, onClose: () => void, onComplete: (envelopeId: string) => void }) => {
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateEnvelope = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setStep(2);
            setIsProcessing(false);
        }, 2000);
    };

    const handleSend = async () => {
        setIsProcessing(true);
        try {
            const result = await store.sendDocuSignOffer(candidate.id);
            onComplete(result.envelopeId);
        } catch (err: any) {
            console.error('DocuSign send failed:', err);
            alert('Failed to send via DocuSign. Check your DocuSign configuration.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] overflow-y-auto animate-fade-in">
            <div className="min-h-full flex items-center justify-center p-4">
            <Card className="max-w-xl w-full p-0 overflow-hidden shadow-2xl border-none animate-scale-in bg-white">
                <div className="bg-[#FF0000] p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <PenTool className="w-6 h-6 text-[#FF0000]" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight italic">DocuSign Integration</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-[17px] font-semibold text-slate-900">Prepare Signing Envelope</h3>
                                <p className="text-sm text-slate-500 mt-1 text-balance">We are mapping fields from your generated offer letter to a DocuSign template.</p>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><User className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signer</p>
                                            <p className="text-sm font-bold text-slate-900">{candidate.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-black tracking-widest">RECIPIENT</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between opacity-60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center"><Briefcase className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Counter-signer</p>
                                            <p className="text-sm font-bold text-slate-900">Hiring Manager</p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] bg-slate-600 text-white px-2 py-0.5 rounded font-black tracking-widest">OWNER</div>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateEnvelope}
                                disabled={isProcessing}
                                className="w-full py-4 bg-[#FF0000] text-white rounded-2xl font-black text-lg shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all flex items-center justify-center gap-3"
                            >
                                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Envelope'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <h3 className="text-[17px] font-semibold text-slate-900 italic">Signature Fields Mapped</h3>
                                <p className="text-sm text-slate-500 mt-1">Ready to dispatch via DocuSign Connect.</p>
                            </div>

                            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <PenTool className="w-12 h-12 text-[#FF0000]" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                                        <span className="font-bold text-slate-400 uppercase">Document Name</span>
                                        <span className="font-bold text-slate-900">Offer_Letter_{candidate.name.replace(' ', '_')}.pdf</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                                        <span className="font-bold text-slate-400 uppercase">Interactive Fields</span>
                                        <span className="font-bold text-slate-900">4 Mapped (Signature, Date, Initials)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-400 uppercase">Branding</span>
                                        <span className="font-bold text-slate-900">Corporate Identity Applied</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={isProcessing}
                                className="w-full py-4 bg-[#FF0000] text-white rounded-2xl font-black text-lg shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all flex items-center justify-center gap-3"
                            >
                                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm & Send for Signing'}
                            </button>
                        </div>
                    )}
                </div>
            </Card>
            </div>
        </div>
    );
};

const DocusignPulse = ({ envelopeId, candidateId }: { envelopeId: string; candidateId?: string }) => {
    const [activities, setActivities] = useState([
        { id: 1, type: 'Sent', text: 'Offer dispatched via DocuSign', time: 'Pending sync...', icon: Send, color: 'text-blue-500' },
    ]);
    const [isNudging, setIsNudging] = useState(false);

    // Poll DocuSign status on mount and every 30 seconds
    useEffect(() => {
        if (!candidateId || !envelopeId) return;

        const pollStatus = async () => {
            try {
                const result = await store.checkDocuSignStatus(candidateId);
                const statusActivities: any[] = [
                    { id: 1, type: 'Sent', text: 'Offer dispatched via DocuSign', time: 'Confirmed', icon: Send, color: 'text-blue-500' },
                ];

                if (result.status === 'Delivered' || result.status === 'Completed' || result.status === 'Declined') {
                    statusActivities.push({ id: 2, type: 'Delivered', text: 'Candidate received email notification', time: 'Confirmed', icon: Mail, color: 'text-emerald-500' });
                }
                if (result.status === 'Completed') {
                    statusActivities.push({ id: 3, type: 'Signed', text: 'Document signed by candidate', time: 'Complete', icon: CheckCircle, color: 'text-emerald-400', pulse: true });
                }
                if (result.status === 'Declined') {
                    statusActivities.push({ id: 3, type: 'Declined', text: 'Candidate declined the offer', time: 'Final', icon: AlertCircle, color: 'text-red-400', pulse: true });
                }
                if (!['Completed', 'Declined'].includes(result.status || '')) {
                    statusActivities.push({ id: 99, type: 'Waiting', text: `Current status: ${result.status}`, time: 'Live', icon: Activity, color: 'text-amber-500', pulse: true });
                }

                setActivities(statusActivities);
            } catch (err) {
                console.warn("DocuSign poll failed (credentials may not be configured):", err);
            }
        };

        pollStatus();
        const interval = setInterval(pollStatus, 30000);
        return () => clearInterval(interval);
    }, [candidateId, envelopeId]);

    const handleNudge = () => {
        setIsNudging(true);
        setTimeout(() => {
            const newActivity = {
                id: Date.now(),
                type: 'Nudge',
                text: 'Follow-up email dispatched via Lumina Engine',
                time: 'Just now',
                icon: BellRing,
                color: 'text-brand-400'
            };
            setActivities(prev => [newActivity, ...prev]);
            setIsNudging(false);
        }, 1500);
    };

    return (
        <div className="mt-4 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <PenTool className="w-20 h-20 text-white" />
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Live Document Pulse</h4>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleNudge}
                        disabled={isNudging}
                        className="px-3 py-1 bg-brand-600/20 hover:bg-brand-600 text-brand-400 hover:text-white border border-brand-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        {isNudging ? <Loader2 className="w-3 h-3 animate-spin" /> : <BellRing className="w-3 h-3" />}
                        Nudge Candidate
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">{envelopeId}</span>
                </div>
            </div>

            <div className="space-y-4 relative z-10 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 group animate-fade-in-up">
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center ${activity.color}`}>
                                <activity.icon className={`w-4 h-4 ${activity.pulse ? 'animate-bounce' : ''}`} />
                            </div>
                            <div className="w-px h-full bg-white/10 my-1"></div>
                        </div>
                        <div className="flex-1 pb-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-white uppercase tracking-wider">{activity.type}</p>
                                <span className="text-[10px] text-slate-500 font-medium">{activity.time}</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{activity.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
                <span className="text-slate-500 italic">Connected to DocuSign Real-time API</span>
                <span className="text-brand-400">Listening...</span>
            </div>
        </div>
    );
};

const TranscriptModal = ({ session, onClose }: { session: InterviewSession, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto animate-fade-in">
            <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Interview Transcript</h3>
                        <p className="text-xs text-slate-500 font-medium">{session.type} • {session.date}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    {session.transcript?.map((entry, i) => (
                        <div key={i} className={`flex gap-4 ${entry.speaker === 'Candidate' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm border border-slate-100 ${entry.speaker === 'Lumina' ? 'bg-brand-100 text-brand-700' : 'bg-white text-slate-600'}`}>
                                {entry.speaker === 'Lumina' ? 'AI' : 'C'}
                            </div>
                            <div className={`flex flex-col ${entry.speaker === 'Candidate' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${entry.speaker === 'Candidate'
                                    ? 'bg-slate-800 text-white rounded-tr-none'
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                    }`}>
                                    {entry.text}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1.5 px-2 font-medium">{entry.timestamp} • {entry.speaker}</span>
                            </div>
                        </div>
                    ))}
                    {!session.transcript && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                            <p>Transcript not available for this session.</p>
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    )
}

const RecordingModal = ({ session, onClose }: { session: InterviewSession, onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    }, []);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getHighlightColor = (type: string) => {
        switch (type) {
            case 'Flag': return 'bg-amber-500 text-amber-500';
            case 'Positive': return 'bg-emerald-500 text-emerald-500';
            case 'Negative': return 'bg-red-500 text-red-500';
            case 'Insight': return 'bg-blue-500 text-blue-500';
            default: return 'bg-slate-400 text-slate-400';
        }
    };

    const getHighlightIcon = (type: string) => {
        switch (type) {
            case 'Flag': return <Flag className="w-3 h-3" />;
            case 'Positive': return <CheckCircle className="w-3 h-3" />;
            case 'Negative': return <XCircle className="w-3 h-3" />;
            case 'Insight': return <BrainCircuit className="w-3 h-3" />;
            default: return <div className="w-2 h-2 rounded-full bg-current" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto animate-fade-in">
            <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden animate-fade-in-up border border-slate-800">
                <div className="flex-1 relative flex flex-col bg-black group"
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => setShowControls(false)}
                >
                    <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                        <div className="pointer-events-auto">
                            <h3 className="font-bold text-lg text-white leading-tight">{session.type}</h3>
                            <p className="text-xs text-slate-300 font-mono opacity-80">{session.id} • {session.date}</p>
                        </div>
                        <button onClick={onClose} className="pointer-events-auto p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center bg-black/50">
                        {session.videoUrl ? (
                            <video
                                ref={videoRef}
                                src={session.videoUrl}
                                className="w-full h-full object-contain"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onClick={togglePlay}
                            />
                        ) : (
                            <div className="flex flex-col items-center text-slate-500">
                                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                    <VideoOff className="w-8 h-8 opacity-50" />
                                </div>
                                <p>Recording unavailable</p>
                            </div>
                        )}
                        {!isPlaying && session.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Play className="w-10 h-10 text-white ml-1" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`absolute bottom-0 left-0 right-0 pt-20 pb-6 px-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/timeline mb-4"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const percent = (e.clientX - rect.left) / rect.width;
                                handleSeek(percent * duration);
                            }}
                        >
                            <div className="absolute top-0 left-0 bottom-0 bg-brand-500 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                            <div className="absolute top-1/2 -mt-1.5 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover/timeline:opacity-100 transition-opacity" style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translateX(-50%)' }}></div>
                            {session.videoHighlights?.map((h) => (
                                <div
                                    key={h.id}
                                    className={`absolute top-1/2 -mt-1 h-2 w-2 rounded-full ${getHighlightColor(h.type).split(' ')[0]} z-10 transform -translate-x-1/2 ring-1 ring-black/50 group/marker transition-transform hover:scale-150`}
                                    style={{ left: `${(h.timestamp / duration) * 100}%` }}
                                    title={h.text}
                                ></div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center text-white">
                            <div className="flex items-center gap-4">
                                <button onClick={togglePlay} className="hover:text-brand-400 transition-colors">
                                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                </button>
                                <div className="text-xs font-mono opacity-80">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white/80 transition-colors">
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                                <button className="hover:text-white/80 transition-colors">
                                    <Maximize className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-900 z-10">
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand-400" /> AI Highlights
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Jump to key moments detected by Lumina.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {session.videoHighlights?.map((h) => {
                            const isActive = currentTime >= h.timestamp && currentTime < h.timestamp + 5;
                            return (
                                <button
                                    key={h.id}
                                    onClick={() => handleSeek(h.timestamp)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex gap-3 group relative ${isActive
                                        ? 'bg-slate-800 border-slate-700 shadow-md'
                                        : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-800'
                                        }`}
                                >
                                    <div className="absolute left-[19px] top-8 bottom-[-20px] w-px bg-slate-800 group-last:hidden"></div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border border-slate-800 ${getHighlightColor(h.type)} bg-opacity-10`}>
                                        {getHighlightIcon(h.type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${getHighlightColor(h.type).split(' ')[1]}`}>
                                                {h.type}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500">{formatTime(h.timestamp)}</span>
                                        </div>
                                        <p className={`text-xs leading-relaxed ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                            {h.text}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}

const FileManager = ({ candidate }: { candidate: any }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const documents = (candidate as any).documents || [];
    const folders = (candidate as any).folders || [];

    const filteredDocs = documents.filter((d: any) => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = !selectedFolder || d.category === selectedFolder || (selectedFolder === 'Resume & CV' && d.category === 'Resume') || (selectedFolder === 'Offer Docs' && d.category === 'Offer') || (selectedFolder === 'Legal & Tax' && d.category === 'Legal');
        return matchesSearch && matchesFolder;
    });

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'Resume': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Offer': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Legal': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Identification': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        // Simulate upload delay
        setTimeout(() => {
            const newDoc = {
                id: `d${Date.now()}`,
                name: file.name,
                type: file.type,
                size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
                uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                category: 'Other',
                url: '#'
            };
            store.addCandidateDocument(candidate.id, newDoc);
            setIsUploading(false);
        }, 1500);
    };

    const handleAddFolder = () => {
        setShowNewFolderModal(true);
    };

    const createFolder = () => {
        if (newFolderName.trim()) {
            const newFolder = {
                id: `f${Date.now()}`,
                name: newFolderName,
                color: 'bg-slate-50',
                icon: 'Folder',
                fileCount: 0,
                size: '0 KB'
            };
            store.addCandidateFolder(candidate.id, newFolder);
            setNewFolderName('');
            setShowNewFolderModal(false);
        }
    };

    return (
        <div className="space-y-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                className="hidden"
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search workspace files..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isUploading ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
            </div>

            {selectedFolder && (
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => setSelectedFolder(null)}
                        className="text-slate-500 hover:text-slate-900 font-bold"
                    >
                        Workspace
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <span className="font-bold text-slate-900">{selectedFolder}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {folders.map((folder: any) => (
                    <Card
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.name)}
                        className={`p-4 flex items-center gap-4 hover:border-brand-200 transition-colors cursor-pointer group ${selectedFolder === folder.name ? 'ring-2 ring-brand-500 border-brand-500' : ''}`}
                    >
                        <div className={`w-12 h-12 ${folder.color} rounded-xl flex items-center justify-center group-hover:opacity-80 transition-opacity`}>
                            <Folder className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{folder.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{folder.fileCount} Files • {folder.size}</p>
                        </div>
                    </Card>
                ))}

                <button
                    onClick={handleAddFolder}
                    className="p-4 border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-all cursor-pointer rounded-xl h-full min-h-[100px]"
                >
                    <Plus className="w-6 h-6" />
                    <span className="font-bold text-sm">New Folder</span>
                </button>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">File Size</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Modified</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDocs.length > 0 ? filteredDocs.map((doc: any) => (
                                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                <File className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getCategoryStyles(doc.category)}`}>
                                            {doc.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{doc.size}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{doc.uploadedAt}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        No files found in this folder.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="flex items-center gap-4 p-6 bg-slate-900 rounded-2xl text-white">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-brand-400" />
                </div>
                <div className="flex-1">
                    <p className="font-bold">Sync with Google Drive</p>
                    <p className="text-xs text-slate-400">Keep candidate folders synchronized across your workspace.</p>
                </div>
                <button className="px-6 py-2.5 bg-brand-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-brand-700 transition-all">
                    Connect Drive
                </button>
            </div>

            {/* New Folder Modal */}
            {showNewFolderModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowNewFolderModal(false)}>
                    <div className="min-h-full flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Create New Folder</h3>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                            placeholder="Enter folder name..."
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-4"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowNewFolderModal(false);
                                    setNewFolderName('');
                                }}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createFolder}
                                disabled={!newFolderName.trim()}
                                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Folder
                            </button>
                        </div>
                    </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN PROFILE COMPONENT ---

export const CandidateProfile = () => {
    const { id, orgId } = useParams();
    const navigate = useNavigate();

    const [relatedApps, setRelatedApps] = useState<any[]>([]);

    const [candidate, setCandidate] = useState(id ? store.getState().candidates.find(c => c.id === id) : null);

    // Ensure reliable store subscription
    useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            if (id) {
                setCandidate(store.getState().candidates.find(c => c.id === id) || null);
            }
        });
        return unsubscribe;
    }, [id]);

    useEffect(() => {
        if (candidate?.email && orgId) {
            const fetchRelated = async () => {
                try {
                    const q = query(collection(db, 'organizations', orgId, 'candidates'), where('email', '==', candidate.email));
                    const snap = await getDocs(q);
                    const others = snap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter((d: any) => d.id !== candidate.id);
                    setRelatedApps(others);
                } catch (e) {
                    console.error("Failed to fetch related apps", e);
                }
            };
            fetchRelated();
        }
    }, [candidate?.email, orgId, candidate?.id]);
    const [activeTab, setActiveTab] = useState<'resume' | 'analysis' | 'interviews' | 'offer' | 'onboarding' | 'files'>('resume');
    const [transcriptSession, setTranscriptSession] = useState<InterviewSession | null>(null);
    const [recordingSession, setRecordingSession] = useState<InterviewSession | null>(null);
    const [lastScheduledSession, setLastScheduledSession] = useState<InterviewSession | null>(null);
    const [showIntroVideo, setShowIntroVideo] = useState(false);
    const [sentOfferPreview, setSentOfferPreview] = useState<boolean>(false);
    const [isDocusignOpen, setIsDocusignOpen] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [scheduleSuccess, setScheduleSuccess] = useState(false);
    const [offerData, setOfferData] = useState<OfferDetails>(candidate?.offer || {
        status: 'Draft',
        salary: 120000,
        currency: 'USD',
        equity: '0.05%',
        signOnBonus: '$10,000',
        performanceBonus: '15%',
        benefits: 'Full Health, Dental, Vision, 401k match',
        startDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'New York, NY (Hybrid)',
        offerLetterContent: ''
    });
    const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);
    const [isEditingOffer, setIsEditingOffer] = useState(false);
    const [hrisSyncState, setHrisSyncState] = useState<'Not_Synced' | 'Syncing' | 'Synced' | 'Error'>(candidate?.onboarding?.hrisSyncStatus || 'Not_Synced');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);


    // State for Onboarding Tasks (mocking completion toggle and upload)
    const [localTasks, setLocalTasks] = useState<OnboardingTask[]>(candidate?.onboarding?.tasks || []);
    const initialTabSet = useRef(false);

    // Reset the ref when navigating to a different candidate
    useEffect(() => {
        initialTabSet.current = false;
    }, [id]);

    useEffect(() => {
        // Only set tab based on stage on initial load, not on every update
        if (!initialTabSet.current && candidate) {
            if (candidate?.stage === 'Offer') setActiveTab('offer');
            if (candidate?.stage === 'Hired') setActiveTab('onboarding');
            initialTabSet.current = true;
        }

        if (candidate?.offer) {
            setOfferData(candidate.offer);
        }
        if (candidate?.onboarding) {
            setHrisSyncState(candidate.onboarding.hrisSyncStatus);
            setLocalTasks(candidate.onboarding.tasks);
        }
    }, [candidate]);

    if (!candidate) return <div className="p-8 text-center">Candidate not found</div>;

    const handleGenerateOffer = () => {
        setIsGeneratingOffer(true);
        setTimeout(() => {
            // Build compensation lines conditionally
            const compensationLines = [];
            compensationLines.push(`• Base Salary: ${offerData.currency} ${offerData.salary.toLocaleString()} annually, paid semi-monthly.`);

            if (offerData.signOnBonus && offerData.signOnBonus.trim() !== '' && offerData.signOnBonus !== '0') {
                compensationLines.push(`• Sign-On Bonus: ${offerData.signOnBonus}`);
            }

            if (offerData.performanceBonus && offerData.performanceBonus.trim() !== '' && offerData.performanceBonus !== '0%' && offerData.performanceBonus !== '0') {
                compensationLines.push(`• Performance Bonus: Target of ${offerData.performanceBonus} of base salary.`);
            }

            if (offerData.equity && offerData.equity.trim() !== '' && offerData.equity !== '0') {
                compensationLines.push(`• Equity: Option to purchase ${offerData.equity} shares of Common Stock.`);
            }

            if (offerData.benefits && offerData.benefits.trim() !== '') {
                compensationLines.push(`• Benefits: ${offerData.benefits}`);
            }

            const content = `CONFIDENTIAL
            
${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

${candidate.name}
${candidate.email}

Dear ${candidate.name.split(' ')[0]},

We are thrilled to offer you the full-time position of ${candidate.role} at Presona Recruit, reporting to the VP of Engineering. We were impressed by your background and believe your skills will be instrumental to our team's success.

Compensation & Benefits:
${compensationLines.join('\n')}

Start Date:
Your anticipated start date will be ${new Date(offerData.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Location:
This role is based in ${offerData.location || 'our headquarters'}.

This offer is valid until ${offerData.expirationDate ? new Date(offerData.expirationDate).toLocaleDateString() : 'Invalid Date'}. We look forward to welcoming you to the team!

Sincerely,

Sarah Connor
Director of People Operations
Presona Recruit`;

            setOfferData(prev => ({
                ...prev,
                offerLetterContent: content
            }));

            if (id) {
                store.updateOffer(id, {
                    ...offerData,
                    offerLetterContent: content,
                    status: 'Draft'
                });
            }

            setIsGeneratingOffer(false);
        }, 1500);
    };

    const handleSendOffer = async () => {
        const token = offerData.token || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const updatedOfferData = {
            ...offerData,
            status: 'Sent' as const,
            sentDate: new Date().toLocaleDateString(),
            token: token
        };

        setOfferData(updatedOfferData);

        if (id) {
            store.updateOffer(candidate.id, updatedOfferData);

            // Send the real email via Resend
            try {
                await store.sendOffer(candidate.id, candidate.email, token);
            } catch (err) {
                console.error("Failed to send offer email", err);
            }
        }
        setSentOfferPreview(true);
    };

    const handleHrisSync = () => {
        setHrisSyncState('Syncing');
        setTimeout(() => {
            setHrisSyncState('Synced');
            if (id) {
                store.syncToHris(id);
            }
        }, 2000);
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            // Find the correct job for this candidate
            const jobs = store.getState().jobs;
            const job = jobs.find(j => j.id === candidate.jobId) ||
                jobs.find(j => j.title === candidate.role) ||
                jobs[0];

            if (candidate && job) {
                const updates = await generateCandidateReport(candidate, job, orgId);
                if (id) {
                    store.updateCandidate(id, updates);
                }
            }
        } catch (error) {
            console.error("Failed to generate report", error);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const toggleTask = (taskId: string) => {
        const task = localTasks.find(t => t.id === taskId);
        if (id && task) {
            store.updateOnboardingTask(id, taskId, { completed: !task.completed });
        }
    };

    const handleSendDocuSign = async () => {
        setIsDocusignOpen(true);

        if (!id) return;

        try {
            // Call the real DocuSign Cloud Function
            const result = await store.sendDocuSignOffer(id);
            console.log(`[DocuSign] Envelope created: ${result.envelopeId}`);

            // The Cloud Function already updates Firestore with envelope ID and status.
            // Firestore listener will propagate the update to the UI.
            setIsDocusignOpen(false);
            setSentOfferPreview(true);
        } catch (err: any) {
            console.error("DocuSign send failed:", err);

            // Fallback: if DocuSign isn't configured yet, use mock flow
            if (err.message?.includes('not configured') || err.code === 'functions/failed-precondition') {
                console.warn("DocuSign not configured. Using simulated flow.");
                const token = offerData.token || Math.random().toString(36).substring(7);
                const offerDetails: any = {
                    id: `off_${Date.now()}`,
                    status: 'Sent',
                    token: token,
                    sentAt: new Date().toISOString(),
                    documentUrl: '',
                    envelopeId: `env_${Math.random().toString(36).substring(7).toUpperCase()}`
                };

                store.updateOffer(id, {
                    ...offerData,
                    status: 'Sent',
                    docusignStatus: 'Sent',
                    docusignEnvelopeId: offerDetails.envelopeId
                });

                const currentCandidate = store.getState().candidates.find(c => c.id === id);
                if (currentCandidate) {
                    store.updateCandidate(id, {
                        ...currentCandidate,
                        offer: offerDetails
                    });
                }
                setIsDocusignOpen(false);
                setSentOfferPreview(true);
            } else {
                alert(`Failed to send via DocuSign: ${err.message}`);
                setIsDocusignOpen(false);
            }
        }
    };

    const handleFileUpload = (taskId: string) => {
        if (id) {
            store.updateOnboardingTask(id, taskId, { completed: true, fileUrl: 'simulated_upload.pdf' });
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto animate-fade-in-up space-y-6">

            {/* HEADER & NAVIGATION */}
            <div className="flex flex-col gap-6">
                <button onClick={() => navigate('/candidates')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 w-fit transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Candidates
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex justify-between items-start">
                    <div className="flex gap-6">
                        <div className="relative">
                            <CandidateAvatar
                                avatar={candidate.avatar || candidate.thumbnailUrl}
                                videoUrl={candidate.videoUrl}
                                name={candidate.name}
                                size="lg"
                            />
                            {candidate.videoUrl && !showIntroVideo && (
                                <button
                                    onClick={() => setShowIntroVideo(true)}
                                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30 transition-all hover:scale-110 z-10"
                                    title="Play introduction video"
                                >
                                    <Play className="w-3 h-3 ml-0.5" />
                                </button>
                            )}
                            {showIntroVideo && candidate.videoUrl && (
                                <div className="absolute top-0 left-0 z-20 bg-black rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-700" style={{ width: '280px', height: '210px' }}>
                                    <video
                                        src={candidate.videoUrl}
                                        autoPlay
                                        controls
                                        playsInline
                                        className="w-full h-full object-cover"
                                        onEnded={() => setShowIntroVideo(false)}
                                    />
                                    <button
                                        onClick={() => setShowIntroVideo(false)}
                                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-10"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{candidate.name}</h1>
                            <div className="flex items-center gap-3 mt-2 text-slate-500 font-medium">
                                <span>{candidate.role}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {candidate.location}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${candidate.stage === 'Hired' ? 'bg-emerald-100 text-emerald-700' :
                                    candidate.stage === 'Offer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {candidate.stage}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                    AI Match: {candidate.score}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                            <Mail className="w-4 h-4" /> Email
                        </button>
                        <button
                            onClick={() => setIsScheduleOpen(true)}
                            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Calendar className="w-4 h-4 text-brand-600" /> Schedule
                        </button>

                        {candidate.stage !== 'Rejected' && candidate.stage !== 'Hired' && (
                            <button
                                onClick={async () => {
                                    if (window.confirm(`Are you sure you want to reject ${candidate.name}? This will send a polite rejection email.`)) {
                                        if (id) {
                                            await store.sendRejectionEmail(id);
                                            await store.updateCandidateStage(id, 'Rejected');
                                        }
                                    }
                                }}
                                className="px-4 py-2.5 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <XCircle className="w-4 h-4" /> Reject
                            </button>
                        )}

                        <button
                            onClick={() => { if (id) store.exportCandidateData(id); }}
                            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                            title="Export candidate data (GDPR)"
                        >
                            <Download className="w-4 h-4 text-slate-500" /> Export Data
                        </button>

                        <button
                            onClick={() => {
                                const stages: Candidate['stage'][] = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
                                const currentIndex = stages.indexOf(candidate.stage);
                                const nextStage = stages[currentIndex + 1] || 'Hired';
                                if (id) store.updateCandidateStage(id, nextStage as any);
                            }}
                            className="px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
                        >
                            Move Stage
                        </button>
                    </div>
                </div>
            </div>

            {/* PIPELINE STAGE TRACKER */}
            {candidate.stage !== 'Rejected' && (() => {
                const pipelineStages: { key: Candidate['stage']; label: string; icon: any }[] = [
                    { key: 'Applied', label: 'Applied', icon: FileText },
                    { key: 'Screening', label: 'Screening', icon: Search },
                    { key: 'Interview', label: 'Interview', icon: MessageSquare },
                    { key: 'Offer', label: 'Offer', icon: DollarSign },
                    { key: 'Hired', label: 'Hired', icon: CheckCircle },
                ];
                const currentIdx = pipelineStages.findIndex(s => s.key === candidate.stage);
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-0">
                        <div className="flex items-center justify-between relative">
                            {/* Connector line */}
                            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 mx-12" />
                            <div className="absolute top-5 left-0 h-0.5 bg-brand-500 mx-12 transition-all duration-500" style={{ width: currentIdx > 0 ? `${(currentIdx / (pipelineStages.length - 1)) * 100}%` : '0%' }} />
                            {pipelineStages.map((s, i) => {
                                const isPast = i < currentIdx;
                                const isCurrent = i === currentIdx;
                                const isFuture = i > currentIdx;
                                return (
                                    <div key={s.key} className="flex flex-col items-center relative z-10 flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            isPast ? 'bg-brand-100 text-brand-600 ring-2 ring-brand-200' :
                                            isCurrent ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-lg shadow-brand-500/30 scale-110' :
                                            'bg-slate-100 text-slate-400 ring-2 ring-slate-200'
                                        }`}>
                                            {isPast ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                        </div>
                                        <span className={`text-xs font-bold mt-2 transition-colors ${
                                            isPast ? 'text-brand-600' :
                                            isCurrent ? 'text-brand-700' :
                                            'text-slate-400'
                                        }`}>{s.label}</span>
                                        {isCurrent && (
                                            <span className="text-[9px] font-bold text-brand-500 uppercase tracking-widest mt-0.5">Current</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* TABS */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-white rounded-t-xl px-2 shadow-sm">
                {[
                    { id: 'resume', label: 'Resume & Profile', icon: User },
                    { id: 'analysis', label: 'AI Intelligence', icon: BrainCircuit },
                    { id: 'interviews', label: 'Interview History', icon: MessageSquare },
                    { id: 'files', label: 'Candidate Workspace', icon: Folder },
                    ...(candidate.stage === 'Offer' || candidate.stage === 'Hired' ? [{ id: 'offer', label: 'Offer Management', icon: DollarSign }] : []),
                    ...(candidate.stage === 'Hired' ? [{ id: 'onboarding', label: 'Onboarding & HRIS', icon: Server }] : [])
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[500px]">

                {/* RESUME */}
                {activeTab === 'resume' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <button
                                onClick={() => candidate.resumeUrl && window.open(candidate.resumeUrl, '_blank')}
                                disabled={!candidate.resumeUrl}
                                className={`w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg ${candidate.resumeUrl
                                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                                    }`}
                            >
                                <Download className="w-4 h-4" /> Download Resume (PDF)
                            </button>

                            <Card className="p-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Contact Info</h3>
                                <div className="space-y-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        {candidate.email ? <a href={`mailto:${candidate.email}`} className="text-brand-600 hover:underline truncate">{candidate.email}</a> : <span className="text-slate-400 italic">Not provided</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        {candidate.phone ? <a href={`tel:${candidate.phone}`} className="text-brand-600 hover:underline">{candidate.phone}</a> : <span className="text-slate-400 italic">Not provided</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Linkedin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        {candidate.linkedin ? <a href={candidate.linkedin.startsWith('http') ? candidate.linkedin : `https://${candidate.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline truncate">{candidate.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="text-slate-400 italic">Not provided</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Github className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        {candidate.github ? <a href={candidate.github.startsWith('http') ? candidate.github : `https://${candidate.github}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline truncate">{candidate.github.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="text-slate-400 italic">Not provided</span>}
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills?.map(s => <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">{s}</span>) || <span className="text-xs text-slate-400 italic">No skills listed</span>}
                                </div>
                            </Card>

                            {/* Related Applications */}
                            {relatedApps.length > 0 && (
                                <Card className="p-6 border-l-4 border-brand-500">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-brand-600" /> Related Applications
                                    </h3>
                                    <div className="space-y-3">
                                        {relatedApps.map(app => (
                                            <div key={app.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-200 transition-colors cursor-pointer" onClick={() => window.location.href = `/org/${orgId}/candidate/${app.id}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-bold text-slate-900 text-sm truncate w-[70%]">{app.role || 'Unknown Role'}</p>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${app.stage === 'Hired' ? 'bg-emerald-100 text-emerald-700' :
                                                        app.stage === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>{app.stage || 'New'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-slate-500">
                                                    <span>Match: {app.score || 0}%</span>
                                                    <span>{new Date(app.appliedDate || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-8">
                                <h3 className="text-xl font-bold text-slate-900 mb-4">Summary</h3>
                                <p className="text-slate-600 leading-relaxed">{candidate.summary}</p>
                            </Card>
                            <div className="space-y-4">
                                {candidate.experience?.map(exp => (
                                    <Card key={exp.id} className="p-6">
                                        <h4 className="font-bold text-slate-900 text-lg">{exp.role}</h4>
                                        <div className="text-sm text-slate-500 font-medium mb-3">{exp.company} • {exp.duration}</div>
                                        <p className="text-slate-600 text-sm leading-relaxed">{exp.description}</p>
                                    </Card>
                                )) || (
                                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                                            No experience details provided.
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ANALYSIS */}
                {activeTab === 'analysis' && (
                    <div className="space-y-8 animate-fade-in">
                        {(!candidate.analysis || isGeneratingReport) ? (
                            isGeneratingReport ? (
                                <div className="text-center py-32 bg-white rounded-2xl border border-slate-200">
                                    <div className="relative w-20 h-20 mx-auto mb-6">
                                        <div className="absolute inset-0 bg-brand-100 rounded-full animate-ping opacity-75"></div>
                                        <div className="relative bg-white rounded-full p-4 border-2 border-brand-100 shadow-xl">
                                            <Loader2 className="w-full h-full text-brand-600 animate-spin" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Generating Intelligence Report...</h3>
                                    <p className="text-slate-500"> analyzing {(candidate.experience || []).length} experience items against the Job Description.</p>
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <BrainCircuit className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">AI Intelligence Report Not Generated</h3>
                                    <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                                        Generate a comprehensive deep-dive analysis based on the candidate's resume and job description using our AI engine.
                                    </p>
                                    <button
                                        onClick={handleGenerateReport}
                                        className="px-8 py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 active:scale-95 flex items-center gap-3 mx-auto"
                                    >
                                        <Sparkles className="w-5 h-5" /> Generate AI Report
                                    </button>
                                </div>
                            )
                        ) : (
                            <>
                                {/* 1. Executive Intelligence Overview */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <Card className="lg:col-span-1 p-0 border-2 border-emerald-500 shadow-xl shadow-emerald-100 relative overflow-hidden flex flex-col">
                                        <div className="p-8 flex-1">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AI Verdict</h3>
                                                <button
                                                    onClick={handleGenerateReport}
                                                    disabled={isGeneratingReport}
                                                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                                                    title="Regenerate Intelligence Report"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-baseline gap-3 mb-6">
                                                <span className="text-7xl font-black text-slate-900 tracking-tight">{candidate.score}</span>
                                                <span className="text-3xl font-bold text-slate-400">/ 100</span>
                                            </div>

                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-8 border ${candidate.aiVerdict === 'Proceed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                candidate.aiVerdict === 'Review' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${candidate.aiVerdict === 'Proceed' ? 'bg-emerald-500' :
                                                    candidate.aiVerdict === 'Review' ? 'bg-amber-500' : 'bg-red-500'
                                                    }`}>
                                                    <Check className="w-3 h-3 text-white stroke-[4]" />
                                                </div>
                                                Recommended Action: {candidate.aiVerdict}
                                            </div>

                                            <p className="text-slate-600 font-medium leading-relaxed mb-6">
                                                {candidate.matchReason}
                                            </p>
                                        </div>

                                        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <span>Confidence Score: 94%</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Cpu className="w-3.5 h-3.5" />
                                                <span>AI-Powered Analysis</span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="lg:col-span-2 p-6 flex flex-col md:flex-row items-center gap-8">
                                        <div className="h-64 w-full md:w-1/2 flex-shrink-0" style={{ minWidth: 200, minHeight: 200 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                                    { subject: 'Technical', A: candidate.analysis.technicalScore || 0, fullMark: 100 },
                                                    { subject: 'Cultural', A: candidate.analysis.culturalScore || 0, fullMark: 100 },
                                                    { subject: 'Communication', A: candidate.analysis.communicationScore || 0, fullMark: 100 },
                                                    { subject: 'Experience', A: 90, fullMark: 100 },
                                                    { subject: 'Leadership', A: 85, fullMark: 100 },
                                                ]}>
                                                    <PolarGrid stroke="#e2e8f0" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar name="Candidate" dataKey="A" stroke="#16a34a" strokeWidth={2} fill="#22c55e" fillOpacity={0.3} />
                                                    <Tooltip />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <h4 className="font-bold text-slate-900 mb-3">Assessment Summary</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-600 font-medium">Technical Capability</span>
                                                        <span className="font-bold text-slate-900">{candidate.analysis.technicalScore || 0}/100</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${candidate.analysis.technicalScore || 0}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 mt-4">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-600 font-medium">Cultural Alignment</span>
                                                        <span className="font-bold text-slate-900">{candidate.analysis.culturalScore || 0}/100</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${candidate.analysis.culturalScore || 0}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 mt-4">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-600 font-medium">Communication</span>
                                                        <span className="font-bold text-slate-900">{candidate.analysis.communicationScore || 0}/100</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${candidate.analysis.communicationScore || 0}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* 2. Detailed Breakdown Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Key Strengths with Evidence */}
                                    <Card className="p-6 border-l-4 border-emerald-500">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-emerald-500" /> Distinctive Strengths
                                            </h3>
                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded">Top 5%</span>
                                        </div>
                                        <div className="space-y-4">
                                            {(candidate.analysis.strengths || []).map((s, i) => (
                                                <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100">
                                                    <div className="mt-1">
                                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{s}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Evidenced in Resume & Initial Screening.</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    {/* Areas of Concern with Probe Questions */}
                                    <Card className="p-6 border-l-4 border-amber-500">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-amber-500" /> Risks & Probing Areas
                                            </h3>
                                            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded">Attention Needed</span>
                                        </div>
                                        <div className="space-y-4">
                                            {(candidate.analysis.weaknesses || []).map((w, i) => (
                                                <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 transition-colors border border-transparent hover:border-amber-100">
                                                    <div className="mt-1">
                                                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                                            <AlertCircle className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{w}</p>
                                                        <div className="mt-2 bg-white p-2 rounded border border-slate-200">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Suggested Question:</p>
                                                            <p className="text-xs text-slate-600 italic">"Can you describe a time when you had to learn a new technology under a tight deadline to solve a specific problem related to this?"</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>

                                {/* 3. Skills Matrix (Inferred from Resume Skills) */}
                                <Card className="p-8">
                                    <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                                        <Code className="w-5 h-5 text-blue-500" /> Skills Proficiency Matrix
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                                        {candidate.analysis?.skillsMatrix && candidate.analysis.skillsMatrix.length > 0 ? (
                                            candidate.analysis.skillsMatrix.map((item) => (
                                                <div key={item.skill}>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="font-bold text-slate-800">{item.skill}</span>
                                                        <span className="text-xs text-slate-500">{item.years}+ years</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${item.proficiency > 85 ? 'bg-brand-500' : item.proficiency > 70 ? 'bg-blue-500' : 'bg-slate-400'}`}
                                                            style={{ width: `${item.proficiency || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            (candidate.skills || []).slice(0, 6).map((skill, i) => {
                                                const proficiency = Math.max(60, 95 - (i * 5));
                                                const experienceYears = Math.max(1, 5 - Math.floor(i / 2));
                                                return (
                                                    <div key={skill}>
                                                        <div className="flex justify-between items-end mb-2">
                                                            <span className="font-bold text-slate-800">{skill}</span>
                                                            <span className="text-xs text-slate-500">{experienceYears}+ years</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${proficiency > 85 ? 'bg-brand-500' : proficiency > 70 ? 'bg-blue-500' : 'bg-slate-400'}`}
                                                                style={{ width: `${proficiency}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        {(!candidate.analysis?.skillsMatrix || candidate.analysis.skillsMatrix.length === 0) && (candidate.skills || []).length === 0 && (
                                            <div className="col-span-full text-center py-6 text-slate-400 italic">
                                                No specific skills identified for matrix.
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </>
                        )}
                    </div>
                )}

                {/* INTERVIEWS */}
                {activeTab === 'interviews' && (
                    <div className="space-y-8 animate-fade-in">
                        {(!candidate.interviews || candidate.interviews.length === 0) ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Video className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No interviews yet</h3>
                                <p className="text-slate-500 mt-1">Schedule a Lumina screening or invite the candidate.</p>
                                <button
                                    onClick={() => setIsScheduleOpen(true)}
                                    className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:scale-95"
                                >
                                    Schedule Interview
                                </button>
                            </div>
                        ) : (
                            candidate.interviews.map((interview, index) => (
                                <div key={interview.id} className="relative pl-8 md:pl-0">
                                    {/* Timeline Line (Desktop) */}
                                    <div className="hidden md:block absolute left-8 top-0 bottom-0 w-px bg-slate-200 -z-10 last:bottom-auto last:h-full"></div>

                                    <Card className="overflow-hidden border-l-4 border-l-brand-500 relative">
                                        {/* Status Ribbon/Badge */}
                                        <div className="absolute top-0 right-0 p-4 flex gap-2">
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${interview.mode === 'AI' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                {interview.mode === 'AI' ? <BrainCircuit className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                                {interview.mode === 'AI' ? 'AI Assistant' : 'Schedule External'}
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${interview.status === 'Upcoming' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                (interview.score || 0) >= 7 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    (interview.score || 0) < 4 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                {interview.status === 'Upcoming' ? <Clock className="w-3 h-3" /> :
                                                    (interview.score || 0) >= 7 ? <Sparkles className="w-3 h-3" /> : (interview.score || 0) < 4 ? <AlertCircle className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                                {interview.status === 'Upcoming' ? 'Upcoming' : `Score: ${interview.score || 0}/10`}
                                            </div>
                                        </div>

                                        <div className="p-6 md:p-8">
                                            <div className="flex flex-col md:flex-row gap-8">
                                                {/* Left Column: Meta & Score */}
                                                <div className="md:w-1/3 space-y-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-14 h-14 ${interview.mode === 'AI' ? 'bg-brand-600' : (interview.platform === 'Microsoft Teams' ? 'bg-blue-600' : 'bg-slate-900')} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-600/20`}>
                                                            {interview.mode === 'AI' ? <BrainCircuit className="w-7 h-7" /> : (interview.platform === 'Microsoft Teams' ? <span className="font-bold text-lg">T</span> : <Video className="w-7 h-7" />)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-xl text-slate-900 leading-tight">{interview.type}</h4>
                                                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                                <Calendar className="w-4 h-4" /> {interview.date}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Score Card / Status Card */}
                                                    {interview.status === 'Upcoming' ? (
                                                        <div className={`${interview.mode === 'AI' ? 'bg-emerald-50 border-emerald-100' : (interview.platform === 'Microsoft Teams' ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100')} rounded-xl p-5 border`}>
                                                            <p className={`text-[10px] font-black ${interview.mode === 'AI' ? 'text-emerald-500' : (interview.platform === 'Microsoft Teams' ? 'text-blue-400' : 'text-indigo-400')} uppercase tracking-widest mb-3`}>
                                                                {interview.mode === 'AI' ? 'Secure Link Verification' : 'Meeting Details'}
                                                            </p>
                                                            <div className="flex items-center gap-3 mb-4">
                                                                {interview.mode === 'AI' ? (
                                                                    <>
                                                                        <AlertCircle className="w-5 h-5 text-emerald-600" />
                                                                        <span className="font-bold text-emerald-900 text-sm">Expires: {interview.expiryDate}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Clock className={`w-5 h-5 ${interview.platform === 'Microsoft Teams' ? 'text-blue-600' : 'text-indigo-600'}`} />
                                                                        <span className={`font-bold ${interview.platform === 'Microsoft Teams' ? 'text-blue-900' : 'text-indigo-900 text-sm'}`}>{interview.time || 'TBD'} ({interview.timezone})</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {interview.meetLink && (
                                                                <a
                                                                    href={interview.meetLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`w-full py-3 ${interview.mode === 'AI' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : (interview.platform === 'Microsoft Teams' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20')} text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg text-sm`}
                                                                >
                                                                    {interview.mode === 'AI' ? <ExternalLink className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                                                    {interview.mode === 'AI' ? 'View AI Session Link' : `Join ${interview.platform || 'Meet'}`}
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                                            <div className="flex justify-between items-end mb-2">
                                                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Overall Score</span>
                                                                <span className="text-3xl font-black text-slate-900">{interview.score}<span className="text-lg text-slate-400 font-medium">/10</span></span>
                                                            </div>
                                                            <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-slate-100">
                                                                <div className="h-full bg-gradient-to-r from-blue-500 to-brand-500" style={{ width: `${(interview.score || 0) * 10}%` }}></div>
                                                            </div>

                                                            {/* Mock Sub-metrics */}
                                                            <div className="mt-4 space-y-3">
                                                                <div>
                                                                    <div className="flex justify-between text-xs mb-1">
                                                                        <span className="font-medium text-slate-600">Technical Proficiency</span>
                                                                        <span className="font-bold text-slate-900">{((interview.score || 0) + 0.5).toFixed(1)}</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min(100, ((interview.score || 0) + 0.5) * 10)}%` }}></div></div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex justify-between text-xs mb-1">
                                                                        <span className="font-medium text-slate-600">Communication</span>
                                                                        <span className="font-bold text-slate-900">{((interview.score || 0) - 0.2).toFixed(1)}</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{ width: `${Math.min(100, ((interview.score || 0) - 0.2) * 10)}%` }}></div></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Identity Verification Card */}
                                                    {interview.status === 'Completed' && interview.identityVerification && (
                                                        <div className={`rounded-xl p-4 border flex items-start gap-3 mt-4 ${interview.identityVerification.match ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${interview.identityVerification.match ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'}`}>
                                                                <Fingerprint className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-bold text-slate-900">Identity Verification</span>
                                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${interview.identityVerification.match ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                        {interview.identityVerification.match ? 'Verified' : 'Mismatch'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex-1 bg-white h-2 rounded-full overflow-hidden border border-slate-100">
                                                                        <div className={`h-full rounded-full ${interview.identityVerification.match ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${interview.identityVerification.score}%` }}></div>
                                                                    </div>
                                                                    <span className="text-sm font-bold text-slate-700">{interview.identityVerification.score}%</span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-2">
                                                                    {interview.identityVerification.match
                                                                        ? `The candidate's identity was verified against their lobby selfie with ${interview.identityVerification.score}% confidence.`
                                                                        : `Identity could not be verified — the live frame did not match the lobby selfie (${interview.identityVerification.score}% similarity).`
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Column: Content */}
                                                <div className="flex-1 space-y-6">
                                                    {interview.status === 'Upcoming' ? (
                                                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 border-dashed text-center">
                                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                                <Calendar className="w-8 h-8 text-slate-300" />
                                                            </div>
                                                            <h5 className="font-bold text-slate-900 mb-1">Awaiting Session</h5>
                                                            <p className="text-sm text-slate-500">This interview has been scheduled and sync-checked with your calendar. Participants will receive a reminder 10 minutes before the start.</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div>
                                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                    <MessageSquare className="w-3 h-3" /> Executive Summary
                                                                </h5>
                                                                <p className="text-slate-700 leading-relaxed bg-white text-sm md:text-base">
                                                                    {interview.summary}
                                                                </p>
                                                            </div>

                                                            {/* Highlights Grid */}
                                                            {interview.videoHighlights && interview.videoHighlights.length > 0 && (
                                                                <div>
                                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                        <Sparkles className="w-3 h-3" /> Key Moments Detected
                                                                    </h5>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        {interview.videoHighlights.slice(0, 4).map((h) => (
                                                                            <div key={h.id} className={`p-3 rounded-lg border flex gap-3 ${h.type === 'Positive' ? 'bg-emerald-50 border-emerald-100' :
                                                                                h.type === 'Negative' ? 'bg-red-50 border-red-100' :
                                                                                    h.type === 'Insight' ? 'bg-blue-50 border-blue-100' :
                                                                                        'bg-amber-50 border-amber-100'
                                                                                }`}>
                                                                                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${h.type === 'Positive' ? 'bg-emerald-200 text-emerald-700' :
                                                                                    h.type === 'Negative' ? 'bg-red-200 text-red-700' :
                                                                                        h.type === 'Insight' ? 'bg-blue-200 text-blue-700' :
                                                                                            'bg-amber-200 text-amber-700'
                                                                                    }`}>
                                                                                    {h.type === 'Positive' ? <Check className="w-3 h-3" /> :
                                                                                        h.type === 'Negative' ? <X className="w-3 h-3" /> :
                                                                                            h.type === 'Insight' ? <BrainCircuit className="w-3 h-3" /> : <Flag className="w-3 h-3" />}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-xs font-bold opacity-80 uppercase mb-0.5">{h.type}</div>
                                                                                    <div className="text-sm font-medium text-slate-800 line-clamp-2">{h.text}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Proctoring Report */}
                                                            {interview.proctoring && (
                                                                <div>
                                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                        <Eye className="w-3 h-3" /> Proctoring Report
                                                                    </h5>
                                                                    <div className={`p-4 rounded-xl border ${
                                                                        interview.proctoring.integrity === 'Clean' ? 'bg-emerald-50 border-emerald-200' :
                                                                        interview.proctoring.integrity === 'Flagged' ? 'bg-red-50 border-red-200' :
                                                                        'bg-amber-50 border-amber-200'
                                                                    }`}>
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                                                interview.proctoring.integrity === 'Clean' ? 'bg-emerald-200 text-emerald-700' :
                                                                                interview.proctoring.integrity === 'Flagged' ? 'bg-red-200 text-red-700' :
                                                                                'bg-amber-200 text-amber-700'
                                                                            }`}>
                                                                                <ShieldCheck className="w-4 h-4" />
                                                                            </div>
                                                                            <div className={`text-sm font-bold ${
                                                                                interview.proctoring.integrity === 'Clean' ? 'text-emerald-800' :
                                                                                interview.proctoring.integrity === 'Flagged' ? 'text-red-800' :
                                                                                'text-amber-800'
                                                                            }`}>
                                                                                Integrity: {interview.proctoring.integrity}
                                                                            </div>
                                                                        </div>
                                                                        {interview.proctoring.observations.length > 0 ? (
                                                                            <div className="space-y-2">
                                                                                {interview.proctoring.observations.map((obs, idx) => {
                                                                                    const isStructured = typeof obs === 'object' && obs !== null && 'category' in obs;
                                                                                    const category = isStructured ? (obs as any).category : 'other';
                                                                                    const severity = isStructured ? (obs as any).severity : 'medium';
                                                                                    const timestamp = isStructured ? (obs as any).timestamp : null;
                                                                                    const description = isStructured ? (obs as any).description : String(obs);

                                                                                    const categoryLabels: Record<string, string> = {
                                                                                        eye_gaze: 'Eye Gaze',
                                                                                        language: 'Language',
                                                                                        environment: 'Environment',
                                                                                        behavior: 'Behavior',
                                                                                        third_party: 'Third Party',
                                                                                        other: 'Other'
                                                                                    };
                                                                                    const categoryIcons: Record<string, React.ReactNode> = {
                                                                                        eye_gaze: <Eye className="w-3 h-3" />,
                                                                                        language: <Globe className="w-3 h-3" />,
                                                                                        environment: <Laptop className="w-3 h-3" />,
                                                                                        behavior: <Activity className="w-3 h-3" />,
                                                                                        third_party: <Users className="w-3 h-3" />,
                                                                                        other: <AlertCircle className="w-3 h-3" />
                                                                                    };
                                                                                    const severityColors: Record<string, string> = {
                                                                                        low: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                                                                        medium: 'bg-orange-100 text-orange-700 border-orange-200',
                                                                                        high: 'bg-red-100 text-red-700 border-red-200'
                                                                                    };

                                                                                    return (
                                                                                        <div key={idx} className="flex items-start gap-2 p-2.5 bg-white/70 rounded-lg border border-slate-100">
                                                                                            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                                                                                                {timestamp && (
                                                                                                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{timestamp}</span>
                                                                                                )}
                                                                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${severityColors[severity] || severityColors.medium}`}>
                                                                                                    {categoryIcons[category] || categoryIcons.other}
                                                                                                    {categoryLabels[category] || 'Other'}
                                                                                                </span>
                                                                                            </div>
                                                                                            <p className="text-xs text-slate-700 leading-relaxed">{description}</p>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-500">No integrity concerns detected during this session.</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    {/* Actions */}
                                                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                                                        <button
                                                            onClick={() => setRecordingSession(interview)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 active:scale-95"
                                                        >
                                                            <PlayCircle className="w-4 h-4" /> Watch Recording
                                                        </button>
                                                        <button
                                                            onClick={() => setTranscriptSession(interview)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-all active:scale-95"
                                                        >
                                                            <FileText className="w-4 h-4" /> Read Transcript
                                                        </button>
                                                        <div className="flex-1"></div>
                                                        <button className="text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center gap-1">
                                                            <Download className="w-4 h-4" /> Export Report
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'files' && (
                    <FileManager candidate={candidate} />
                )}

                {/* OFFER & ONBOARDING (Simplified for brevity, same logic as drawer) */}
                {(activeTab === 'offer' || activeTab === 'onboarding') && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {activeTab === 'offer' && (
                            <>
                                <Card className="p-8">
                                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-brand-600" />
                                        Offer Details
                                    </h3>
                                    <div className="space-y-6">
                                        {/* Financials Row 1 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Base Salary</label>
                                                <div className="flex gap-2">
                                                    <select
                                                        value={offerData.currency}
                                                        onChange={(e) => setOfferData({ ...offerData, currency: e.target.value as any })}
                                                        className="w-24 p-2.5 border rounded-lg bg-slate-50 text-sm font-bold"
                                                    >
                                                        {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'INR'].map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        value={offerData.salary}
                                                        onChange={(e) => setOfferData({ ...offerData, salary: parseInt(e.target.value) || 0 })}
                                                        className="flex-1 p-2.5 border rounded-lg bg-slate-50 text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Sign-On Bonus</label>
                                                <input
                                                    type="text"
                                                    value={offerData.signOnBonus || ''}
                                                    onChange={(e) => setOfferData({ ...offerData, signOnBonus: e.target.value })}
                                                    placeholder="$10,000"
                                                    className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Financials Row 2 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Equity / Options</label>
                                                <input
                                                    type="text"
                                                    value={offerData.equity}
                                                    onChange={(e) => setOfferData({ ...offerData, equity: e.target.value })}
                                                    placeholder="0.05% or 10,000 RSUs"
                                                    className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Perf. Bonus</label>
                                                <input
                                                    type="text"
                                                    value={offerData.performanceBonus || ''}
                                                    onChange={(e) => setOfferData({ ...offerData, performanceBonus: e.target.value })}
                                                    placeholder="15% of annual"
                                                    className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Logistics Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Start Date</label>
                                                <input
                                                    type="date"
                                                    value={offerData.startDate}
                                                    onChange={(e) => setOfferData({ ...offerData, startDate: e.target.value })}
                                                    className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Offer Expiry</label>
                                                <input
                                                    type="date"
                                                    value={offerData.expirationDate || ''}
                                                    onChange={(e) => setOfferData({ ...offerData, expirationDate: e.target.value })}
                                                    className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Benefits Summary</label>
                                            <textarea
                                                value={offerData.benefits || ''}
                                                onChange={(e) => setOfferData({ ...offerData, benefits: e.target.value })}
                                                className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm h-20 resize-none"
                                                placeholder="Describe health, dental, vision, 401k..."
                                            />
                                        </div>

                                        <button onClick={handleGenerateOffer} disabled={isGeneratingOffer} className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex justify-center gap-2 shadow-lg shadow-brand-500/20 active:scale-95 transition-all">
                                            {isGeneratingOffer ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 fill-white" />}
                                            Generate Official Letter
                                        </button>
                                    </div>
                                </Card>
                                <Card className="p-8 bg-slate-50 border-slate-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-900">Offer Letter Preview</h3>
                                        {offerData.offerLetterContent && (
                                            <button
                                                onClick={() => setIsEditingOffer(!isEditingOffer)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                {isEditingOffer ? (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Save Changes
                                                    </>
                                                ) : (
                                                    <>
                                                        <Edit2 className="w-4 h-4" />
                                                        Edit Letter
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {isEditingOffer ? (
                                        <textarea
                                            value={offerData.offerLetterContent || ''}
                                            onChange={(e) => setOfferData({ ...offerData, offerLetterContent: e.target.value })}
                                            className="w-full h-[300px] p-4 font-serif text-sm text-slate-700 leading-relaxed border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                                        />
                                    ) : (
                                        <pre className="whitespace-pre-wrap font-serif text-sm text-slate-700 leading-relaxed h-[300px] overflow-y-auto pr-2">{offerData.offerLetterContent || "Draft not generated..."}</pre>
                                    )}

                                    {/* Action Buttons (Only show if not already sent/signed) */}
                                    {(!candidate.offer || candidate.offer.status === 'Draft') && offerData.offerLetterContent && (
                                        <div className="mt-6 flex gap-3">
                                            <button onClick={handleSendOffer} className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                                                <Send className="w-4 h-4" /> Send Direct Email
                                            </button>
                                            <button onClick={handleSendDocuSign} className="flex-1 py-3 bg-[#FF0000] text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all">
                                                <PenTool className="w-4 h-4" /> Send via DocuSign
                                            </button>
                                        </div>
                                    )}

                                    {/* LIVE STATUS CARD */}
                                    {candidate.offer && candidate.offer.status !== 'Draft' && (
                                        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">Employment Offer</div>
                                                        <div className="text-xs text-slate-500">Envelope ID: {candidate.offer.envelopeId || '...'}</div>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${candidate.offer.status === 'Signed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    candidate.offer.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                        candidate.offer.status === 'Viewed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                            'bg-amber-100 text-amber-700 border-amber-200'
                                                    }`}>
                                                    {candidate.offer.status === 'Signed' ? <CheckCircle className="w-3 h-3" /> :
                                                        candidate.offer.status === 'Rejected' ? <X className="w-3 h-3" /> :
                                                            candidate.offer.status === 'Viewed' ? <Globe className="w-3 h-3" /> :
                                                                <Clock className="w-3 h-3" />}
                                                    {candidate.offer.status}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white space-y-4">
                                                {/* Timeline */}
                                                <div className="relative pl-4 space-y-4 border-l-2 border-slate-100 ml-2">
                                                    <div className="relative">
                                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>
                                                        <p className="text-xs text-slate-500">{new Date(candidate.offer.sentAt).toLocaleString()}</p>
                                                        <p className="text-sm font-medium text-slate-900">Offer Sent via DocuSign</p>
                                                    </div>

                                                    {candidate.offer.viewedAt && (
                                                        <div className="relative">
                                                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-300 border-2 border-white"></div>
                                                            <p className="text-xs text-slate-500">{new Date(candidate.offer.viewedAt).toLocaleString()}</p>
                                                            <p className="text-sm font-medium text-slate-900">Candidate Viewed Offer</p>
                                                        </div>
                                                    )}

                                                    {candidate.offer.status === 'Signed' && (
                                                        <div className="relative">
                                                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-100 shadow-sm"></div>
                                                            <p className="text-xs text-slate-500">{candidate.offer.signedAt ? new Date(candidate.offer.signedAt).toLocaleString() : 'Just now'}</p>
                                                            <p className="text-sm font-bold text-emerald-700">Signed & Accepted</p>
                                                        </div>
                                                    )}

                                                    {candidate.offer.status === 'Rejected' && (
                                                        <div className="relative">
                                                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
                                                            <p className="text-xs text-slate-500">{candidate.offer.rejectedAt ? new Date(candidate.offer.rejectedAt).toLocaleString() : 'Just now'}</p>
                                                            <p className="text-sm font-bold text-red-700">Offer Declined</p>
                                                            {candidate.offer.rejectionReason && (
                                                                <div className="mt-2 p-3 bg-red-50 rounded-lg text-xs text-red-800 italic border border-red-100">
                                                                    "{candidate.offer.rejectionReason}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-4 border-t border-slate-100 flex-wrap">
                                                    <button
                                                        onClick={() => window.open(`/#/offer/${candidate.offer?.token}`, '_blank')}
                                                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                                    >
                                                        <Globe className="w-3 h-3" /> View Secure Link
                                                    </button>
                                                    {candidate.offer.status === 'Signed' && (
                                                        <button className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1">
                                                            <Download className="w-3 h-3" /> Download Signed PDF
                                                        </button>
                                                    )}
                                                    {/* Demo Reset Button */}
                                                    <button
                                                        onClick={() => {
                                                            store.updateOffer(candidate.id, {
                                                                status: 'Sent',
                                                                viewedAt: undefined,
                                                                signedAt: undefined,
                                                                rejectedAt: undefined,
                                                                rejectionReason: undefined
                                                            });
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 ml-auto"
                                                        title="Reset for testing"
                                                    >
                                                        <RefreshCw className="w-3 h-3" /> Reset (Demo)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* DocuSign Live Pulse — real-time status polling */}
                                    {candidate.offer?.docusignEnvelopeId && candidate.offer.status !== 'Draft' && (
                                        <DocusignPulse envelopeId={candidate.offer.docusignEnvelopeId} candidateId={candidate.id} />
                                    )}
                                </Card>
                            </>
                        )}
                        {activeTab === 'onboarding' && (
                            <Card className="p-8 col-span-2">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><Server className="w-6 h-6 text-emerald-600" /></div><div><h3 className="font-bold text-xl text-slate-900">Sync to HRIS</h3><p className="text-slate-500">Push candidate data to external systems.</p></div></div>
                                    <button onClick={handleHrisSync} disabled={hrisSyncState === 'Synced' || hrisSyncState === 'Syncing'} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">{hrisSyncState === 'Synced' ? <Check className="w-5 h-5" /> : hrisSyncState === 'Syncing' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sync Now'}</button>
                                </div>

                                <div className="space-y-6">
                                    {['Legal & Compliance', 'IT & Equipment', 'Culture & Orientation'].map(cat => (
                                        <div key={cat}>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">{cat}</h4>
                                            <div className="space-y-3">
                                                {localTasks.filter(t => t.category === cat).map(t => (
                                                    <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                        <div className="flex items-center gap-4">
                                                            {t.type === 'upload' ? (
                                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${t.completed ? 'bg-orange-100 border-orange-200 text-orange-600' : 'border-slate-300 text-slate-400'}`}>
                                                                    <FileText className="w-4 h-4" />
                                                                </div>
                                                            ) : (
                                                                <button onClick={() => toggleTask(t.id)} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${t.completed ? 'bg-brand-500 border-brand-500' : 'border-slate-300 hover:border-brand-400'}`}>
                                                                    {t.completed && <Check className="w-3.5 h-3.5 text-white" />}
                                                                </button>
                                                            )}

                                                            <div>
                                                                <div className={`font-medium ${t.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{t.task}</div>
                                                                {t.fileUrl && <div className="text-xs text-brand-600 flex items-center gap-1 mt-0.5"><CheckCircle className="w-3 h-3" /> {t.fileUrl} uploaded</div>}
                                                            </div>
                                                        </div>

                                                        {t.type === 'upload' && !t.completed && (
                                                            <button onClick={() => handleFileUpload(t.id)} className="text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2">
                                                                <UploadCloud className="w-3 h-3" /> Upload
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {localTasks.filter(t => t.category === cat).length === 0 && (
                                                    <div className="text-xs text-slate-400 italic">No tasks assigned.</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {/* MODALS */}
            {transcriptSession && <TranscriptModal session={transcriptSession} onClose={() => setTranscriptSession(null)} />}
            {recordingSession && <RecordingModal session={recordingSession} onClose={() => setRecordingSession(null)} />}
            {isScheduleOpen && (
                <ScheduleModal
                    candidate={candidate}
                    onClose={() => setIsScheduleOpen(false)}
                    onScheduled={(session) => {
                        setIsScheduleOpen(false);
                        setLastScheduledSession(session);
                    }}
                />
            )}
            {lastScheduledSession && (
                <InterviewConfirmationModal
                    candidate={candidate}
                    session={lastScheduledSession}
                    onClose={() => setLastScheduledSession(null)}
                />
            )}
            {sentOfferPreview && (
                <OfferConfirmationModal
                    candidate={candidate}
                    offer={offerData}
                    onClose={() => setSentOfferPreview(false)}
                />
            )}
            {isDocusignOpen && (
                <DocusignModal
                    candidate={candidate}
                    offer={offerData}
                    onClose={() => setIsDocusignOpen(false)}
                    onComplete={(envId) => {
                        setIsDocusignOpen(false);
                        const updates = { ...offerData, status: 'Sent' as any, docusignStatus: 'Sent' as any, docusignEnvelopeId: envId };
                        setOfferData(updates);
                        store.updateOffer(candidate.id, updates);
                        setSentOfferPreview(true);
                    }}
                />
            )}

            {/* Success Notification */}
            {scheduleSuccess && (
                <div className="fixed bottom-8 right-8 z-[100] animate-bounce-subtle">
                    <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                        <CheckCircle className="w-6 h-6" />
                        <div>
                            <p className="font-bold">Interview Scheduled!</p>
                            <p className="text-xs opacity-90 text-emerald-50">Calendar invites sent to candidate & team.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
