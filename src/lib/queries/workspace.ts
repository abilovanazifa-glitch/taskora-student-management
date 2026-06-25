import { addDays, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAccessibleProjectIds } from "@/lib/permissions/access";

const DEFAULT_LISTS = [
  { nameUz: "Shaxsiy", nameJa: "個人", color: "#6366f1" },
  { nameUz: "O'qish", nameJa: "学習", color: "#10b981" },
  { nameUz: "Ish", nameJa: "仕事", color: "#f59e0b" },
  { nameUz: "Muhim", nameJa: "重要", color: "#ef4444" },
] as const;

const DEFAULT_LABELS = [
  { nameUz: "Muhim", nameJa: "重要", color: "#ef4444" },
  { nameUz: "Shoshilinch", nameJa: "緊急", color: "#f97316" },
  { nameUz: "O'qish", nameJa: "学習", color: "#10b981" },
  { nameUz: "Ish", nameJa: "仕事", color: "#3b82f6" },
  { nameUz: "Shaxsiy", nameJa: "個人", color: "#8b5cf6" },
] as const;

type DefaultTaskSeed = {
  titleUz: string;
  titleJa: string;
  descriptionUz: string;
  descriptionJa: string;
  status: TaskStatus;
  priority: TaskPriority;
  listIndex: number;
  labelIndexes: number[];
  deadlineOffset?: number;
  completedOffset?: number;
};

const DEFAULT_TASKS: DefaultTaskSeed[] = [
  {
    titleUz: "Haftalik reja tuzish",
    titleJa: "週間計画を立てる",
    descriptionUz: "Dushanbadan jumagacha bajariladigan vazifalar ro'yxati.",
    descriptionJa: "月曜から金曜までのタスク一覧。",
    status: "TODO",
    priority: "MEDIUM",
    listIndex: 2,
    labelIndexes: [3],
    deadlineOffset: 1,
  },
  {
    titleUz: "Email javoblarini yozish",
    titleJa: "メール返信を書く",
    descriptionUz: "Kutilayotgan xabarlar va takliflarga javob berish.",
    descriptionJa: "未返信メールと提案への返信。",
    status: "TODO",
    priority: "HIGH",
    listIndex: 2,
    labelIndexes: [0, 1],
    deadlineOffset: 0,
  },
  {
    titleUz: "Yangi kitob o'qishni boshlash",
    titleJa: "新しい本を読み始める",
    descriptionUz: "Tanlangan kitobning birinchi bobini o'qish.",
    descriptionJa: "選んだ本の第1章を読む。",
    status: "TODO",
    priority: "LOW",
    listIndex: 1,
    labelIndexes: [2],
    deadlineOffset: 3,
  },
  {
    titleUz: "Prezentatsiya slaydlarini tayyorlash",
    titleJa: "発表スライドを準備する",
    descriptionUz: "Asosiy g'oya, ma'lumotlar va xulosa qismlarini yozish.",
    descriptionJa: "要点・データ・結論の部分を作成する。",
    status: "IN_PROGRESS",
    priority: "HIGH",
    listIndex: 2,
    labelIndexes: [0],
    deadlineOffset: 2,
  },
  {
    titleUz: "Ingliz tilini mashq qilish",
    titleJa: "英語の練習",
    descriptionUz: "30 daqiqa lug'at va tinglash mashqi.",
    descriptionJa: "30分の語彙とリスニング練習。",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    listIndex: 1,
    labelIndexes: [2],
    deadlineOffset: 0,
  },
  {
    titleUz: "Sport zaliga borish",
    titleJa: "ジムに行く",
    descriptionUz: "Kuch mashqlari va yengil kardio darslari.",
    descriptionJa: "筋トレと軽い有酸素運動。",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    listIndex: 0,
    labelIndexes: [4],
    deadlineOffset: 0,
  },
  {
    titleUz: "Xarid ro'yxatini tuzish",
    titleJa: "買い物リストを作成",
    descriptionUz: "Haftalik oziq-ovqat va uy jihozlari ro'yxati.",
    descriptionJa: "週間の食料品と日用品リスト。",
    status: "COMPLETED",
    priority: "LOW",
    listIndex: 0,
    labelIndexes: [4],
    completedOffset: 1,
  },
  {
    titleUz: "Uchrashuv vaqtini kelishish",
    titleJa: "会議時間を調整",
    descriptionUz: "Jamoa bilan qulay vaqtni aniqlash va kalendar yangilash.",
    descriptionJa: "チームと都合の良い時間を決めてカレンダーを更新。",
    status: "COMPLETED",
    priority: "MEDIUM",
    listIndex: 3,
    labelIndexes: [0],
    completedOffset: 2,
  },
  {
    titleUz: "Hisobotni yakunlash",
    titleJa: "レポートを完成させる",
    descriptionUz: "Oxirgi tekshiruv va formatlash.",
    descriptionJa: "最終確認とフォーマット調整。",
    status: "TODO",
    priority: "URGENT",
    listIndex: 3,
    labelIndexes: [0, 1],
    deadlineOffset: -1,
  },
  {
    titleUz: "Portfolio yangilash",
    titleJa: "ポートフォリオを更新",
    descriptionUz: "So'nggi loyihalar va natijalarni qo'shish.",
    descriptionJa: "最新プロジェクトと成果を追加する。",
    status: "TODO",
    priority: "MEDIUM",
    listIndex: 0,
    labelIndexes: [4],
    deadlineOffset: 5,
  },
];

async function ensureDefaultTasks(userId: string, projectId: string) {
  const taskCount = await prisma.task.count({ where: { projectId } });
  if (taskCount > 0) {
    return;
  }

  const [lists, tags] = await Promise.all([
    prisma.subject.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
    prisma.tag.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);

  if (lists.length === 0) {
    return;
  }

  const today = startOfDay(new Date());

  for (const task of DEFAULT_TASKS) {
    const deadline =
      task.deadlineOffset !== undefined
        ? setMinutes(setHours(addDays(today, task.deadlineOffset), 18), 0)
        : undefined;
    const completedAt =
      task.completedOffset !== undefined ? subDays(today, task.completedOffset) : undefined;

    const created = await prisma.task.create({
      data: {
        projectId,
        creatorId: userId,
        assigneeId: userId,
        subjectId: lists[task.listIndex]?.id ?? lists[0].id,
        titleUz: task.titleUz,
        titleJa: task.titleJa,
        descriptionUz: task.descriptionUz,
        descriptionJa: task.descriptionJa,
        status: task.status,
        priority: task.priority,
        deadline,
        completedAt,
      },
    });

    const tagIds = task.labelIndexes
      .map((index) => tags[index]?.id)
      .filter((id): id is string => Boolean(id));

    if (tagIds.length > 0) {
      await prisma.taskTag.createMany({
        data: tagIds.map((tagId) => ({ taskId: created.id, tagId })),
      });
    }
  }
}

/** Ensures the user has a hidden workspace project for task storage. */
export async function ensureUserWorkspace(userId: string) {
  const existing = await prisma.project.findFirst({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      status: { in: ["PLANNED", "ACTIVE"] },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const project = await prisma.project.create({
    data: {
      nameUz: "Shaxsiy doska",
      nameJa: "個人ボード",
      descriptionUz: "",
      descriptionJa: "",
      color: "#6366f1",
      ownerId: userId,
      status: "ACTIVE",
      members: {
        create: { userId, role: "OWNER" },
      },
    },
    select: { id: true },
  });

  return project.id;
}

export async function ensureDefaultListsAndLabels(userId: string) {
  const [listCount, tagCount] = await Promise.all([
    prisma.subject.count({ where: { ownerId: userId } }),
    prisma.tag.count({ where: { ownerId: userId } }),
  ]);

  if (listCount === 0) {
    await prisma.subject.createMany({
      data: DEFAULT_LISTS.map((list) => ({
        ownerId: userId,
        nameUz: list.nameUz,
        nameJa: list.nameJa,
        color: list.color,
      })),
    });
  }

  if (tagCount === 0) {
    await prisma.tag.createMany({
      data: DEFAULT_LABELS.map((label) => ({
        ownerId: userId,
        nameUz: label.nameUz,
        nameJa: label.nameJa,
        color: label.color,
      })),
    });
  }
}

export async function prepareUserTaskWorkspace(userId: string) {
  const projectId = await ensureUserWorkspace(userId);
  await ensureDefaultListsAndLabels(userId);
  await ensureDefaultTasks(userId, projectId);
  return projectId;
}

export async function getUserDefaultProjectId(userId: string) {
  const ids = await getAccessibleProjectIds(userId);
  if (ids.length > 0) {
    return ids[0];
  }
  return ensureUserWorkspace(userId);
}
