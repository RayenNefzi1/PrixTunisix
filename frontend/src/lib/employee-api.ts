import axios from 'axios'

const employeeApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

employeeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('employee_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

employeeApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('employee_token')
      localStorage.removeItem('employee_user')
      if (typeof window !== 'undefined') {
        window.location.href = '/employee/login'
      }
    }
    return Promise.reject(err)
  }
)

export default employeeApi