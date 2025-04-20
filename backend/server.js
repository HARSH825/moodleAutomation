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
app.use('/loginFetch',loginFetchRouter);
app.use('/checkSubmissions',checkSubRouter);
app.use('/generateDocuments',generateDocumentsRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
