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
    const { phone_number_id, access_token, phone_number } = body;

    if (!phone_number_id?.trim() || !access_token?.trim()) {
        return NextResponse.json({ error: 'Phone Number ID and Access Token are required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('whatsapp_credentials_submissions')
        .insert({
            business_id,
            phone_number_id: phone_number_id.trim(),
            access_token: access_token.trim(),
            phone_number: phone_number?.trim() || null,
            status: 'pending',
        });

    if (error) {
        console.error('Credentials submit error:', error);
        return NextResponse.json({ error: 'Failed to submit credentials' }, { status: 500 });
    }

    await supabase.from('notifications').insert({
        business_id,
        type: 'whatsapp_credentials_submitted',
        title: 'WhatsApp Credentials Submitted',
        message: 'Your credentials have been submitted for review. We will activate your bot shortly.',
        is_read: false,
    });

    try {
        await resend.emails.send({
            from: 'Munshi Alerts <onboarding@resend.dev>',
            to: 'shahmeershaikh900@gmail.com',
            subject: 'New WhatsApp Credentials Submitted',
            html: `<p>New credentials submitted for review.</p>
             <p><strong>Phone Number ID:</strong> ${phone_number_id}</p>
             <p>Check the admin panel: munshi-theta.vercel.app/admin/requests</p>`
        })
    } catch (emailError) {
        console.error('Email alert failed:', emailError)
    }

    return NextResponse.json({ success: true });
}