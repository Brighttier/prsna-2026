import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { OfferDetails } from '../types';
import { Card } from '../components/Card';
import { Check, Download, FileText, Globe, Lock, ShieldCheck, PenTool, AlertCircle } from 'lucide-react';

export const OfferPortal = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState<{ id: string; name: string; email: string; role: string; offer: OfferDetails } | null>(null);
    const [branding, setBranding] = useState<{ companyName: string; primaryColor: string; logoUrl: string; contactEmail?: string }>({ companyName: '', primaryColor: '#16a34a', logoUrl: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'document' | 'signing' | 'success' | 'reject'>('document');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSigning, setIsSigning] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('No offer token provided.');
            setLoading(false);
            return;
        }

        store.resolvePortalToken(token)
            .then((data) => {
                if (!data.offer) {
                    setError('No offer found for this link.');
                    setLoading(false);
                    return;
                }

                const resolved = {
                    id: data.candidateId,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    offer: data.offer as OfferDetails,
                };
                setCandidate(resolved);
                setBranding(data.branding);

                // Mark as Viewed if not already
                if (resolved.offer.status === 'Sent') {
                    store.updateCandidate(resolved.id, {
                        offer: { ...resolved.offer, status: 'Viewed', viewedAt: new Date().toISOString() }
                    } as any).catch(() => {});
                }

                // Restore state if already signed/rejected
                if (resolved.offer.status === 'Signed') {
                    setViewMode('success');
                } else if (resolved.offer.status === 'Rejected') {
                    setError('This offer has been rejected.');
                }

                setLoading(false);
            })
            .catch((err) => {
                console.error('Token resolution failed:', err);
                setError('Invalid or expired offer link.');
                setLoading(false);
            });
    }, [token]);

    const handleSign = async () => {
        setIsSigning(true);

        if (!candidate || !candidate.offer) return;

        // If there's a DocuSign envelope, check its status
        if (candidate.offer.docusignEnvelopeId) {
            try {
                const result = await store.checkDocuSignStatus(candidate.id);
                if (result.status === 'Completed') {
                    setCandidate(prev => prev ? {
                        ...prev,
                        offer: { ...prev.offer!, status: 'Signed', signedAt: new Date().toISOString() }
                    } : null);
                    setIsSigning(false);
                    setViewMode('success');
                    return;
                }
            } catch (err) {
                console.error("DocuSign status check failed, falling back to local signing:", err);
            }
        }

        // Local signing flow (used when DocuSign isn't configured or as fallback)
        const updatedOffer: OfferDetails = {
            ...candidate.offer,
            status: 'Signed',
            signedAt: new Date().toISOString(),
        };

        store.updateCandidate(candidate.id, {
            offer: updatedOffer
        } as any).catch(() => {});

        setCandidate(prev => prev ? { ...prev, offer: updatedOffer } : null);
        setIsSigning(false);
        setViewMode('success');
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) return;

        if (candidate && candidate.offer) {
            const updatedOffer: OfferDetails = {
                ...candidate.offer,
                status: 'Rejected',
                rejectedAt: new Date().toISOString(),
                rejectionReason: rejectionReason
            };

            store.updateCandidate(candidate.id, {
                offer: updatedOffer
            } as any).catch(() => {});

            setCandidate(prev => prev ? { ...prev, offer: updatedOffer } : null);
            alert('Offer rejected. The hiring team has been notified.');
            navigate('/');
        }
    };

    const formatSalary = () => {
        if (!candidate?.offer) return '';
        const { currency, salary } = candidate.offer;
        return `${currency || 'USD'} ${salary?.toLocaleString() || ''}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <ShieldCheck className="w-12 h-12 text-indigo-600" />
                    <p className="text-slate-500 font-medium">Verifying secure link...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-500">{error}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {branding.logoUrl ? (
                            <img src={branding.logoUrl} alt={branding.companyName} className="h-8" />
                        ) : (
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <Globe className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <span className="font-bold text-slate-900 tracking-tight">{branding.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                        <Lock className="w-3 h-3" /> Secure Offer Portal
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full p-6 pb-32">

                {viewMode === 'document' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
                        {/* Document Viewer */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-12 shadow-xl border-slate-200 min-h-[800px] relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Globe className="w-32 h-32" />
                                </div>

                                <div className="space-y-8 text-slate-800 leading-relaxed font-serif">
                                    <div className="border-b border-slate-100 pb-8 mb-8">
                                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Employment Offer Letter</h1>
                                        <p className="text-slate-500 font-sans">{candidate?.offer?.sentAt ? new Date(candidate.offer.sentAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date pending'}</p>
                                    </div>

                                    <p>Dear <strong>{candidate?.name}</strong>,</p>
                                    <p>We are delighted to offer you the position of <strong>{candidate?.role}</strong> at {branding.companyName}.</p>

                                    {/* Dynamic offer sections from real data */}
                                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                                        <h3 className="font-bold text-slate-900 mb-2 font-sans">1. Position & Compensation</h3>
                                        <p className="text-sm">Your starting annual salary will be <strong>{formatSalary()}</strong>{candidate?.offer?.signOnBonus ? `, with a sign-on bonus of ${candidate.offer.signOnBonus}` : ''}{candidate?.offer?.performanceBonus ? ` and performance bonus of ${candidate.offer.performanceBonus}` : ''}.</p>
                                    </div>

                                    {candidate?.offer?.equity && (
                                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                                            <h3 className="font-bold text-slate-900 mb-2 font-sans">2. Equity</h3>
                                            <p className="text-sm">{candidate.offer.equity}</p>
                                        </div>
                                    )}

                                    {candidate?.offer?.benefits && (
                                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                                            <h3 className="font-bold text-slate-900 mb-2 font-sans">{candidate?.offer?.equity ? '3' : '2'}. Benefits</h3>
                                            <p className="text-sm">{candidate.offer.benefits}</p>
                                        </div>
                                    )}

                                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                                        <h3 className="font-bold text-slate-900 mb-2 font-sans">Start Date & Location</h3>
                                        <p className="text-sm">
                                            Your anticipated start date is <strong>{candidate?.offer?.startDate || 'TBD'}</strong>
                                            {candidate?.offer?.location ? `, based in ${candidate.offer.location}` : ''}.
                                            {candidate?.offer?.expirationDate ? ` This offer expires on ${candidate.offer.expirationDate}.` : ''}
                                        </p>
                                    </div>

                                    {/* Offer letter content if provided */}
                                    {candidate?.offer?.offerLetterContent && (
                                        <div className="bg-white p-6 rounded-lg border border-slate-200">
                                            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{candidate.offer.offerLetterContent}</div>
                                        </div>
                                    )}

                                    <div className="pt-12 mt-12 border-t border-slate-200">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="border-t border-slate-300 w-48 pt-1">
                                                    <p className="text-xs font-bold uppercase text-slate-400 font-sans">From</p>
                                                    <p className="font-bold text-slate-900 font-sans">{branding.companyName}</p>
                                                    <p className="text-xs text-slate-500 font-sans">People Operations</p>
                                                </div>
                                            </div>

                                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg w-64 cursor-pointer hover:bg-yellow-100 transition-colors group" onClick={() => setViewMode('signing')}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <PenTool className="w-5 h-5 text-yellow-600" />
                                                    <span className="text-xs font-bold text-yellow-700 uppercase">Candidate Signature</span>
                                                </div>
                                                <div className="h-10 border-b-2 border-yellow-300 flex items-end">
                                                    <span className="text-sm text-yellow-600 italic group-hover:not-italic group-hover:font-medium">Click here to sign...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar Actions */}
                        <div className="space-y-6">
                            <Card className="p-6 sticky top-24">
                                <h3 className="font-bold text-slate-900 mb-4">Action Required</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setViewMode('signing')}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
                                    >
                                        <PenTool className="w-4 h-4" /> Review & Sign
                                    </button>
                                    <button
                                        onClick={() => setViewMode('reject')}
                                        className="w-full py-3 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl font-medium transition-colors"
                                    >
                                        Decline Offer
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-4 text-center">
                                    By clicking "Review & Sign", you agree to be legally bound by this document.
                                </p>
                            </Card>
                        </div>
                    </div>
                )}

                {viewMode === 'signing' && (
                    <div className="fixed inset-0 z-50 bg-slate-900/90 overflow-y-auto animate-fade-in">
                        <div className="min-h-full flex items-center justify-center p-4">
                        <Card className="max-w-2xl w-full p-8 relative overflow-hidden">
                            {isSigning ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <PenTool className="w-8 h-8 text-indigo-600 animate-pulse" />
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">Finalizing Document...</h2>
                                    <p className="text-slate-500">Securing digital signature</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <PenTool className="w-8 h-8 text-yellow-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900">Adopt Your Signature</h2>
                                        <p className="text-slate-500">Confirm your name and signature style.</p>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                            <input type="text" value={candidate?.name} disabled className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initials</label>
                                            <input type="text" value={candidate?.name?.split(' ').map((n: string) => n[0]).join('')} disabled className="w-24 p-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold" />
                                        </div>
                                    </div>

                                    <div className="bg-white border-2 border-indigo-100 rounded-xl p-8 text-center hover:border-indigo-200 transition-colors cursor-pointer relative overflow-hidden">
                                        <p className="font-dancing-script text-4xl text-slate-800 transform -rotate-2">{candidate?.name}</p>
                                        <div className="absolute top-2 right-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">PREVIEW</div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setViewMode('document')} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                                        <button onClick={handleSign} className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-xl shadow-lg shadow-yellow-200 transition-all transform hover:scale-[1.02]">
                                            Adopt and Sign
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                        </div>
                    </div>
                )}

                {viewMode === 'reject' && (
                    <div className="fixed inset-0 z-50 bg-slate-900/90 overflow-y-auto animate-fade-in">
                        <div className="min-h-full flex items-center justify-center p-4">
                        <Card className="max-w-lg w-full p-8">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6" /> Decline Offer
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">We're sorry to see you decline. Please provide a reason to formalize this decision.</p>
                            </div>

                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Please let us know why you are declining..."
                                className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mb-6 resize-none"
                            ></textarea>

                            <div className="flex gap-4">
                                <button onClick={() => setViewMode('document')} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectionReason.trim()}
                                    className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Confirm Decline
                                </button>
                            </div>
                        </Card>
                        </div>
                    </div>
                )}

                {viewMode === 'success' && (
                    <div className="max-w-2xl mx-auto mt-12 animate-scale-in">
                        <Card className="p-12 text-center overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-12 h-12 text-emerald-600" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 mb-2">You're Hired!</h1>
                            <p className="text-slate-500 text-lg mb-8">Congratulations, {candidate?.name?.split(' ')[0]}! We're thrilled to have you on board at {branding.companyName}.</p>

                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 mb-8">
                                <h3 className="font-bold text-slate-900 mb-4 block">Your Signed Documents</h3>
                                {candidate?.offer?.signedDocumentUrl ? (
                                    <a href={candidate.offer.signedDocumentUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-slate-900">Signed Offer Letter.pdf</div>
                                                <div className="text-xs text-slate-400">Digitally signed</div>
                                            </div>
                                        </div>
                                        <Download className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                    </a>
                                ) : (
                                    <div className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-slate-900">Signed Offer Letter</div>
                                                <div className="text-xs text-slate-400">Digitally signed • A copy has been sent to your email</div>
                                            </div>
                                        </div>
                                        <Check className="w-5 h-5 text-emerald-500" />
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-slate-400">A copy has also been sent to your email.</p>
                        </Card>
                    </div>
                )}

            {/* GDPR Data Rights Footer */}
            <footer className="mt-12 mb-8 text-center text-xs text-slate-400 max-w-lg mx-auto space-y-1">
                <p>Your data is processed by <strong className="text-slate-500">{branding.companyName || 'the hiring organization'}</strong> in accordance with GDPR.</p>
                <p>
                    You have the right to access, correct, or delete your personal data.
                    {branding.contactEmail ? (
                        <> Contact <a href={`mailto:${branding.contactEmail}`} className="text-brand-600 hover:underline font-medium">{branding.contactEmail}</a> to exercise your rights.</>
                    ) : (
                        <> Contact the hiring organization directly to exercise your rights.</>
                    )}
                </p>
                <p><a href="/#/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-medium">Privacy Policy</a></p>
            </footer>
            </main>
        </div>
    );
};
