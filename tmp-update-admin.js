const { db } = require('./src/config/db');

(async () => {
  const users = db.collection('user');
  const result = await users.updateOne(
    { email: 'debuguser@example.com' },
    { $set: { role: 'admin' } },
    { upsert: true }
  );
  console.log(JSON.stringify({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, upsertedId: result.upsertedId }, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
