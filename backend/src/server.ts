

import express from "express";
import usageRoutes from "./routes/usageRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
app.use(express.json());

app.use("/usage", usageRoutes);
app.use("/users", userRoutes);

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
