// lib/settings/metadata.ts
// Server-side helper to generate metadata from settings
import { Metadata } from 'next';
import { connectDB } from '@/lib/db/connect';
import AppSetting from '@/lib/models/AppSetting';

export async function getSettingsMetadata(): Promise<Metadata> {
  try {
    await connectDB();

    const [title, description, ogImage] = await Promise.all([
      AppSetting.findOne({ key: 'seo.meta_title' }),
      AppSetting.findOne({ key: 'seo.meta_description' }),
      AppSetting.findOne({ key: 'seo.og_image' }),
    ]);

    return {
      title: title?.value || 'Farisly AI',
      description: description?.value || 'AI-powered browser extension',
      openGraph: {
        title: title?.value || 'Farisly AI',
        description: description?.value || 'AI-powered browser extension',
        images: ogImage?.value ? [ogImage.value] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: title?.value || 'Farisly AI',
        description: description?.value || 'AI-powered browser extension',
        images: ogImage?.value ? [ogImage.value] : [],
      },
    };
  } catch (error) {
    console.error('Error fetching metadata from settings:', error);
    // Return fallback metadata
    return {
      title: 'Farisly AI',
      description: 'AI-powered browser extension',
    };
  }
}

// Helper to get a specific setting value on the server
export async function getServerSetting(key: string, defaultValue: any = null) {
  try {
    await connectDB();
    const setting = await AppSetting.findOne({ key });
    return setting?.value ?? defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
}

// Helper to get multiple settings at once
export async function getServerSettings(keys: string[]): Promise<Record<string, any>> {
  try {
    await connectDB();
    const settings = await AppSetting.find({ key: { $in: keys } });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
}
