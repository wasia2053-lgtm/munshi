import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business_id = user.id;
    const body = await request.json();
    const { phone_number, business_name, notes } = body;

    if (!phone_number || phone_number.trim().length < 8) {
        return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('whatsapp_connection_requests')
        .insert({
            business_id,
            phone_number: phone_number.trim(),
            business_name: business_name?.trim() || null,
            notes: notes?.trim() || null,
            status: 'pending',
        });

    if (error) {
        console.error('Connect request error:', error);
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }

    // Notify via notifications table so it shows in admin/owner's awareness
    await supabase.from('notifications').insert({
        business_id,
        type: 'whatsapp_connect_request',
        title: 'WhatsApp Connection Requested',
        message: `Connection request submitted for ${phone_number}. Our team will reach out within 24 hours.`,
        is_read: false,
    });

    return NextResponse.json({ success: true });
}