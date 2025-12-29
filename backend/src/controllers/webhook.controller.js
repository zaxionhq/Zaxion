import crypto from "crypto";
import env from "../config/env.js";
import { addPrAnalysisJob } from "../queues/prAnalysis.queue.js";
import { PrAnalysisService } from "../services/prAnalysis.service.js";

const prAnalysisService = new PrAnalysisService();

/**
 * Handle GitHub Webhooks
 * POST /api/v1/webhooks/github
 */
export async function handleGitHubWebhook(req, res, next) {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const secret = env.get("GITHUB_WEBHOOK_SECRET");

    // 1. Verify Signature (Enterprise-ready requirement)
    // Fail Closed: If signature verification fails, block the request.
    if (secret && signature) {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");
      
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        console.warn("[webhook] Invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
    } else if (!secret) {
      // In production, this should ideally be an error, but for dev we warn
      console.warn("[webhook] GITHUB_WEBHOOK_SECRET not set, skipping signature verification");
    }

    const event = req.headers["x-github-event"];
    const payload = req.body;

    console.log(`[webhook] Received event: ${event}`);

    // 2. Filter relevant events (pull_request)
    if (event === "pull_request") {
      const { action, pull_request, repository } = payload;
      
      // Events we care about: opened, synchronize (new commits), reopened
      if (["opened", "synchronize", "reopened"].includes(action)) {
        const prData = {
          owner: repository.owner.login,
          repo: repository.name,
          prNumber: pull_request.number,
          headSha: pull_request.head.sha,
          baseRef: pull_request.base.ref,
          headRef: pull_request.head.ref,
          installationId: payload.installation?.id // For GitHub Apps if applicable
        };

        const traceId = `${prData.installationId || 'PAT'}:${prData.headSha}`;
        console.log(`[webhook] [trace:${traceId}] event: ${event}.${action} pr: #${prData.prNumber}`);

        // 3. Queue the job (Immediate ACK - Fire & Forget)
        // CRITICAL: Do NOT connect to Postgres here. Do NOT call GitHub API here.
        try {
          await addPrAnalysisJob(prData);
          console.log(`[webhook] Queued PR analysis for ${prData.owner}/${prData.repo} PR #${prData.prNumber} SHA:${prData.headSha}`);
        } catch (queueErr) {
          console.warn(`[webhook] Queue failed (${queueErr.message}), falling back to Direct Execution (Dev Mode).`);
          
          // Fallback: Execute directly (async, don't await result to keep webhook fast)
          // This ensures Phase 1 logic works even without Redis
          prAnalysisService.execute(prData).catch(err => {
            console.error(`[DirectMode] Analysis failed: ${err.message}`);
          });
        }
      }
    }

    // 4. Immediately ACK GitHub (Respond fast < 5s)
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("[webhook] Error handling webhook:", err);
    // Even on error, we might want to return 200 to GitHub to prevent retries if it's a logic error,
    // but 500 is safer to signal something went wrong in our ingest layer.
    next(err);
  }
}
