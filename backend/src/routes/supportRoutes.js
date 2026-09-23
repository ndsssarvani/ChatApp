import express from 'express';
import { getFaqs, createTicket } from '../controllers/supportController.js';

const router = express.Router();

router.get('/faqs', getFaqs);
router.post('/tickets', createTicket);

export default router;
