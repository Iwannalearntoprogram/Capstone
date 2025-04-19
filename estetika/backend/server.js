const express = require('express');
const app = express();
const PORT = 3000;

// Serve static files (like HTML, CSS, JS)
app.use(express.static('public'));

// Define routes
app.get('/', (req, res) => {
    res.send('Hello, World! Your server is working.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
