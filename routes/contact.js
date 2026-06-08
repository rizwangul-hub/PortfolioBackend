import express from "express";
import { submitContact } from "../controller/contactController.js";
import { validateContact } from "../middleware/validateContact.js";

const router = express.Router();

router.post("/", validateContact, submitContact);

export default router;
