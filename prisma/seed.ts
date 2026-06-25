import {
  addDays,
  addHours,
  setHours,
  setMinutes,
  startOfDay,
  subDays,
} from "date-fns";
import {
  getInvitationExpiresAt,
} from "../src/lib/invitations/token";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

const SEED_EMAILS = [
  "student@example.com",
  "talaba@example.com",
  "nazifa@example.com",
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("Student1!", BCRYPT_ROUNDS);
  const passwordHashUz = await bcrypt.hash("Talaba1!", BCRYPT_ROUNDS);
  const passwordHashAdmin = await bcrypt.hash("Nazifa1!", BCRYPT_ROUNDS);

  const yuki = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {
      fullName: "Tanaka Yuki",
      passwordHash,
      preferredLanguage: "JA",
      theme: "SYSTEM",
    },
    create: {
      fullName: "Tanaka Yuki",
      email: "student@example.com",
      passwordHash,
      preferredLanguage: "JA",
      theme: "SYSTEM",
    },
  });

  const aziza = await prisma.user.upsert({
    where: { email: "talaba@example.com" },
    update: {
      fullName: "Aziza Karimova",
      passwordHash: passwordHashUz,
      preferredLanguage: "UZ",
      theme: "LIGHT",
    },
    create: {
      fullName: "Aziza Karimova",
      email: "talaba@example.com",
      passwordHash: passwordHashUz,
      preferredLanguage: "UZ",
      theme: "LIGHT",
    },
  });

  const nazifa = await prisma.user.upsert({
    where: { email: "nazifa@example.com" },
    update: {
      fullName: "Nazifa Abilova",
      passwordHash: passwordHashAdmin,
      preferredLanguage: "UZ",
      theme: "DARK",
    },
    create: {
      fullName: "Nazifa Abilova",
      email: "nazifa@example.com",
      passwordHash: passwordHashAdmin,
      preferredLanguage: "UZ",
      theme: "DARK",
    },
  });

  const seedUserIds = [yuki.id, aziza.id, nazifa.id];

  await prisma.notification.deleteMany({ where: { userId: { in: seedUserIds } } });
  await prisma.taskTag.deleteMany({});
  await prisma.task.deleteMany({
    where: { project: { ownerId: { in: seedUserIds } } },
  });
  await prisma.calendarEvent.deleteMany({
    where: {
      OR: [{ creatorId: { in: seedUserIds } }, { project: { ownerId: { in: seedUserIds } } }],
    },
  });
  await prisma.invitation.deleteMany({
    where: { project: { ownerId: { in: seedUserIds } } },
  });
  await prisma.projectMember.deleteMany({
    where: { project: { ownerId: { in: seedUserIds } } },
  });
  await prisma.project.deleteMany({ where: { ownerId: { in: seedUserIds } } });
  await prisma.subject.deleteMany({ where: { ownerId: { in: seedUserIds } } });
  await prisma.tag.deleteMany({ where: { ownerId: { in: seedUserIds } } });

  const now = new Date();
  const today = startOfDay(now);

  const n5Project = await prisma.project.create({
    data: {
      nameUz: "N5 Yapon tili",
      nameJa: "日本語能力試験 N5",
      descriptionUz: "JLPT N5 imtihoniga tayyorgarlik — kanji, grammatika, o'qish va eshitish.",
      descriptionJa: "JLPT N5試験対策 — 漢字、文法、読解、聴解。",
      color: "#e11d48",
      ownerId: aziza.id,
      status: "ACTIVE",
      startDate: subDays(today, 21),
      endDate: addDays(today, 60),
      members: {
        create: [
          { userId: aziza.id, role: "OWNER" },
          { userId: yuki.id, role: "MEMBER" },
          { userId: nazifa.id, role: "ADMIN" },
        ],
      },
    },
  });

  const dailyStudyProject = await prisma.project.create({
    data: {
      nameUz: "Kundalik yodlash",
      nameJa: "毎日の暗記",
      descriptionUz: "Har kuni so'zlar, kanji va grammatika takrorlash.",
      descriptionJa: "毎日語彙・漢字・文法の復習。",
      color: "#8b5cf6",
      ownerId: aziza.id,
      status: "ACTIVE",
      startDate: subDays(today, 14),
      endDate: addDays(today, 45),
      members: {
        create: [
          { userId: aziza.id, role: "OWNER" },
          { userId: yuki.id, role: "MEMBER" },
        ],
      },
    },
  });

  const devInvitationToken =
    "devseed0000000000000000000000000000000000000000000000000000000001";

  await prisma.invitation.create({
    data: {
      projectId: dailyStudyProject.id,
      inviterId: aziza.id,
      invitedEmail: "nazifa@example.com",
      role: "MEMBER",
      token: devInvitationToken,
      expiresAt: getInvitationExpiresAt(),
      status: "PENDING",
    },
  });

  await prisma.project.create({
    data: {
      nameUz: "N4 ga o'tish rejasi",
      nameJa: "N4への準備",
      descriptionUz: "N5 tugagach N4 darajasiga tayyorgarlik rejalari.",
      descriptionJa: "N5完了後のN4準備計画。",
      color: "#f59e0b",
      ownerId: yuki.id,
      status: "PLANNED",
      startDate: addDays(today, 30),
      endDate: addDays(today, 120),
      members: {
        create: [{ userId: yuki.id, role: "OWNER" }],
      },
    },
  });

  await prisma.project.create({
    data: {
      nameUz: "O'tgan oylik testlar",
      nameJa: "先月の模試",
      descriptionUz: "Yakunlangan mock testlar va natijalar.",
      descriptionJa: "完了した模擬試験と結果。",
      color: "#64748b",
      ownerId: aziza.id,
      status: "COMPLETED",
      startDate: subDays(today, 90),
      endDate: subDays(today, 10),
      members: {
        create: [{ userId: aziza.id, role: "OWNER" }],
      },
    },
  });

  const kanjiSubject = await prisma.subject.create({
    data: {
      nameUz: "Kanji",
      nameJa: "漢字",
      color: "#e11d48",
      ownerId: aziza.id,
    },
  });

  const grammarSubject = await prisma.subject.create({
    data: {
      nameUz: "Grammatika",
      nameJa: "文法",
      color: "#6366f1",
      ownerId: aziza.id,
    },
  });

  const vocabSubject = await prisma.subject.create({
    data: {
      nameUz: "So'z boyligi",
      nameJa: "語彙",
      color: "#10b981",
      ownerId: aziza.id,
    },
  });

  const readingSubject = await prisma.subject.create({
    data: {
      nameUz: "O'qish",
      nameJa: "読解",
      color: "#3b82f6",
      ownerId: aziza.id,
    },
  });

  const listeningSubject = await prisma.subject.create({
    data: {
      nameUz: "Eshitish",
      nameJa: "聴解",
      color: "#f59e0b",
      ownerId: aziza.id,
    },
  });

  const memorizeTag = await prisma.tag.create({
    data: {
      nameUz: "Yodlash",
      nameJa: "暗記",
      color: "#8b5cf6",
      ownerId: aziza.id,
    },
  });

  const readingTag = await prisma.tag.create({
    data: {
      nameUz: "O'qish",
      nameJa: "読む",
      color: "#3b82f6",
      ownerId: aziza.id,
    },
  });

  const listeningTag = await prisma.tag.create({
    data: {
      nameUz: "Eshitish",
      nameJa: "聴く",
      color: "#f59e0b",
      ownerId: aziza.id,
    },
  });

  const reviewTag = await prisma.tag.create({
    data: {
      nameUz: "Takrorlash",
      nameJa: "復習",
      color: "#10b981",
      ownerId: aziza.id,
    },
  });

  const mockTestTag = await prisma.tag.create({
    data: {
      nameUz: "Mock test",
      nameJa: "模擬試験",
      color: "#ef4444",
      ownerId: aziza.id,
    },
  });

  const tasks = [
    {
      projectId: n5Project.id,
      subjectId: kanjiSubject.id,
      tagIds: [memorizeTag.id, reviewTag.id],
      titleUz: "N5 kanji ro'yxati (1–100) yodlash",
      titleJa: "N5漢字リスト（1〜100）を暗記",
      descriptionUz: "Kuniga 10 ta kanji — o'qish, yozish va ma'nosini yodlash.",
      descriptionJa: "1日10漢字 — 読み・書き・意味を覚える。",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      creatorId: aziza.id,
      assigneeId: aziza.id,
      deadline: setMinutes(setHours(today, 20), 0),
    },
    {
      projectId: n5Project.id,
      subjectId: grammarSubject.id,
      tagIds: [memorizeTag.id],
      titleUz: "Minna no Nihongo dars 5 grammatikasi",
      titleJa: "みんなの日本語 第5課の文法",
      descriptionUz: "〜てください, 〜ませんか shakllarini o'rganish va misollar yozish.",
      descriptionJa: "〜てください、〜ませんか の文型を学び例文を書く。",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      creatorId: nazifa.id,
      assigneeId: aziza.id,
      deadline: addDays(today, 2),
    },
    {
      projectId: n5Project.id,
      subjectId: listeningSubject.id,
      tagIds: [listeningTag.id, mockTestTag.id],
      titleUz: "CD eshitish: track 3–5",
      titleJa: "CD聴解：トラック3〜5",
      descriptionUz: "Har bir trackni 3 marta eshitib, savollarga javob yozish.",
      descriptionJa: "各トラックを3回聞いて設問に答える。",
      status: "TODO" as const,
      priority: "URGENT" as const,
      creatorId: yuki.id,
      assigneeId: aziza.id,
      deadline: subDays(today, 1),
    },
    {
      projectId: n5Project.id,
      subjectId: vocabSubject.id,
      tagIds: [memorizeTag.id],
      titleUz: "Kunlik 30 ta so'z yodlash",
      titleJa: "毎日30語を暗記",
      descriptionUz: "Anki yoki qog'oz kartochkalar bilan goi ro'yxatini yodlash.",
      descriptionJa: "Ankiまたは単語カードで語彙リストを覚える。",
      status: "COMPLETED" as const,
      priority: "LOW" as const,
      creatorId: aziza.id,
      assigneeId: aziza.id,
      deadline: subDays(today, 3),
      completedAt: subDays(today, 2),
    },
    {
      projectId: n5Project.id,
      subjectId: readingSubject.id,
      tagIds: [readingTag.id],
      titleUz: "Qisqa matn o'qish — kundalik hayot",
      titleJa: "短文読解 — 日常生活",
      descriptionUz: "N5 darajadagi 5 ta qisqa matn o'qib, xulosa yozish.",
      descriptionJa: "N5レベルの短文5つを読んで要約を書く。",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      creatorId: aziza.id,
      assigneeId: aziza.id,
      deadline: addDays(today, 5),
    },
    {
      projectId: dailyStudyProject.id,
      subjectId: vocabSubject.id,
      tagIds: [reviewTag.id],
      titleUz: "Hiragana / Katakana takrorlash",
      titleJa: "ひらがな・カタカナ復習",
      descriptionUz: "Aralash belgilar bilan tez o'qish mashqi (10 daqiqa).",
      descriptionJa: "混ぜ文字で速読練習（10分）。",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      creatorId: aziza.id,
      assigneeId: null,
      deadline: addDays(today, 1),
    },
    {
      projectId: dailyStudyProject.id,
      subjectId: grammarSubject.id,
      tagIds: [mockTestTag.id, reviewTag.id],
      titleUz: "N5 mock test #2",
      titleJa: "N5模擬試験 #2",
      descriptionUz: "To'liq mock test — vaqt chegarasida bajarish va xatolarni tahlil qilish.",
      descriptionJa: "模擬試験を時間内に受け、間違いを分析する。",
      status: "COMPLETED" as const,
      priority: "HIGH" as const,
      creatorId: nazifa.id,
      assigneeId: aziza.id,
      deadline: subDays(today, 5),
      completedAt: subDays(today, 4),
    },
    {
      projectId: n5Project.id,
      subjectId: kanjiSubject.id,
      tagIds: [memorizeTag.id],
      titleUz: "Kanji yozish daftari (10 sahifa)",
      titleJa: "漢字ノート（10ページ）",
      descriptionUz: "Har bir kanjini 5 marta yozib, on-yomi / kun-yomi qayd qilish.",
      descriptionJa: "各漢字を5回書き、音読み・訓読みを記録する。",
      status: "REVIEW" as const,
      priority: "MEDIUM" as const,
      creatorId: yuki.id,
      assigneeId: aziza.id,
      deadline: addDays(today, 3),
    },
  ];

  for (const task of tasks) {
    const { tagIds = [], ...taskData } = task;
    const created = await prisma.task.create({
      data: {
        ...taskData,
        descriptionUz: taskData.descriptionUz ?? "",
        descriptionJa: taskData.descriptionJa ?? "",
      },
    });

    if (tagIds.length > 0) {
      await prisma.taskTag.createMany({
        data: tagIds.map((tagId) => ({ taskId: created.id, tagId })),
      });
    }
  }

  await prisma.calendarEvent.createMany({
    data: [
      {
        titleUz: "N5 speaking club",
        titleJa: "N5スピーキングクラブ",
        descriptionUz: "Hamkor bilan oddiy dialog mashqi.",
        descriptionJa: "ペアで簡単な会話練習。",
        startAt: addHours(today, 10),
        endAt: addHours(today, 11),
        projectId: n5Project.id,
        creatorId: aziza.id,
      },
      {
        titleUz: "Kanji yozish darsi",
        titleJa: "漢字書き取りレッスン",
        descriptionUz: "O'qituvchi bilan kanji yozish amaliyoti.",
        descriptionJa: "先生と漢字の書き取り練習。",
        startAt: addDays(setHours(today, 14), 2),
        endAt: addDays(setHours(today, 16), 2),
        projectId: n5Project.id,
        creatorId: nazifa.id,
      },
      {
        titleUz: "JLPT mock imtihon",
        titleJa: "JLPT模擬試験",
        descriptionUz: "N5 to'liq mock test — vaqt bilan.",
        descriptionJa: "N5本番形式の模擬試験。",
        startAt: addDays(setHours(today, 9), 4),
        endAt: addDays(setHours(today, 11), 4),
        projectId: n5Project.id,
        creatorId: yuki.id,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: aziza.id,
        type: "DEADLINE_REMINDER",
        titleUz: "Eshitish mashqi muddati o'tdi",
        titleJa: "聴解練習の期限が過ぎました",
        messageUz: "CD eshitish: track 3–5 vazifasini bugun bajaring.",
        messageJa: "CD聴解：トラック3〜5を今日完了しましょう。",
        isRead: false,
      },
      {
        userId: aziza.id,
        type: "TASK_ASSIGNED",
        titleUz: "Yangi vazifa: grammatika",
        titleJa: "新しいタスク：文法",
        messageUz: "Minna no Nihongo dars 5 grammatikasi tayinlandi.",
        messageJa: "みんなの日本語 第5課の文法が割り当てられました。",
        isRead: true,
      },
      {
        userId: aziza.id,
        type: "PROJECT_INVITATION",
        titleUz: "N5 loyihasiga xush kelibsiz",
        titleJa: "N5プロジェクトへようこそ",
        messageUz: "N5 Yapon tili kursida o'qishni davom eting!",
        messageJa: "日本語能力試験 N5 の学習を続けましょう！",
        isRead: false,
      },
      {
        userId: aziza.id,
        type: "SYSTEM",
        titleUz: "Bugun 30 ta so'z yodlang",
        titleJa: "今日は30語暗記しましょう",
        messageUz: "Kundalik yodlash rejangizni unutmang.",
        messageJa: "毎日の暗記計画を忘れずに。",
        isRead: true,
      },
    ],
  });

  console.log("Seed complete:");
  console.log(`  Users: ${SEED_EMAILS.join(", ")}`);
  console.log("  Projects: N5 Japanese, Daily study, N4 prep, Past mocks");
  console.log(`  Tasks: ${tasks.length}, Events: 3, Notifications: 4`);
  console.log("  Subjects: Kanji, Grammar, Vocab, Reading, Listening");
  console.log("  Tags: Memorize, Reading, Listening, Review, Mock test");
  console.log(`  Dev invitation: /uz/invitations/${devInvitationToken} (sardor → Daily study)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
