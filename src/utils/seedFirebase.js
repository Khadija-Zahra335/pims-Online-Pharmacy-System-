/**
 * SEED SCRIPT — Run this ONCE to populate Firebase with demo data.
 *
 * HOW TO USE:
 * 1. npm install firebase
 * 2. Fill in your firebaseConfig below (same as src/firebase.js)
 * 3. node src/utils/seedFirebase.js
 */

const { initializeApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
} = require("firebase/auth");
const {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  Timestamp,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyD42QTI74FF-z6QNxNdY7A0fsFg0j7vb4w",
  authDomain: "pims-pharmacy.firebaseapp.com",
  projectId: "pims-pharmacy",
  storageBucket: "pims-pharmacy.firebasestorage.app",
  messagingSenderId: "1049395499799",
  appId: "1:1049395499799:web:dfd7bc940a30523032dd52",
  measurementId: "G-0WG5NTWZ9Q"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const daysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return Timestamp.fromDate(d);
};

const DEMO_USERS = [
  {
    email: "manager@pims.com",
    password: "Manager@123",
    role: "manager",
    name: "Pharmacy Manager",
  },
  {
    email: "cashier@pims.com",
    password: "Cashier@123",
    role: "cashier",
    name: "Front Desk Cashier",
  },
  {
    email: "admin@pims.com",
    password: "Admin@123",
    role: "admin",
    name: "System Admin",
  },
];

const DEMO_MEDICINES = [
  {
    name: "Paracetamol 500mg",
    genericName: "Acetaminophen",
    category: "Analgesic",
    manufacturer: "GSK Pakistan",
    batchNumber: "BATCH-001",
    sku: "MED-001",
    quantity: 500,
    unitPrice: 15,
    reorderLevel: 100,
    expiryDate: daysFromNow(180),
    barcode: "1234567890001",
    alternatives: ["Panadol 500mg", "Calpol 500mg"],
    salesHistory: [45, 52, 38, 60, 55, 70, 48, 65, 72, 58, 80, 62],
  },
  {
    name: "Amoxicillin 250mg",
    genericName: "Amoxicillin",
    category: "Antibiotic",
    manufacturer: "Sami Pharmaceuticals",
    batchNumber: "BATCH-002",
    sku: "MED-002",
    quantity: 200,
    unitPrice: 45,
    reorderLevel: 50,
    expiryDate: daysFromNow(25),
    barcode: "1234567890002",
    alternatives: ["Amoxil 250mg", "Trimox 250mg"],
    salesHistory: [20, 18, 22, 25, 19, 30, 15, 28, 32, 22, 26, 20],
  },
  {
    name: "Metformin 500mg",
    genericName: "Metformin HCl",
    category: "Antidiabetic",
    manufacturer: "Ferozsons Labs",
    batchNumber: "BATCH-003",
    sku: "MED-003",
    quantity: 350,
    unitPrice: 30,
    reorderLevel: 80,
    expiryDate: daysFromNow(365),
    barcode: "1234567890003",
    alternatives: ["Glucophage 500mg"],
    salesHistory: [35, 40, 38, 42, 36, 45, 39, 43, 48, 41, 50, 44],
  },
  {
    name: "Omeprazole 20mg",
    genericName: "Omeprazole",
    category: "Antacid",
    manufacturer: "Abbott Pakistan",
    batchNumber: "BATCH-004",
    sku: "MED-004",
    quantity: 15,
    unitPrice: 55,
    reorderLevel: 60,
    expiryDate: daysFromNow(200),
    barcode: "1234567890004",
    alternatives: ["Losec 20mg", "Prilosec 20mg"],
    salesHistory: [28, 32, 29, 35, 30, 38, 26, 34, 40, 31, 36, 33],
  },
  {
    name: "Atorvastatin 10mg",
    genericName: "Atorvastatin",
    category: "Statin",
    manufacturer: "Pfizer Pakistan",
    batchNumber: "BATCH-005",
    sku: "MED-005",
    quantity: 280,
    unitPrice: 85,
    reorderLevel: 70,
    expiryDate: daysFromNow(85),
    barcode: "1234567890005",
    alternatives: ["Lipitor 10mg", "Sortis 10mg"],
    salesHistory: [22, 25, 24, 27, 23, 30, 21, 28, 33, 26, 29, 25],
  },
  {
    name: "Cetirizine 10mg",
    genericName: "Cetirizine HCl",
    category: "Antihistamine",
    manufacturer: "Searle Pakistan",
    batchNumber: "BATCH-006",
    sku: "MED-006",
    quantity: 400,
    unitPrice: 20,
    reorderLevel: 100,
    expiryDate: daysFromNow(300),
    barcode: "1234567890006",
    alternatives: ["Zyrtec 10mg", "Reactine 10mg"],
    salesHistory: [50, 65, 48, 70, 80, 95, 55, 72, 85, 60, 90, 75],
  },
  {
    name: "Aspirin 75mg",
    genericName: "Acetylsalicylic Acid",
    category: "Antiplatelet",
    manufacturer: "Bayer Pakistan",
    batchNumber: "BATCH-007",
    sku: "MED-007",
    quantity: 0,
    unitPrice: 12,
    reorderLevel: 150,
    expiryDate: daysFromNow(500),
    barcode: "1234567890007",
    alternatives: ["Cardiprin 75mg", "Ecosprin 75mg"],
    salesHistory: [60, 55, 70, 65, 58, 72, 62, 68, 75, 63, 78, 70],
  },
  {
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    category: "NSAID",
    manufacturer: "Highnoon Laboratories",
    batchNumber: "BATCH-008",
    sku: "MED-008",
    quantity: 320,
    unitPrice: 25,
    reorderLevel: 100,
    expiryDate: daysFromNow(150),
    barcode: "1234567890008",
    alternatives: ["Brufen 400mg", "Advil 400mg"],
    salesHistory: [40, 45, 42, 48, 44, 52, 38, 46, 55, 43, 50, 47],
  },
];

const DEMO_SUPPLIERS = [
  {
    name: "MedLine Distributors",
    contact: "Ali Hassan",
    phone: "+92-42-111-555-666",
    email: "orders@medline.com.pk",
    address: "Ferozepur Road, Lahore",
    leadTimeDays: 3,
    medicines: ["Paracetamol 500mg", "Ibuprofen 400mg"],
  },
  {
    name: "PharmaCo Wholesale",
    contact: "Sara Khan",
    phone: "+92-21-111-222-333",
    email: "supply@pharmaco.pk",
    address: "Clifton, Karachi",
    leadTimeDays: 5,
    medicines: ["Amoxicillin 250mg", "Cetirizine 10mg"],
  },
  {
    name: "National Drug House",
    contact: "Tariq Mahmood",
    phone: "+92-51-111-888-999",
    email: "info@ndh.com.pk",
    address: "Blue Area, Islamabad",
    leadTimeDays: 2,
    medicines: ["Metformin 500mg", "Atorvastatin 10mg"],
  },
];

async function seed() {
  console.log("🌱 Seeding Firebase...\n");

  // Create users
  for (const user of DEMO_USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );
      await setDoc(doc(db, "users", cred.user.uid), {
        email: user.email,
        role: user.role,
        name: user.name,
        createdAt: Timestamp.now(),
      });
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        console.log(`⚠️  User already exists: ${user.email}`);
      } else {
        console.error(`❌ Error creating ${user.email}:`, err.message);
      }
    }
  }

  // Add medicines
  console.log("\n📦 Adding medicines...");
  for (const med of DEMO_MEDICINES) {
    await addDoc(collection(db, "medicines"), {
      ...med,
      createdAt: Timestamp.now(),
    });
    console.log(`✅ Added: ${med.name}`);
  }

  // Add suppliers
  console.log("\n🚚 Adding suppliers...");
  for (const sup of DEMO_SUPPLIERS) {
    await addDoc(collection(db, "suppliers"), {
      ...sup,
      createdAt: Timestamp.now(),
    });
    console.log(`✅ Added supplier: ${sup.name}`);
  }

  console.log("\n🎉 Seeding complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("DEMO CREDENTIALS:");
  console.log("Manager  → manager@pims.com  / Manager@123");
  console.log("Cashier  → cashier@pims.com  / Cashier@123");
  console.log("Admin    → admin@pims.com    / Admin@123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  process.exit(0);
}

seed().catch(console.error);
