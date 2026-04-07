import {
  PrismaClient,
  TicketPriority,
  TicketStatus,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const randomNames = [
  "Thrall",
  "Sylvanas",
  "Anduin",
  "Illidan",
  "Malfurion",
  "Tyrande",
  "Valeera",
  "Rexxar",
  "Velen",
  "Uther",
  "Kael'thas",
  "Vol'jin",
  "Bolvar",
  "Alleria",
  "Grommash",
];

const randomCategories = [
  "Suporte",
  "Infra",
  "Analytics",
  "Financeiro",
  "Integração",
  "Produto",
  "Segurança",
];

const taskTopics = [
  "Ajustar fluxo de aprovação",
  "Revisar indicadores do dashboard",
  "Mapear gargalos da fila",
  "Atualizar documentação interna",
  "Padronizar rotinas de suporte",
  "Refinar monitoramento operacional",
  "Validar qualidade dos dados",
  "Melhorar onboarding de cliente",
];

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFutureDate(daysAhead = 30) {
  const date = new Date();
  date.setDate(date.getDate() + randomInt(1, daysAhead));
  return date;
}

async function ensureVolumeUsers(passwordHash: string) {
  const existingDemoUsers = await prisma.user.findMany({
    where: {
      email: {
        startsWith: "demo+",
      },
    },
    select: { id: true },
  });

  const targetAmount = 14;
  const missing = targetAmount - existingDemoUsers.length;

  if (missing <= 0) {
    return;
  }

  const now = Date.now();

  for (let index = 0; index < missing; index += 1) {
    const baseName = randomNames[(existingDemoUsers.length + index) % randomNames.length];
    const unique = now + index;
    const name = `${baseName} ${index + 1}`;
    const email = `demo+${unique}@wowhub.com`;

    await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: UserRole.USER,
        avatar: name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      },
    });
  }
}

async function ensureVolumeProjects(adminId: string) {
  const current = await prisma.project.count();
  const target = 6;

  if (current >= target) {
    return;
  }

  const toCreate = target - current;

  for (let i = 0; i < toCreate; i += 1) {
    const topic = pick(taskTopics);
    await prisma.project.create({
      data: {
        name: `Ops Stream ${i + 1}`,
        description: `${topic} com foco em previsibilidade e execução diária.`,
        status: "active",
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "Project created",
        details: `Projeto Ops Stream ${i + 1} criado para expansão do fluxo.`,
        userId: adminId,
      },
    });
  }
}

async function ensureVolumeTicketsAndComments() {
  const existingTickets = await prisma.ticket.count();
  const targetTickets = 55;

  if (existingTickets >= targetTickets) {
    return;
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true },
  });

  const userPool = users.filter((u) => u.role === UserRole.USER);
  const adminPool = users.filter((u) => u.role === UserRole.ADMIN);

  if (userPool.length === 0 || adminPool.length === 0) {
    return;
  }

  const statuses = [
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.WAITING_RESPONSE,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ];
  const priorities = [
    TicketPriority.LOW,
    TicketPriority.MEDIUM,
    TicketPriority.HIGH,
    TicketPriority.CRITICAL,
  ];

  const createAmount = targetTickets - existingTickets;

  for (let i = 0; i < createAmount; i += 1) {
    const owner = pick(userPool);
    const priority = pick(priorities);
    const status = pick(statuses);
    const category = pick(randomCategories);
    const title = `${pick(taskTopics)} #${existingTickets + i + 1}`;

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: `Volume seed para dashboard: ${title}.`,
        category,
        status,
        priority,
        userId: owner.id,
      },
    });

    const commentsAmount = randomInt(0, 3);
    for (let commentIndex = 0; commentIndex < commentsAmount; commentIndex += 1) {
      const author =
        Math.random() > 0.5 ? pick(adminPool) : pick(userPool);

      await prisma.comment.create({
        data: {
          ticketId: ticket.id,
          userId: author.id,
          message: `Atualização ${commentIndex + 1} no chamado "${title}".`,
        },
      });
    }
  }
}

async function ensureVolumeTasks(adminId: string) {
  const existingTasks = await prisma.task.count();
  const targetTasks = 70;

  if (existingTasks >= targetTasks) {
    return;
  }

  const users = await prisma.user.findMany({
    select: { id: true, role: true, name: true },
  });
  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
  });

  const assignees = users.filter((u) => u.role === UserRole.USER);

  if (assignees.length === 0 || projects.length === 0) {
    return;
  }

  const statuses = [TaskStatus.TODO, TaskStatus.DOING, TaskStatus.DONE];
  const createAmount = targetTasks - existingTasks;

  for (let i = 0; i < createAmount; i += 1) {
    const project = pick(projects);
    const assignee = pick(assignees);
    const status = pick(statuses);
    const title = `${pick(taskTopics)} • ${project.name}`;

    await prisma.task.create({
      data: {
        title,
        description: `Item gerado para aumentar volume operacional no ambiente de demo.`,
        status,
        dueDate: Math.random() > 0.2 ? randomFutureDate(45) : null,
        projectId: project.id,
        assigneeId: assignee.id,
        createdById: adminId,
      },
    });
  }
}

async function ensureVolumeActivities(adminId: string, userId: string) {
  const existingActivities = await prisma.activityLog.count();
  const targetActivities = 90;

  if (existingActivities >= targetActivities) {
    return;
  }

  const missing = targetActivities - existingActivities;

  for (let i = 0; i < missing; i += 1) {
    const actor = Math.random() > 0.6 ? userId : adminId;
    await prisma.activityLog.create({
      data: {
        action: pick([
          "Ticket triaged",
          "Task reprioritized",
          "Support follow-up",
          "Admin review",
          "Workflow updated",
        ]),
        details: `Evento de volume #${i + 1} para alimentar timeline operacional.`,
        userId: actor,
      },
    });
  }
}

async function main() {
  const password = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@wowhub.com" },
    update: {},
    create: {
      name: "Arthas Menethil",
      email: "admin@wowhub.com",
      password,
      role: UserRole.ADMIN,
      avatar: "AM",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@wowhub.com" },
    update: {},
    create: {
      name: "Jaina Proudmoore",
      email: "user@wowhub.com",
      password,
      role: UserRole.USER,
      avatar: "JP",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "wowhub-project-core" },
    update: {},
    create: {
      id: "wowhub-project-core",
      name: "Launch Campaign",
      description:
        "Central project for onboarding, operations and support workflows.",
      status: "active",
    },
  });

  const existingTasksCount = await prisma.task.count({
    where: { projectId: project.id },
  });

  if (existingTasksCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: "Design onboarding board",
          description: "Prepare the premium onboarding view for new clients.",
          status: TaskStatus.DOING,
          projectId: project.id,
          assigneeId: admin.id,
          createdById: admin.id,
        },
        {
          title: "Map support SLAs",
          description: "Document the main support lanes and escalation rules.",
          status: TaskStatus.TODO,
          projectId: project.id,
          assigneeId: user.id,
          createdById: admin.id,
        },
        {
          title: "Review landing animations",
          description: "Check the hero area and polish motion and spacing.",
          status: TaskStatus.DONE,
          projectId: project.id,
          assigneeId: admin.id,
          createdById: admin.id,
        },
      ],
    });
  }

  const ticket = await prisma.ticket.upsert({
    where: { id: "wowhub-ticket-seed" },
    update: {},
    create: {
      id: "wowhub-ticket-seed",
      title: "Dashboard analytics mismatch",
      description:
        "The executive dashboard is not reflecting this week sales numbers.",
      category: "Analytics",
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
      userId: user.id,
    },
  });

  const existingCommentsCount = await prisma.comment.count({
    where: { ticketId: ticket.id },
  });

  if (existingCommentsCount === 0) {
    await prisma.comment.createMany({
      data: [
        {
          message: "Investigating the data aggregation pipeline.",
          ticketId: ticket.id,
          userId: admin.id,
        },
        {
          message:
            "Client confirmed the issue is happening since yesterday morning.",
          ticketId: ticket.id,
          userId: user.id,
        },
      ],
    });
  }

  const existingActivitiesCount = await prisma.activityLog.count();

  if (existingActivitiesCount === 0) {
    await prisma.activityLog.createMany({
      data: [
        {
          action: "Ticket escalated",
          details: "High priority analytics issue moved to engineering lane.",
          userId: admin.id,
        },
        {
          action: "Task closed",
          details: "Landing animation pass approved by design lead.",
          userId: admin.id,
        },
        {
          action: "Support request opened",
          details: "New report mismatch ticket created by Jaina Proudmoore.",
          userId: user.id,
        },
      ],
    });
  }

  await ensureVolumeUsers(password);
  await ensureVolumeProjects(admin.id);
  await ensureVolumeTicketsAndComments();
  await ensureVolumeTasks(admin.id);
  await ensureVolumeActivities(admin.id, user.id);

  console.log("WoWHUB seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });