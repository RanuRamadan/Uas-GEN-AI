import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import chatRoutes from "./routes/chatRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/chat", chatRoutes);
app.use("/api/progress", progressRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`SIGAP-KOTA running on ${PORT}`);

});