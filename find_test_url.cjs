const admin = require('firebase-admin');
const serviceAccount = require('./functions/service-account.json');
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();
async function findData() {
    try {
        const orgs = await db.collection('organizations').limit(5).get();
        for (const org of orgs.docs) {
            const jobs = await db.collection('organizations').doc(org.id).collection('jobs').limit(1).get();
            if (!jobs.empty) {
                console.log(`TEST_URL: https://persona-recruit-new.web.app/jobs#/p/${org.id}/board`);
                process.exit(0);
            }
        }
        console.log('No orgs with jobs found');
    } catch (e) {
        console.error(e);
    }
}
findData();
