// app/api/admin/settings/init/route.ts
// Initialize default app settings (admin only)
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import AppSetting from "@/lib/models/AppSetting";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

const defaultSettings = [
  // General Settings
  {
    key: 'app.name',
    value: 'Farisly AI',
    type: 'string',
    category: 'general',
    label: 'Application Name',
    description: 'The name of your application',
    isPublic: true,
  },
  {
    key: 'app.description',
    value: 'AI-powered browser extension for saved replies',
    type: 'string',
    category: 'general',
    label: 'Application Description',
    description: 'Short description of your application',
    isPublic: true,
  },
  {
    key: 'app.support_email',
    value: 'support@farisly.ai',
    type: 'string',
    category: 'general',
    label: 'Support Email',
    description: 'Email address for customer support',
    isPublic: true,
  },
  {
    key: 'app.maintenance_mode',
    value: false,
    type: 'boolean',
    category: 'general',
    label: 'Maintenance Mode',
    description: 'Enable to show maintenance page to users',
    isPublic: true,
  },

  // Theme Settings
  {
    key: 'theme.primary_color',
    value: '#3b82f6',
    type: 'string',
    category: 'theme',
    label: 'Primary Color',
    description: 'Main brand color (hex code)',
    isPublic: true,
  },
  {
    key: 'theme.logo_url',
    value: '/logo.png',
    type: 'string',
    category: 'theme',
    label: 'Logo URL',
    description: 'Path to your logo image',
    isPublic: true,
  },
  {
    key: 'theme.favicon_url',
    value: '/favicon.ico',
    type: 'string',
    category: 'theme',
    label: 'Favicon URL',
    description: 'Path to your favicon',
    isPublic: true,
  },

  // Email Settings
  {
    key: 'email.from_name',
    value: 'Farisly AI',
    type: 'string',
    category: 'email',
    label: 'From Name',
    description: 'Name shown in sent emails',
    isPublic: false,
  },
  {
    key: 'email.from_address',
    value: 'noreply@farisly.ai',
    type: 'string',
    category: 'email',
    label: 'From Address',
    description: 'Email address used for sending emails',
    isPublic: false,
  },
  {
    key: 'email.welcome_template',
    value: `<h1>Welcome to {{app_name}}!</h1>
<p>Hi {{user_name}},</p>
<p>Thank you for signing up. We're excited to have you on board!</p>
<p>Get started by visiting your dashboard.</p>
<p>Best regards,<br>The {{app_name}} Team</p>`,
    type: 'html',
    category: 'email',
    label: 'Welcome Email Template',
    description: 'HTML template for welcome emails (use {{variable}} for placeholders)',
    isPublic: false,
  },

  // Content Settings
  {
    key: 'content.homepage_hero_title',
    value: 'Save Time with AI-Powered Replies',
    type: 'string',
    category: 'content',
    label: 'Homepage Hero Title',
    description: 'Main headline on the homepage',
    isPublic: true,
  },
  {
    key: 'content.homepage_hero_subtitle',
    value: 'Automate your responses with intelligent saved replies powered by AI',
    type: 'string',
    category: 'content',
    label: 'Homepage Hero Subtitle',
    description: 'Subtitle text on the homepage',
    isPublic: true,
  },
  {
    key: 'content.footer_text',
    value: '© 2024 Farisly AI. All rights reserved.',
    type: 'string',
    category: 'content',
    label: 'Footer Text',
    description: 'Copyright text in footer',
    isPublic: true,
  },

  // SEO Settings
  {
    key: 'seo.meta_title',
    value: 'Farisly AI - AI-Powered Saved Replies',
    type: 'string',
    category: 'seo',
    label: 'Meta Title',
    description: 'Default page title for SEO',
    isPublic: true,
  },
  {
    key: 'seo.meta_description',
    value: 'Boost your productivity with Farisly AI - the intelligent browser extension for managing and automating your saved replies.',
    type: 'string',
    category: 'seo',
    label: 'Meta Description',
    description: 'Default meta description for SEO',
    isPublic: true,
  },
  {
    key: 'seo.og_image',
    value: '/og-image.png',
    type: 'string',
    category: 'seo',
    label: 'Open Graph Image',
    description: 'Image shown when sharing on social media',
    isPublic: true,
  },
];

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    // Check if settings already exist
    const existingCount = await AppSetting.countDocuments();

    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        message: `Settings already initialized (${existingCount} settings found). Delete existing settings first if you want to reinitialize.`,
      }, { status: 400 });
    }

    // Create all default settings
    const created = await AppSetting.insertMany(
      defaultSettings.map(setting => ({
        ...setting,
        updatedBy: admin.id,
      }))
    );


    return NextResponse.json({
      success: true,
      message: `Successfully initialized ${created.length} default settings`,
      data: created,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to initialize settings" },
      { status: 500 }
    );
  }
}
