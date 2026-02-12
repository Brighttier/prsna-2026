import { Job, Candidate, AssessmentModule, OnboardingTask, OfferDetails, JobStatus } from '../types';
export type { Job, Candidate, AssessmentModule, OnboardingTask, OfferDetails, JobStatus };
import { db, collection, doc, setDoc, updateDoc, onSnapshot, getDoc, auth } from './firebase';

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
        strengths: string[];
        weaknesses: string[];
        technicalScore: number;
        culturalScore: number;
        communicationScore: number;
    };
    interviews?: InterviewSession[];
}

interface PlatformSettings {
    killSwitches: {
        global: boolean;
        resume: boolean;
        interview: boolean;
    };
}

interface BrandingSettings {
    companyName: string;
    brandColor: string;
    fontStyle: 'sans' | 'serif' | 'mono';
    cornerStyle: 'sharp' | 'soft' | 'round';
}

interface AppState {
    jobs: Job[];
    candidates: ExtendedCandidate[];
    assessments: AssessmentModule[];
    settings: PlatformSettings;
    branding: BrandingSettings;
}

const INITIAL_STATE: AppState = {
    jobs: [
        {
            id: '1',
            title: 'Senior React Engineer',
            department: 'Engineering',
            location: 'Remote, US',
            type: 'Full-time',
            status: JobStatus.OPEN,
            applicants: 45,
            postedDate: '2 days ago',
            workflow: { screening: '1', technical: '3' }
        },
        {
            id: '2',
            title: 'Product Designer',
            department: 'Design',
            location: 'New York, NY',
            type: 'Full-time',
            status: JobStatus.OPEN,
            applicants: 28,
            postedDate: '5 days ago'
        }
    ],
    candidates: [
        {
            id: '1',
            name: 'Sarah Jenkins',
            email: 'sarah.j@example.com',
            role: 'Senior React Engineer',
            stage: 'Offer',
            score: 92,
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            appliedDate: '2 days ago',
            offer: {
                id: 'off_123',
                status: 'Sent',
                token: 'secure-token-abc-123',
                sentAt: '2023-10-26T10:00:00Z',
                documentUrl: 'https://example.com/offer.pdf',
                envelopeId: 'env_88392',
                // Compensation & Logistics
                salary: 165000,
                currency: 'USD',
                equity: '0.15%',
                signOnBonus: '$10,000',
                performanceBonus: '15%',
                benefits: 'Standard Health, Dental, Vision',
                startDate: '2023-11-15'
            },
            match: 94,
            lastActive: '5 hours ago',
            location: 'San Francisco, CA (Remote)',
            phone: '+1 (555) 123-4567',
            linkedin: 'linkedin.com/in/sarahj',
            github: 'github.com/sarahjcodes',
            aiVerdict: 'Proceed',
            matchReason: 'Strong trajectory in SaaS scale-ups.',
            summary: 'Product-minded Senior Frontend Engineer with 6+ years of experience building scalable web applications. Specialized in React ecosystem, performance optimization, and design systems. Previously led a team of 4 engineers at TechFlow.',
            skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js', 'GraphQL', 'AWS'],
            experience: [
                { id: 'e1', company: 'TechFlow Inc', role: 'Senior Frontend Engineer', duration: '2021 - Present', description: 'Led the migration from Angular to Next.js, improving TTI by 40%. established the internal design system "FlowUI" used by 3 product teams.' },
                { id: 'e2', company: 'WebScale', role: 'Frontend Developer', duration: '2018 - 2021', description: 'Built high-traffic landing pages and marketing funnels. Collaborated with design to implement pixel-perfect UIs.' }
            ],
            education: [{ school: 'MIT', degree: 'BS Computer Science', year: '2018' }],
            analysis: {
                strengths: ['Demonstrated leadership in migration projects', 'Strong understanding of web performance vitals', 'Cultural fit: High ownership'],
                weaknesses: ['Limited backend/database experience', 'No mobile (React Native) experience found'],
                technicalScore: 94,
                culturalScore: 88,
                communicationScore: 90
            },
            interviews: [
                {
                    id: 'i1',
                    date: 'Oct 24, 2023',
                    type: 'Lumina Screening',
                    status: 'Completed',
                    platform: 'Google Meet',
                    score: 9.2,
                    sentiment: 'Positive',
                    summary: 'Sarah demonstrated exceptional depth in React internals, specifically around concurrent rendering and custom hook optimization. Her communication was clear, and she showed strong leadership potential by describing her experience mentoring junior developers.',
                    videoHighlights: [
                        { id: 'h1', timestamp: 120, type: 'Positive', text: 'Explained Virtual DOM vs Shadow DOM with perfect clarity.' },
                        { id: 'h2', timestamp: 340, type: 'Insight', text: 'Showed deep understanding of Web Vitals and SSR.' },
                        { id: 'h3', timestamp: 600, type: 'Positive', text: 'Strong culture fit: Values transparency and peer reviews.' }
                    ]
                }
            ],
            folders: [
                { id: 'f1', name: 'Resume & CV', color: 'bg-blue-50', icon: 'Folder', fileCount: 2, size: '4.2 MB' },
                { id: 'f2', name: 'Offer Docs', color: 'bg-emerald-50', icon: 'Folder', fileCount: 1, size: '120 KB' },
                { id: 'f3', name: 'Legal & Tax', color: 'bg-purple-50', icon: 'Folder', fileCount: 3, size: '12 MB' }
            ],
            documents: [
                { id: 'd1', name: 'Resume_Sarah_Jenkins.pdf', type: 'application/pdf', size: '1.2 MB', uploadedAt: 'Oct 20, 2023', category: 'Resume', url: '#' },
                { id: 'd2', name: 'ID_Passport_Copy.jpg', type: 'image/jpeg', size: '2.4 MB', uploadedAt: 'Oct 21, 2023', category: 'Identification', url: '#' },
                { id: 'd3', name: 'Technical_Assessment_Grid.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: '450 KB', uploadedAt: 'Oct 25, 2023', category: 'Legal', url: '#' }
            ]
        },
        {
            id: '2',
            name: 'Michael Chen',
            email: 'm.chen@example.com',
            role: 'Senior React Engineer',
            stage: 'Hired',
            score: 88,
            avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            appliedDate: '1 day ago',
            lastActive: 'Just now',
            location: 'New York, NY',
            phone: '+1 (555) 987-6543',
            linkedin: 'linkedin.com/in/mchen',
            github: 'github.com/chenv2',
            aiVerdict: 'Proceed',
            matchReason: 'Excellent technical skill density.',
            summary: 'Full Stack Engineer with a heavy lean towards frontend. Passionate about developer tooling and CI/CD pipelines.',
            skills: ['React', 'Redux', 'Webpack', 'Docker', 'CI/CD', 'Python'],
            experience: [
                { id: 'e1', company: 'DevTools Co', role: 'Software Engineer', duration: '2019 - Present', description: 'Maintained the core dashboard using React and Redux. Optimized build times by 50% using Esbuild.' }
            ],
            analysis: {
                strengths: ['Strong tooling experience', 'Backend capable'],
                weaknesses: ['Less focus on UI/UX details'],
                technicalScore: 89,
                culturalScore: 85,
                communicationScore: 82
            },
            onboarding: {
                hrisSyncStatus: 'Not_Synced',
                tasks: [
                    { id: 't1', category: 'IT & Equipment', task: 'Provision MacBook Pro M2', type: 'checkbox', completed: false, assignee: 'IT' },
                    { id: 't2', category: 'IT & Equipment', task: 'Create IAM User', type: 'checkbox', completed: true, assignee: 'IT' },
                    { id: 't3', category: 'Culture & Orientation', task: 'Send Welcome Swag Kit', type: 'checkbox', completed: false, assignee: 'HR' },
                    { id: 't4', category: 'Legal & Compliance', task: 'Sign Employment Agreement', type: 'upload', completed: true, assignee: 'HR' },
                ]
            },
            interviews: []
        }
    ],
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
        }
    },
    branding: {
        companyName: 'Acme Corp',
        brandColor: '#16a34a',
        fontStyle: 'sans',
        cornerStyle: 'soft'
    }
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
                // Fetch user to get Org ID
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    this.orgId = userDoc.data().orgId;
                    console.log(`[Store] Initialized for Org: ${this.orgId}`);
                    this.initOrgListeners(this.orgId!);
                } else {
                    console.warn("User authenticated but no user profile found in Firestore.");
                }
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
            if (!snapshot.empty) {
                this.state.jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
                this.notifyListeners();
            } else {
                this.seedJobs(orgId);
            }
        });
        this.unsubscribeListeners.push(jobsUnsub);

        // Candidates Listener
        const candidatesUnsub = onSnapshot(collection(db, 'organizations', orgId, 'candidates'), (snapshot) => {
            if (!snapshot.empty) {
                this.state.candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExtendedCandidate));
                this.notifyListeners();
            } else {
                this.seedCandidates(orgId);
            }
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
            } else {
                // If org exists but no settings, seeding handled by signUp usually, but we can double check
            }
        });
        this.unsubscribeListeners.push(settingsUnsub);
    }

    private async seedJobs(orgId: string) {
        if (this.seeded) return;
        console.log('Seeding Jobs for Org...');
        for (const job of INITIAL_STATE.jobs) {
            await setDoc(doc(db, 'organizations', orgId, 'jobs', job.id), job);
        }
    }

    private async seedCandidates(orgId: string) {
        if (this.seeded) return;
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

    // Check if AI is allowed
    isAiAllowed(feature: 'resume' | 'interview'): boolean {
        if (this.state.settings.killSwitches.global) return false;
        if (feature === 'resume' && this.state.settings.killSwitches.resume) return false;
        if (feature === 'interview' && this.state.settings.killSwitches.interview) return false;
        return true;
    }
}

export const store = new Store();
