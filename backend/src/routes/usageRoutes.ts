import express, { Request, Response } from "express";
import db from "../config/db";

const router = express.Router();

// POST /usage
router.post("/usage", (req: Request, res: Response) => {
  const { userId, action, usedUnits } = req.body;

  if (!userId || !action || usedUnits === undefined) {
    return res.status(400).json({ message: "userId, action, usedUnits required" });
  }

  const query =
    "INSERT INTO UsageRecords (userId, action, usedUnits) VALUES (?, ?, ?)";

  db.query(query, [userId, action, usedUnits], (err, result: any) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "DB Insert Error", error: err });
    }

    return res.status(201).json({
      message: "Usage recorded successfully",
      insertedId: result.insertId,
    });
  });
});

export default router;
