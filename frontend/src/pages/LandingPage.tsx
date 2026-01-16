import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, CheckCircle2, Zap, Github, ArrowRight, Lock, ListChecks, GitPullRequest } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Zaxion</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com/apps/zaxion-guard" target="_blank" rel="noopener noreferrer">
                Documentation
              </a>
            </Button>
            <Button size="sm" asChild>
              <a href="https://github.com/apps/zaxion-guard" target="_blank" rel="noopener noreferrer" className="gap-2">
                <Github className="h-4 w-4" />
                Install on GitHub
              </a>
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 border border-primary/20">
            <Lock className="h-3 w-3" />
            DETERMINISTIC PR QUALITY GATE
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
            Stop shipping high-risk code without <span className="text-primary">Zaxion Guard</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Zaxion is an AI-powered PR Guard that detects risks at merge-time and guides developers to resolve them deterministically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2" asChild>
              <a href="https://github.com/apps/zaxion-guard" target="_blank" rel="noopener noreferrer">
                Get Started for Free
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold" asChild>
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">The Problem with PR Quality</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Legacy test coverage tools are reactive and noisy. Developers ignore them, and critical code paths often ship without proper verification.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Blind Spots",
                  description: "High-risk files (auth, payments, core logic) are modified without new tests, increasing production risk.",
                  icon: Shield
                },
                {
                  title: "Manual Review Fatigue",
                  description: "Senior engineers spend hours manually checking if PRs have sufficient test coverage for complex changes.",
                  icon: Zap
                },
                {
                  title: "Missing Context",
                  description: "Traditional CI tools tell you what's wrong, but never show you exactly how to fix it within your workflow.",
                  icon: ListChecks
                }
              ].map((item, i) => (
                <Card key={i} className="border-none shadow-none bg-background">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 3-Step Process */}
        <section id="how-it-works" className="py-20 container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">The 3-Step Resolution Path</h2>
            <p className="text-muted-foreground">From a blocked PR to a safe merge in minutes.</p>
          </div>
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-[20px] top-0 bottom-0 w-px bg-border hidden md:block" />
            <div className="space-y-12">
              {[
                {
                  step: "01",
                  title: "Enforcement",
                  description: "A developer opens a PR. Zaxion runs as a GitHub Check and identifies policy violations (e.g., modified core files without tests).",
                  icon: GitPullRequest,
                  badge: "GitHub"
                },
                {
                  step: "02",
                  title: "Resolution Handoff",
                  description: "If blocked, GitHub presents a deep-link: 'Fix with Zaxion'. The developer is routed to a context-aware Resolution Workspace.",
                  icon: ArrowRight,
                  badge: "Zaxion Guard"
                },
                {
                  step: "03",
                  title: "AI-Assisted Fix",
                  description: "Zaxion Advisor provides the rationale and AI-generated test code to satisfy the policy. Commit the fix and merge safely.",
                  icon: CheckCircle2,
                  badge: "Zaxion Advisor"
                }
              ].map((item, i) => (
                <div key={i} className="flex flex-col md:flex-row gap-6 relative">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold z-10 shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-bold uppercase mb-2">
                      {item.badge}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to secure your merge pipeline?</h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Install the Zaxion GitHub App and start enforcing high-quality test standards today.
            </p>
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold gap-2" asChild>
              <a href="https://github.com/apps/zaxion-guard" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
                Install on GitHub
              </a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Shield className="h-5 w-5" />
            <span className="font-bold">Zaxion</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2026 Zaxion. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
