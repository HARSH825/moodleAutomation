import express from "express";
const router = express.Router();
import checkSubController from "../controller/checkSubController.js";
router.post('/', checkSubController);

export default router;