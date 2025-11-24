import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Database, FileText, Sparkles, Upload, Zap, ArrowRight, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      id: "what-is-kenly",
      question: "What is Kenly?",
      answer: "Kenly is an AI-powered client onboarding platform designed for agencies and service-based businesses. It streamlines the client intake process by providing a centralized workspace where clients can complete forms, upload files, sign contracts, and track project progress—all from one branded portal."
    },
    {
      id: "who-is-kenly-for",
      question: "Who is Kenly for?",
      answer: "Kenly is built for creative agencies, digital agencies, marketing firms, consulting businesses, and freelancers who want to streamline their client onboarding process. If you're spending hours each week chasing clients for information, forms, or files, Kenly is for you."
    },
    {
      id: "how-does-pricing-work",
      question: "How does pricing work?",
      answer: "Kenly uses simple per-user pricing. You pay only for active team members who need access to the platform. All plans include unlimited clients and unlimited team members. We offer three tiers: Basic ($29/user/month), Pro ($49/user/month), and Enterprise (custom pricing). Each plan has different storage limits, automation runs, and e-signature allowances."
    },
    {
      id: "what-are-automation-runs",
      question: "What are automation runs?",
      answer: "Automation runs are triggered actions that happen automatically when certain conditions are met, such as sending an email when a form is submitted, updating a client status, or creating a task. Each plan includes a certain number of automation runs per user per month. Basic includes 25 runs, Pro includes 100 runs, and Enterprise includes unlimited runs."
    },
    {
      id: "can-i-try-kenly-for-free",
      question: "Can I try Kenly for free?",
      answer: "Yes! Kenly offers a free trial with no credit card required. You can explore all features, create client portals, and test the platform with your team before committing to a paid plan. The trial gives you full access to Pro features so you can experience everything Kenly has to offer."
    },
    {
      id: "how-long-does-setup-take",
      question: "How long does setup take?",
      answer: "Most agencies are up and running with their first client portal in under 30 minutes. You can create a branded intake form, customize your portal appearance, and send your first client invitation in just a few clicks. No technical expertise required."
    },
    {
      id: "can-i-customize-branding",
      question: "Can I customize the branding?",
      answer: "Yes! Basic plans allow you to add your logo. Pro and Enterprise plans offer full white-label branding including custom colors, fonts, and the ability to remove all Kenly branding. Your clients will see a completely branded experience that matches your agency's identity."
    },
    {
      id: "what-file-types-supported",
      question: "What file types are supported?",
      answer: "Kenly supports all common file types including documents (PDF, DOCX, XLSX), images (JPG, PNG, GIF, SVG), videos (MP4, MOV), and compressed files (ZIP, RAR). All files are securely stored with encryption and access controls based on your organization's settings."
    },
    {
      id: "how-secure-is-my-data",
      question: "How secure is my data?",
      answer: "Security is our top priority. All data is encrypted at rest and in transit using industry-standard protocols. We implement row-level security to ensure complete data isolation between organizations. Each file upload is scanned, and we maintain detailed activity logs for audit trails. Your data is stored on secure, enterprise-grade infrastructure."
    },
    {
      id: "can-clients-access-portal-mobile",
      question: "Can clients access the portal on mobile?",
      answer: "Absolutely! Kenly is fully responsive and works seamlessly on desktop, tablet, and mobile devices. Your clients can complete forms, upload files, and check their progress from any device with an internet connection."
    },
    {
      id: "what-happens-when-limit-reached",
      question: "What happens when I reach my usage limits?",
      answer: "When you approach your storage, automation, or e-signature limits, you'll receive notifications prompting you to upgrade. Actions are blocked gracefully with clear messaging, so you're never caught off guard. Usage resets monthly, and you can upgrade your plan at any time to increase your limits."
    },
    {
      id: "can-i-integrate-other-tools",
      question: "Can I integrate with other tools?",
      answer: "Kenly offers webhook integrations that allow you to connect with thousands of other tools through platforms like Zapier or Make. Enterprise plans include custom integrations and dedicated API access for deeper connections with your existing tech stack."
    },
    {
      id: "how-many-team-members",
      question: "How many team members can I add?",
      answer: "All plans include unlimited team members. You only pay for the active users who need access to manage clients and forms. This means your entire team can collaborate without worrying about per-seat restrictions."
    },
    {
      id: "what-support-included",
      question: "What support is included?",
      answer: "Basic plans include email support with response times within 24-48 hours. Pro plans add priority email and chat support. Enterprise plans include a dedicated account manager and priority support with guaranteed response times via a dedicated Slack channel."
    },
    {
      id: "can-i-cancel-anytime",
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time with no penalties or cancellation fees. Your data remains accessible until the end of your billing period, and you can export all client information and files before canceling."
    }
  ];

  const filteredFaqs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Kenly",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Client Management Software",
        "operatingSystem": "Web Browser",
        "offers": [
          {
            "@type": "Offer",
            "name": "Basic Plan",
            "price": "29",
            "priceCurrency": "USD",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "29",
              "priceCurrency": "USD",
              "unitText": "user per month"
            }
          },
          {
            "@type": "Offer",
            "name": "Pro Plan",
            "price": "49",
            "priceCurrency": "USD",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "49",
              "priceCurrency": "USD",
              "unitText": "user per month"
            }
          },
          {
            "@type": "Offer",
            "name": "Enterprise Plan",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Custom pricing available"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5",
          "ratingCount": "3",
          "bestRating": "5",
          "worstRating": "1"
        },
        "description": "AI-powered client onboarding platform that automates intake forms, file uploads, contract management, and follow-ups for creative and digital agencies.",
        "featureList": [
          "Custom Intake Forms",
          "Smart File Uploads",
          "Automated Follow-ups",
          "AI Client Summaries",
          "Task Management",
          "Contract Management",
          "Invoice Tracking",
          "Team Collaboration",
          "Progress Tracking",
          "Branded Client Portal"
        ],
        "screenshot": "https://storage.googleapis.com/gpt-engineer-file-uploads/dWvqdtRAVib2R32OIdhn88PchYE2/social-images/social-1763487156994-dfff6f05129d42b1ae07a864d874096e.jpg",
        "softwareVersion": "1.0",
        "author": {
          "@type": "Organization",
          "name": "Kenly"
        }
      },
      {
        "@type": "Organization",
        "name": "Kenly",
        "url": "https://kenly.app",
        "logo": {
          "@type": "ImageObject",
          "url": "https://storage.googleapis.com/gpt-engineer-file-uploads/dWvqdtRAVib2R32OIdhn88PchYE2/social-images/social-1763487156994-dfff6f05129d42b1ae07a864d874096e.jpg"
        },
        "description": "Kenly provides AI-powered client onboarding and management solutions for agencies and service-based businesses.",
        "sameAs": [
          "https://twitter.com/kenly"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Customer Support",
          "availableLanguage": "English"
        }
      },
      {
        "@type": "WebApplication",
        "name": "Kenly",
        "url": "https://kenly.app",
        "description": "Professional client portal and onboarding automation platform for agencies",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5",
          "reviewCount": "3"
        },
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": "29",
          "highPrice": "49",
          "priceCurrency": "USD",
          "offerCount": "3"
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Kenly</span>
            </div>
            <div className="hidden items-center gap-8 md:flex">
              <a
                href="#problem"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Problem
              </a>
              <a
                href="#solution"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Solution
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                FAQ
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero" size="default">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-hero py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              <Sparkles className="h-4 w-4" />
              AI-Powered Client Onboarding
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl text-balance">
              The Client Portal that onboards your clients for you
            </h1>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl md:text-2xl text-balance">
              A professional workspace where clients complete contracts, upload assets, and track progress—automatically
              keeping your projects on schedule from day one.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full">
                  Create your first Portal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="xl" className="w-full">
                  View a Demo Project
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              <u>No credit card required.</u> Free to start. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Client Onboarding Shouldn't Be This Hard
            </h2>
            <p className="mb-16 text-lg text-muted-foreground sm:text-xl text-balance">
              Every new client means hours of manual work, endless email threads, and delayed project starts.
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            <Card className="border-2 transition-all duration-300 hover:shadow-medium">
              <CardContent className="p-8">
                <div className="mb-4 inline-flex rounded-lg bg-destructive/10 p-3">
                  <Clock className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Hours Wasted Weekly</h3>
                <p className="text-muted-foreground">
                  Agencies spend 8–12 hours per week chasing clients for forms, files, and basic information.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 transition-all duration-300 hover:shadow-medium">
              <CardContent className="p-8">
                <div className="mb-4 inline-flex rounded-lg bg-destructive/10 p-3">
                  <Database className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Scattered Tools</h3>
                <p className="text-muted-foreground">
                  Email, Google Forms, Dropbox, Slack — information is everywhere except where you need it.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 transition-all duration-300 hover:shadow-medium">
              <CardContent className="p-8">
                <div className="mb-4 inline-flex rounded-lg bg-destructive/10 p-3">
                  <FileText className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Poor First Impression</h3>
                <p className="text-muted-foreground">
                  Chaotic onboarding makes you look unprofessional before the real work even begins.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="gradient-accent py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              One Link. Complete Onboarding.
            </h2>
            <p className="mb-16 text-lg text-muted-foreground sm:text-xl text-balance">
              Send clients a single branded link. They fill out forms, upload files, and you get everything organized
              instantly.
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-soft transition-all duration-300 hover:shadow-medium">
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Custom Intake Forms</h3>
                <p className="text-sm text-muted-foreground">Build branded forms tailored to your workflow</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft transition-all duration-300 hover:shadow-medium">
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Smart File Uploads</h3>
                <p className="text-sm text-muted-foreground">Collect files with automatic organization</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft transition-all duration-300 hover:shadow-medium">
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Automated Follow-ups</h3>
                <p className="text-sm text-muted-foreground">Gentle reminders without manual work</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft transition-all duration-300 hover:shadow-medium">
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">AI Client Summaries</h3>
                <p className="text-sm text-muted-foreground">Instant insights from client responses</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-16 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              How It Works
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h3 className="mb-3 text-xl font-semibold">Brand Your Portal</h3>
                <p className="text-muted-foreground">
                  Create a professional client workspace with your logo, colors, and messaging that reflects your
                  agency's identity.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="mb-3 text-xl font-semibold">Define the Blockers</h3>
                <p className="text-muted-foreground">
                  Set up required contracts, assets, and information you need before project kickoff—eliminating common
                  delays.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="mb-3 text-xl font-semibold">Onboarding on Auto-Pilot</h3>
                <p className="text-muted-foreground">
                  Clients receive automated reminders and progress tracking while you focus on billable work instead of
                  follow-ups.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                4
              </div>
              <div>
                <h3 className="mb-3 text-xl font-semibold">Ready on Day 1</h3>
                <p className="text-muted-foreground">
                  Everything you need is collected, organized, and ready when it's time to start—no delays, no excuses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="gradient-accent py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-16 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Loved by Agencies
            </h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            <Card className="shadow-soft">
              <CardContent className="p-8">
                <p className="mb-6 text-muted-foreground">
                  "Kenly cut our onboarding time from 2 weeks to 2 days. It's like having a dedicated operations
                  person."
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    SC
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Chen</div>
                    <div className="text-sm text-muted-foreground">Founder, DesignLab Studio</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-8">
                <p className="mb-6 text-muted-foreground">
                  "Our clients love how professional and easy the process is. It sets the tone for the entire project."
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    MR
                  </div>
                  <div>
                    <div className="font-semibold">Michael Rodriguez</div>
                    <div className="text-sm text-muted-foreground">Creative Director, Pixel & Co</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-8">
                <p className="mb-6 text-muted-foreground">
                  "We stopped losing projects to slow starts. Kenly gets us working faster and looking better."
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    JP
                  </div>
                  <div>
                    <div className="font-semibold">Jennifer Park</div>
                    <div className="text-sm text-muted-foreground">CEO, Growth Marketing Pro</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Simple, Per-User Pricing
            </h2>
            <p className="mb-16 text-lg text-muted-foreground sm:text-xl text-balance">
              Unlimited clients and team members. Scale as you grow. No hidden fees.
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            {/* Basic Plan */}
            <Card className="border-2 shadow-soft transition-all duration-300 hover:shadow-medium">
              <CardContent className="p-8">
                <div className="mb-6 text-center">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">Basic</div>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-lg text-muted-foreground">/user/mo</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Essential tools</div>
                </div>
                <div className="mb-8 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Unlimited clients</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Unlimited team members</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">10 GB storage per user</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">25 automation runs per user</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">10 e-signature runs per user</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Standard Kenly branding</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Standard email support</span>
                  </div>
                </div>
                <Link to="/signup" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary shadow-strong">
              <CardContent className="p-8">
                <div className="mb-6 text-center">
                  <div className="mb-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Recommended
                  </div>
                  <div className="mb-2 text-sm font-medium text-primary">Pro</div>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">$49</span>
                    <span className="text-lg text-muted-foreground">/user/mo</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Advanced features</div>
                </div>
                <div className="mb-8 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Unlimited clients</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Unlimited team members</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">100 GB storage per user</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">500 automation runs per user</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">100 e-signature runs per user</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Custom branding (colors + logo)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Remove "Powered by Kenly" badge</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Priority support</span>
                  </div>
                </div>
                <Link to="/signup" className="w-full">
                  <Button variant="hero" size="lg" className="w-full">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 shadow-soft transition-all duration-300 hover:shadow-medium">
              <CardContent className="p-8">
                <div className="mb-6 text-center">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">Enterprise</div>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">$199</span>
                    <span className="text-lg text-muted-foreground">/user/mo</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Complete solution</div>
                </div>
                <div className="mb-8 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Unlimited clients</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Unlimited team members</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">1 TB storage per user</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Unlimited automations</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Unlimited e-signatures</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Full branding removal</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">SLA with guaranteed uptime</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">Dedicated support channel</span>
                  </div>
                </div>
                <Link to="/signup" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground sm:text-xl text-balance">
              Everything you need to know about Kenly. Can't find what you're looking for? Contact our support team.
            </p>
          </div>

          {/* Search Box */}
          <div className="mx-auto max-w-2xl mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base shadow-soft"
              />
            </div>
            {searchQuery && (
              <p className="mt-3 text-sm text-muted-foreground text-center">
                {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'} found
              </p>
            )}
          </div>

          {/* FAQ Accordion */}
          <div className="mx-auto max-w-3xl">
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="border rounded-lg bg-card shadow-soft hover:shadow-medium transition-shadow px-6"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-6">
                      <span className="font-semibold text-base">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Card className="shadow-soft">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No results found</p>
                  <p className="text-muted-foreground">
                    Try adjusting your search or browse all questions above.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact CTA */}
          <div className="mx-auto max-w-2xl mt-16 text-center">
            <Card className="shadow-soft bg-accent/50 border-accent">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-3">Still have questions?</h3>
                <p className="text-muted-foreground mb-6">
                  Our team is here to help you get started with Kenly and answer any questions you may have.
                </p>
                <Link to="/signup">
                  <Button variant="default" size="lg">
                    Contact Support
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="gradient-hero py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Ready to Transform Your Onboarding?
            </h2>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl text-balance">
              Join hundreds of agencies streamlining their client intake process with Kenly.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="xl" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold">Kenly</span>
            </div>
            <p className="text-center text-sm text-muted-foreground md:text-left">
              © 2025 Kenly. All rights reserved. Built for agencies that move fast.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-primary">
                Privacy
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                Terms
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
