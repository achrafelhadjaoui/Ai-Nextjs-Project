'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Rocket
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    businessType: '',
    teamSize: '',
    useCases: [] as string[],
  });
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    // Check if already onboarded
    const done = localStorage.getItem('onboarding_done');
    if (done) {
      router.push('/dashboard');
    }
  }, [router, user, loading]);

  const steps: Step[] = [
    {
      id: 0,
      title: 'Welcome to Farisly AI!',
      description: 'Let\'s get you set up in just a few steps',
      icon: <Sparkles className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">What you'll get:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">AI-powered saved replies for faster communication</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Customizable templates for every situation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Analytics to track your productivity</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">Browser extension for seamless integration</span>
              </li>
            </ul>
          </div>
          <p className="text-gray-400 text-center">
            This will only take 2 minutes
          </p>
        </div>
      ),
    },
    {
      id: 1,
      title: 'What best describes you?',
      description: 'Help us personalize your experience',
      icon: <Users className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          {[
            { value: 'individual', label: 'Individual / Freelancer', desc: 'Working solo or on personal projects' },
            { value: 'small_team', label: 'Small Team (2-10)', desc: 'Collaborating with a small group' },
            { value: 'company', label: 'Company (10+)', desc: 'Part of a larger organization' },
            { value: 'agency', label: 'Agency / Service Provider', desc: 'Managing multiple clients' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFormData({ ...formData, businessType: option.value })}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                formData.businessType === option.value
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-800 bg-[#111111] hover:border-gray-700'
              }`}
            >
              <div className="font-semibold text-white mb-1">{option.label}</div>
              <div className="text-sm text-gray-400">{option.desc}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      id: 2,
      title: 'How large is your team?',
      description: 'We\'ll tailor features to your team size',
      icon: <Users className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          {[
            { value: 'solo', label: 'Just me', icon: '👤' },
            { value: '2-5', label: '2-5 people', icon: '👥' },
            { value: '6-20', label: '6-20 people', icon: '👨‍👩‍👧‍👦' },
            { value: '20+', label: '20+ people', icon: '🏢' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFormData({ ...formData, teamSize: option.value })}
              className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 transition-all ${
                formData.teamSize === option.value
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-800 bg-[#111111] hover:border-gray-700'
              }`}
            >
              <span className="text-3xl">{option.icon}</span>
              <span className="font-semibold text-white">{option.label}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      id: 3,
      title: 'What will you use Farisly AI for?',
      description: 'Select all that apply',
      icon: <Zap className="w-8 h-8" />,
      content: (
        <div className="space-y-3">
          {[
            { value: 'customer_support', label: 'Customer Support', icon: '💬' },
            { value: 'sales', label: 'Sales & Outreach', icon: '📈' },
            { value: 'social_media', label: 'Social Media Management', icon: '📱' },
            { value: 'email', label: 'Email Responses', icon: '📧' },
            { value: 'internal', label: 'Internal Communication', icon: '👔' },
            { value: 'other', label: 'Other', icon: '✨' },
          ].map((option) => {
            const isSelected = formData.useCases.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => {
                  const newUseCases = isSelected
                    ? formData.useCases.filter((uc) => uc !== option.value)
                    : [...formData.useCases, option.value];
                  setFormData({ ...formData, useCases: newUseCases });
                }}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-800 bg-[#111111] hover:border-gray-700'
                }`}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="font-medium text-white">{option.label}</span>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-purple-400 ml-auto" />
                )}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      id: 4,
      title: 'You\'re all set!',
      description: 'Ready to boost your productivity',
      icon: <Rocket className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Welcome aboard!</h3>
            <p className="text-gray-300 mb-6">
              Your personalized workspace is ready. Let's start creating your first saved reply.
            </p>
          </div>

          <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-3">Next Steps:</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                Install the browser extension
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                Create your first saved reply
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                Explore AI-powered templates
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save onboarding data to backend (optional)
      console.log('Onboarding data:', formData);

      // Mark onboarding as complete
      localStorage.setItem('onboarding_done', 'true');

      // Redirect to dashboard
      router.push('/dashboard');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skip = () => {
    localStorage.setItem('onboarding_done', 'true');
    router.push('/dashboard');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const canProceed = () => {
    if (currentStep === 1) return formData.businessType !== '';
    if (currentStep === 2) return formData.teamSize !== '';
    if (currentStep === 3) return formData.useCases.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={skip}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-[#111111] border border-gray-800 rounded-2xl p-8"
          >
            {/* Icon & Title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
                {steps[currentStep].icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {steps[currentStep].title}
                </h2>
                <p className="text-gray-400 text-sm">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">{steps[currentStep].content}</div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentStep === 0
                    ? 'opacity-0 pointer-events-none'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i === currentStep
                        ? 'w-8 bg-gradient-to-r from-purple-500 to-blue-500'
                        : i < currentStep
                        ? 'w-2 bg-purple-500/50'
                        : 'w-2 bg-gray-700'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  canProceed()
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
