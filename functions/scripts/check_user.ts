
import * as admin from 'firebase-admin';

// Initialize app with projectId
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'persona-recruit-new',
        credential: admin.credential.applicationDefault()
    });
}

const orgId = 'org_3PrWC1bWbtXU839b2tnPTd6ZtKF2'; // Found previously
const inviteEmail = 'atiwari@brighttier.com';

async function check() {
    try {
        console.log(`Checking invitations in org ${orgId}...`);
        const snapshot = await admin.firestore().collection('organizations').doc(orgId).collection('invitations').get();

        console.log(`Total invitations found: ${snapshot.size}`); // Log count

        let found = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(` - ${data.email} (${data.status})`);
            if (data.email === inviteEmail) {
                found = true;
            }
        });

        if (found) {
            console.log(`\nSUCCESS: Invitation for ${inviteEmail} is present.`);
        } else {
            console.log(`\nFAILURE: Invitation for ${inviteEmail} is NOT present.`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

check();
