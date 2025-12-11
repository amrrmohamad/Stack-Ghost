
// Get all users
router.get('/users', async (req, res) => {
  const users = await prisma.users.findMany();
  res.json(users);
});