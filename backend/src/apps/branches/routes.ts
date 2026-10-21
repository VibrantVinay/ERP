import { Router } from 'express';
import { branchController } from './controller';

const router = Router();

router.get('/', (req, res) => branchController.getBranches(req, res));
router.get('/summary', (req, res) => branchController.getSummary(req, res));
router.get('/:id', (req, res) => branchController.getBranchById(req, res));
router.post('/', (req, res) => branchController.createBranch(req, res));
router.put('/:id', (req, res) => branchController.updateBranch(req, res));
router.delete('/:id', (req, res) => branchController.deleteBranch(req, res));

export default router;
