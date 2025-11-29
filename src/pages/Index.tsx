import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, FileText, Upload, Zap, Shield, Mail, Slack, Database, CheckSquare, FileSignature, Bell, Star, ArrowRight, Users, Building2, Crown, Lock, Clock } from "lucide-react";
import kenlyLogo from "@/assets/kenly-logo.png";
import { motion } from "framer-motion";
const Index = () => {
  // Animation variants
  const fadeInUp = {
    initial: {
      opacity: 0,
      y: 30
    },
    whileInView: {
      opacity: 1,
      y: 0
    },
    viewport: {
      once: true,
      margin: "-50px"
    },
    transition: {
      duration: 0.5
    }
  };
  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    },
    viewport: {
      once: true,
      margin: "-50px"
    }
  };
  const staggerItem = {
    initial: {
      opacity: 0,
      y: 20
    },
    whileInView: {
      opacity: 1,
      y: 0
    },
    transition: {
      duration: 0.4
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={kenlyLogo} alt="Kenly" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold">Kenly</span>
            </div>
            <div className="hidden items-center gap-8 md:flex">
              <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Pricing
              </a>
              <a href="#roadmap" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Roadmap
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
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section className="gradient-hero py-20 sm:py-32" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              {/* Left Column - Copy */}
              <motion.div initial={{
              opacity: 0,
              x: -30
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }}>
                <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
                  Stop chasing clients. Start closing them faster.
                </h1>
                <p className="mb-8 text-lg text-muted-foreground sm:text-xl text-balance">
                  The only client portal agencies need to collect files, sign contracts, and finish onboarding—without
                  the chaos.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link to="/signup" className="w-full sm:w-auto">
                    <Button variant="hero" size="xl" className="w-full">
                      Get Started Free
                    </Button>
                  </Link>
                </div>
                {/* Trust Badge Bar */}
                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Multi-Tenant Isolation
                  </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>GDPR compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Encrypted at Rest & in Transit </span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">No credit card required. Full access in 5 minutes.</p>
              </motion.div>

              {/* Right Column - Hero Screenshot */}
              <motion.div initial={{
              opacity: 0,
              x: 30
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6,
              delay: 0.2
            }} className="relative">
                <div className="rounded-lg border-2 bg-card p-6 shadow-strong">
                  {/* Mock Dashboard */}
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Onboarding Progress</span>
                        <span className="text-muted-foreground">65%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 w-[65%] rounded-full bg-primary"></div>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="text-sm">Complete intake form</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="text-sm">Upload brand assets</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                        <div className="h-5 w-5 rounded-full border-2 border-warning"></div>
                        <span className="text-sm">Review contract</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground"></div>
                        <span className="text-sm">Schedule kickoff call</span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      <div className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                        Contract Signed ✓
                      </div>
                      <div className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                        Form Submitted ✓
                      </div>
                      <div className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                        Files Pending
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2 border-t pt-4">
                      <p className="text-xs font-medium text-muted-foreground">Recent Activity</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-success"></div>
                          <span className="text-xs text-muted-foreground">Contract signed 2 hours ago</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-success"></div>
                          <span className="text-xs text-muted-foreground">Form completed yesterday</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Social Proof Stripe */}
      <motion.section className="border-y bg-muted/30 py-8" initial={{
      opacity: 0
    }} whileInView={{
      opacity: 1
    }} viewport={{
      once: true
    }} transition={{
      duration: 0.5
    }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-center text-sm font-medium text-muted-foreground">
              Join 200+ agencies who've replaced their onboarding chaos
            </p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-primary text-primary" />)}
              <span className="ml-2 text-sm text-muted-foreground">Loved by early users</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Problem Section */}
      <motion.section id="problem" className="py-20 sm:py-32" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5
        }}>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Onboarding clients shouldn't feel like chaos.
            </h2>
            <p className="text-lg text-muted-foreground">For most agencies, it still does.</p>
          </motion.div>

          <motion.div className="mx-auto max-w-4xl mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }}>
            <Card className="border-2 border-destructive/20 bg-destructive/5">
              <CardContent className="p-8">
                <p className="text-lg leading-relaxed">Your team wastes 8+ hours every week chasing documents across multiple platforms. 
Clients miss deadlines because they don't know what you need. You push back launch dates because someone forgot to upload a logo.8+ hours every week chasing documents across multiple platforms. Clients miss deadlines because they don't know what you need. You push back launch dates because someone forgot to upload a logo.<strong>8+ hours every week</strong> chasing documents across Gmail, Drive, DocuSign,
                  and Typeform. Clients miss deadlines because they don't know what you need. You push back launch dates
                  because someone forgot to upload a logo.
                </p>
                <p className="mt-4 text-lg font-semibold">
                  It's not a process. It's a Frankenstein stack held together with reminder emails.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chaos Grid */}
          <motion.div className="mx-auto max-w-2xl" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{
          once: true
        }}>
            
          </motion.div>
        </div>
      </motion.section>

      {/* Solution Section */}
      <motion.section id="solution" className="gradient-accent py-20 sm:py-32" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5
        }}>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Your client lands in one branded portal.
            </h2>
            <p className="text-lg text-muted-foreground mb-4">Forms, contracts, files, tasks—everything connected.</p>
            <p className="text-lg">They know what's left. You know what's blocking launch.</p>
            <p className="mt-4 text-xl font-semibold">Onboarding becomes your smoothest process, not your messiest.</p>
          </motion.div>

          {/* Before/After Comparison */}
          <motion.div className="mx-auto max-w-6xl grid gap-8 md:grid-cols-2" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{
          once: true
        }}>
            {/* Before */}
            <motion.div variants={staggerItem}>
              <Card className="h-full border-2 border-destructive/20">
                <CardContent className="p-6">
                  <div className="mb-4 text-center">
                    <span className="inline-block rounded-full bg-destructive/10 px-4 py-1 text-sm font-semibold text-destructive">
                      Before Kenly
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-sm font-medium mb-2">Your Desktop:</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• 8+ browser tabs open</li>
                        <li>• Slack: "URGENT: Need files" 🔥</li>
                        <li>• Email: 47 unread messages</li>
                        <li>• Multiple Drive folders scattered</li>
                        <li>• Lost files, missed deadlines</li>
                      </ul>
                    </div>
                    <p className="text-center text-sm italic text-destructive">Stressful. Chaotic. Unprofessional.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* After */}
            <motion.div variants={staggerItem}>
              <Card className="h-full border-2 border-success/20 bg-success/5">
                <CardContent className="p-6">
                  <div className="mb-4 text-center">
                    <span className="inline-block rounded-full bg-success/20 px-4 py-1 text-sm font-semibold text-success">
                      With Kenly
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-sm font-medium mb-2">Clean Portal:</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>Progress bar at 80%</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>3 of 4 steps complete</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>Everything organized</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>Client knows exactly what's next</span>
                        </li>
                      </ul>
                    </div>
                    <p className="text-center text-sm italic text-success font-medium">
                      Calm. Organized. Professional.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section id="features" className="py-20 sm:py-32" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5
        }}>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Everything you need. Nothing you don't.
            </h2>
          </motion.div>

          <motion.div className="mx-auto max-w-6xl grid gap-12 md:grid-cols-2" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{
          once: true
        }}>
            {/* Feature 1 */}
            <motion.div variants={staggerItem}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">Collect everything effortlessly</h3>
                  <p className="text-muted-foreground mb-4">
                    Clients submit forms, upload files, and complete required steps without back-and-forth.
                  </p>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Brand Guidelines.pdf</span>
                        <span className="text-xs text-success">✓ Uploaded</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Logo Assets.zip</span>
                        <span className="text-xs text-success">✓ Uploaded</span>
                      </div>
                      <Button size="sm" className="w-full mt-2">
                        Upload Files
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={staggerItem}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <CheckSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">Keep every client aligned</h3>
                  <p className="text-muted-foreground mb-4">
                    Clear tasks, transparent progress, and no confusion about what comes next.
                  </p>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="text-sm">Complete intake form</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="text-sm">Upload brand assets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full border-2 border-warning"></div>
                        <span className="text-sm">Sign contract</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted mt-2">
                        <div className="h-2 w-[66%] rounded-full bg-primary"></div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">2 of 3 complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={staggerItem}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">Sign and store documents</h3>
                  <p className="text-muted-foreground mb-4">
                    Contracts that get signed fast—and stay organized in one secure vault.
                  </p>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Service Agreement</span>
                        <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Signed ✓</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">NDA Document</span>
                        <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded">Pending</span>
                      </div>
                      <Button size="sm" className="w-full mt-2">
                        <Lock className="h-4 w-4 mr-2" />
                        Sign Here
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={staggerItem}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">Automate onboarding</h3>
                  <p className="text-muted-foreground mb-4">
                    Let the system handle reminders, notifications, and follow-ups automatically.
                  </p>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-sm">Welcome email sent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-warning" />
                        <span className="text-sm">Reminder scheduled (2 days)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm">Notification on completion</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Comparison Section */}
      <motion.section className="gradient-accent py-20 sm:py-32" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5
        }}>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              One portal replaces your entire stack.
            </h2>
          </motion.div>

          <motion.div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-2" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{
          once: true
        }}>
            {/* Before Kenly */}
            <motion.div variants={staggerItem}>
              <Card className="h-full border-2">
                <CardContent className="p-8">
                  <h3 className="mb-6 text-xl font-semibold text-center">Before Kenly</h3>
                  <p className="mb-6 text-center text-muted-foreground">
                    7 tools. 12 browser tabs. Endless follow-ups.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-muted-foreground line-through">
                      <span className="text-sm">Typeform for forms</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground line-through">
                      <span className="text-sm">Google Drive for files</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground line-through">
                      <span className="text-sm">Email for reminders</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground line-through">
                      <span className="text-sm">DocuSign for contracts</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground line-through">
                      <span className="text-sm">Notion for tasks</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground line-through">
                      <span className="text-sm">Slack for messaging</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground line-through">
                      <span className="text-sm">Manual follow-ups</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* With Kenly */}
            <motion.div variants={staggerItem}>
              <Card className="h-full border-2 border-primary bg-primary/5">
                <CardContent className="p-8">
                  <h3 className="mb-6 text-xl font-semibold text-center">With Kenly</h3>
                  <p className="mb-6 text-center text-muted-foreground">One portal. One link. Zero chasing.</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium">Smart forms</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium">Secure file vault</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium">Automated reminders</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium">Built-in e-signature</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium">Task tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium">Client messaging</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium">Full automation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Social Proof / Testimonials */}
      <motion.section className="py-20 sm:py-32" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5
        }}>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Don't take our word for it.
            </h2>
          </motion.div>

          <motion.div className="mx-auto max-w-6xl grid gap-8 md:grid-cols-3" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{
          once: true
        }}>
            {/* Testimonial 1 */}
            <motion.div variants={staggerItem}>
              <Card className="h-full">
                <CardContent className="p-8">
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => <svg key={i} className="h-5 w-5 fill-primary text-primary" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>)}
                  </div>
                  <p className="mb-6 text-muted-foreground">
                    "Kenly cut our onboarding time in half. Clients finally complete everything on time."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      SK
                    </div>
                    <div>
                      <div className="font-semibold">Sarah K.</div>
                      <div className="text-sm text-muted-foreground">Creative Director</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div variants={staggerItem}>
              <Card className="h-full">
                <CardContent className="p-8">
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => <svg key={i} className="h-5 w-5 fill-primary text-primary" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>)}
                  </div>
                  <p className="mb-6 text-muted-foreground">
                    "We replaced 7 tools with one portal. It feels like an OS built specifically for agencies."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      MT
                    </div>
                    <div>
                      <div className="font-semibold">Mike T.</div>
                      <div className="text-sm text-muted-foreground">Agency Founder</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Card */}
            <motion.div variants={staggerItem}>
              <Card className="h-full border-2 border-primary bg-primary/5">
                <CardContent className="p-8">
                  <h3 className="mb-6 text-xl font-semibold">Built for agencies who move fast.</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-primary">8+ hours</div>
                      <div className="text-sm text-muted-foreground">saved per client</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">2x faster</div>
                      <div className="text-sm text-muted-foreground">onboarding speed</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">95%</div>
                      <div className="text-sm text-muted-foreground">completion rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
      {/* Pricing Section */}
      <motion.section id="pricing" className="gradient-accent py-20 sm:py-32" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center mb-4" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5
        }}>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Simple pricing. No surprises.
            </h2>
            <p className="text-lg text-muted-foreground">Most agencies start free and upgrade in week two.</p>
          </motion.div>

          <motion.div className="mx-auto max-w-6xl grid gap-8 md:grid-cols-3 mt-16" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{
          once: true
        }}>
            {/* STARTER Plan - FREE */}
            <motion.div variants={staggerItem}>
              <Card className="h-full border-2 hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">STARTER</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Forever free</p>
                  </div>

                  <div className="mb-8 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">1 active client portal</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Unlimited forms, files, tasks</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">3 e-signatures per client</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">5 GB storage total</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Kenly branding</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Email notifications</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Community support</span>
                    </div>
                  </div>

                  <Link to="/signup" className="w-full block">
                    <Button variant="outline" size="lg" className="w-full">
                      Start Free
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* PRO Plan - $49/month */}
            <motion.div variants={staggerItem}>
              <Card className="h-full border-2 border-primary shadow-lg relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">PRO</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">$49</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-success mt-2">$39/month billed annually</p>
                  </div>

                  <div className="mb-2">
                    <p className="text-sm font-medium mb-4 text-primary">Unlimited clients • Unlimited team members</p>
                  </div>

                  <div className="mb-8 space-y-3">
                    <p className="text-sm font-semibold mb-3">Everything in Starter, plus:</p>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Unlimited clients</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Unlimited team members</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Workflow automations</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Custom-branded portal</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Unlimited e-signatures</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">50 GB storage</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">File approval workflows</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Client messaging</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Priority email support</span>
                    </div>
                  </div>

                  <Link to="/signup" className="w-full block">
                    <Button variant="hero" size="lg" className="w-full">
                      Start Free Trial
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-muted-foreground mt-3">14-day free trial</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* AGENCY Plan - $149/month - COMING SOON */}
            <motion.div variants={staggerItem}>
              <Card className="h-full border-2 hover:shadow-lg transition-all relative opacity-90">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-muted text-muted-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Coming Soon
                  </span>
                </div>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">AGENCY</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">$149</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-success mt-2">$129/month billed annually</p>
                  </div>

                  <div className="mb-2">
                    <p className="text-sm font-medium mb-4 text-primary">Unlimited everything</p>
                  </div>

                  <div className="mb-8 space-y-3">
                    <p className="text-sm font-semibold mb-3">Everything in Pro, plus:</p>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Multi-organization support</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Advanced role permissions</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">200 GB storage</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Custom integrations (API, Zapier)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Priority support (4-hour response)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Live chat support</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">30-min onboarding call</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Usage analytics & reporting</span>
                    </div>
                  </div>

                  <Button variant="outline" size="lg" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
      {/* FAQ Section */}
      <motion.section id="faq" className="py-20 sm:py-32" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5
        }}>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <motion.div className="mx-auto max-w-3xl" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }}>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">How long does it take to set up?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Most agencies are up and running in under 30 minutes. Simply add your branding, customize your intake
                  forms, and send your first client link. No complex setup or technical knowledge required.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">Can I customize the portal with my branding?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Pro and Agency plans let you add your logo, brand colors, and custom fonts. The Pro plan includes
                  custom branding with the ability to remove "Powered by Kenly" branding.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">What happens if a client doesn't complete their onboarding?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Kenly automatically sends gentle reminder emails based on your schedule. You can track completion
                  progress in real-time and see exactly what's blocking each client from moving forward.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">Is there a limit to the number of clients?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The Starter plan includes 1 active client at a time (perfect for freelancers testing Kenly). Pro and
                  Agency plans include unlimited clients and unlimited team members—you only pay the flat monthly fee,
                  not per client or per user.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">Can I integrate Kenly with my existing tools?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Pro plans include workflow automations. The upcoming Agency plan will include advanced
                  integrations with API access, Zapier, and Make to connect with your existing tech stack.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">What kind of support do you offer?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Starter plans include community support. Pro plans get priority email support with faster response
                  times. Agency plans (coming soon) will receive priority support with 4-hour response times, live chat,
                  and a dedicated 30-minute onboarding call.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section className="gradient-hero py-20 sm:py-32" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5
        }}>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Ready to stop chasing clients?
            </h2>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl text-balance">
              Join hundreds of agencies who've replaced chaos with clarity.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="xl" className="w-full bg-background hover:bg-muted">
                  View Demo
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">No credit card required. Full access. 5-minute setup.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer className="border-t bg-muted/30 py-12" initial={{
      opacity: 0
    }} whileInView={{
      opacity: 1
    }} viewport={{
      once: true
    }} transition={{
      duration: 0.6
    }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Column 1: Product */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-primary transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-primary transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#roadmap" className="hover:text-primary transition-colors">
                    Roadmap
                  </a>
                </li>
                <li>
                  <Link to="/changelog" className="hover:text-primary transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Resources */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/docs" className="hover:text-primary transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/api" className="hover:text-primary transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="/templates" className="hover:text-primary transition-colors">
                    Templates
                  </a>
                </li>
                <li>
                  <a href="/blog" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/about" className="hover:text-primary transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-primary transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Security */}
            <div>
              <h3 className="font-semibold mb-4">Security</h3>
              <p className="text-sm text-muted-foreground mb-3">Enterprise-grade security</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Built on Supabase with full RLS</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Multi-tenant isolation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Encrypted data transport</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Role-based access control</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>SOC2 compliance in progress</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <img src={kenlyLogo} alt="Kenly" className="h-5 w-5 object-contain" />
              <span className="font-semibold">Kenly</span>
            </div>
            <p className="text-center text-sm text-muted-foreground md:text-left">
              © 2025 Kenly. All rights reserved.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>;
};
export default Index;