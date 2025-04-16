import express from "express";
const router = express.Router();
import genDocController from "../controller/genDocController.js";
router.post("/", genDocController);

export default router;