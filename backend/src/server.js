const app = require('./app');
const { initDb } = require('./config/db');

const port = process.env.PORT || 4000;

const start = async () => {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`CalPlanner API ready on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to start CalPlanner API', error);
    process.exit(1);
  }
};

start();
