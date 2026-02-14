
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'persona-recruit-new',
        credential: admin.credential.applicationDefault()
    });
}

const email = 'atiwari@brighttier.com';
const role = 'Recruiter';
const orgId = 'org_3PrWC1bWbtXU839b2tnPTd6ZtKF2'; // The org we found

async function manualInvite() {
    try {
        console.log(`Processing manual invite for ${email}...`);

        let uid;
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            uid = userRecord.uid;
            console.log(`User already exists: ${uid}`);
        } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
                console.log('Creating new user...');
                const newUser = await admin.auth().createUser({
                    email: email,
                    emailVerified: true
                });
                uid = newUser.uid;
                console.log(`New User created: ${uid}`);
            } else {
                throw e;
            }
        }

        console.log('Setting custom claims...');
        await admin.auth().setCustomUserClaims(uid, { orgId, role });

        console.log('Creating Invitation Doc...');
        const inviteId = Buffer.from(email).toString('base64').replace(/=/g, '');
        await admin.firestore().collection('organizations').doc(orgId).collection('invitations').doc(inviteId).set({
            email,
            role,
            status: 'active',
            invitedAt: new Date().toISOString(),
            uid: uid
        }, { merge: true });

        console.log('Creating User Doc...');
        await admin.firestore().collection('users').doc(uid).set({
            email,
            role,
            orgId,
            createdAt: new Date().toISOString()
        }, { merge: true });

        console.log('DONE. User and Invitation created.');

    } catch (error) {
        console.error('Error:', error);
    }
}

manualInvite();
