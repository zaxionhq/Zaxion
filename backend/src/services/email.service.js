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
            subject: "Zaxion Protocol: Registration Verified",
            html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Zaxion</title>
        <style>
            /* Base Reset */
            body { 
                margin: 0; 
                padding: 0; 
                background-color: #050505; /* Deep Black Background */
                color: #ffffff; 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                -webkit-font-smoothing: antialiased; 
                line-height: 1.6;
            }
            
            /* Wrapper */
            .wrapper {
                width: 100%;
                background-color: #050505;
                padding: 60px 0;
            }
            
            /* Container */
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #0a0a0a; /* Slightly lighter card */
                border: 1px solid #262626;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            }

            /* Header with Logo */
            .header {
                padding: 40px;
                text-align: center;
                background-color: #ffffff; /* White background for black logo */
                border-bottom: 1px solid #e5e5e5;
            }
            .logo-text {
                font-size: 24px;
                font-weight: 800;
                letter-spacing: 0.15em;
                color: #000000; /* Black text for fallback */
                text-transform: uppercase;
                display: inline-block;
            }
            .logo-img {
                max-width: 140px;
                height: auto;
                display: block;
                margin: 0 auto;
                pointer-events: none; /* Prevent interaction/download button on some clients */
                user-select: none;
            }

            /* Main Content */
            .content {
                padding: 48px;
            }

            /* Typography */
            .eyebrow {
                font-size: 12px;
                color: #10b981; /* Brand Green */
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                text-align: center;
                margin-bottom: 12px;
                display: block;
            }

            h1 {
                font-size: 32px;
                font-weight: 700;
                color: #ffffff;
                margin: 0 0 24px 0;
                text-align: center;
                letter-spacing: -0.03em;
                line-height: 1.1;
            }
            
            p {
                font-size: 16px;
                color: #a3a3a3;
                margin-bottom: 24px;
                text-align: center;
                max-width: 480px;
                margin-left: auto;
                margin-right: auto;
            }

            /* Feature/Explanation Section */
            .feature-box {
                background-color: #111111;
                border: 1px solid #262626;
                border-radius: 8px;
                padding: 32px;
                margin-top: 40px;
                text-align: left;
            }
            .feature-title {
                font-size: 14px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 24px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .feature-dot {
                width: 6px;
                height: 6px;
                background-color: #10b981; /* Brand Green */
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
            }
            
            /* List Styles */
            .feature-item {
                margin-bottom: 24px;
            }
            .feature-item:last-child {
                margin-bottom: 0;
            }
            .feature-header {
                font-size: 13px;
                font-weight: 700;
                color: #e5e5e5;
                display: block;
                margin-bottom: 6px;
                font-family: 'Inter', sans-serif;
            }
            .feature-text {
                font-size: 14px;
                color: #888888;
                margin: 0;
                line-height: 1.5;
            }

            /* Signature */
            .signature {
                margin-top: 40px;
                text-align: center;
                font-size: 14px;
                color: #d4d4d4;
                line-height: 1.6;
            }
            .signature strong {
                color: #ffffff;
                font-weight: 600;
            }

            /* Footer */
            .footer {
                padding: 32px;
                text-align: center;
                border-top: 1px solid #1a1a1a;
                background-color: #080808;
            }
            .footer-text {
                font-size: 12px;
                color: #404040;
            }
        </style>
    </head>
    <body>

        <div class="wrapper">
            <div class="container">
                <!-- Header / Logo -->
                <div class="header">
                <!-- Fallback to text if image fails to load in preview -->
<div class="header">
                <img src="https://api.zaxion.dev/public/logo.png" alt="ZAXION" class="logo-img" draggable="false">
            </div>

                <!-- Content -->
                <div class="content">
                    <!-- Eyebrow -->
                    <span class="eyebrow">Registration Verified.</span>

                    <!-- Headline -->
                    <h1>Welcome to the Protocol.</h1>
                    
                    <p>
                        Your request to join the Zaxion Waitlist has been confirmed. You have secured a position in our upcoming priority release cohort.
                    </p>

                    <!-- What is Zaxion? -->
                    <div class="feature-box">
                        <div class="feature-title">
                            <div class="feature-dot"></div>
                            What is Zaxion?
                        </div>
                        
                        <p class="feature-text" style="margin-bottom: 24px;">
                            Zaxion is an AI-powered PR Governor that enforces institutional quality standards. We automate test generation and provide cryptographic proof of code integrity before any merge.
                        </p>

                        <div class="feature-item">
                            <span class="feature-header">01. Deterministic Delivery</span>
                            <p class="feature-text">
                                We replace manual approvals with cryptographic proofs. Zaxion guarantees that the code you reviewed is bit-for-bit identical to the code running in production.
                            </p>
                        </div>

                        <div class="feature-item">
                            <span class="feature-header">02. Policy-Driven Execution</span>
                            <p class="feature-text">
                                Compliance is compiled, not checked. Security policies are enforced at the pipeline level, preventing non-compliant artifacts from ever reaching your infrastructure.
                            </p>
                        </div>

                        <div class="feature-item">
                            <span class="feature-header">03. Immutable Audit Trails</span>
                            <p class="feature-text">
                                Every deployment action is signed and recorded on a tamper-proof ledger. Eliminate the gap between intent and execution with zero-trust traceability.
                            </p>
                        </div>
                    </div>

                    <!-- Signature -->
                    <div class="signature">
                        Stay secure,<br>
                        <strong>The Zaxion Core Team</strong>
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <div class="footer-text">
                        &copy; 2026 Zaxion Inc. <br>
                        Automated System Notification
                    </div>
                </div>
            </div>
        </div>

    </body>
    </html>
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
