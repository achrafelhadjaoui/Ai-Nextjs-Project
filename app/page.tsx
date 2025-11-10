"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useI18n } from "@/providers/i18n-provider";
import { useSettings } from "@/providers/settings-provider";

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { get } = useSettings();

  // Get dynamic content from settings
  const appName = get('app.name', 'Farisly AI');
  const heroTitle = get('content.homepage_hero_title', t('home.title'));
  const heroSubtitle = get('content.homepage_hero_subtitle', t('home.description'));
  const footerText = get('content.footer_text', `© ${new Date().getFullYear()} ${appName}. ${t('home.footer')}`);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-[#0a0a0a] to-[#111111] px-4 text-center">
      {/* Logo / Title */}
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
        {heroTitle}
      </h1>

      <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-xl">
        {heroSubtitle}
      </p>

      {/* Hero Image (Optional) */}
      <div className="mb-8">
        <Image
          src="/hero-illustration.png"
          alt="Farisly AI Hero"
          width={500}
          height={300}
          className="rounded-lg shadow-lg"
        />
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => router.push("/auth/login")}
          className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          {t('home.signIn')}
        </button>
        <button
          onClick={() => router.push("/auth/signup")}
          className="px-8 py-3 bg-transparent border border-white text-white font-medium rounded-lg hover:bg-white hover:text-black transition-colors"
        >
          {t('home.getStarted')}
        </button>
      </div>

      <footer className="text-gray-500 text-sm mt-12">
        {footerText}
      </footer>
    </main>
  );
}
