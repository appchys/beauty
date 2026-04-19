const { getAdminDb } = require('./src/lib/firebase-admin');

async function testFetch() {
  try {
    const adminDb = getAdminDb();
    console.log("Fetching services...");
    const snapshot = await adminDb.collection('services').get();
    console.log("Found " + snapshot.docs.length + " services");
    
    const services = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      console.log('Doc ID:', doc.id, 'createdAt type:', typeof createdAt, 'is null:', createdAt === null, 'has toDate:', createdAt && typeof createdAt.toDate === 'function');
      return doc.id;
    });
    console.log("Success");
  } catch (err) {
    console.error("Error reading services:", err);
  }
}

testFetch();
