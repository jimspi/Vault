'use client';

import { useEffect, useState } from 'react';
import { FileText, Upload, Lightbulb, Sparkles, ArrowRight, CheckCircle, Target } from 'lucide-react';

export default function AnimatedDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const intervals = [
      400,  // Step 1: Show upload
      500, // Step 2: Document uploaded
      500, // Step 3: Custom insight
      500, // Step 4: AI generating
      600, // Step 5: Insights complete
      600, // Step 6: Recommendations
    ];

    let currentStep = 0;
    const timeouts: NodeJS.Timeout[] = [];

    intervals.forEach((_duration, index) => {
      const timeout = setTimeout(() => {
        currentStep = index + 1;
        setStep(currentStep);
        if (currentStep >= intervals.length) {
          // Reset animation
          setTimeout(() => {
            setStep(0);
          }, 500);
        }
      }, intervals.slice(0, index + 1).reduce((a, b) => a + b, 0));
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [step === 0]); // Re-run when animation resets

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Main animation container */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 rounded-2xl p-4 md:p-6 shadow-2xl border border-primary/20">
        <div className="space-y-4">
          {/* Step 1: Upload Document */}
          <div
            className={`transition-all duration-700 transform ${
              step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <div className="bg-background rounded-xl p-4 shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-3">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-500 ${
                    step >= 2 ? 'bg-green-500/20' : ''
                  }`}
                >
                  {step >= 2 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Upload className={`h-5 w-5 text-primary ${step === 1 ? 'animate-bounce' : ''}`} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Research-Paper.pdf</span>
                  </div>
                  <div className="mt-1.5">
                    {step === 1 && (
                      <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full animate-progress w-full" />
                      </div>
                    )}
                    {step >= 2 && (
                      <p className="text-xs text-green-600 font-medium">Uploaded & processed</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          {step >= 2 && (
            <div className="flex justify-center">
              <ArrowRight
                className={`h-6 w-6 text-primary transition-all duration-500 ${
                  step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                }`}
              />
            </div>
          )}

          {/* Step 2: Custom Insight */}
          {step >= 3 && (
            <div
              className={`transition-all duration-700 transform ${
                step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <div className="bg-background rounded-xl p-4 shadow-lg border border-border hover:shadow-xl transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Manual Insight Added</span>
                      <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                        Custom
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Key findings from quarterly review meeting...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Arrow */}
          {step >= 3 && (
            <div className="flex justify-center">
              <ArrowRight
                className={`h-6 w-6 text-primary transition-all duration-500 ${
                  step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                }`}
              />
            </div>
          )}

          {/* Step 3: AI Generating */}
          {step >= 4 && (
            <div
              className={`transition-all duration-700 transform ${
                step >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 rounded-xl p-4 shadow-lg border border-purple-500/20 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Sparkles className={`h-6 w-6 text-purple-500 ${step === 4 ? 'animate-pulse' : ''}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">
                        {step === 4 ? 'AI Analyzing Documents...' : 'AI Insights Generated'}
                      </span>
                      {step >= 5 && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    {step === 4 && (
                      <div className="mt-2 flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: AI Insights Results */}
          {step >= 5 && (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-3 transition-all duration-700 transform ${
                step >= 5 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <div className="bg-background rounded-lg p-3 shadow border border-border hover:shadow-lg transition-all hover:scale-105">
                <div className="flex items-start space-x-2">
                  <Sparkles className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-primary">Pattern Detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recurring theme across 3 documents
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 shadow border border-border hover:shadow-lg transition-all hover:scale-105">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-600">Suggestion</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consider consolidating findings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Arrow */}
          {step >= 5 && (
            <div className="flex justify-center">
              <ArrowRight
                className={`h-6 w-6 text-primary transition-all duration-500 ${
                  step >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                }`}
              />
            </div>
          )}

          {/* Step 5: Actionable Recommendations */}
          {step >= 6 && (
            <div
              className={`transition-all duration-700 transform ${
                step >= 6 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <div className="bg-gradient-to-r from-green-500/10 to-primary/10 rounded-xl p-4 shadow-lg border border-green-500/20 hover:shadow-xl transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-green-600">Actionable Recommendations</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      3 personalized recommendations with action steps
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Network with industry peers</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Schedule follow-up meeting</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
}
