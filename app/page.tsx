'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/notes')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Loading...</h1>
      </div>
    </div>
  )
}
