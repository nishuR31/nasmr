/**
 * Seed script — generates ~500 realistic reports around Ranchi, Jharkhand
 * Run: bun run seed
 */
import { PrismaClient, ReportCategory, ReportStatus, HotspotSeverity } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Ranchi city center: 23.3441, 85.3096
const RANCHI_CENTER = { lat: 23.3441, lng: 85.3096 };

const TEMPLATES: Array<{ text: string; category: string; severityBase: number }> = [
  { text: 'There is no drinking water supply in our locality for the past 3 weeks. Families are suffering.', category: 'WATER', severityBase: 0.85 },
  { text: 'Hamare area mein teen mahine se pani nahi aa raha hai. Bacchon ko bahut takleef ho rahi hai.', category: 'WATER', severityBase: 0.9 },
  { text: 'The road near Lalpur chowk has huge potholes. Several vehicles have been damaged.', category: 'ROAD', severityBase: 0.7 },
  { text: 'Sadak bahut kharab hai, baarish ke baad toh aur bhi bura haal ho gaya hai.', category: 'ROAD', severityBase: 0.65 },
  { text: 'Power cuts of 8-10 hours daily are affecting local businesses and hospitals.', category: 'ELECTRICITY', severityBase: 0.8 },
  { text: 'Street lights near our colony have been non-functional for 2 months. It is very unsafe at night.', category: 'ELECTRICITY', severityBase: 0.6 },
  { text: 'Drainage system is completely choked. Sewage water is overflowing into the street.', category: 'SANITATION', severityBase: 0.9 },
  { text: 'Kachre ka dhera mahino se nahi utha. Jangali janwar aa rahe hain.', category: 'SANITATION', severityBase: 0.75 },
  { text: 'Government health center has no doctor available for the past month.', category: 'HEALTHCARE', severityBase: 0.85 },
  { text: 'School building roof is leaking. Children cannot attend during rain.', category: 'EDUCATION', severityBase: 0.7 },
  { text: 'No bus service available to our village. People have to walk 8 km to reach hospital.', category: 'TRANSPORT', severityBase: 0.75 },
  { text: 'Water pipeline has burst near main road, water is being wasted for 3 days.', category: 'WATER', severityBase: 0.8 },
  { text: 'Road is blocked due to construction but no diversion sign has been placed.', category: 'ROAD', severityBase: 0.5 },
  { text: 'Electric transformer is making loud noise and sparking, very dangerous for residents.', category: 'ELECTRICITY', severityBase: 0.95 },
  { text: 'Open manholes on main street are causing accidents, especially at night.', category: 'SANITATION', severityBase: 0.88 },
];

// Clusters around specific areas of Ranchi for realistic hotspot formation
const CLUSTERS = [
  { name: 'Lalpur', center: { lat: 23.3536, lng: 85.3256 }, radius: 0.02 },
  { name: 'Ratu', center: { lat: 23.3750, lng: 85.2800 }, radius: 0.025 },
  { name: 'Namkum', center: { lat: 23.2950, lng: 85.3400 }, radius: 0.02 },
  { name: 'Kanke', center: { lat: 23.3980, lng: 85.2700 }, radius: 0.015 },
  { name: 'Doranda', center: { lat: 23.3200, lng: 85.2950 }, radius: 0.018 },
  { name: 'Hehal', center: { lat: 23.3300, lng: 85.2600 }, radius: 0.022 },
];

function randomNormal(center: number, stddev: number) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return center + z * stddev;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Seeding NASMR database with Ranchi data...');

  // Create demo users
  const hash = await bcrypt.hash('demo123', 10);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'citizen@demo.com' },
      update: {},
      create: { email: 'citizen@demo.com', name: 'Ravi Kumar', role: 'CITIZEN', password: hash },
    }),
    prisma.user.upsert({
      where: { email: 'official@demo.com' },
      update: {},
      create: { email: 'official@demo.com', name: 'Priya Singh', role: 'OFFICIAL', password: hash },
    }),
  ]);

  console.log(`✅ Created ${users.length} demo users`);

  // Generate reports clustered around Ranchi neighborhoods
  const reportData = [];
  const totalReports = 480;

  for (let i = 0; i < totalReports; i++) {
    const cluster = randomFrom(CLUSTERS);
    const template = randomFrom(TEMPLATES);
    const lat = randomNormal(cluster.center.lat, cluster.radius);
    const lng = randomNormal(cluster.center.lng, cluster.radius);
    const severity = Math.min(1, Math.max(0, template.severityBase + (Math.random() - 0.5) * 0.2));
    const daysAgo = Math.floor(Math.random() * 180); // last 6 months
    const createdAt = new Date(Date.now() - daysAgo * 86400000);

    reportData.push({
      text: template.text,
      category: template.category as ReportCategory,
      severity,
      urgency: severity * (0.8 + Math.random() * 0.2),
      status: (Math.random() > 0.2 ? 'ANALYZED' : 'PENDING') as ReportStatus,
      latitude: lat,
      longitude: lng,
      address: `${cluster.name}, Ranchi, Jharkhand`,
      userId: Math.random() > 0.3 ? users[0].id : null,
      createdAt,
      updatedAt: createdAt,
    });
  }

  // Batch insert
  await prisma.report.createMany({ data: reportData, skipDuplicates: true });
  console.log(`✅ Created ${reportData.length} reports`);

  // Create seed hotspots
  const hotspots = await Promise.all(
    CLUSTERS.map((cluster, i) => {
      const categories = ['WATER', 'ROAD', 'ELECTRICITY', 'SANITATION', 'HEALTHCARE', 'TRANSPORT'];
      return prisma.hotspot.create({
        data: {
          name: `${cluster.name} Zone`,
          category: categories[i % categories.length] as ReportCategory,
          severity: (i < 2 ? 'CRITICAL' : i < 4 ? 'HIGH' : 'MEDIUM') as HotspotSeverity,
          reportCount: Math.floor(Math.random() * 200) + 50,
          affectedPop: Math.floor(Math.random() * 5000) + 1000,
          centerLat: cluster.center.lat,
          centerLng: cluster.center.lng,
          priorityScore: Math.random() * 40 + 60,
        },
      });
    })
  );
  console.log(`✅ Created ${hotspots.length} hotspots`);

  // Create seed recommendations
  const recTemplates = [
    { title: 'Urgent Water Infrastructure Upgrade', action: 'Evaluate expansion of water supply pipeline in Lalpur Zone. Immediate tanker deployment required.' },
    { title: 'Road Resurfacing Priority Project', action: 'Commission road survey and resurfacing for Ratu Zone arterial roads. Estimated completion: 3 months.' },
    { title: 'Power Grid Stability Improvement', action: 'Install additional transformer capacity in Namkum Zone. Coordinate with JSEB for timeline.' },
    { title: 'Drainage System Overhaul', action: 'Redesign drainage network in Kanke Zone to prevent seasonal flooding and sewage overflow.' },
    { title: 'Mobile Health Unit Deployment', action: 'Deploy mobile health unit to Doranda Zone 3x weekly until permanent facility is established.' },
    { title: 'Bus Route Extension', action: 'Extend Route 14 to cover Hehal Zone outer areas. Estimated 3,200 daily beneficiaries.' },
  ];

  await Promise.all(
    hotspots.map((hotspot, i) =>
      prisma.recommendation.create({
        data: {
          hotspotId: hotspot.id,
          title: recTemplates[i].title,
          description: `Based on AI analysis of ${hotspot.reportCount} citizen reports, this area requires immediate government intervention. ${hotspot.reportCount * 4} estimated residents affected.`,
          action: recTemplates[i].action,
          priorityScore: hotspot.priorityScore,
          evidence: {
            reportCount: hotspot.reportCount,
            affectedCommunities: Math.floor(hotspot.affectedPop / 500),
            avgSeverity: 0.78,
            persistenceDays: Math.floor(Math.random() * 120) + 30,
            categories: [hotspot.category],
          },
        },
      })
    )
  );

  console.log(`✅ Created ${hotspots.length} recommendations`);
  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('   Citizen:  citizen@demo.com / demo123');
  console.log('   Official: official@demo.com / demo123');
  console.log('   Admin:    admin@nasmr.gov / admin123\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
