import { Job, Candidate, AssessmentModule, OnboardingTask, OfferDetails, JobStatus } from '../types';
export type { Job, Candidate, AssessmentModule, OnboardingTask, OfferDetails, JobStatus };
import { db, collection, doc, setDoc, updateDoc, onSnapshot, auth } from './firebase';

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
    heroHeadline?: string;
    heroSubhead?: string;
    coverStyle?: 'gradient' | 'minimal';
}

interface AppState {
    jobs: Job[];
    candidates: ExtendedCandidate[];
    assessments: AssessmentModule[];
    settings: PlatformSettings;
    branding: BrandingSettings;
    invitations: Invitation[];
    orgId?: string; // Expose orgId for UI
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
    assessments: [
        { id: '1', name: 'React Core Concepts', type: 'QuestionBank', description: 'Hooks, Lifecycle, and Virtual DOM deep dive.', difficulty: 'Mid', estimatedDuration: 15, tags: ['React', 'Frontend'], itemsCount: 12, sourceMode: 'manual' },
        { id: '2', name: 'System Design: Scalable Feed', type: 'SystemDesign', description: 'Design a Twitter-like feed architecture.', difficulty: 'Senior', estimatedDuration: 30, tags: ['Architecture', 'Backend'], itemsCount: 1 },
        { id: '3', name: 'JS Algorithms: Arrays', type: 'CodingChallenge', description: 'Array manipulation and optimization tasks.', difficulty: 'Mid', estimatedDuration: 20, tags: ['Algorithms', 'JS'], itemsCount: 3 }
    ],
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
        companyName: 'Acme Corp',
        brandColor: '#16a34a',
        fontStyle: 'sans',
        cornerStyle: 'soft',
        domain: 'acme',
        heroHeadline: 'Build the future with us.',
        heroSubhead: 'Join a team of visionaries, builders, and dreamers. We are looking for exceptional talent to solve the world\'s hardest problems.',
        coverStyle: 'gradient'
    },
    invitations: [],
    orgId: undefined
};

class Store {
    private state: AppState;
    private listeners: Set<() => void> = new Set();
    private seeded: boolean = false;
    private orgId: string | null = null;
    private unsubscribeListeners: (() => void)[] = [];

    constructor() {
        this.state = INITIAL_STATE;
        this.initFirestore();
    }

    private async initFirestore() {
        // Import auth dynamically or use the exported one
        const { onAuthStateChanged } = await import('firebase/auth');

        onAuthStateChanged(auth, async (user) => {
            // Clear existing listeners
            this.unsubscribeListeners.forEach(unsub => unsub());
            this.unsubscribeListeners = [];

            if (user) {
                console.log(`[Store] Auth User detected: ${user.uid}`);
                // Listen to User Profile to get Org ID (handles race condition during signup)
                const userUnsub = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
                    if (userDoc.exists()) {
                        const newOrgId = userDoc.data().orgId;
                        if (this.orgId !== newOrgId) {
                            this.orgId = newOrgId;
                            this.state.orgId = newOrgId; // Update state
                            console.log(`[Store] Organization ID found: ${this.orgId}`);
                            this.notifyListeners(); // Validate link update
                            // Re-init org listeners if org changes
                            // Note: We might need to clear previous org listeners specifically if we supported switching orgs,
                            // but for now simplistic approach is fine or we can add a specific cleanup for org listeners.
                            // Since this is a singleton and top-level listeners are cleared on auth change, 
                            // we should probably clear *org* listeners before adding new ones if this fires multiple times.
                            // However, likely it fires once real orgId is written.
                            // Ideally we keep track of orgUnsubs separately.
                            this.initOrgListeners(this.orgId!);
                        }
                    } else {
                        console.warn("User authenticated but no user profile found in Firestore yet. Waiting...");
                    }
                }, (error) => {
                    console.error("Error listening to user profile:", error);
                });
                this.unsubscribeListeners.push(userUnsub);
            } else {
                this.orgId = null;
                console.log("[Store] User signed out. Resetting state.");
                this.state = INITIAL_STATE;
                this.notifyListeners();
            }
        });
    }

    private initOrgListeners(orgId: string) {
        // Jobs Listener
        const jobsUnsub = onSnapshot(collection(db, 'organizations', orgId, 'jobs'), (snapshot) => {
            this.state.jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            if (snapshot.empty) {
                this.seedJobs(orgId);
            }
            this.notifyListeners();
        });
        this.unsubscribeListeners.push(jobsUnsub);

        // Candidates Listener
        const candidatesUnsub = onSnapshot(collection(db, 'organizations', orgId, 'candidates'), (snapshot) => {
            this.state.candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExtendedCandidate));
            if (snapshot.empty) {
                this.seedCandidates(orgId);
            }
            this.notifyListeners();
        });
        this.unsubscribeListeners.push(candidatesUnsub);

        // Settings Listener
        const settingsUnsub = onSnapshot(doc(db, 'organizations', orgId), (docParams) => {
            if (docParams.exists()) {
                const data = docParams.data();
                if (data.settings) {
                    this.state.settings = data.settings as PlatformSettings;
                }
                if (data.settings?.branding) {
                    this.state.branding = data.settings.branding as BrandingSettings;
                }
                this.notifyListeners();
            }
        });
        this.unsubscribeListeners.push(settingsUnsub);

        // Invitations Listener
        const invitesUnsub = onSnapshot(collection(db, 'organizations', orgId, 'invitations'), (snapshot) => {
            this.state.invitations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
            this.notifyListeners();
        });
        this.unsubscribeListeners.push(invitesUnsub);
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
            const updates: Partial<ExtendedCandidate> = {
                stage: "Hired" as Candidate['stage'],
                onboarding: {
                    hrisSyncStatus: 'Not_Synced',
                    tasks: [
                        { id: 't1', category: 'IT & Equipment', task: 'Provision MacBook Pro M2', type: 'checkbox', completed: false, assignee: 'IT' },
                        { id: 't2', category: 'IT & Equipment', task: 'Create IAM User', type: 'checkbox', completed: false, assignee: 'IT' },
                        { id: 't3', category: 'Culture & Orientation', task: 'Send Welcome Swag Kit', type: 'checkbox', completed: false, assignee: 'HR' },
                        { id: 't4', category: 'Legal & Compliance', task: 'Sign Employment Agreement', type: 'upload', completed: false, assignee: 'HR' },
                    ]
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

    async inviteTeamMember(email: string) {
        if (!this.orgId || !email) return;
        try {
            const inviteId = `inv_${Math.random().toString(36).substr(2, 9)}`;
            await setDoc(doc(db, 'organizations', this.orgId, 'invitations', inviteId), {
                email,
                status: 'pending',
                invitedAt: new Date().toISOString(),
                role: 'member'
            });
            console.log(`Invitation created for ${email}`);
        } catch (e) {
            console.error("Error inviting team member: ", e);
        }
    }

    // Check if AI is allowed
    isAiAllowed(feature: 'resume' | 'interview'): boolean {
        if (this.state.settings.killSwitches.global) return false;
        if (feature === 'resume' && this.state.settings.killSwitches.resume) return false;
        if (feature === 'interview' && this.state.settings.killSwitches.interview) return false;
        return true;
    }
}

export const store = new Store();
