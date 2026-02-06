import express from 'express';

const router = express.Router();

// Define your class routes here
router.get('/', async (req, res) => {
  res.send('Get all classes');
});

router.get('/:id', async (req, res) => {
    res.send(`Get class with ID: ${req.params.id}`);
});

router.post('/', async (req, res) => {
    res.send('Create a new class');
});

router.put('/:id', async (req, res) => {
    res.send(`Update class with ID: ${req.params.id}`);
});

router.delete('/:id', async (req, res) => {
    res.send(`Delete class with ID: ${req.params.id}`);
});

export default router;