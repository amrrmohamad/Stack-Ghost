const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = prisma;



// Get all users
router.get('/users', async (req, res) => {
  const users = await prisma.users.findMany();
  res.json(users);
});