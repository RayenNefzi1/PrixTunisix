'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeIndex() {
  const router = useRouter()
  
  useEffect(() => {
    const token = localStorage.getItem('employee_token')
    if (token) {
      router.push('/employee/dashboard')
    } else {
      router.push('/employee/login')
    }
  }, [router])
  
  return null
}