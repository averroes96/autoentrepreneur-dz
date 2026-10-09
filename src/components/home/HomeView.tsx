"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Receipt,
  Scale,
  Calendar,
  Lock,
  Sparkles,
  Award,
} from "lucide-react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useI18n } from "@/lib/i18n/I18nContext";

interface HomeViewProps {
  session: any;
}

export function HomeView({ session }: HomeViewProps) {
  const { t, locale, dir } = useI18n();
  const isAr = locale === "ar";

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white ${isAr ? "font-arabic" : ""}`} dir={dir}>
      {/* Top Notification / Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs py-2 px-4 text-center font-medium shadow-xs">
        <span className="inline-flex items-center gap-1.5 flex-wrap justify-center">
          <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {isAr ? "القانون رقم 22-23" : "Loi n° 22-23"}
          </span>
          <span>
            {isAr
              ? "منصة مطابقة 100% لنظام المقاول الذاتي في الجزائر (المرسوم التنفيذي رقم 23-197)"
              : "Solution 100% conforme au statut de l'Auto-Entrepreneur en Algérie (Décret 23-197)"}
          </span>
        </span>
      </div>

      {/* Main Header / Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                Auto Entrepreneur <span className="text-emerald-400">DZ</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition">
              {isAr ? "المميزات" : "Fonctionnalités"}
            </a>
            <a href="#compliance" className="hover:text-emerald-400 transition">
              {isAr ? "اللوائح والضريبة" : "Réglementation & IFU"}
            </a>
            <a href="#rules" className="hover:text-emerald-400 transition">
              {isAr ? "قاعدة الـ 3 سنوات" : "Règle des 3 Ans"}
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition">
              {isAr ? "الأسئلة الشائعة" : "FAQ"}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition"
              >
                <span>{isAr ? "الدخول إلى حسابي" : "Accéder à mon espace"}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
                >
                  {isAr ? "تسجيل الدخول" : "Se connecter"}
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition"
                >
                  <span>{isAr ? "إنشاء حساب" : "Créer un compte"}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-emerald-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isAr
                  ? "مصمم حصرياً للمستقلين ومقدمي الخدمات الرقمية في الجزائر"
                  : "Conçu exclusivement pour les prestataires et freelances algériens"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              {isAr ? (
                <>
                  فوترة مطابقة وإدارة جبائية لـ
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    {" "}المقاول الذاتي
                  </span>
                </>
              ) : (
                <>
                  Facturation conforme & gestion fiscale pour l&apos;
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    Auto-Entrepreneur
                  </span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {isAr
                ? "إصدار فواتير معفاة قانوناً من الرسم على القيمة المضافة (Loi 22-23)، متابعة لحظية لسقف 5 000 000 دج، والتحكم التام في تصريح الضريبة الجزافية الوحيدة IFU بنسبة 0.5%."
                : "Émettez des factures sans TVA avec mentions légales obligatoires (Loi 22-23), surveillez en temps réel votre plafond de 5 000 000 DZD et maîtrisez votre déclaration d'IFU à 0.5%."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              {session ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/40 transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAr ? "الدخول إلى لوحة القيادة" : "Accéder à mon tableau de bord"}</span>
                  <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/40 transition"
                  >
                    <span>{isAr ? "ابدأ مجاناً الآن" : "Commencer gratuitement"}</span>
                    <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>{isAr ? "تسجيل الدخول للأعضاء" : "Espace Membre (Connexion)"}</span>
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {isAr ? "إعفاء تلقائي من رسم TVA" : "Exonération de TVA automatique"}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {isAr ? "ترقيم تسلسلي إلزامي غير قابل للتعديل" : "Numérotation séquentielle stricte"}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {isAr ? "احتساب الضريبة التبرئية 0.5%" : "Calcul IFU libératoire 0.5%"}
              </span>
            </div>
          </div>

          {/* Interactive UI Preview Showcase Card */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-slate-700/50 via-slate-800/30 to-slate-900/50 shadow-2xl">
            <div className="bg-slate-950 rounded-[22px] p-6 sm:p-8 border border-slate-800 space-y-6">
              {/* Window mock bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 rtl:mr-2 text-xs font-mono text-slate-500">
                    {isAr ? "autoentrepreneur.dz / لوحة-القيادة" : "autoentrepreneur.dz / tableau-de-bord"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isAr ? "نظام مطابق (القانون 22-23)" : "Régime Conforme (Loi 22-23)"}</span>
                </div>
              </div>

              {/* Sample Metrics inside Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="uppercase font-bold tracking-wider">
                      {isAr ? "المحصل 2026" : "CA Encaissé 2026"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      {isAr ? "مطابق" : "Conforme"}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {isAr ? "340 000 د.ج" : "340 000,00 DZD"}
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "6.8%" }} />
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>{isAr ? "السقف : 5 000 000 دج" : "Plafond : 5 000 000 DZD"}</span>
                    <span>{isAr ? "المتبقي : 4 660 000 دج" : "Reste : 4 660 000 DZD"}</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="uppercase font-bold tracking-wider">
                      {isAr ? "ضريبة IFU (0.5%)" : "Impôt IFU (0.5%)"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                      {isAr ? "تبرئية" : "Libératoire"}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {isAr ? "10 000 د.ج" : "10 000,00 DZD"}
                  </div>
                  <p className="text-[11px] text-amber-400/90 font-medium">
                    {isAr ? "ℹ تم تطبيق الحد الأدنى القانوني 10 000 دج" : "ℹ Plancher légal de 10 000 DZD appliqué"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? "التصريح السنوي مستحق قبل 31 جانفي" : "Déclaration annuelle due avant le 31 Janvier N+1"}
                  </p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="uppercase font-bold tracking-wider">
                      {isAr ? "قاعدة الـ 3 سنوات" : "Règle des 3 Ans"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      {isAr ? "محمي" : "Sécurisé"}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    {isAr ? "لا يوجد أي خطر للشطب" : "Aucun risque de radiation"}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? "متابعة تلقائية للنشاط المستمر وحماية الصفة القانونية للوكالة."
                      : "Surveillance automatique de l'activité continue et protection du statut ANAE."}
                  </p>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    {isAr ? "اشتراك CASNOS الجزافي : 24 000 دج / سنوياً" : "CASNOS Forfaitaire : 24 000 DZD / an"}
                  </div>
                </div>
              </div>

              {/* Sample Invoices Table inside Mock */}
              <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden">
                <div className="px-4 py-3 bg-slate-800/50 flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>{isAr ? "أحدث الفواتير المنشأة" : "Factures récentes générées"}</span>
                  <span className="text-emerald-400 text-[11px]">
                    {isAr ? "تنسيق مطابق لوكالة ANAE ومصالح الضرائب" : "Format conforme ANAE & DGI"}
                  </span>
                </div>
                <div className="divide-y divide-slate-800 text-xs">
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-[11px] font-bold">
                        FAC
                      </div>
                      <div>
                        <div className="font-bold text-white">FAC-2026-0001</div>
                        <div className="text-[11px] text-slate-400">
                          {isAr ? "الزبون : ش.ذ.م.م تيك الجزائر • 06/10/2026" : "Client : SARL Algiers Tech • 06/10/2026"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right rtl:text-left">
                      <div className="font-extrabold text-white">
                        {isAr ? "170 000 د.ج" : "170 000,00 DZD"}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-400">
                        {isAr ? "صادرة (مسددة) • معفاة من الرسم على القيمة المضافة" : "Émise (Payée) • Exonérée TVA"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars of Algerian Auto-Entrepreneur Compliance (Loi 22-23) */}
      <section id="compliance" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              {isAr ? "الضمانات القانونية والجبائية" : "Garanties Juridiques & Fiscales"}
            </h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {isAr
                ? "كل متطلبات القانون 22-23، تحت تصرفك بنقرة زر"
                : "Tout ce que la Loi 22-23 exige, géré pour vous en un clic"}
            </p>
            <p className="text-sm text-slate-400">
              {isAr
                ? "يوفر نظام المقاول الذاتي امتيازات كبرى، لكنه يفرض معايير دقيقة للحفاظ على بطاقتك ونظامك التفضيلي."
                : "Le statut d'auto-entrepreneur offre d'immenses avantages, mais impose des règles strictes pour conserver votre carte et votre régime préférentiel."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {isAr ? "فواتير بدون TVA بالبيانات الإلزامية" : "Factures sans TVA & Mentions Légales"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "يستفيد المقاول الذاتي قانوناً من الإعفاء الكلي من الرسم على القيمة المضافة. تتضمن فواتيرك تلقائياً السند القانوني، رمز نشاط ANAE، رقم NIF، والترقيم التسلسلي الإلزامي."
                  : "Les auto-entrepreneurs sont légalement exonérés de TVA. Vos factures comportent automatiquement la mention obligatoire, votre code ANAE, NIF, adresse et numérotation séquentielle inaltérable."}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {isAr ? "السقف السنوي 5 000 000 دج" : "Plafond Annuel de 5 000 000 DZD"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "متابعة لحظية لرقم أعمالك بمؤشرات بصرية دقيقة. تعرف على وجه التحديد المبلغ المتبقي قبل الوصول إلى السقف السنوي المحدد تشريعياً."
                  : "Suivez votre progression en temps réel avec des jauges prédictives. Vous savez exactement combien de chiffre d'affaires il vous reste avant d'atteindre la limite légale annuelle."}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {isAr ? "احتساب IFU وقاعدة الـ 3 سنوات" : "Calcul IFU & Règle des 3 Ans"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "تقدير فوري للضريبة الجزافية الوحيدة 0.5% (مع تطبيق الحد الأدنى 10 000 دج) ورصد الـ 3 سنوات المتتالية لتفادي الشطب القانوني من السجل."
                  : "Estimation en direct de l'impôt forfaitaire unique à 0,5% (avec application automatique du plancher de 10 000 DZD) et suivi des 3 années consécutives pour éviter toute radiation d'office."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              {isAr ? "الميزات الأساسية" : "Fonctionnalités Clés"}
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {isAr ? "مجموعة متكاملة مخصصة لنشاطك المهني" : "Une suite complète conçue pour votre activité"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
              <FileText className="w-6 h-6 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">
                {isAr ? "إنشاء PDF احترافي" : "Génération PDF Pro"}
              </h4>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "تحميل عروض الأسعار والفواتير بصيغة PDF عالية الدقة ومطابقة للمعايير الوطنية."
                  : "Téléchargez vos devis et factures en PDF haute définition prêts à être transmis à vos clients en toute conformité."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
              <Calendar className="w-6 h-6 text-teal-400" />
              <h4 className="text-sm font-bold text-white">
                {isAr ? "تعدد السنوات المالية" : "Multi-Exercices Fiscaux"}
              </h4>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "الانتقال بسهولة بين السنوات المالية الحالية والسابقة للاطلاع على السجل الكامل."
                  : "Basculez facilement entre vos exercices 2026, 2027 et antérieurs pour consulter l'historique complet de votre activité."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
              <Lock className="w-6 h-6 text-blue-400" />
              <h4 className="text-sm font-bold text-white">
                {isAr ? "الأمان وثبات المستندات" : "Sécurité & Immuabilité"}
              </h4>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "حماية الفواتير الصادرة من التعديل غير القانوني، بما يضمن الامتثال التام عند المراقبة الجبائية."
                  : "Vos factures émises sont verrouillées contre toute modification accidentelle, garantissant votre conformité en cas de contrôle fiscal."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
              <Award className="w-6 h-6 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                {isAr ? "اشتراكات CASNOS" : "Cotisation CASNOS"}
              </h4>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "تذكير ومتابعة الاشتراك السنوي الجزافي المخفض 24 000 دج الخاص بالمقاول الذاتي."
                  : "Rappel et suivi du forfait CASNOS préférentiel de 24 000 DZD/an propre aux bénéficiaires de la carte d'auto-entrepreneur."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              {isAr ? "الأسئلة الشائعة" : "Questions Fréquentes"}
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {isAr ? "دليلك لفهم نظام المقاول الذاتي في الجزائر" : "Comprendre le statut d'Auto-Entrepreneur en Algérie"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white">
                {isAr
                  ? "هل يتوجب علي فرض الرسم على القيمة المضافة (TVA) على الزبائن؟"
                  : "Dois-je facturer la TVA à mes clients ?"}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "كلا. تنص المادة 2.1 من القانون رقم 22-23 وقانون الضرائب المباشرة على الإعفاء الشامل للمقاول الذاتي من الرسم على القيمة المضافة. يجب أن تنص الفاتورة على هذا الإعفاء القانوني دون إدراج أي مبلغ للرسم."
                  : "Non. L'article 2.1 de la Loi 22-23 et le Code des Impôts Directs prévoient l'exonération totale de la TVA pour les auto-entrepreneurs. Toute facture émise doit obligatoirement stipuler cette dispense légale sans faire apparaître de montant de taxe sur la valeur ajoutée."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white">
                {isAr
                  ? "ما هي نسبة الضريبة الجزافية الوحيدة (IFU) وموعد تسويتها؟"
                  : "Quel est le taux de l'Impôt Forfaitaire Unique (IFU) ?"}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "حددت النسبة بـ 0.5% تحررية من رقم الأعمال السنوي المحصل، بحد أدنى قانوني قدره 10 000 دج سنوياً. يتم التصريح والدفع قبل تاريخ 31 جانفي من السنة الموالية (N+1)."
                  : "Le taux est fixé à 0,5% libératoire du chiffre d'affaires annuel encaissé, avec un plancher légal minimum de 10 000 DZD par an. La déclaration et le règlement s'effectuent avant le 31 janvier de l'année suivante (N+1)."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white">
                {isAr
                  ? "ماذا يحدث عند تجاوز سقف 5 000 000 دج سنوياً؟"
                  : "Que se passe-t-il si je dépasse le plafond de 5 000 000 DZD ?"}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "في حال تجاوز السقف لمدة ثلاث سنوات متتالية، يلتزم المقاول بالتحول إلى شركة تجارية (ش.ذ.م.م أو ش.ش.ذ.م.م). ترسل المنصة تنبيهات مسبقة لتفادي أي إشكاليات قانونية."
                  : "Si vous dépassez le plafond pendant 3 années consécutives, vous êtes tenu de changer de statut juridique et d'évoluer vers une société commerciale (EURL ou SARL). Auto Entrepreneur DZ vous alerte en amont pour anticiper cette transition."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            {isAr
              ? "هل أنت مستعد لتبسيط إدارة نشاطك كمقاول ذاتي؟"
              : "Prêt à simplifier votre gestion d'Auto-Entrepreneur ?"}
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            {isAr
              ? "انضم إلى Auto Entrepreneur DZ اليوم لإصدار فواتيرك الرسمية والتحكم التام في التزاماتك الجبائية."
              : "Rejoignez Auto Entrepreneur DZ dès aujourd'hui pour éditer vos factures conformes et garder le contrôle absolu sur votre fiscalité."}
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition"
              >
                <span>{isAr ? "الدخول إلى حسابي" : "Accéder à mon espace"}</span>
                <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition"
              >
                <span>{isAr ? "إنشاء حساب مجاني" : "Créer mon compte gratuit"}</span>
                <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-400">
              {isAr
                ? "Auto Entrepreneur DZ — مطابق لأحكام القانون رقم 22-23 (الجمهورية الجزائرية)"
                : "Auto Entrepreneur DZ — Conforme Loi n° 22-23 (Algérie)"}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300 transition">
              {isAr ? "تسجيل الدخول" : "Connexion"}
            </Link>
            <Link href="/signup" className="hover:text-slate-300 transition">
              {isAr ? "إنشاء حساب" : "Inscription"}
            </Link>
            <a
              href="https://anae.dz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition"
            >
              {isAr ? "بوابة الوكالة anae.dz ↗" : "Portail ANAE.dz ↗"}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomeView;
