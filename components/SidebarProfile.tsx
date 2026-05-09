'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SidebarProfile() {
  const [name, setName] = useState('User')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)

  const fetchProfile = async () => {
    console.log('SidebarProfile: fetching...')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    setEmail(user.email || '')
    
    const { data } = await supabase
      .from('business_settings')
      .select('organization_name, avatar_url')
      .eq('business_id', user.id)
      .single()
    
    console.log('settings data:', data, 'user:', user?.id)
    
    if (data?.organization_name) setName(data.organization_name)
    if (data?.avatar_url && data.avatar_url !== 'NULL') 
      setAvatar(data.avatar_url)
  }

  useEffect(() => {
    fetchProfile()
    window.addEventListener('munshi_profile_updated', fetchProfile)
    return () => 
      window.removeEventListener('munshi_profile_updated', fetchProfile)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', 
      padding: '12px 16px', borderTop: '1px solid #2A4A42' }}>
      {avatar 
        ? <img src={avatar} style={{ width: 36, height: 36, 
            borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{ width: 36, height: 36, borderRadius: '50%',
            background: '#D4A853', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            color: '#102C26', fontWeight: 700 }}>
            {name.charAt(0).toUpperCase()}
          </div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#F7E7CE', fontSize: 14, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ color: '#8A7560', fontSize: 12,
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' }}>{email}</div>
      </div>
      <button onClick={async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/login'
      }} style={{ background: 'transparent', border: 'none',
        color: '#8A7560', cursor: 'pointer', fontSize: 18 }}
        title="Logout">
        🚪
      </button>
    </div>
  )
}
