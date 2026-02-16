// src/controllers/waitlist.controller.js
import { waitlistService } from "../services/waitlist.service.js";
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

    // 2. Delegate to Service
    const { existing, entry } = await waitlistService.join(db, {
      email,
      ipAddress: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"]
    });

    if (existing) {
      // Return success to avoid information leakage
      return res.status(200).json({
        success: true,
        message: "Protocol registration verified.",
      });
    }

    // 3. Trigger automated email handshake
    try {
      console.log(`[WaitlistController] Attempting to send welcome email to: ${email}`);
      await emailService.sendWaitlistWelcome(email.toLowerCase());
      console.log(`[WaitlistController] Welcome email sent successfully to: ${email}`);
    } catch (emailError) {
      console.error("[WaitlistController] Failed to send welcome email:", emailError);
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
    const entries = await waitlistService.getAll(db);

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
