# Settings Integration Guide

This guide shows how the admin settings system is integrated throughout the application and how to use it in your components.

## Overview

The settings system allows admins to customize the application without touching code. Settings are stored in MongoDB and can be edited through the admin dashboard at `/admin/settings`.

## How It Works

1. **Database**: Settings stored in `AppSetting` collection
2. **API**: Public endpoint `/api/app-settings` serves settings to frontend
3. **Provider**: `SettingsProvider` makes settings available app-wide
4. **Hook**: `useSettings()` hook for easy access in components

## Using Settings in Components

### Client Components

```typescript
'use client';

import { useSettings, useSetting } from '@/providers/settings-provider';

export default function MyComponent() {
  // Method 1: Get all settings
  const { get, settings, loading } = useSettings();
  const appName = get('app.name', 'Default Name');

  // Method 2: Get single setting (convenience hook)
  const { value: primaryColor } = useSetting('theme.primary_color', '#3b82f6');

  return (
    <div>
      <h1>{appName}</h1>
      <p style={{ color: primaryColor }}>Themed content</p>
    </div>
  );
}
```

### Server Components

```typescript
import { getServerSetting, getServerSettings } from '@/lib/settings/metadata';

export default async function ServerComponent() {
  // Get a single setting
  const appName = await getServerSetting('app.name', 'Farisly AI');

  // Get multiple settings at once
  const settings = await getServerSettings([
    'app.name',
    'app.description',
    'theme.primary_color'
  ]);

  return (
    <div>
      <h1>{appName}</h1>
      <p>{settings['app.description']}</p>
    </div>
  );
}
```

### Dynamic Metadata

```typescript
// app/my-page/page.tsx
import { getSettingsMetadata } from '@/lib/settings/metadata';

export async function generateMetadata() {
  return await getSettingsMetadata();
}

export default function MyPage() {
  return <div>My Page</div>;
}
```

## Available Settings Categories

### General Settings
- `app.name` - Application name
- `app.description` - App description
- `app.support_email` - Support email address
- `app.maintenance_mode` - Boolean for maintenance mode

### Theme Settings
- `theme.primary_color` - Primary brand color (hex)
- `theme.logo_url` - Logo image path
- `theme.favicon_url` - Favicon path

### Email Settings
- `email.from_name` - Email sender name
- `email.from_address` - Email sender address
- `email.welcome_template` - HTML template for welcome emails

### Content Settings
- `content.homepage_hero_title` - Homepage main headline
- `content.homepage_hero_subtitle` - Homepage subtitle
- `content.footer_text` - Footer copyright text

### SEO Settings
- `seo.meta_title` - Default page title
- `seo.meta_description` - Default meta description
- `seo.og_image` - Open Graph image URL

## Examples in the Codebase

### 1. Homepage (`app/page.tsx`)
```typescript
const appName = get('app.name', 'Farisly AI');
const heroTitle = get('content.homepage_hero_title', 'Default Title');
const footerText = get('content.footer_text', '© 2024 Company');
```

### 2. Login Page (`app/auth/login/page.tsx`)
```typescript
const appName = get('app.name', 'Farisly AI');
// Used in: <h1>{appName}</h1>
```

### 3. Email Templates (Server-side)
```typescript
const fromName = await getServerSetting('email.from_name', 'Farisly AI');
const template = await getServerSetting('email.welcome_template');
// Replace {{variables}} in template
const personalizedEmail = template
  .replace('{{app_name}}', fromName)
  .replace('{{user_name}}', user.name);
```

## Adding New Settings

### Via Admin Dashboard
1. Go to `/admin/settings`
2. Click "Initialize Default Settings" (first time only)
3. Edit any setting value
4. Click "Save Changes"

### Programmatically
```typescript
await fetch('/api/admin/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'feature.new_setting',
    value: 'Some value',
    type: 'string', // string, number, boolean, json, html, array
    category: 'features', // general, theme, email, features, content, seo
    label: 'New Setting',
    description: 'Description of what this does',
    isPublic: true, // Whether non-admins can read it
  }),
});
```

## Settings Types

| Type | Use Case | Example |
|------|----------|---------|
| `string` | Text values | App name, email address |
| `number` | Numeric values | Max items, timeout |
| `boolean` | On/off toggles | Maintenance mode, feature flags |
| `json` | Complex data | Configuration objects |
| `html` | Rich content | Email templates |
| `array` | Lists | Categories, tags |

## Public vs Private Settings

- **Public** (`isPublic: true`): Available via `/api/app-settings`, can be read by anyone
- **Private** (`isPublic: false`): Only admins can read via `/api/admin/settings`

Use private for:
- Email credentials
- API keys
- Internal configuration
- Admin-only features

## Caching & Performance

Settings are:
- **Cached on client**: Refreshed every 5 minutes
- **Can be manually refreshed**: `await refetch()`
- **Minimal database queries**: Fetched once per page load

```typescript
const { refetch } = useSettings();

// Manually refresh settings
await refetch();
```

## Best Practices

1. **Always provide defaults**: `get('key', 'default')`
2. **Use semantic keys**: `content.hero_title` not `setting1`
3. **Group by category**: Makes admin UI organized
4. **Mark sensitive settings private**: Email config, API keys
5. **Add descriptions**: Help admins understand settings
6. **Use TypeScript**: Get type safety with settings

## Migration from Hardcoded Values

**Before:**
```typescript
<h1>Farisly AI</h1>
<p>AI-powered browser extension</p>
```

**After:**
```typescript
const appName = get('app.name', 'Farisly AI');
const description = get('app.description', 'AI-powered browser extension');

<h1>{appName}</h1>
<p>{description}</p>
```

## Troubleshooting

### Settings not loading?
1. Check if settings are initialized: Visit `/admin/settings`
2. Check browser console for errors
3. Verify API endpoint: `curl http://localhost:3000/api/app-settings`

### Settings not updating?
1. Click "Save Changes" in admin dashboard
2. Wait up to 5 minutes for cache refresh
3. Or manually refresh: `const { refetch } = useSettings(); await refetch();`

### Can't see private settings?
- Private settings only available to admins via `/api/admin/settings`
- Check `isPublic` field in database

## Future Enhancements

Possible additions:
- **Setting history**: Track all changes with rollback
- **A/B testing**: Multiple values for same setting
- **Environment-based**: Different settings per environment
- **Setting groups**: Custom grouping beyond categories
- **Validation rules**: Enforce formats (email, URL, etc.)
- **Setting dependencies**: Show/hide based on other values
