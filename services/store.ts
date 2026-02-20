import { Job, Candidate, AssessmentModule, OnboardingTask, OfferDetails, JobStatus } from '../types';
export type { Job, Candidate, AssessmentModule, OnboardingTask, OfferDetails, JobStatus };
import { db, collection, doc, setDoc, updateDoc, onSnapshot, auth, query, where, httpsCallable, functions } from './firebase';


export interface TranscriptEntry {
    speaker: 'Lumina' | 'Candidate';
    text: string;
    timestamp: string;
}

export interface VideoHighlight {
    id: string;
    timestamp: number;
    type: 'Flag' | 'Insight' | 'Positive' | 'Negative';
    text: string;
}

export interface OrgMember {
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    name?: string;
    role: string;
    orgId: string;
}

export interface ProctoringObservation {
    timestamp: string;
    category: 'eye_gaze' | 'language' | 'environment' | 'behavior' | 'third_party' | 'other';
    severity: 'low' | 'medium' | 'high';
    description: string;
}

export interface InterviewSession {
    id: string;
    date: string;
    time?: string;
    timezone?: string;
    expiryDate?: string;
    assessmentId?: string;
    token?: string;
    mode: 'AI' | 'Face-to-Face';
    type: string;
    status: 'Upcoming' | 'Completed' | 'Cancelled';
    meetLink?: string;
    platform?: 'Google Meet' | 'Microsoft Teams';
    score?: number;
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
    summary?: string;
    transcript?: TranscriptEntry[];
    videoHighlights?: VideoHighlight[];
    videoUrl?: string;
    identityVerification?: { score: number; match: boolean };
    proctoring?: {
        integrity: 'Clean' | 'Minor Concerns' | 'Flagged';
        observations: (string | ProctoringObservation)[];
    };
}

export interface Experience {
    id: string;
    company: string;
    role: string;
    duration: string;
    description: string;
}

export interface Education {
    school: string;
    degree: string;
    year: string;
}

// Extended candidate for UI
export interface ExtendedCandidate extends Candidate {
    avatar?: string;
    appliedDate: string;
    lastActive: string;
    location: string;
    phone: string;
    linkedin: string;
    github: string;
    aiVerdict?: 'Proceed' | 'Review' | 'Reject';
    matchReason?: string;
    summary?: string;
    skills?: string[];
    experience?: Experience[];
    education?: Education[];
    resumeText?: string;
    analysis?: {
        strengths?: string[];
        weaknesses?: string[];
        technicalScore?: number;
        culturalScore?: number;
        communicationScore?: number;
        skillsMatrix?: { skill: string; proficiency: number; years: number }[];
        // Merged fields
        matchScore?: number;
        verdict?: string;
        metrics?: any;
        missingSkills?: string[];
        sentimentScore?: number;
    };
    interviews?: InterviewSession[];
}

export type EmailType = 'INVITATION' | 'OFFER' | 'INTERVIEW_INVITE' | 'APPLICATION_RECEIPT' | 'REJECTION' | 'ONBOARDING_INVITE';

export interface EmailTemplateOverride {
    subject?: string;
    headline?: string;
    message?: string;
    buttonText?: string;
    footerNote?: string;
}

export type EmailTemplateOverrides = Partial<Record<EmailType, EmailTemplateOverride>>;

interface PlatformSettings {
    killSwitches: {
        global: boolean;
        resume: boolean;
        interview: boolean;
    };
    emailTemplates?: EmailTemplateOverrides;
    persona?: {
        intensity: number;
        voice: string;
        autoReportThreshold: number;
        autoReportEnabled: boolean;
        introduction?: string;
        outro?: string;
        interviewTimeLimit?: number;
    };
}

export interface BrandingSettings {
    companyName: string;
    brandColor: string;
    fontStyle: 'sans' | 'serif' | 'mono';
    cornerStyle: 'sharp' | 'soft' | 'round';
    domain?: string;
    heroHeadline?: string;
    heroSubhead?: string;
    coverStyle?: 'gradient' | 'minimal';
}

export interface Tenant {
    id: string;
    name: string;
    plan: 'Starter' | 'Pro' | 'Enterprise';
    usersCount: number;
    apiUsage: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Active' | 'Suspended';
    spend: number;
    createdAt: string;
}

interface PlatformStats {
    totalRevenue: number;
    infraOverhead: number;
    computeCredits: number;
    netProfit: number;
}

interface AppState {
    jobs: Job[];
    candidates: ExtendedCandidate[];
    assessments: AssessmentModule[];
    settings: PlatformSettings;
    branding: BrandingSettings;
    invitations: Invitation[];
    orgId?: string; // Expose orgId for UI
    tenants: Tenant[];
    platformStats: PlatformStats;
    isHydrated: boolean;
    onboardingTemplate: OnboardingTask[];
    members: OrgMember[];
    userProfile: UserProfile | null;
}

export interface Invitation {
    id: string;
    email: string;
    role: string;
    status: 'pending' | 'accepted';
    invitedAt: string;
}

const INITIAL_STATE: AppState = {
    jobs: [],
    candidates: [],
    assessments: [],
    settings: {
        killSwitches: {
            global: false,
            resume: false,
            interview: false
        },
        persona: {
            intensity: 30,
            voice: 'Kore (Neutral)',
            autoReportThreshold: 80,
            autoReportEnabled: true,
            introduction: 'Hello! I am Lumina, your AI interviewer today. I am excited to learn more about your experience and skills.',
            outro: 'Thank you for your time today. Our team will review the session and get back to you soon!',
            interviewTimeLimit: 30
        }
    },
    branding: {
        companyName: 'Loading...',
        brandColor: '#16a34a',
        fontStyle: 'sans',
        cornerStyle: 'soft',
        domain: '',
        heroHeadline: 'Build the future with us.',
        heroSubhead: 'Join a team of visionaries, builders, and dreamers. We are looking for exceptional talent to solve the world\'s hardest problems.',
        coverStyle: 'gradient'
    },
    invitations: [],
    orgId: undefined,
    tenants: [],
    platformStats: {
        totalRevenue: 0,
        infraOverhead: 0,
        computeCredits: 0,
        netProfit: 0
    },
    isHydrated: false,
    onboardingTemplate: [],
    members: [],
    userProfile: null
};

class Store {
    private state: AppState;
    private listeners: Set<() => void> = new Set();
    private seeded: boolean = false;
    private orgId: string | null = null;
    private unsubscribeListeners: (() => void)[] = [];
    private platformAdminListening: boolean = false;

    constructor() {
        this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
        this.initFirestore();
    }

    async waitForOrgId(timeoutMs: number = 5000): Promise<string> {
        if (this.orgId) return this.orgId;

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                unsubscribe();
                reject(new Error("Timeout waiting for Organization ID"));
            }, timeoutMs);

            const unsubscribe = this.subscribe(() => {
                if (this.state.orgId) {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve(this.state.orgId);
                }
            });
        });
    }

    private async initFirestore() {
        // Import auth dynamically or use the exported one
        const { onAuthStateChanged } = await import('firebase/auth');

        onAuthStateChanged(auth, async (user) => {
            console.log(`[Store] Auth state change: ${user ? user.email : 'Signed Out'}`);
            // Clear existing listeners
            this.unsubscribeListeners.forEach(unsub => unsub());
            this.unsubscribeListeners = [];
            this.platformAdminListening = false;

            if (user) {
                console.log(`[Store] Auth User detected: ${user.uid}`);
                // Listen to User Profile to get Org ID (handles race condition during signup)
                const userUnsub = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const newOrgId = userData.orgId;
                        console.log(`[Store] User profile doc updated:`, userData);

                        if (this.orgId !== newOrgId) {
                            this.orgId = newOrgId;
                            this.state.orgId = newOrgId; // Update state
                            console.log(`[Store] Organization ID found: ${this.orgId}`);

                            const role = userData.role;
                            if (role === 'platform_admin' || role === 'admin') {
                                this.initPlatformAdminListeners();
                            }

                            this.state.userProfile = {
                                uid: user.uid,
                                email: userData.email,
                                name: userData.name,
                                role: userData.role,
                                orgId: newOrgId
                            };

                            this.notifyListeners(); // Validate link update
                            this.initOrgListeners(this.orgId!);
                        } else {
                            // Even if orgId hasn't changed, profile details (like name) might have
                            this.state.userProfile = {
                                uid: user.uid,
                                email: userData.email,
                                name: userData.name,
                                role: userData.role,
                                orgId: newOrgId
                            };
                            this.notifyListeners();
                        }
                    } else {
                        console.warn(`[Store] No user profile found in Firestore for ${user.uid} yet.`);
                        // For new users who just signed up, the doc might be created by the client-side code in auth.ts
                        // but there's a tiny window where it doesn't exist.
                        // However, if it's an invited user, it MUST exist.
                        // To prevent being stuck in a loading state, we mark as hydrated but log the warning.
                        this.state.isHydrated = true;
                        this.notifyListeners();
                    }
                }, (error) => {
                    console.error("[Store] Error listening to user profile:", error);
                    this.state.isHydrated = true;
                    this.notifyListeners();
                });
                this.unsubscribeListeners.push(userUnsub);
            } else {
                this.orgId = null;
                this.state.orgId = undefined;
                console.log("[Store] User signed out. Resetting state.");
                this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
                this.notifyListeners();
            }
        });
    }

    private initOrgListeners(orgId: string) {
        console.log(`[Store] Initializing Org Listeners for: ${orgId}`);
        // Jobs Listener
        const jobsUnsub = onSnapshot(collection(db, 'organizations', orgId, 'jobs'), (snapshot) => {
            console.log(`[Store] Jobs snapshot received: ${snapshot.size} docs`);
            this.state.jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            if (snapshot.empty) {
                console.log(`[Store] Jobs empty, seeding...`);
                this.seedJobs(orgId);
            }
            this.notifyListeners();
        });
        this.unsubscribeListeners.push(jobsUnsub);

        // Candidates Listener
        const candidatesUnsub = onSnapshot(collection(db, 'organizations', orgId, 'candidates'), (snapshot) => {
            console.log(`[Store] Candidates snapshot received: ${snapshot.size} docs`);
            this.state.candidates = snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data, avatar: data.thumbnailUrl || data.avatar || '' } as ExtendedCandidate;
            });
            if (snapshot.empty) {
                console.log(`[Store] Candidates empty, seeding...`);
                this.seedCandidates(orgId);
            }
            this.notifyListeners();
        });
        this.unsubscribeListeners.push(candidatesUnsub);

        // Settings Listener
        const settingsUnsub = onSnapshot(doc(db, 'organizations', orgId), (docParams) => {
            console.log(`[Store] Organization root doc update:`, docParams.exists() ? docParams.data() : 'DOC MISSING');
            if (docParams.exists()) {
                const data = docParams.data();
                if (data.settings) {
                    this.state.settings = data.settings as PlatformSettings;
                }
                if (data.settings?.branding) {
                    this.state.branding = data.settings.branding as BrandingSettings;
                    console.log(`[Store] Branding updated to:`, this.state.branding.companyName);
                }
                if (data.onboardingTemplate) {
                    this.state.onboardingTemplate = data.onboardingTemplate as OnboardingTask[];
                }
                this.state.isHydrated = true;
                this.notifyListeners();
            } else {
                // If org doc doesn't exist, we are still "hydrated" (with defaults) but ready
                this.state.isHydrated = true;
                this.notifyListeners();
            }
        });
        this.unsubscribeListeners.push(settingsUnsub);

        // Invitations Listener
        const invitesUnsub = onSnapshot(collection(db, 'organizations', orgId, 'invitations'), (snapshot) => {
            console.log(`[Store] Invitations snapshot received: ${snapshot.size} docs`);
            this.state.invitations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
            this.notifyListeners();
        });
        this.unsubscribeListeners.push(invitesUnsub);

        // Assessments Listener
        const assessmentsUnsub = onSnapshot(collection(db, 'organizations', orgId, 'assessments'), (snapshot) => {
            console.log(`[Store] Assessments snapshot received: ${snapshot.size} docs`);
            this.state.assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssessmentModule));
            this.notifyListeners();
        });
        this.unsubscribeListeners.push(assessmentsUnsub);

        // Members Listener (Users with matching orgId)
        const membersQuery = query(collection(db, 'users'), where('orgId', '==', orgId));
        const membersUnsub = onSnapshot(membersQuery, (snapshot) => {
            console.log(`[Store] Members snapshot received: ${snapshot.size} docs`);
            this.state.members = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    joinedAt: data.createdAt
                } as OrgMember;
            });
            this.notifyListeners();
        });
        this.unsubscribeListeners.push(membersUnsub);
    }

    private initPlatformAdminListeners() {
        if (this.platformAdminListening) {
            console.log("[Store] Platform Admin Listeners already active. Skipping.");
            return;
        }
        this.platformAdminListening = true;

        console.log("[Store] Initializing Platform Admin Listeners...");
        const tenantsUnsub = onSnapshot(collection(db, 'organizations'), async (snapshot) => {
            const { getCountFromServer, query, where } = await import('firebase/firestore');

            const tenantPromises = snapshot.docs.map(async (orgDoc) => {
                const data = orgDoc.data();
                const orgId = orgDoc.id;

                // Get real counts from sub-collections + users collection
                let candidatesCount = 0;
                let jobsCount = 0;
                let usersCount = 0;
                try {
                    const [candSnap, jobsSnap, usersSnap] = await Promise.all([
                        getCountFromServer(collection(db, 'organizations', orgId, 'candidates')),
                        getCountFromServer(collection(db, 'organizations', orgId, 'jobs')),
                        getCountFromServer(query(collection(db, 'users'), where('orgId', '==', orgId)))
                    ]);
                    candidatesCount = candSnap.data().count;
                    jobsCount = jobsSnap.data().count;
                    usersCount = usersSnap.data().count;
                } catch (e) {
                    console.warn(`[Store] Failed to count sub-collections for ${orgId}`, e);
                }

                // Derive usage tier from candidate volume
                const apiUsage: Tenant['apiUsage'] =
                    candidatesCount > 100 ? 'Critical' :
                    candidatesCount > 50 ? 'High' :
                    candidatesCount > 10 ? 'Medium' : 'Low';

                return {
                    id: orgId,
                    name: data.settings?.branding?.companyName || data.name || 'Unnamed Organization',
                    plan: data.plan || 'Starter',
                    usersCount: usersCount || 1,
                    apiUsage,
                    status: data.status || 'Active',
                    spend: data.spend || 0,
                    createdAt: data.createdAt || new Date().toISOString()
                } as Tenant;
            });

            this.state.tenants = await Promise.all(tenantPromises);

            // Calculate aggregate stats
            const stats = this.state.tenants.reduce((acc, tenant) => {
                acc.totalRevenue += tenant.spend * 1.5;
                acc.infraOverhead += tenant.spend;
                acc.computeCredits += (tenant.apiUsage === 'High' || tenant.apiUsage === 'Critical' ? 500000 : 100000);
                return acc;
            }, { totalRevenue: 0, infraOverhead: 0, computeCredits: 0, netProfit: 0 });

            stats.netProfit = stats.totalRevenue - stats.infraOverhead;
            this.state.platformStats = stats;

            this.notifyListeners();
        });
        this.unsubscribeListeners.push(tenantsUnsub);
    }

    private async seedJobs(orgId: string) {
        if (this.seeded) return;
        if (INITIAL_STATE.jobs.length === 0) return;
        console.log('Seeding Jobs for Org...');
        for (const job of INITIAL_STATE.jobs) {
            await setDoc(doc(db, 'organizations', orgId, 'jobs', job.id), job);
        }
    }

    private async seedCandidates(orgId: string) {
        if (this.seeded) return;
        if (INITIAL_STATE.candidates.length === 0) return;
        console.log('Seeding Candidates for Org...');
        for (const candidate of INITIAL_STATE.candidates) {
            await setDoc(doc(db, 'organizations', orgId, 'candidates', candidate.id), candidate);
        }
    }

    // No need to seed settings as they are created during SignUp in auth.ts

    getState() {
        return this.state;
    }

    private notifyListeners() {
        this.listeners.forEach(l => l());
    }

    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // Actions - Writing to Firestore

    async addJob(job: Job) {
        if (!this.orgId) return;
        try {
            await setDoc(doc(db, 'organizations', this.orgId, 'jobs', job.id), job);
        } catch (e) {
            console.error("Error adding job: ", e);
        }
    }

    async updateJob(id: string, updates: Partial<Job>) {
        if (!this.orgId) return;
        try {
            await updateDoc(doc(db, 'organizations', this.orgId, 'jobs', id), updates);
        } catch (e) {
            console.error("Error updating job: ", e);
        }
    }

    async deleteJob(id: string) {
        if (!this.orgId) return;
        try {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'organizations', this.orgId, 'jobs', id));
        } catch (e) {
            console.error("Error deleting job: ", e);
        }
    }

    async addCandidate(candidate: ExtendedCandidate) {
        if (!this.orgId) return;
        try {
            await setDoc(doc(db, 'organizations', this.orgId, 'candidates', candidate.id), candidate);
        } catch (e) {
            console.error("Error adding candidate: ", e);
        }
    }

    async updateCandidate(id: string, updates: Partial<ExtendedCandidate>) {
        if (!this.orgId) return;
        try {
            // Firestore rejects undefined values — strip them recursively
            const clean = JSON.parse(JSON.stringify(updates));
            await updateDoc(doc(db, 'organizations', this.orgId, 'candidates', id), clean);
        } catch (e) {
            console.error("Error updating candidate: ", e);
        }
    }

    async deleteCandidate(id: string) {
        if (!this.orgId) return;
        try {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'organizations', this.orgId, 'candidates', id));
        } catch (e) {
            console.error("Error deleting candidate: ", e);
        }
    }

    async addInterviewSession(candidateId: string, session: InterviewSession) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (candidate) {
            const existing = (candidate.interviews || []);
            // If the session has an ID matching an existing Upcoming session, replace it
            const matchIdx = existing.findIndex(i => i.id === session.id && i.status === 'Upcoming');
            let updatedInterviews: InterviewSession[];
            if (matchIdx >= 0) {
                updatedInterviews = [...existing];
                updatedInterviews[matchIdx] = session;
            } else {
                updatedInterviews = [...existing, session];
            }
            await this.updateCandidate(candidateId, { interviews: updatedInterviews });
        }
    }

    async addCandidateDocument(candidateId: string, docData: any) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (candidate) {
            const updatedDocs = [...(candidate.documents || []), docData];
            await this.updateCandidate(candidateId, { documents: updatedDocs });
        }
    }

    async addCandidateFolder(candidateId: string, folder: any) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (candidate) {
            const updatedFolders = [...(candidate.folders || []), folder];
            await this.updateCandidate(candidateId, { folders: updatedFolders });
        }
    }

    async updateKillSwitch(key: keyof PlatformSettings['killSwitches'], value: boolean) {
        if (!this.orgId) return;
        const newSettings = { ...this.state.settings };
        newSettings.killSwitches[key] = value;
        try {
            // Update the consolidated settings in org doc
            await updateDoc(doc(db, 'organizations', this.orgId), { settings: newSettings });
        } catch (e) {
            console.error("Error updating killswitch: ", e);
        }
    }

    async updateBranding(updates: Partial<BrandingSettings>) {
        if (!this.orgId) return;
        const newBranding = { ...this.state.branding, ...updates };
        try {
            await updateDoc(doc(db, 'organizations', this.orgId), {
                'settings.branding': newBranding
            });
        } catch (e) {
            console.error("Error updating branding: ", e);
        }
    }

    async updatePersona(updates: {
        intensity?: number;
        voice?: string;
        autoReportThreshold?: number;
        autoReportEnabled?: boolean;
        introduction?: string;
        outro?: string;
        interviewTimeLimit?: number;
    }) {
        if (!this.orgId) return;
        const currentPersona = this.state.settings.persona || { intensity: 30, voice: 'Kore (Neutral)', autoReportThreshold: 80, autoReportEnabled: true };
        const newPersona = { ...currentPersona, ...updates };

        try {
            await updateDoc(doc(db, 'organizations', this.orgId), {
                'settings.persona': newPersona
            });
        } catch (e) {
            console.error("Error updating persona: ", e);
        }
    }

    async updateEmailTemplates(templates: EmailTemplateOverrides) {
        if (!this.orgId) return;
        try {
            await updateDoc(doc(db, 'organizations', this.orgId), {
                'settings.emailTemplates': templates
            });
        } catch (e) {
            console.error("Error updating email templates: ", e);
        }
    }

    async updateOffer(candidateId: string, offer: Partial<OfferDetails>) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (candidate) {
            const existingOffer = candidate.offer || {} as OfferDetails;
            const updatedOffer = { ...existingOffer, ...offer };
            await this.updateCandidate(candidateId, { offer: updatedOffer });
        }
    }

    async sendOffer(candidateId: string, email: string, token?: string) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (!candidate) return;

        try {
            const sendOfferLetterFn = httpsCallable(functions, 'sendOfferLetter');
            // Assuming we have a public offer view page like /offer/:candidateId
            // The origin should be dynamically retrieved
            // Use token for secure link if available, otherwise fallback (though token is preferred)
            const offerToken = token || candidate.offer?.token || candidateId;
            const offerUrl = `${window.location.origin}/offer/${offerToken}`;

            await sendOfferLetterFn({
                candidateId,
                email,
                jobTitle: candidate.role,
                companyName: this.state.branding.companyName,
                offerUrl,
                orgId: this.orgId
            });
            console.log(`[Store] Offer letter sent to ${email}`);
        } catch (e) {
            console.error("Error sending offer letter:", e);
            throw e;
        }
    }

    async sendAiInterviewInvite(candidateId: string, email: string, token: string, assessmentId?: string) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (!candidate || !this.orgId) return;

        try {
            const sendInviteFn = httpsCallable(functions, 'sendAiInterviewInvite');
            const interviewUrl = `${window.location.origin}/interview-invite/${token}`;

            // Cloud Function creates the interviewInvites doc (Admin SDK) and sends the email
            await sendInviteFn({
                email,
                jobTitle: candidate.role,
                interviewUrl,
                token,
                orgId: this.orgId,
                candidateId,
                candidateName: candidate.name,
                assessmentId: assessmentId || null,
            });
            console.log(`[Store] AI Interview invite sent to ${email}`);
        } catch (e) {
            console.error("Error sending AI interview invite:", e);
            throw e;
        }
    }

    async sendApplicationReceipt(email: string, jobTitle: string, candidateName: string) {
        try {
            const sendReceiptFn = httpsCallable(functions, 'sendApplicationReceipt');
            await sendReceiptFn({
                email,
                jobTitle,
                candidateName,
                orgId: this.orgId
            });
            console.log(`[Store] Application receipt sent to ${email}`);
        } catch (e) {
            console.error("Error sending application receipt:", e);
            // Don't throw, just log. It's not critical for the UI flow.
        }
    }

    async sendRejectionEmail(candidateId: string) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (!candidate) return;

        try {
            const sendRejectionFn = httpsCallable(functions, 'sendRejectionEmail');
            await sendRejectionFn({
                email: candidate.email,
                jobTitle: candidate.role,
                candidateName: candidate.name,
                orgId: this.orgId
            });
            console.log(`[Store] Rejection email sent to ${candidate.email}`);
        } catch (e) {
            console.error("Error sending rejection email:", e);
            throw e;
        }
    }

    async sendOnboardingInvite(candidateId: string) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (!candidate) return;

        try {
            const sendOnboardingFn = httpsCallable(functions, 'sendOnboardingInvite');
            // Assuming we have an onboarding portal
            // For now, let's use a placeholder or the same offer token concept if we want secure access
            const onboardingToken = candidate.offer?.token || candidateId; // Reuse or create new
            const onboardingUrl = `${window.location.origin}/onboarding-portal/${onboardingToken}`;

            await sendOnboardingFn({
                email: candidate.email,
                jobTitle: candidate.role,
                candidateName: candidate.name,
                onboardingUrl,
                orgId: this.orgId
            });
            console.log(`[Store] Onboarding invite sent to ${candidate.email}`);
        } catch (e) {
            console.error("Error sending onboarding invite:", e);
            throw e;
        }
    }


    async updateOnboardingTask(candidateId: string, taskId: string, updates: Partial<OnboardingTask>) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (candidate && candidate.onboarding) {
            const updatedTasks = candidate.onboarding.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
            await this.updateCandidate(candidateId, {
                onboarding: { ...candidate.onboarding, tasks: updatedTasks }
            });
        }
    }

    async syncToHris(candidateId: string) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (candidate && candidate.onboarding) {
            const hrisId = `SGE-${candidateId.substring(0, 8).toUpperCase()}`;
            const updatedOnboarding = {
                ...candidate.onboarding,
                hrisSyncStatus: 'Synced' as const,
                hrisId: hrisId
            };
            await this.updateCandidate(candidateId, { onboarding: updatedOnboarding });
        }
    }

    async promoteToHired(candidateId: string) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (candidate) {
            const tasks = this.state.onboardingTemplate.length > 0
                ? JSON.parse(JSON.stringify(this.state.onboardingTemplate))
                : [
                    { id: 't1', category: 'IT & Equipment', task: 'Provision MacBook Pro M2', type: 'checkbox', completed: false, assignee: 'IT' },
                    { id: 't2', category: 'IT & Equipment', task: 'Create IAM User', type: 'checkbox', completed: false, assignee: 'IT' },
                    { id: 't3', category: 'Culture & Orientation', task: 'Send Welcome Swag Kit', type: 'checkbox', completed: false, assignee: 'HR' },
                    { id: 't4', category: 'Legal & Compliance', task: 'Sign Employment Agreement', type: 'upload', completed: false, assignee: 'HR' },
                ];

            const updates: Partial<ExtendedCandidate> = {
                stage: "Hired" as Candidate['stage'],
                onboarding: {
                    hrisSyncStatus: 'Not_Synced',
                    tasks: tasks
                }
            };
            await this.updateCandidate(candidateId, updates);

            // Automatically send onboarding invite
            await this.sendOnboardingInvite(candidateId);
        }
    }

    async updateCandidateStage(id: string, stage: Candidate['stage']) {
        if (stage === 'Hired') {
            await this.promoteToHired(id);
        } else if (stage === 'Rejected') {
            // Optional: Auto-send rejection? Maybe better to keep it manual to allow personalization or delay.
            // For now, let's just update the status. The UI can have a button to "Reject & Notify".
            await this.updateCandidate(id, { stage });
        } else {
            await this.updateCandidate(id, { stage });
        }
    }


    async inviteTeamMember(email: string, role: string = 'Recruiter') {
        if (!this.orgId) {
            console.error("[Store] Cannot invite team member: Organization ID is missing.");
            throw new Error("Organization ID not loaded. Please try again in 5 seconds.");
        }
        if (!email) return;

        try {
            console.log(`[Store] Inviting ${email} to org ${this.orgId} via Cloud Function...`);

            // 1. Call Cloud Function to create User and Set Claims
            const inviteFn = httpsCallable(functions, 'inviteTeamMember');
            await inviteFn({
                email,
                role,
                orgId: this.orgId
            });

            console.log(`[Store] User invitation processed by backend.`);

            // Backend now handles the email sending via Resend
            console.log(`[Store] Secure invitation link sent to ${email}`);

        } catch (e: any) {
            console.error("[Store] Error inviting team member: ", e);
            throw e;
        }
    }
    async revokeInvitation(inviteId: string) {
        if (!this.orgId) return;
        try {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'organizations', this.orgId, 'invitations', inviteId));
            console.log(`Invitation ${inviteId} revoked`);
        } catch (e) {
            console.error("Error revoking invitation: ", e);
        }
    }

    async publishAssessment(assessment: Partial<AssessmentModule>) {
        if (!this.orgId) return;
        try {
            const id = assessment.id || `asm_${Date.now()}`;
            await setDoc(doc(db, 'organizations', this.orgId, 'assessments', id), {
                ...assessment,
                id: id,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error("Error publishing assessment: ", e);
        }
    }

    async deleteAssessment(id: string) {
        if (!this.orgId) return;
        try {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'organizations', this.orgId, 'assessments', id));
        } catch (e) {
            console.error("Error deleting assessment: ", e);
        }
    }


    // --- GOOGLE MEET INTEGRATION ---
    async createGoogleMeetEvent(params: {
        candidateId: string;
        candidateName: string;
        candidateEmail: string;
        jobTitle: string;
        date: string;
        time: string;
        timezone: string;
        durationMinutes?: number;
        interviewerEmail?: string;
    }): Promise<{ meetLink: string; eventId: string }> {
        if (!this.orgId) throw new Error("Organization not loaded.");

        const createMeetFn = httpsCallable(functions, 'createGoogleMeetEvent');
        const result = await createMeetFn({
            ...params,
            orgId: this.orgId,
        });

        return result.data as { meetLink: string; eventId: string };
    }

    // --- MICROSOFT TEAMS INTEGRATION ---
    async createTeamsMeeting(params: {
        candidateId: string;
        candidateName: string;
        candidateEmail: string;
        jobTitle: string;
        date: string;
        time: string;
        durationMinutes?: number;
        interviewerEmail?: string;
    }): Promise<{ meetLink: string; meetingId: string }> {
        if (!this.orgId) throw new Error("Organization not loaded.");

        const createTeamsFn = httpsCallable(functions, 'createTeamsMeeting');
        const result = await createTeamsFn({
            ...params,
            orgId: this.orgId,
        });

        return result.data as { meetLink: string; meetingId: string };
    }

    async getTeamsMeetingArtifacts(meetingId: string, candidateId: string): Promise<{ recordings: any[]; transcripts: any[] }> {
        if (!this.orgId) throw new Error("Organization not loaded.");

        const getArtifactsFn = httpsCallable(functions, 'getTeamsMeetingArtifacts');
        const result = await getArtifactsFn({
            meetingId,
            candidateId,
            orgId: this.orgId,
        });

        return result.data as { recordings: any[]; transcripts: any[] };
    }

    // --- DOCUSIGN INTEGRATION ---
    async sendDocuSignOffer(candidateId: string): Promise<{ envelopeId: string; signingUrl?: string }> {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (!candidate || !this.orgId) throw new Error("Candidate or organization not loaded.");

        const offer = candidate.offer;
        if (!offer) throw new Error("No offer details found for this candidate.");

        const createEnvelopeFn = httpsCallable(functions, 'createDocuSignEnvelope');
        const result = await createEnvelopeFn({
            candidateId,
            candidateName: candidate.name,
            candidateEmail: candidate.email,
            jobTitle: candidate.role,
            companyName: this.state.branding.companyName,
            salary: offer.salary ? `${offer.currency || 'USD'} ${offer.salary.toLocaleString()}` : undefined,
            startDate: offer.startDate,
            orgId: this.orgId,
            returnUrl: `${window.location.origin}/#/offer/${offer.token}`,
        });

        return result.data as { envelopeId: string; signingUrl?: string };
    }

    async checkDocuSignStatus(candidateId: string): Promise<{ status: string }> {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (!candidate?.offer?.docusignEnvelopeId || !this.orgId) {
            throw new Error("No DocuSign envelope found.");
        }

        const checkStatusFn = httpsCallable(functions, 'checkDocuSignStatus');
        const result = await checkStatusFn({
            envelopeId: candidate.offer.docusignEnvelopeId,
            orgId: this.orgId,
            candidateId,
        });

        return result.data as { status: string };
    }

    // Check if AI is allowed
    isAiAllowed(feature: 'resume' | 'interview'): boolean {
        if (this.state.settings.killSwitches.global) return false;
        if (feature === 'resume' && this.state.settings.killSwitches.resume) return false;
        if (feature === 'interview' && this.state.settings.killSwitches.interview) return false;
        return true;
    }

    // Platform Admin Actions
    async updateTenantStatus(tenantId: string, status: 'Active' | 'Suspended') {
        try {
            await updateDoc(doc(db, 'organizations', tenantId), { status });
        } catch (e) {
            console.error("Error updating tenant status: ", e);
        }
    }

    async updateTenantPlan(tenantId: string, plan: string) {
        try {
            await updateDoc(doc(db, 'organizations', tenantId), { plan });
        } catch (e) {
            console.error("Error updating tenant plan: ", e);
        }
    }

    async updateOnboardingTemplate(tasks: OnboardingTask[]) {
        if (!this.orgId) return;
        try {
            await updateDoc(doc(db, 'organizations', this.orgId), {
                onboardingTemplate: tasks
            });
        } catch (e) {
            console.error("Error updating onboarding template: ", e);
        }
    }

    // --- PUBLIC PORTAL TOKEN RESOLVER ---
    async resolvePortalToken(token: string): Promise<{
        candidateId: string;
        name: string;
        email: string;
        role: string;
        offer: any;
        onboarding: any;
        branding: { companyName: string; primaryColor: string; logoUrl: string };
        orgId: string;
    }> {
        const fn = httpsCallable(functions, 'resolvePortalToken');
        const result = await fn({ token });
        return result.data as any;
    }
}

export const store = new Store();
