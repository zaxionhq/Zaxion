
import { initDb } from "../src/models/index.js";

async function checkWaitlist() {
  console.log("🔍 Connecting to database...");
  const db = await initDb();
  
  try {
    const entries = await db.Waitlist.findAll({
      order: [['createdAt', 'DESC']],
      raw: true
    });

    console.log(`\n📋 Waitlist Entries (${entries.length}):`);
    console.table(entries.map(e => ({
      email: e.email,
      status: e.status,
      created: e.createdAt.toISOString()
    })));

  } catch (error) {
    console.error("❌ Error fetching waitlist:", error);
  } finally {
    await db.sequelize.close();
    console.log("\n✅ Connection closed.");
  }
}

checkWaitlist();
