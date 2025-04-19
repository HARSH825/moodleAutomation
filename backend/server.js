import express from 'express';
import loginFetchRouter from './route/loginFetch.js';
import checkSubRouter from './route/checkSub.js';
import generateDocumentsRouter from './route/genDocRoute.js';
import cors from 'cors';


const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/loginFetch',loginFetchRouter);
app.use('/checkSubmissions',checkSubRouter);
app.use('/generateDocuments',generateDocumentsRouter);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});