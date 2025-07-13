export default defineEventHandler(async event => {
  try {
    const { cloudflare } = event.context;
    const db = cloudflare.env.DB;

    console.log(db);
    const { results } = await db.prepare('SELECT * FROM User').all();

    return {
      message: 'Data from D1!',
      users: results,
    };
  } catch (error) {
    console.error('D1 error:', error);
    return {
      error: 'Failed to fetch data from D1',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
