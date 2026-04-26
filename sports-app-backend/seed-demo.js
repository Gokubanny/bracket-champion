/**
 * ArenaX Seed Script
 * Creates 1 admin account + 5 tournaments with different sports
 * Run: node seed-demo.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ── Models ──────────────────────────────────────────────────────
const User = require("./src/models/User.model");
const Tournament = require("./src/models/Tournament.model");

// ── Config ──────────────────────────────────────────────────────
const ADMIN = {
  fullName: "ArenaX Admin",
  email: "admin@arenax.com",
  password: "Admin@1234",
  role: "admin",
};

const TOURNAMENTS = [
  {
    name: "UNIPORT Football Cup 2026",
    sport: "Football",
    description: "The annual inter-departmental football championship. Top 8 departments compete for the golden trophy.",
    teamSlots: 8,
    startDate: new Date("2026-06-01"),
    registrationDeadline: new Date("2026-05-20"),
    estimatedMatchDuration: "90 minutes",
    visibility: "public",
  },
  {
    name: "Faculty Basketball League",
    sport: "Basketball",
    description: "Fast-paced 5v5 basketball tournament across all faculties. Only the best advance to the finals.",
    teamSlots: 8,
    startDate: new Date("2026-06-15"),
    registrationDeadline: new Date("2026-06-05"),
    estimatedMatchDuration: "45 minutes",
    visibility: "public",
  },
  {
    name: "Campus Volleyball Championship",
    sport: "Volleyball",
    description: "Mixed-level volleyball competition open to all departments. Register your team and compete for glory.",
    teamSlots: 8,
    startDate: new Date("2026-07-01"),
    registrationDeadline: new Date("2026-06-20"),
    estimatedMatchDuration: "60 minutes",
    visibility: "public",
  },
  {
    name: "Table Tennis Grand Prix",
    sport: "Table Tennis",
    description: "Singles and doubles table tennis tournament. Fast, competitive and open to all skill levels.",
    teamSlots: 16,
    startDate: new Date("2026-07-10"),
    registrationDeadline: new Date("2026-06-30"),
    estimatedMatchDuration: "30 minutes",
    visibility: "public",
  },
  {
    name: "Badminton Invitational 2026",
    sport: "Badminton",
    description: "Private invitational badminton tournament. By invite only for top-ranked campus players.",
    teamSlots: 8,
    startDate: new Date("2026-08-01"),
    registrationDeadline: new Date("2026-07-20"),
    estimatedMatchDuration: "45 minutes",
    visibility: "private",
  },
];

// ── Seed ────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // ── Admin Account ──────────────────────────────────────────
    let admin = await User.findOne({ email: ADMIN.email });

    if (admin) {
      console.log(`⚠️  Admin already exists: ${ADMIN.email}`);
    } else {
      admin = await User.create({
        fullName: ADMIN.fullName,
        email: ADMIN.email,
        passwordHash: ADMIN.password,
        role: "admin",
      });
      console.log("✅ Admin account created:");
      console.log(`   Email    : ${ADMIN.email}`);
      console.log(`   Password : ${ADMIN.password}`);
      console.log(`   Role     : admin\n`);
    }

    // ── Tournaments ────────────────────────────────────────────
    console.log("🏆 Creating tournaments...\n");

    for (const t of TOURNAMENTS) {
      const existing = await Tournament.findOne({ name: t.name });
      if (existing) {
        console.log(`⚠️  Already exists: ${t.name} (invite: ${existing.inviteCode})`);
        continue;
      }

      const tournament = await Tournament.create({
        ...t,
        createdBy: admin._id,
      });

      console.log(`✅ ${tournament.name}`);
      console.log(`   Sport      : ${tournament.sport}`);
      console.log(`   Slots      : ${tournament.teamSlots}`);
      console.log(`   Invite Code: ${tournament.inviteCode}`);
      console.log(`   Status     : ${tournament.status}`);
      console.log(`   Visibility : ${tournament.visibility}\n`);
    }

    console.log("─────────────────────────────────────────");
    console.log("🎉 Seed complete!");
    console.log("─────────────────────────────────────────");
    console.log(`\n🔑 Login credentials:`);
    console.log(`   Email    : ${ADMIN.email}`);
    console.log(`   Password : ${ADMIN.password}`);
    console.log(`\n🌐 Backend URL: ${process.env.CLIENT_URL || "http://localhost:5000"}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
