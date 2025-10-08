require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5080

app.use(express.json());

const start_server = async () => {
    try {
        
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost/5000`);

        });

    } catch (error) {
        throw new Error("Error starting server");
        
    }
};

start_server();