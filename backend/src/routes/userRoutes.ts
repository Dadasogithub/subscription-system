import express, { Request, Response } from "express";
import db from "../config/db";

const router = express.Router();

// GET /users/:id/current-usage
router.get("/users/:id/current-usage", (req: Request, res: Response) => {
  const userId = req.params.id;

  const planQuery = `
    SELECT p.id as planId, p.name as planName, p.monthlyQuota, p.extraChargePerUnit
    FROM Subscriptions s
    JOIN Plans p ON s.planId = p.id
    WHERE s.userId = ? AND s.isActive = 1
    LIMIT 1
  `;

  db.query(planQuery, [userId], (err, planRows: any) => {
    if (err) return res.status(500).json({ message: "DB Error", err });

    if (planRows.length === 0) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    const plan = planRows[0];

    const usageQuery = `
      SELECT COALESCE(SUM(usedUnits), 0) AS totalUsed
      FROM UsageRecords
      WHERE userId = ?
      AND MONTH(createdAt) = MONTH(CURRENT_DATE())
      AND YEAR(createdAt) = YEAR(CURRENT_DATE())
    `;

    db.query(usageQuery, [userId], (err, usageRows: any) => {
      if (err) return res.status(500).json({ message: "DB Error", err });

      const totalUsed = usageRows[0].totalUsed;
      const remainingUnits = Math.max(plan.monthlyQuota - totalUsed, 0);

      return res.json({
        userId: Number(userId),
        totalUnitsUsed: totalUsed,
        remainingUnits,
        activePlan: {
          planId: plan.planId,
          planName: plan.planName,
          monthlyQuota: plan.monthlyQuota,
          extraChargePerUnit: Number(plan.extraChargePerUnit),
        },
      });
    });
  });
});

// GET /users/:id/billing-summary
router.get("/users/:id/billing-summary", (req: Request, res: Response) => {
  const userId = req.params.id;

  const planQuery = `
    SELECT p.id as planId, p.name as planName, p.monthlyQuota, p.extraChargePerUnit
    FROM Subscriptions s
    JOIN Plans p ON s.planId = p.id
    WHERE s.userId = ? AND s.isActive = 1
    LIMIT 1
  `;

  db.query(planQuery, [userId], (err, planRows: any) => {
    if (err) return res.status(500).json({ message: "DB Error", err });

    if (planRows.length === 0) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    const plan = planRows[0];

    const usageQuery = `
      SELECT COALESCE(SUM(usedUnits), 0) AS totalUsed
      FROM UsageRecords
      WHERE userId = ?
      AND MONTH(createdAt) = MONTH(CURRENT_DATE())
      AND YEAR(createdAt) = YEAR(CURRENT_DATE())
    `;

    db.query(usageQuery, [userId], (err, usageRows: any) => {
      if (err) return res.status(500).json({ message: "DB Error", err });

      const totalUsed = usageRows[0].totalUsed;

      let extraUnits = 0;
      let extraCharges = 0;

      if (totalUsed > plan.monthlyQuota) {
        extraUnits = totalUsed - plan.monthlyQuota;
        extraCharges = extraUnits * plan.extraChargePerUnit;
      }

      extraCharges = Number(extraCharges.toFixed(2));

      return res.json({
        userId: Number(userId),
        totalUsage: totalUsed,
        planQuota: plan.monthlyQuota,
        extraUnits,
        extraCharges,
        activePlan: {
          planId: plan.planId,
          planName: plan.planName,
          monthlyQuota: plan.monthlyQuota,
          extraChargePerUnit: Number(plan.extraChargePerUnit),
        },
      });
    });
  });
});

export default router;
