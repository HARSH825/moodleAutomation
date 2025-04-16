import express from 'express';
const router = express.Router();
import  loginFetchController  from '../controller/loginFetchController.js';

router.post('/',loginFetchController);

export default router;