import { Job, Candidate, AssessmentModule, OnboardingTask, OfferDetails, JobStatus } from '../types';
export type { Job, Candidate, AssessmentModule, OnboardingTask, OfferDetails, JobStatus };
import { db, collection, doc, setDoc, updateDoc, onSnapshot, auth, query, where, httpsCallable, functions } from './firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

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

export interface InterviewSession {
    id: string;
    date: string;
    time?: string;
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
    avatar: string;
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
    analysis?: {
        strengths?: string[];
        weaknesses?: string[];
        technicalScore?: number;
        culturalScore?: number;
        communicationScore?: number;
        // Merged fields
        matchScore?: number;
        verdict?: string;
        metrics?: any;
        missingSkills?: string[];
        sentimentScore?: number;
    };
    interviews?: InterviewSession[];
}

interface PlatformSettings {
    killSwitches: {
        global: boolean;
        resume: boolean;
        interview: boolean;
    };
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
            this.state.candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExtendedCandidate));
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
        const tenantsUnsub = onSnapshot(collection(db, 'organizations'), (snapshot) => {
            this.state.tenants = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || data.settings?.branding?.companyName || 'Unnamed Organization',
                    plan: data.plan || 'Free',
                    usersCount: data.usersCount || 0,
                    apiUsage: data.apiUsage || 'Low',
                    status: data.status || 'Active',
                    spend: data.spend || 0,
                    createdAt: data.createdAt || new Date().toISOString()
                } as Tenant;
            });

            // Calculate aggregate stats
            const stats = this.state.tenants.reduce((acc, tenant) => {
                acc.totalRevenue += tenant.spend * 1.5; // Example calc
                acc.infraOverhead += tenant.spend;
                acc.computeCredits += (tenant.apiUsage === 'High' ? 500000 : 100000);
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
            await updateDoc(doc(db, 'organizations', this.orgId, 'candidates', id), updates as any);
        } catch (e) {
            console.error("Error updating candidate: ", e);
        }
    }

    async addInterviewSession(candidateId: string, session: InterviewSession) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (candidate) {
            const updatedInterviews = [...(candidate.interviews || []), session];
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

    async updateOffer(candidateId: string, offer: Partial<OfferDetails>) {
        const candidate = this.state.candidates.find(c => c.id === candidateId);
        if (candidate) {
            const existingOffer = candidate.offer || {} as OfferDetails;
            const updatedOffer = { ...existingOffer, ...offer };
            await this.updateCandidate(candidateId, { offer: updatedOffer });
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
            const hrisId = `SGE-${Math.floor(Math.random() * 10000)}`;
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
        }
    }

    async updateCandidateStage(id: string, stage: Candidate['stage']) {
        if (stage === 'Hired') {
            await this.promoteToHired(id);
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

            console.log(`[Store] User created/updated. Sending internal password reset email...`);

            // 2. Send Firebase Auth Password Reset Email (as the invite)
            try {
                // We use the client SDK to send the email using Firebase's internal system
                await sendPasswordResetEmail(auth, email);
                console.log(`[Store] Password reset email sent to ${email}`);
            } catch (emailError: any) {
                console.error("[Store] Failed to send password reset email:", emailError);
                // We don't throw here because the user is technically created/invited
                // The UI will show success but mentioned they might need to reset password
                throw new Error(`Invitation created but email failed: ${emailError.message}`);
            }

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
}

export const store = new Store();
