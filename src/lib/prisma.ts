import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'], // Eliminamos 'query' para no mostrar logs de consultas SQL
});

export default prisma;