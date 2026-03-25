import { Router } from 'express';
import { getLearnerProgress, updateGoals, getStats } from '../controllers/learners.controller';
import { authenticate, authorize } from '../middleware/auth'; // Existing middleware
import { createGoalValidator } from '../validators/learners.validator';

const router = Router();

// All routes here require the user to be logged in and be a 'learner'
router.use(authenticate);
router.use(authorize('learner'));

router.get('/me/progress', getLearnerProgress);
router.get('/me/stats', getStats);
router.put('/me/goals', createGoalValidator, updateGoals);

export default router;
