import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, FileText, Search, Sparkles, Target, Clock } from 'lucide-react';
import AnimatedDemo from '@/components/home/AnimatedDemo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Vault</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <section className="py-6 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Your AI-Powered
              <span className="text-primary"> Continual Memory</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Store, analyze, and surface insights from all your content. Vault uses advanced AI
              to help you remember everything, understand patterns, and discover connections.
            </p>
            <div className="flex justify-center pt-2">
              <Link href="/signup">
                <Button size="lg">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Animated Demo Section - Prominent and visible */}
        <section className="py-4 pb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">See How It Works</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Watch Vault transform your documents into actionable insights and recommendations
            </p>
          </div>
          <AnimatedDemo />
        </section>

        {/* Features Section */}
        <section className="py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-card">
              <FileText className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Multi-Format Upload</h3>
              <p className="text-muted-foreground">
                Upload PDFs, Word docs, images, and text files. Automatic OCR and content
                extraction.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Search className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Semantic Search</h3>
              <p className="text-muted-foreground">
                Find content by meaning, not just keywords. Powered by advanced vector embeddings.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Sparkles className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Insights</h3>
              <p className="text-muted-foreground">
                Automatically detect patterns, contradictions, and trends across your documents.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Target className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Actionable Recommendations</h3>
              <p className="text-muted-foreground">
                Get personalized, AI-powered recommendations with specific action steps and real resources tailored to your goals.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Clock className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Time Machine</h3>
              <p className="text-muted-foreground">
                Navigate your knowledge chronologically and track how information evolves.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Profile Summary</h3>
              <p className="text-muted-foreground">
                See what your AI assistant has learned about your interests, goals, and patterns over time.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Ready to build your knowledge vault?</h2>
            <p className="text-lg text-muted-foreground">
              Start with 100 documents free. No credit card required.
            </p>
            <Link href="/signup">
              <Button size="lg">
                Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 Vault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
