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
    console.error('API Error:', err.response?.status, err.response?.data)
    // Don't redirect automatically - let the component handle errors
    return Promise.reject(err)
  }
)

export default employeeApi