import { auth, db, doc, setDoc, functions, httpsCallable } from './firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    updateProfile,
    User
} from 'firebase/auth';

export interface AuthResponse {
    user: User | null;
    error: string | null;
}

export const signUp = async (email: string, password: string, name: string, companyName: string): Promise<AuthResponse> => {
    try {
        // 1. Create Authentication User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Update Display Name
        await updateProfile(user, { displayName: name });

        // 3. Create Organization Document (Multi-tenancy root)
        const orgId = `org_${user.uid}`; // Simple 1-to-1 mapping for owner for now, or UUID

        await setDoc(doc(db, 'organizations', orgId), {
            name: companyName,
            createdAt: new Date().toISOString(),
            ownerId: user.uid,
            settings: {
                branding: {
                    companyName: companyName,
                    brandColor: '#16a34a',
                    fontStyle: 'sans',
                    cornerStyle: 'soft'
                },
                killSwitches: {
                    global: false,
                    resume: false,
                    interview: false
                }
            }
        });

        // 4. Create User Profile
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            role: 'admin',
            orgId: orgId,
            createdAt: new Date().toISOString()
        });

        return { user, error: null };
    } catch (error: any) {
        console.error("Sign Up Error:", error);
        return { user: null, error: error.message };
    }
};

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error: any) {
        console.error("Sign In Error:", error);
        return { user: null, error: error.message };
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error:", error);
    }
};

export const resetPassword = async (email: string) => {
    try {
        const resetFn = httpsCallable(functions, 'requestPasswordReset');
        await resetFn({ email });
        return { error: null };
    } catch (error: any) {
        console.error("Reset Password Error:", error);
        return { error: error.message };
    }
};
