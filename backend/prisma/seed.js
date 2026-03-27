"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const password = await bcryptjs_1.default.hash("123456", 10);
    const admin = await prisma.user.upsert({
        where: { email: "admin@wowhub.com" },
        update: {},
        create: {
            name: "Arthas Menethil",
            email: "admin@wowhub.com",
            password,
            role: client_1.UserRole.ADMIN,
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
            role: client_1.UserRole.USER,
            avatar: "JP",
        },
    });
    const project = await prisma.project.upsert({
        where: { id: "wowhub-project-core" },
        update: {},
        create: {
            id: "wowhub-project-core",
            name: "Launch Campaign",
            description: "Central project for onboarding, operations and support workflows.",
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
                    status: client_1.TaskStatus.DOING,
                    projectId: project.id,
                    assigneeId: admin.id,
                    createdById: admin.id,
                },
                {
                    title: "Map support SLAs",
                    description: "Document the main support lanes and escalation rules.",
                    status: client_1.TaskStatus.TODO,
                    projectId: project.id,
                    assigneeId: user.id,
                    createdById: admin.id,
                },
                {
                    title: "Review landing animations",
                    description: "Check the hero area and polish motion and spacing.",
                    status: client_1.TaskStatus.DONE,
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
            description: "The executive dashboard is not reflecting this week sales numbers.",
            category: "Analytics",
            status: client_1.TicketStatus.IN_PROGRESS,
            priority: client_1.TicketPriority.HIGH,
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
                    message: "Client confirmed the issue is happening since yesterday morning.",
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
