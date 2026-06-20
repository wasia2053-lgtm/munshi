import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business_id = user.id;

    const { data: settings } = await supabase
        .from('business_settings')
        .select('bot_name, language, tone, onboarding_complete, operating_hours')
        .eq('business_id', business_id)
        .single();

    // Determine if currently within operating hours
    let isOpen = true;
    if (settings?.operating_hours) {
        const now = new Date();
        const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const hours = settings.operating_hours as any;
        if (hours[day]) {
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const [openH, openM] = (hours[day].open || '00:00').split(':').map(Number);
            const [closeH, closeM] = (hours[day].close || '23:59').split(':').map(Number);
            const openMinutes = openH * 60 + openM;
            const closeMinutes = closeH * 60 + closeM;
            isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
        }
    }

    return NextResponse.json({
        botName: settings?.bot_name || 'Munshi Bot',
        language: settings?.language || 'english',
        tone: settings?.tone || 'professional',
        onboardingComplete: settings?.onboarding_complete || false,
        isCurrentlyOpen: isOpen,
    });
}