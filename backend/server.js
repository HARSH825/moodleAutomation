import express from 'express';
import loginFetchRouter from './route/loginFetch.js';
import checkSubRouter from './route/checkSub.js';
import generateDocumentsRouter from './route/genDocRoute.js';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/loginFetch', loginFetchRouter);
app.use('/checkSubmissions', checkSubRouter);
app.use('/generateDocuments', generateDocumentsRouter);

const port = process.env.PORT || 3000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});