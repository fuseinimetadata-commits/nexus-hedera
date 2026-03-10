import express from 'express';
import dotenv from 'dotenv';
import { assessmentRouter } from './api/routes';
import { initHedera } from './hedera/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', assessmentRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', agent: 'NEXUS', version: '1.0.0' });
});

async function main() {
  await initHedera();
  app.listen(PORT, () => {
    console.log(`NEXUS agent running on port ${PORT}`);
    console.log(`HOL Registry: registered`);
    console.log(`OpenClaw UCP: listening`);
  });
}

main().catch(console.error);
