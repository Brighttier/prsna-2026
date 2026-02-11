import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, Shield, Zap, Users, ArrowRight, Check, CheckCircle,
    BarChart2, Globe, Cpu, MessageSquare, Clock
} from 'lucide-react';

export const Landing = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: Sparkles,
            title: "AI-Powered Screening",
            desc: "Our advanced AI analyzes resumes in seconds, ranking candidates based on skills, experience, and cultural fit.",
            color: "text-emerald-600",
            bg: "bg-emerald-100"
        },
        {
            icon: Clock,
            title: "Automated Scheduling",
            desc: "Eliminate the back-and-forth. Our intelligent scheduler coordinates interviews seamlessly with Google & Outlook.",
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
        {
            icon: Shield,
            title: "Bank-Level Security",
            desc: "Enterprise-grade encryption and compliance (GDPR, SOC2) ensure your sensitive candidate data is always protected.",
            color: "text-purple-600",
            bg: "bg-purple-100"
        },
        {
            icon: MessageSquare,
            title: "Smart Communication",
            desc: "Personalized, automated email sequences keep candidates engaged throughout the hiring process.",
            color: "text-orange-600",
            bg: "bg-orange-100"
        },
        {
            icon: BarChart2,
            title: "Deep Analytics",
            desc: "Gain actionable insights into your hiring pipeline with real-time dashboards and custom reporting.",
            color: "text-pink-600",
            bg: "bg-pink-100"
        },
        {
            icon: Globe,
            title: "Global Hiring",
            desc: "Support for multi-currency offers, international compliance, and remote team management.",
            color: "text-indigo-600",
            bg: "bg-indigo-100"
        }
    ];

    const pricingTiers = [
        {
            name: "Free",
            price: "$0",
            desc: "Perfect for individuals and testing",
            features: [
                "Up to 3 Active Jobs",
                "100 AI Resume Screens/mo",
                "Basic Candidate Pipeline",
                "Email Support",
                "1 Team Member"
            ],
            cta: "Get Started Free",
            popular: false
        },
        {
            name: "Starter",
            price: "$49",
            period: "/mo",
            desc: "For small teams hiring occasionally",
            features: [
                "Up to 10 Active Jobs",
                "500 AI Resume Screens/mo",
                "Automated Scheduling",
                "Email & Chat Support",
                "3 Team Members",
                "Custom Branding"
            ],
            cta: "Start Free Trial",
            popular: false
        },
        {
            name: "Essential",
            price: "$149",
            period: "/mo",
            desc: "For growing companies scaling up",
            features: [
                "Unlimited Active Jobs",
                "2,000 AI Resume Screens/mo",
                "Advanced Analytics",
                "Priority Support",
                "10 Team Members",
                "Offer Letter Generation",
                "DocuSign Integration"
            ],
            cta: "Start Free Trial",
            popular: true
        },
        {
            name: "Professional",
            price: "$399",
            period: "/mo",
            desc: "Powerhouse features for established teams",
            features: [
                "Unlimited Everything",
                "10,000 AI Resume Screens/mo",
                "Dedicated Account Manager",
                "API Access",
                "Unlimited Team Members",
                "Custom Workflows",
                "SSO / SAML",
                "Team Permissions"
            ],
            cta: "Contact Sales",
            popular: false
        },
        {
            name: "Enterprise",
            price: "Custom",
            desc: "Tailored solutions for large organizations",
            features: [
                "Custom AI Models",
                "On-Premise Deployment",
                "SLA Guarantees",
                "24/7 Phone Support",
                "Audit Logs",
                "Custom Integrations",
                "White Labeling"
            ],
            cta: "Contact Sales",
            popular: false
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900">

            {/* --- NAVIGATION --- */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">RecruiteAI</span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Features</a>
                            <a href="#how-it-works" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">How it Works</a>
                            <a href="#pricing" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Pricing</a>
                        </div>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="hidden md:block text-slate-600 hover:text-emerald-600 font-bold transition-colors"
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute top-40 right-10 w-[500px] h-[500px] bg-teal-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        New: Gemini 2.0 Integration Live
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
                        Hire the Top 1% <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                            Powered by AI Intelligence
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
                        Automate resume screening, streamline scheduling, and make data-driven hiring decisions
                        10x faster. The modern OS for high-growth recruiting teams.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transform hover:-translate-y-1"
                        >
                            Start Free Trial <ArrowRight className="w-5 h-5" />
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            <Cpu className="w-5 h-5" /> View Demo
                        </button>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="relative mx-auto max-w-5xl">
                        <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl shadow-slate-400/20 border border-slate-800">
                            <div className="bg-slate-900 rounded-xl overflow-hidden aspect-[16/9] relative group cursor-pointer">
                                {/* Mock UI Elements */}
                                <div className="absolute inset-x-0 top-0 h-10 bg-slate-800 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    </div>
                                    <div className="mx-auto w-64 h-6 bg-slate-700 rounded-md opacity-50"></div>
                                </div>
                                {/* Placeholder for dashboard image or interactive demo */}
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 font-mono text-sm pt-10">
                                    <div className="grid grid-cols-4 gap-4 p-8 w-full h-full opacity-50">
                                        <div className="col-span-1 bg-slate-700 rounded-lg h-full"></div>
                                        <div className="col-span-3 space-y-4">
                                            <div className="h-32 bg-slate-700 rounded-lg w-full"></div>
                                            <div className="h-64 bg-slate-700 rounded-lg w-full"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Overlay Card */}
                                <div className="absolute bottom-10 right-10 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-2xl animate-bounce-slow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <Check className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Offer Accepted!</p>
                                            <p className="text-white/70 text-xs">Sarah J. joined Engineering</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section id="features" className="py-24 bg-slate-50 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-emerald-600 font-bold tracking-wide uppercase text-sm mb-3">Powerful Features</h2>
                        <h3 className="text-4xl font-extrabold text-slate-900 mb-4">Everything you need to hire efficiently</h3>
                        <p className="max-w-2xl mx-auto text-xl text-slate-500">
                            Built for speed and precision. Our tools help you focus on the best candidates, not busywork.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
                                <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-emerald-600 font-bold tracking-wide uppercase text-sm mb-3">Simple Pricing</h2>
                        <h3 className="text-4xl font-extrabold text-slate-900 mb-4">Plans for teams of all sizes</h3>
                        <p className="max-w-2xl mx-auto text-xl text-slate-500">
                            Transparent pricing. No hidden fees. Upgrade or downgrade anytime.
                        </p>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {pricingTiers.map((tier, idx) => (
                            <div key={idx} className={`relative rounded-2xl p-6 border flex flex-col ${tier.popular
                                    ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 scale-105 z-10 bg-white'
                                    : 'border-slate-200 bg-slate-50 hover:bg-white hover:shadow-lg transition-all'
                                }`}>
                                {tier.popular && (
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h4 className="text-lg font-bold text-slate-900 mb-2">{tier.name}</h4>
                                    <div className="flex items-baseline mb-2">
                                        {tier.price !== "Custom" && <span className="text-3xl font-extrabold text-slate-900">{tier.price}</span>}
                                        {tier.price === "Custom" && <span className="text-3xl font-extrabold text-slate-900">Custom</span>}
                                        {tier.period && <span className="text-slate-500 font-medium">{tier.period}</span>}
                                    </div>
                                    <p className="text-xs text-slate-500">{tier.desc}</p>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {tier.features.map((feat, fIdx) => (
                                        <li key={fIdx} className="flex items-start gap-2 text-sm text-slate-600">
                                            <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.popular ? 'text-emerald-500' : 'text-slate-400'}`} />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => navigate('/login')}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${tier.popular
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                >
                                    {tier.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-slate-900 text-slate-300 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">RecruiteAI</span>
                            </div>
                            <p className="text-slate-400 text-sm max-w-xs mb-6">
                                Empowering the world's best companies to build their dream teams with artificial intelligence.
                            </p>
                            <div className="flex gap-4">
                                {/* Social Icons Placeholder */}
                                <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 transition-colors cursor-pointer"></div>
                                <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 transition-colors cursor-pointer"></div>
                                <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 transition-colors cursor-pointer"></div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Updates</a></li>
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Beta Program</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Press</a></li>
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Cookie Policy</a></li>
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Security</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500">© 2026 RecruiteAI Inc. All rights reserved.</p>
                        <p className="text-sm text-slate-500">Made with ❤️ in San Francisco</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
