import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { authRouter } from './routes/auth.routes.js';
import { questionPaperRouter } from './routes/question-paper.routes.js';
import { noteRouter } from './routes/note.routes.js';
import { bookRouter } from './routes/book.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { ensureDirectoryExists } from './middleware/upload.middleware.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Ensure upload directories exist on startup
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
ensureDirectoryExists(path.join(UPLOADS_ROOT, 'question-papers'));
ensureDirectoryExists(path.join(UPLOADS_ROOT, 'notes'));
ensureDirectoryExists(path.join(UPLOADS_ROOT, 'books'));

// Serve uploaded PDFs statically
app.use('/uploads', express.static(UPLOADS_ROOT));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/question-papers', questionPaperRouter);
app.use('/api/notes', noteRouter);
app.use('/api/books', bookRouter);
app.use('/api/chat', chatRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
