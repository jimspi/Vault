'use client';

import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, FileText, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface InsightGenerationOverlayProps {
  documentCount: number;
}

export default function InsightGenerationOverlay({ documentCount }: InsightGenerationOverlayProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const steps = [
      500,   // Step 1: Analyzing documents
      1500,  // Step 2: Finding patterns
      1500,  // Step 3: Generating insights
    ];

    const timeouts: NodeJS.Timeout[] = [];

    steps.forEach((_duration, index) => {
      const timeout = setTimeout(() => {
        setStep(index + 1);
      }, steps.slice(0, index + 1).reduce((a, b) => a + b, 0));
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20 shadow-2xl">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Sparkles className="h-12 w-12 text-purple-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Generating AI Insights</h2>
              <p className="text-muted-foreground">
                Analyzing {documentCount} {documentCount === 1 ? 'document' : 'documents'}...
              </p>
            </div>

            {/* Step 1: Analyzing Documents */}
            <div
              className={`transition-all duration-700 transform ${
                step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <div className="bg-background rounded-xl p-6 shadow-lg border border-border">
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 ${
                      step >= 2 ? 'bg-green-500/20' : 'bg-primary/10'
                    }`}
                  >
                    {step >= 2 ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <FileText className="h-6 w-6 text-primary animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {step >= 2 ? 'Documents analyzed' : 'Analyzing documents...'}
                    </p>
                    {step < 2 && (
                      <div className="mt-2 h-2 bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full animate-progress w-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Finding Patterns */}
            {step >= 2 && (
              <div
                className={`transition-all duration-700 transform ${
                  step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                <div className="bg-background rounded-xl p-6 shadow-lg border border-border">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 ${
                        step >= 3 ? 'bg-green-500/20' : 'bg-blue-500/10'
                      }`}
                    >
                      {step >= 3 ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <Lightbulb className="h-6 w-6 text-blue-500 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {step >= 3 ? 'Patterns identified' : 'Finding patterns and connections...'}
                      </p>
                      {step === 2 && (
                        <div className="mt-3 flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Generating */}
            {step >= 3 && (
              <div
                className={`transition-all duration-700 transform ${
                  step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 rounded-xl p-6 shadow-lg border border-purple-500/20">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Creating insights...</p>
                      <div className="mt-3 flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Decorative blur elements */}
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
}
