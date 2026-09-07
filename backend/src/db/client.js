/**
 * Prisma client singleton.
 *
 * One client for the whole process. Tests construct their own clients
 * against temporary databases instead of using this one.
 */
const { PrismaClient } = require("@prisma/client");
const { env } = require("../config/env");

const prisma = new PrismaClient({
  datasources: {
    db: { url: env.DATABASE_URL },
  },
});

module.exports = { prisma };