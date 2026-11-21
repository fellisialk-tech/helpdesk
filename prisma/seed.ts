import { prisma } from "../lib/prisma";

function utcDayOffset(daysFromToday: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysFromToday,
      0,
      0,
      0,
      0
    )
  );
}

async function main() {
  await prisma.tempahan.deleteMany();

  await prisma.tempahan.createMany({
    data: [
      {
        nama_pemohon: "Ahmad Faizal bin Razak",
        item_tempahan: "Bilik Perbincangan 1",
        tarikh: utcDayOffset(0),
        slot_masa: "8:00-10:00",
        status: "Diluluskan",
      },
      {
        nama_pemohon: "Nurul Huda binti Ismail",
        item_tempahan: "Kamera DSLR",
        tarikh: utcDayOffset(0),
        slot_masa: "10:00-12:00",
        status: "Menunggu",
      },
      {
        nama_pemohon: "Muhammad Danish Hakim",
        item_tempahan: "Makmal Komputer 1",
        tarikh: utcDayOffset(0),
        slot_masa: "14:00-16:00",
        status: "Menunggu",
      },
      {
        nama_pemohon: "Siti Aisyah binti Kamarudin",
        item_tempahan: "Bola Futsal",
        tarikh: utcDayOffset(0),
        slot_masa: "16:00-18:00",
        status: "Diluluskan",
      },
      {
        nama_pemohon: "Lim Wei Jie",
        item_tempahan: "Tripod",
        tarikh: utcDayOffset(1),
        slot_masa: "10:00-12:00",
        status: "Menunggu",
      },
      {
        nama_pemohon: "Priya Darshini Nair",
        item_tempahan: "Bilik Perbincangan 2",
        tarikh: utcDayOffset(1),
        slot_masa: "14:00-16:00",
        status: "Diluluskan",
      },
      {
        nama_pemohon: "Khairul Anuar bin Yusof",
        item_tempahan: "Makmal Komputer 2",
        tarikh: utcDayOffset(2),
        slot_masa: "8:00-10:00",
        status: "Ditolak",
      },
      {
        nama_pemohon: "Nur Izzati binti Zulkifli",
        item_tempahan: "Raket Badminton",
        tarikh: utcDayOffset(2),
        slot_masa: "16:00-18:00",
        status: "Menunggu",
      },
      {
        nama_pemohon: "Jason Tan Ming Hao",
        item_tempahan: "Kamera DSLR",
        tarikh: utcDayOffset(3),
        slot_masa: "10:00-12:00",
        status: "Diluluskan",
      },
    ],
  });

  console.log("Seeded 9 Tempahan records successfully.");
}

main()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
