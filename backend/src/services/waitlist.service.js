// src/services/waitlist.service.js
import logger from "../logger.js";

/**
 * Waitlist Service
 * Handles core logic for waitlist management to isolate database access from controllers.
 */
class WaitlistService {
  /**
   * Add a new user to the waitlist
   * @param {object} db - Database instance
   * @param {object} data - { email, ipAddress, userAgent }
   * @returns {Promise<object>} The created or existing entry
   */
  async join(db, { email, ipAddress, userAgent }) {
    const normalizedEmail = email.toLowerCase();

    // 1. Check for duplicate entry
    const existingEntry = await db.Waitlist.findOne({
      where: { email: normalizedEmail },
    });

    if (existingEntry) {
      return { existing: true, entry: existingEntry };
    }

    // 2. Create new entry
    const newEntry = await db.Waitlist.create({
      email: normalizedEmail,
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown",
      status: "PENDING",
    });

    return { existing: false, entry: newEntry };
  }

  /**
   * Get all waitlist entries
   * @param {object} db - Database instance
   * @returns {Promise<Array>} List of waitlist entries
   */
  async getAll(db) {
    return await db.Waitlist.findAll({
      order: [["createdAt", "DESC"]],
    });
  }
}

export const waitlistService = new WaitlistService(); 
