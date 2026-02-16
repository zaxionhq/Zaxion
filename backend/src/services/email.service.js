// src/services/email.service.js
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dns from "node:dns";
import env from "../config/env.js";
import { log, warn, error } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Service
 * Handles all protocol-level communications.
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  /**
   * Initialize SMTP transporter
   */
  init() {
    log("[EmailService] Initializing with:", { 
      host: env.SMTP_HOST, 
      user: env.SMTP_USER, 
      passLength: env.SMTP_PASS ? env.SMTP_PASS.length : 0 
    });

    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      warn("[EmailService] SMTP credentials missing. Email delivery disabled.");
      return;
    }

    // --- STRATEGY 1: OAuth2 (Enterprise/Gmail API) ---
    // Preferred: Uses tokens instead of raw credentials, not blocked by IP location.
    if (env.GMAIL_CLIENT_ID && env.GMAIL_REFRESH_TOKEN) {
      log("[EmailService] Configuring OAuth2 transport (Gmail API)...");
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: env.SMTP_USER,
          clientId: env.GMAIL_CLIENT_ID,
          clientSecret: env.GMAIL_CLIENT_SECRET,
          refreshToken: env.GMAIL_REFRESH_TOKEN,
        },
      });

      this.verifyTransporter();
      return;
    }

    // --- STRATEGY 2: Legacy SMTP (App Password) ---
    // Fallback: Uses manual IP resolution to bypass IPv6 blocks on Railway.
    // Force resolve to IPv4 first to bypass Railway IPv6 issues
    dns.resolve4(env.SMTP_HOST, (err, addresses) => {
      let hostToUse = env.SMTP_HOST;
      if (!err && addresses && addresses.length > 0) {
        hostToUse = addresses[0];
        log(`[EmailService] Resolved ${env.SMTP_HOST} to IPv4: ${hostToUse}`);
      } else {
        warn(`[EmailService] DNS resolution failed, using hostname: ${env.SMTP_HOST}`, err);
      }

      this.transporter = nodemailer.createTransport({
        host: hostToUse,
        port: 587,
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        tls: {
          servername: env.SMTP_HOST, // Necessary for TLS when using IP
        },
        family: 4, // Double enforcement
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      this.verifyTransporter();
    });
  }

  verifyTransporter() {
    this.transporter.verify((verifyErr, success) => {
      if (verifyErr) {
        warn("[EmailService] Transporter verification failed (Will retry on send):", { error: verifyErr.message });
      } else {
        log("[EmailService] Transporter ready for protocol handshake.");
      }
    });
  }

  /**
   * Send Waitlist Welcome Email
   * @param {string} to - User email
   */
  async sendWaitlistWelcome(to) {
    if (!this.transporter) {
      warn("[EmailService] Cannot send email: Transporter not initialized.");
      return;
    }

    const mailOptions = {
      from: env.SMTP_FROM,
      to,
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
          
          <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #1a1a1a; text-align: center; color: #444; font-size: 12px;">
            <p>© 2026 Zaxion Protocol. All data encrypted at rest.</p>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      log("[EmailService] Welcome email sent to:", { to, messageId: info.messageId });
      return info;
    } catch (err) {
      error("[EmailService] Failed to send welcome email:", { error: err.message });
      throw err;
    }
  }
}

export const emailService = new EmailService();
