/**
 * ArenaX Seed Script
 * Creates 1 admin account + 12 tournaments with different sports
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

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const TOURNAMENTS = [
  {
    name: "Spring Football Championship",
    sport: "Football",
    description: "The biggest inter-college football tournament of the spring season featuring 16 elite squads.",
    teamSlots: 16,
    startDate: daysFromNow(7),
    registrationDeadline: daysFromNow(3),
    estimatedMatchDuration: "90 minutes",
    visibility: "public",
  },
  {
    name: "Campus Basketball Showdown",
    sport: "Basketball",
    description: "Fast-paced 5v5 hardcourt action — eight teams battling for the campus crown.",
    teamSlots: 8,
    startDate: daysFromNow(-2),
    registrationDeadline: daysFromNow(-5),
    estimatedMatchDuration: "60 minutes",
    visibility: "public",
  },
  {
    name: "University Tennis Open",
    sport: "Tennis",
    description: "Singles knockout bracket open to all enrolled students. Best-of-three sets format.",
    teamSlots: 16,
    startDate: daysFromNow(14),
    registrationDeadline: daysFromNow(10),
    estimatedMatchDuration: "75 minutes",
    visibility: "public",
  },
  {
    name: "Volleyball Beach Classic",
    sport: "Volleyball",
    description: "6v6 indoor volleyball tournament — all divisions welcome. Sets-based scoring.",
    teamSlots: 8,
    startDate: daysFromNow(21),
    registrationDeadline: daysFromNow(14),
    estimatedMatchDuration: "60 minutes",
    visibility: "public",
  },
  {
    name: "Inter-Hall Cricket League",
    sport: "Cricket",
    description: "T20-format cricket league between residence halls. Crown your hall champion.",
    teamSlots: 8,
    startDate: daysFromNow(-30),
    registrationDeadline: daysFromNow(-35),
    estimatedMatchDuration: "180 minutes",
    visibility: "public",
  },
  {
    name: "Badminton Doubles Cup",
    sport: "Badminton",
    description: "Mixed doubles knockout — fast rallies, big upsets. Sign up with a partner.",
    teamSlots: 16,
    startDate: daysFromNow(10),
    registrationDeadline: daysFromNow(5),
    estimatedMatchDuration: "45 minutes",
    visibility: "public",
  },
  {
    name: "Winter Football League",
    sport: "Football",
    description: "Cold season championship — indoor football 7v7 format with high-speed action.",
    teamSlots: 16,
    startDate: daysFromNow(35),
    registrationDeadline: daysFromNow(28),
    estimatedMatchDuration: "75 minutes",
    visibility: "public",
  },
  {
    name: "Basketball 3v3 Street Tournament",
    sport: "Basketball",
    description: "Fast-paced street ball tournament — three-on-three teams compete for glory.",
    teamSlots: 16,
    startDate: daysFromNow(42),
    registrationDeadline: daysFromNow(35),
    estimatedMatchDuration: "45 minutes",
    visibility: "public",
  },
  {
    name: "Tennis Doubles Championship",
    sport: "Tennis",
    description: "Doubles format tennis tournament — team up and dominate the court.",
    teamSlots: 16,
    startDate: daysFromNow(20),
    registrationDeadline: daysFromNow(15),
    estimatedMatchDuration: "90 minutes",
    visibility: "public",
  },
  {
    name: "Summer Volleyball Pro Cup",
    sport: "Volleyball",
    description: "Elite-level 6v6 volleyball championship with professional-grade courts.",
    teamSlots: 16,
    startDate: daysFromNow(56),
    registrationDeadline: daysFromNow(49),
    estimatedMatchDuration: "75 minutes",
    visibility: "public",
  },
  {
    name: "Campus Cricket One-Day Cup",
    sport: "Cricket",
    description: "50-over cricket format tournament featuring the best campus teams.",
    teamSlots: 8,
    startDate: daysFromNow(18),
    registrationDeadline: daysFromNow(12),
    estimatedMatchDuration: "240 minutes",
    visibility: "public",
  },
  {
    name: "Badminton Singles Knockout",
    sport: "Badminton",
    description: "Individual singles knockout championship — showcase your solo skills on the court.",
    teamSlots: 16,
    startDate: daysFromNow(28),
    registrationDeadline: daysFromNow(21),
    estimatedMatchDuration: "40 minutes",
    visibility: "public",
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

    let createdCount = 0;
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

      createdCount++;
      console.log(`✅ ${tournament.name}`);
      console.log(`   Sport      : ${tournament.sport}`);
      console.log(`   Slots      : ${tournament.teamSlots}`);
      console.log(`   Start Date : ${tournament.startDate.toDateString()}`);
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
    console.log(`\n📊 Tournaments Created: ${createdCount}/${TOURNAMENTS.length}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();