// src/services/email.service.js
import { Resend } from "resend";
import env from "../config/env.js";
import { log, warn, error } from "../utils/logger.js";

/**
 * Email Service
 * Handles all protocol-level communications using Resend HTTP API.
 * Replaces legacy SMTP/Nodemailer implementation.
 */
class EmailService {
  constructor() {
    this.client = null;
    this.init();
  }

  /**
   * Initialize Resend Client
   */
  init() {
    log("[EmailService] Initializing Resend client...");

    if (!env.RESEND_API_KEY) {
      warn("[EmailService] RESEND_API_KEY missing. Email delivery disabled.");
      return;
    }

    try {
      this.client = new Resend(env.RESEND_API_KEY);
      log("[EmailService] Resend client initialized successfully.");
    } catch (err) {
      error("[EmailService] Failed to initialize Resend client:", err);
    }
  }

  /**
   * Send Waitlist Welcome Email
   * @param {string} to - User email
   */
  async sendWaitlistWelcome(to) {
    if (!this.client) {
      const msg = "[EmailService] Cannot send email: Resend client not initialized.";
      warn(msg);
      throw new Error(msg); // Throw so BullMQ can retry or fail the job
    }

    log(`[EmailService] Attempting to send welcome email to: ${to}`);

    try {
      const { data, error: resendError } = await this.client.emails.send({
        from: env.EMAIL_FROM,
        to: [to],
        subject: "Zaxion Protocol: Waitlist Registration Confirmed",
        html: `
        <div style="background-color: #050505; color: #ffffff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #1a1a1a;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.05em; margin: 0;">ZAXION <span style="color: #6366f1;">PROTOCOL</span></h1>
          </div>
          
          <div style="line-height: 1.6; font-size: 16px;">
            <p><strong>Registration Verified.</strong></p>
            <p>Your request to join the Zaxion Governance Waitlist has been recorded in the protocol vault.</p>
            
            <div style="background-color: #0a0a0a; border: 1px solid #1a1a1a; padding: 20px; border-radius: 4px; margin: 30px 0;">
              <p style="margin: 0; color: #888; font-size: 14px;">STATUS</p>
              <p style="margin: 5px 0 0 0; color: #10b981; font-weight: bold; letter-spacing: 1px;">WAITLISTED · PRIORITY ACCESS</p>
            </div>

            <p>Zaxion is the first deterministic governance layer for high-risk software delivery. By joining early, you are prioritized for our upcoming beta release.</p>
            
            <p style="margin-top: 40px;">Stay secure,</p>
            <p><strong>The Zaxion Core Team</strong></p>
          </div>
        </div>
        `
      });

      if (resendError) {
        // Resend API returned an error object
        error(`[EmailService] Resend API Error for ${to}:`, resendError);
        throw new Error(`Resend API Error: ${resendError.message}`);
      }

      log(`[EmailService] Email sent successfully. ID: ${data?.id}`);
      return data;

    } catch (err) {
      // Network or other unexpected errors
      error(`[EmailService] Critical failure sending email to ${to}:`, err);
      throw err; // Ensure BullMQ knows it failed
    }
  }
}

export const emailService = new EmailService();
