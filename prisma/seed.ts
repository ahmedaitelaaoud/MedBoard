import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MedBoard database...");

  // ─── Floors ────────────────────────────────────────────────────────────────
  const floors = await Promise.all([
    prisma.floor.create({ data: { name: "Ground Floor", number: 0 } }),
    prisma.floor.create({ data: { name: "1st Floor", number: 1 } }),
    prisma.floor.create({ data: { name: "2nd Floor", number: 2 } }),
  ]);
  console.log(`  ✓ ${floors.length} floors`);

  // ─── Wards ─────────────────────────────────────────────────────────────────
  const wards = await Promise.all([
    prisma.ward.create({ data: { name: "General Medicine", code: "GENMED" } }),
    prisma.ward.create({ data: { name: "Cardiology", code: "CARD" } }),
    prisma.ward.create({ data: { name: "Pediatrics", code: "PED" } }),
    prisma.ward.create({ data: { name: "Surgery", code: "SURG" } }),
  ]);
  console.log(`  ✓ ${wards.length} wards`);

  // ─── Rooms ─────────────────────────────────────────────────────────────────
  const roomDefs: { number: string; floorIdx: number; wardIdx: number; status: string }[] = [
    // Ground floor — General Medicine (10 rooms)
    { number: "G01", floorIdx: 0, wardIdx: 0, status: "OCCUPIED" },
    { number: "G02", floorIdx: 0, wardIdx: 0, status: "OCCUPIED" },
    { number: "G03", floorIdx: 0, wardIdx: 0, status: "EMPTY" },
    { number: "G04", floorIdx: 0, wardIdx: 0, status: "CRITICAL" },
    { number: "G05", floorIdx: 0, wardIdx: 0, status: "OCCUPIED" },
    { number: "G06", floorIdx: 0, wardIdx: 0, status: "DISCHARGE_READY" },
    { number: "G07", floorIdx: 0, wardIdx: 0, status: "EMPTY" },
    { number: "G08", floorIdx: 0, wardIdx: 1, status: "OCCUPIED" },
    { number: "G09", floorIdx: 0, wardIdx: 1, status: "UNDER_OBSERVATION" },
    { number: "G10", floorIdx: 0, wardIdx: 1, status: "EMPTY" },
    // 1st floor — Cardiology & Surgery (10 rooms)
    { number: "101", floorIdx: 1, wardIdx: 1, status: "OCCUPIED" },
    { number: "102", floorIdx: 1, wardIdx: 1, status: "CRITICAL" },
    { number: "103", floorIdx: 1, wardIdx: 1, status: "OCCUPIED" },
    { number: "104", floorIdx: 1, wardIdx: 3, status: "EMPTY" },
    { number: "105", floorIdx: 1, wardIdx: 3, status: "OCCUPIED" },
    { number: "106", floorIdx: 1, wardIdx: 3, status: "UNDER_OBSERVATION" },
    { number: "107", floorIdx: 1, wardIdx: 3, status: "OCCUPIED" },
    { number: "108", floorIdx: 1, wardIdx: 1, status: "EMPTY" },
    { number: "109", floorIdx: 1, wardIdx: 3, status: "DISCHARGE_READY" },
    { number: "110", floorIdx: 1, wardIdx: 3, status: "UNAVAILABLE" },
    // 2nd floor — Pediatrics & General (10 rooms)
    { number: "201", floorIdx: 2, wardIdx: 2, status: "OCCUPIED" },
    { number: "202", floorIdx: 2, wardIdx: 2, status: "OCCUPIED" },
    { number: "203", floorIdx: 2, wardIdx: 2, status: "EMPTY" },
    { number: "204", floorIdx: 2, wardIdx: 2, status: "UNDER_OBSERVATION" },
    { number: "205", floorIdx: 2, wardIdx: 0, status: "OCCUPIED" },
    { number: "206", floorIdx: 2, wardIdx: 0, status: "EMPTY" },
    { number: "207", floorIdx: 2, wardIdx: 0, status: "CRITICAL" },
    { number: "208", floorIdx: 2, wardIdx: 2, status: "OCCUPIED" },
    { number: "209", floorIdx: 2, wardIdx: 0, status: "DISCHARGE_READY" },
    { number: "210", floorIdx: 2, wardIdx: 0, status: "EMPTY" },
  ];

  const rooms = await Promise.all(
    roomDefs.map((r) =>
      prisma.room.create({
        data: {
          number: r.number,
          floorId: floors[r.floorIdx].id,
          wardId: wards[r.wardIdx].id,
          status: r.status,
        },
      })
    )
  );
  console.log(`  ✓ ${rooms.length} rooms`);

  // ─── Users ─────────────────────────────────────────────────────────────────
  const users = await Promise.all([
    // Doctors
    prisma.user.create({ data: { email: "dr.amrani@medboard.local", password: "demo123", firstName: "Youssef", lastName: "Amrani", role: "DOCTOR", specialty: "Cardiologist", isAvailable: true } }),
    prisma.user.create({ data: { email: "dr.benkirane@medboard.local", password: "demo123", firstName: "Fatima", lastName: "Benkirane", role: "DOCTOR", specialty: "General Surgeon", isAvailable: false } }),
    prisma.user.create({ data: { email: "dr.elhassan@medboard.local", password: "demo123", firstName: "Omar", lastName: "El Hassan", role: "DOCTOR", specialty: "Pediatrician", isAvailable: true } }),
    prisma.user.create({ data: { email: "dr.tazi@medboard.local", password: "demo123", firstName: "Khadija", lastName: "Tazi", role: "DOCTOR", specialty: "Neurologist", isAvailable: false } }),
    // Nurses
    prisma.user.create({ data: { email: "n.benali@medboard.local", password: "demo123", firstName: "Amina", lastName: "Benali", role: "NURSE" } }),
    prisma.user.create({ data: { email: "n.idrissi@medboard.local", password: "demo123", firstName: "Rachid", lastName: "Idrissi", role: "NURSE" } }),
    prisma.user.create({ data: { email: "n.chraibi@medboard.local", password: "demo123", firstName: "Salma", lastName: "Chraibi", role: "NURSE" } }),
    prisma.user.create({ data: { email: "n.lahlou@medboard.local", password: "demo123", firstName: "Hassan", lastName: "Lahlou", role: "NURSE" } }),
    // Admins
    prisma.user.create({ data: { email: "admin@medboard.local", password: "demo123", firstName: "Nadia", lastName: "Ziani", role: "ADMIN" } }),
    prisma.user.create({ data: { email: "admin2@medboard.local", password: "demo123", firstName: "Mehdi", lastName: "Bouchta", role: "ADMIN" } }),
    // Read-only
    prisma.user.create({ data: { email: "viewer@medboard.local", password: "demo123", firstName: "Sara", lastName: "Mouline", role: "READONLY" } }),
    prisma.user.create({ data: { email: "viewer2@medboard.local", password: "demo123", firstName: "Amine", lastName: "Fassi", role: "READONLY" } }),
  ]);
  console.log(`  ✓ ${users.length} users`);

  const doctors = users.filter((u) => u.role === "DOCTOR");
  const nurses = users.filter((u) => u.role === "NURSE");

  // ─── Patients ──────────────────────────────────────────────────────────────
  const occupiedRooms = rooms.filter((r) => ["OCCUPIED", "CRITICAL", "DISCHARGE_READY", "UNDER_OBSERVATION"].includes(
    roomDefs.find((rd) => rd.number === r.number)!.status
  ));

  const patientDefs = [
    { firstName: "Ahmed", lastName: "Benjelloun", sex: "MALE", dob: "1958-03-15", height: 175, weight: 82, allergies: "Penicillin", status: "CRITICAL", emergency: "Mounir Benjelloun", emergPhone: "+212 661-123456" },
    { firstName: "Fatima Zahra", lastName: "Kettani", sex: "FEMALE", dob: "1972-07-22", height: 162, weight: 68, allergies: null, status: "ADMITTED", emergency: "Hassan Kettani", emergPhone: "+212 662-234567" },
    { firstName: "Mohammed", lastName: "Alaoui", sex: "MALE", dob: "1985-11-03", height: 180, weight: 90, allergies: "Sulfa drugs", status: "UNDER_OBSERVATION", emergency: "Laila Alaoui", emergPhone: "+212 663-345678" },
    { firstName: "Zineb", lastName: "Fassi Fihri", sex: "FEMALE", dob: "1990-01-28", height: 158, weight: 55, allergies: null, status: "STABLE", emergency: "Karim Fassi Fihri", emergPhone: "+212 664-456789" },
    { firstName: "Abdelkader", lastName: "Cherkaoui", sex: "MALE", dob: "1945-09-10", height: 170, weight: 75, allergies: "Aspirin, Iodine", status: "CRITICAL", emergency: "Nadia Cherkaoui", emergPhone: "+212 665-567890" },
    { firstName: "Houda", lastName: "Berrada", sex: "FEMALE", dob: "1968-04-17", height: 165, weight: 72, allergies: null, status: "DISCHARGE_READY", emergency: "Samir Berrada", emergPhone: "+212 666-678901" },
    { firstName: "Yassine", lastName: "El Idrissi", sex: "MALE", dob: "2015-06-30", height: 120, weight: 28, allergies: "Nuts", status: "ADMITTED", emergency: "Rachida El Idrissi", emergPhone: "+212 667-789012" },
    { firstName: "Khadija", lastName: "Bennani", sex: "FEMALE", dob: "1955-12-05", height: 155, weight: 65, allergies: null, status: "UNDER_OBSERVATION", emergency: "Driss Bennani", emergPhone: "+212 668-890123" },
    { firstName: "Rachid", lastName: "Ouazzani", sex: "MALE", dob: "1978-08-19", height: 178, weight: 88, allergies: "Latex", status: "ADMITTED", emergency: "Souad Ouazzani", emergPhone: "+212 669-901234" },
    { firstName: "Nora", lastName: "Tlemcani", sex: "FEMALE", dob: "1982-02-14", height: 160, weight: 58, allergies: null, status: "STABLE", emergency: "Omar Tlemcani", emergPhone: "+212 670-012345" },
    { firstName: "Ibrahim", lastName: "Sqalli", sex: "MALE", dob: "2020-03-25", height: 95, weight: 15, allergies: null, status: "ADMITTED", emergency: "Meryem Sqalli", emergPhone: "+212 671-123456" },
    { firstName: "Samira", lastName: "Benhima", sex: "FEMALE", dob: "1963-10-08", height: 168, weight: 78, allergies: "Codeine", status: "DISCHARGE_READY", emergency: "Aziz Benhima", emergPhone: "+212 672-234567" },
    { firstName: "Mouad", lastName: "Filali", sex: "MALE", dob: "1995-05-11", height: 183, weight: 85, allergies: null, status: "ADMITTED", emergency: "Halima Filali", emergPhone: "+212 673-345678" },
    { firstName: "Leila", lastName: "Naciri", sex: "FEMALE", dob: "1988-09-27", height: 157, weight: 52, allergies: "Shellfish", status: "UNDER_OBSERVATION", emergency: "Jamal Naciri", emergPhone: "+212 674-456789" },
    { firstName: "Hamza", lastName: "Bouazza", sex: "MALE", dob: "1970-01-02", height: 172, weight: 80, allergies: null, status: "ADMITTED", emergency: "Naima Bouazza", emergPhone: "+212 675-567890" },
    { firstName: "Imane", lastName: "Rahmouni", sex: "FEMALE", dob: "2018-11-15", height: 108, weight: 20, allergies: null, status: "ADMITTED", emergency: "Tariq Rahmouni", emergPhone: "+212 676-678901" },
    { firstName: "Driss", lastName: "Mernissi", sex: "MALE", dob: "1952-07-30", height: 169, weight: 73, allergies: "NSAIDs", status: "DISCHARGE_READY", emergency: "Soumia Mernissi", emergPhone: "+212 677-789012" },
    { firstName: "Asmae", lastName: "Guessous", sex: "FEMALE", dob: "1975-04-22", height: 163, weight: 67, allergies: null, status: "CRITICAL", emergency: "Khalid Guessous", emergPhone: "+212 678-890123" },
  ];

  const patients = [];
  for (let i = 0; i < patientDefs.length; i++) {
    const p = patientDefs[i];
    const room = i < occupiedRooms.length ? occupiedRooms[i] : null;
    const patient = await prisma.patient.create({
      data: {
        patientCode: `PAT-${String(i + 1).padStart(5, "0")}`,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: new Date(p.dob),
        sex: p.sex,
        height: p.height,
        weight: p.weight,
        allergies: p.allergies,
        emergencyContact: p.emergency,
        emergencyPhone: p.emergPhone,
        status: p.status,
        admissionDate: new Date(Date.now() - Math.floor(Math.random() * 14) * 86400000),
        roomId: room?.id ?? null,
      },
    });
    patients.push(patient);
  }
  console.log(`  ✓ ${patients.length} patients`);

  // ─── Medical Records ───────────────────────────────────────────────────────
  const diagnoses = [
    { summary: "Acute myocardial infarction, anterior wall", history: "History of hypertension for 15 years, type 2 diabetes. Previous angioplasty in 2019.", plan: "Cardiac monitoring, dual antiplatelet therapy, cardiology consult for possible catheterization." },
    { summary: "Community-acquired pneumonia, moderate severity", history: "No significant past medical history. Non-smoker.", plan: "IV antibiotics (amoxicillin-clavulanate), chest physiotherapy, follow-up chest X-ray in 48h." },
    { summary: "Post-operative monitoring — laparoscopic cholecystectomy", history: "Recurrent biliary colic over 6 months. No prior surgeries.", plan: "Post-op monitoring, pain management, advance diet as tolerated, discharge in 24-48h." },
    { summary: "Type 2 diabetes with poor glycemic control, DKA resolved", history: "Diagnosed with T2DM 8 years ago. Non-compliant with medications. HbA1c 11.2%.", plan: "Insulin sliding scale, endocrinology consult, diabetes education, medication reconciliation." },
    { summary: "Cerebrovascular accident — right MCA territory", history: "Atrial fibrillation diagnosed 3 years ago, not on anticoagulation. Hypertension.", plan: "Neurology follow-up, anticoagulation initiation, speech therapy, physical rehabilitation assessment." },
    { summary: "Hip fracture — right intertrochanteric, post-ORIF", history: "Osteoporosis. Fall at home. Lives alone.", plan: "Post-operative rehabilitation, DVT prophylaxis, calcium/vitamin D supplementation, social work consult for discharge planning." },
    { summary: "Acute bronchiolitis", history: "Previously healthy child. No prior hospitalizations.", plan: "Supportive care, oxygen supplementation PRN, hydration monitoring, reassess in 24h." },
    { summary: "Congestive heart failure exacerbation, NYHA III", history: "Known CHF with EF 30%. Previous admission 3 months ago. Non-compliant with fluid restriction.", plan: "IV diuretics, daily weights, fluid restriction 1.5L/day, cardiology follow-up, medication optimization." },
    { summary: "Appendicitis — post-appendectomy day 1", history: "No significant past medical history.", plan: "Post-op monitoring, advance to regular diet, pain management, discharge expected tomorrow." },
    { summary: "Iron-deficiency anemia under investigation", history: "Progressive fatigue over 3 months. Hb 7.2 g/dL on admission.", plan: "Iron infusion, GI consult for endoscopy, transfuse if Hb drops below 7, monitor vitals." },
    { summary: "Febrile seizure, resolved", history: "First episode. Development milestones normal.", plan: "Observation 24h, antipyretics, parental education, neurology consult if recurrence." },
    { summary: "COPD exacerbation with acute respiratory failure", history: "30-pack-year smoking history. Previous ICU admission for COPD 2 years ago.", plan: "Bronchodilators, systemic steroids, antibiotics, non-invasive ventilation PRN, pulmonology consult." },
    { summary: "Motorcycle accident — multiple contusions, rib fractures", history: "Previously healthy young man.", plan: "Pain management, serial chest X-rays, respiratory physiotherapy, surgical consult if pneumothorax develops." },
    { summary: "Pre-eclampsia at 34 weeks gestation", history: "First pregnancy. No prior medical conditions.", plan: "Blood pressure monitoring q4h, magnesium sulfate, fetal monitoring, obstetrics lead, delivery planning." },
    { summary: "Chronic kidney disease stage 4, acute-on-chronic deterioration", history: "Hypertensive nephropathy. eGFR 18. On conservative management.", plan: "Fluid management, electrolyte correction, nephrology consult for dialysis access planning." },
    { summary: "Gastroenteritis with dehydration", history: "Daycare exposure. Previously healthy child.", plan: "IV rehydration, electrolyte monitoring, advance oral intake as tolerated." },
    { summary: "Atrial fibrillation with rapid ventricular response", history: "Known paroxysmal AF. Previously on flecainide, self-discontinued.", plan: "Rate control with beta-blockers, anticoagulation assessment (CHA2DS2-VASc), rhythm vs rate control discussion." },
    { summary: "Pulmonary embolism, sub-massive", history: "Recent long-haul flight. Oral contraceptive use. No prior VTE.", plan: "Therapeutic anticoagulation (LMWH bridging to DOAC), echocardiography, consider thrombophilia workup." },
  ];

  for (let i = 0; i < patients.length; i++) {
    await prisma.medicalRecord.create({
      data: {
        patientId: patients[i].id,
        diagnosisSummary: diagnoses[i].summary,
        medicalHistory: diagnoses[i].history,
        currentPlan: diagnoses[i].plan,
      },
    });
  }
  console.log(`  ✓ ${patients.length} medical records`);

  // ─── Assignments ───────────────────────────────────────────────────────────
  for (let i = 0; i < patients.length; i++) {
    const primaryDoctor = doctors[i % doctors.length];
    const consultingDoctor = doctors[(i + 1) % doctors.length];

    await prisma.assignment.create({
      data: {
        patientId: patients[i].id,
        doctorId: primaryDoctor.id,
        role: "PRIMARY",
        active: true,
      },
    });

    // Add a second doctor assignment for part of the patients.
    if (i % 3 === 0 && consultingDoctor.id !== primaryDoctor.id) {
      await prisma.assignment.create({
        data: {
          patientId: patients[i].id,
          doctorId: consultingDoctor.id,
          role: "CONSULTING",
          active: true,
        },
      });
    }
  }
  console.log(`  ✓ doctor assignments created (no nurse assignments)`);

  // ─── Notes ─────────────────────────────────────────────────────────────────
  const noteContents = [
    { type: "ADMISSION", content: "Patient admitted via emergency department. Initial assessment completed. Vitals stable on arrival. IV access established." },
    { type: "PROGRESS", content: "Morning rounds: Patient reports improved pain. Vital signs within normal limits. Appetite improving. Continue current management." },
    { type: "OBSERVATION", content: "Vitals checked: BP 130/85, HR 78, Temp 37.1°C, SpO2 97% on room air. Patient resting comfortably." },
    { type: "PROGRESS", content: "Lab results reviewed. CBC and CMP within acceptable range. Adjusted medication dosing per pharmacy recommendations." },
    { type: "PROCEDURE", content: "Wound dressing changed. Surgical site clean, no signs of infection. Drain output 50ml in last 24h." },
    { type: "CONSULTATION", content: "Cardiology consult completed. Recommend stress test as outpatient after discharge. Agree with current medication regimen." },
    { type: "PROGRESS", content: "Patient ambulating with assistance. Physical therapy session completed. Good progress in mobility." },
    { type: "OBSERVATION", content: "Evening assessment: Patient sleeping. Vitals stable. IV fluids running at prescribed rate. No complaints." },
    { type: "DISCHARGE", content: "Discharge planning initiated. Patient and family educated on medication schedule and follow-up appointments." },
    { type: "PROGRESS", content: "Imaging results reviewed. No acute findings. Continue conservative management and monitoring." },
  ];

  const records = await prisma.medicalRecord.findMany();
  let noteCount = 0;
  for (const record of records) {
    const numNotes = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numNotes; j++) {
      const n = noteContents[(noteCount + j) % noteContents.length];
      const authorRole = n.type === "OBSERVATION" ? nurses : doctors;
      await prisma.note.create({
        data: {
          medicalRecordId: record.id,
          authorId: authorRole[Math.floor(Math.random() * authorRole.length)].id,
          type: n.type,
          content: n.content,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000 - Math.floor(Math.random() * 86400000)),
        },
      });
      noteCount++;
    }
  }
  console.log(`  ✓ ${noteCount} notes`);

  // ─── Activity Log ──────────────────────────────────────────────────────────
  const activities = [
    { action: "PATIENT_ADMITTED", details: "Patient admitted to ward" },
    { action: "NOTE_CREATED", details: "Progress note added" },
    { action: "RECORD_UPDATED", details: "Medical record updated" },
    { action: "STATUS_CHANGED", details: "Patient status changed" },
    { action: "ROOM_ASSIGNED", details: "Patient assigned to room" },
    { action: "NOTE_CREATED", details: "Observation note added" },
    { action: "ASSIGNMENT_CHANGED", details: "Staff assignment updated" },
    { action: "RECORD_UPDATED", details: "Diagnosis summary updated" },
  ];

  for (let i = 0; i < 30; i++) {
    const a = activities[i % activities.length];
    const user = users[Math.floor(Math.random() * users.length)];
    const patient = patients[Math.floor(Math.random() * patients.length)];
    await prisma.activityLog.create({
      data: {
        action: a.action,
        userId: user.id,
        patientId: patient.id,
        details: `${user.firstName} ${user.lastName}: ${a.details} for ${patient.firstName} ${patient.lastName}`,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 3) * 86400000 - Math.floor(Math.random() * 86400000)),
      },
    });
  }
  console.log(`  ✓ 30 activity log entries`);

  // ─── Documents (placeholders) ──────────────────────────────────────────────
  const docTypes = ["lab_report", "imaging", "consent", "prescription"];
  for (let i = 0; i < 5; i++) {
    await prisma.document.create({
      data: {
        name: `${docTypes[i % docTypes.length]}_${i + 1}.pdf`,
        type: docTypes[i % docTypes.length],
        patientId: patients[i].id,
        uploadedBy: doctors[i % doctors.length].id,
      },
    });
  }
  console.log(`  ✓ 5 document placeholders`);

  // ─── Tasks ─────────────────────────────────────────────────────────────────
  const taskDefs = [
    { title: "Check vitals every 2 hours", description: "Monitor BP, HR, SpO2 and temperature. Alert if BP > 160/100 or HR > 110.", priority: "HIGH", status: "PENDING", patientIdx: 0, doctorIdx: 0, nurseIdx: 0 },
    { title: "Administer IV antibiotics", description: "Amoxicillin-clavulanate 1.2g IV at 14:00 and 22:00. Check for allergic reactions.", priority: "HIGH", status: "PENDING", patientIdx: 1, doctorIdx: 0, nurseIdx: 1 },
    { title: "Post-op wound check", description: "Inspect surgical site for signs of infection. Change dressing if saturated.", priority: "NORMAL", status: "IN_PROGRESS", patientIdx: 2, doctorIdx: 1, nurseIdx: 0 },
    { title: "Prepare discharge paperwork", description: "Complete discharge summary and medication reconciliation for patient.", priority: "LOW", status: "PENDING", patientIdx: 5, doctorIdx: 1, nurseIdx: 2 },
    { title: "Blood glucose monitoring", description: "Finger-prick glucose readings before meals and at bedtime. Target 5-10 mmol/L.", priority: "NORMAL", status: "PENDING", patientIdx: 3, doctorIdx: 0, nurseIdx: 1 },
    { title: "Mobilization assessment", description: "Assist patient with supervised walking. Document distance and any difficulty.", priority: "NORMAL", status: "COMPLETED", patientIdx: 8, doctorIdx: 2, nurseIdx: 3 },
    { title: "Administer pain medication PRN", description: "Paracetamol 1g PO if pain score > 4. Maximum 4g in 24 hours.", priority: "NORMAL", status: "PENDING", patientIdx: 4, doctorIdx: 2, nurseIdx: 2 },
    { title: "Oxygen saturation monitoring", description: "Continuous SpO2 monitoring. Titrate O2 to maintain SpO2 > 94%. Escalate if desaturation below 90%.", priority: "HIGH", status: "IN_PROGRESS", patientIdx: 7, doctorIdx: 3, nurseIdx: 0 },
    { title: "Fluid balance chart", description: "Strict input/output monitoring. Target positive balance of 500ml/24h.", priority: "NORMAL", status: "PENDING", patientIdx: 9, doctorIdx: 3, nurseIdx: 3 },
    { title: "Neurological observations", description: "GCS assessment every 4 hours. Check pupil reactivity and limb movements.", priority: "HIGH", status: "PENDING", patientIdx: 4, doctorIdx: 3, nurseIdx: 1 },
    { title: "Arrange physiotherapy consult", description: "Contact PT department for bedside assessment. Patient needs mobility plan.", priority: "LOW", status: "COMPLETED", patientIdx: 5, doctorIdx: 1, nurseIdx: 2 },
    { title: "ECG monitoring", description: "12-lead ECG before morning rounds. Report any rhythm changes immediately.", priority: "HIGH", status: "PENDING", patientIdx: 0, doctorIdx: 0, nurseIdx: 0 },
  ];

  for (const t of taskDefs) {
    await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        patientId: patients[t.patientIdx]?.id ?? null,
        createdById: doctors[t.doctorIdx].id,
        assignedToId: nurses[t.nurseIdx].id,
        completedAt: t.status === "COMPLETED" ? new Date() : null,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 3) * 86400000),
      },
    });
  }
  console.log(`  ✓ ${taskDefs.length} tasks`);

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
