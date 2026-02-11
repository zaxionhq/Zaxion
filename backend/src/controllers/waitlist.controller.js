// src/controllers/waitlist.controller.js
import { initDb } from "../models/index.js";
import { emailService } from "../services/email.service.js";

/**
 * Handle new waitlist join requests
 * POST /api/v1/waitlist
 */
export const joinWaitlist = async (req, res) => {
  try {
    const { email } = req.body;
    const db = req.app.locals.db;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required protocol metadata.",
      });
    }

    // 1. Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid protocol address (email format).",
      });
    }

    // 2. Check for duplicate entry
    const existingEntry = await db.Waitlist.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingEntry) {
      // Return success to avoid information leakage, but don't do anything
      return res.status(200).json({
        success: true,
        message: "Protocol registration verified.",
      });
    }

    // 3. Create new entry
    await db.Waitlist.create({
      email: email.toLowerCase(),
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      status: "PENDING",
    });

    // 4. Trigger automated email handshake (Email Service)
    try {
      await emailService.sendWaitlistWelcome(email.toLowerCase());
    } catch (emailError) {
      // We don't fail the request if email fails, but we log it
      console.error("[WaitlistController] Failed to send welcome email:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Protocol registration initiated. Check your inbox.",
    });
  } catch (error) {
    console.error("Waitlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Protocol failure during waitlist registration.",
    });
  }
};

/**
 * Get all waitlist entries (Admin only)
 * GET /api/v1/waitlist
 */
export const getWaitlist = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const entries = await db.Waitlist.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    console.error("Get Waitlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve protocol waitlist.",
    });
  }
};
