import express  from 'express';

const app = express();
const PORT = process.env.PORT || 8000;
const router = express.Router();

app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
    res.send('Hello, welcome to the Classroom API!');
});

router.get('/subjects', (req, res) => {
    // Handle submission logic here
    res.send('Subjects received!');
});

router.get('/subjects/:id', (req, res) => {
    const { id } = req.params;
    res.send(`Subject ID: ${id}`);
});

app.use('/api', router);

// app.use((err, req, res, next) => {
//   console.error("Error:", err.message);
//   res.status(500).json({
//     error: "Something went wrong!",
//     message: err.message,
//   });
// });

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});