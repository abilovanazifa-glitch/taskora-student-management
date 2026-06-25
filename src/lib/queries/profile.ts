import { prisma } from "@/lib/prisma";
import { getAccessibleProjectIds } from "@/lib/permissions/access";

export async function getProfileStats(userId: string) {
  const projectIds = await getAccessibleProjectIds(userId);

  if (projectIds.length === 0) {
    return {
      projectCount: 0,
      taskCount: 0,
      completedTaskCount: 0,
    };
  }

  const [taskCount, completedTaskCount] = await Promise.all([
    prisma.task.count({
      where: { projectId: { in: projectIds } },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: "COMPLETED",
      },
    }),
  ]);

  return {
    projectCount: projectIds.length,
    taskCount,
    completedTaskCount,
  };
}
