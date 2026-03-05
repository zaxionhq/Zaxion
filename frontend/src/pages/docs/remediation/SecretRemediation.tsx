import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecretRemediation() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Remediation: Hardcoded Secrets</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Why was I blocked?</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Zaxion detected a high-entropy string that looks like a credential (API Key, Password, or Token).
              Committing secrets to git makes them public forever.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Fix</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong>Remove</strong> the secret from your code immediately.</li>
              <li><strong>Revoke</strong> the key in your provider's dashboard (AWS, Stripe, etc.).</li>
              <li><strong>Use Environment Variables</strong> instead:</li>
            </ol>
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-md mt-4">
{`// ❌ Bad
const apiKey = "sk_live_12345";

// ✅ Good
const apiKey = process.env.STRIPE_SECRET_KEY;`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
