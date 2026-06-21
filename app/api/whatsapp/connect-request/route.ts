import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    await supabase.from('notifications').insert({
        business_id,
        type: 'whatsapp_connect_request',
        title: 'WhatsApp Connection Requested',
        message: `Connection request submitted for ${phone_number}. Our team will reach out within 24 hours.`,
        is_read: false,
    });

    try {
        await resend.emails.send({
            from: 'Munshi Alerts <onboarding@resend.dev>',
            to: 'shahmeershaikh900@gmail.com',
            subject: 'New WhatsApp Connection Request',
            html: `<p>A new connection request was submitted.</p>
             <p><strong>Phone:</strong> ${phone_number}</p>
             <p><strong>Business:</strong> ${business_name || 'N/A'}</p>
             <p><strong>Notes:</strong> ${notes || 'N/A'}</p>
             <p>Check the admin panel: munshi-theta.vercel.app/admin/requests</p>`
        })
    } catch (emailError) {
        console.error('Email alert failed:', emailError)
    }

    return NextResponse.json({ success: true });
}