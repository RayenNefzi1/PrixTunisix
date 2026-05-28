'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, RefreshCw, Search, X } from 'lucide-react'
import adminApi from '@/lib/admin-api'

interface Employee {
  id: number
  name: string
  prename: string
  cin: string
  phone: string
  auto_id: string
  created_at: string
  user?: {
    email: string
  }
}

function validateCin(value: string): string | null {
  if (value.length === 0) return null
  if (value.length !== 8) return 'CIN doit avoir 8 chiffres'
  if (!/^[2-9]/.test(value)) return 'CIN doit commencer par 2-9'
  return null
}

function validatePhone(value: string): string | null {
  if (value.length === 0) return null
  if (value.length !== 8) return 'Téléphone doit avoir 8 chiffres'
  if (!/^[2459]/.test(value)) return 'Téléphone doit commencer par 2, 4, 5 ou 9'
  return null
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    prename: '',
    cin: '',
    phone: '',
    email: '',
    password: '',
    auto_id: '',
  })
  const [cinError, setCinError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = () => {
    setLoading(true)
    adminApi.get('/admin/employees')
      .then(res => res.data)
      .then(data => setEmployees(data.data || data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingEmployee) {
        const updateData: any = {
          name: formData.name,
          prename: formData.prename,
          cin: formData.cin,
          phone: formData.phone,
        }
        if (formData.auto_id) updateData.auto_id = formData.auto_id
        if (formData.email) updateData.email = formData.email
        if (formData.password) updateData.password = formData.password
        await adminApi.put(`/admin/employees/${editingEmployee.id}`, updateData)
      } else {
        await adminApi.post('/admin/employees', formData)
      }
      fetchEmployees()
      resetForm()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await adminApi.delete(`/admin/employees/${id}`)
      setEmployees(employees.filter(e => e.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
    setDeletingEmployee(null)
  }

  const handleRegenerateId = async (id: number) => {
    try {
      const res = await adminApi.post(`/admin/employees/${id}/regenerate-id`)
      setEmployees(employees.map(e => e.id === id ? res.data : e))
    } catch (err) {
      console.error('Regenerate failed:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      prename: '',
      cin: '',
      phone: '',
      email: '',
      password: '',
      auto_id: '',
    })
    setEditingEmployee(null)
    setShowModal(false)
  }

  const openEdit = (emp: Employee) => {
    setFormData({
      name: emp.name,
      prename: emp.prename,
      cin: emp.cin,
      phone: emp.phone,
      email: emp.user?.email || '',
      password: '',
      auto_id: emp.auto_id || '',
    })
    setEditingEmployee(emp)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employés</h1>
          <p className="text-gray-500">Gérer les employés de la plateforme</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700"
        >
          <Plus className="w-5 h-5" />
          Ajouter un employé
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">ID</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nom</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Prénom</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">CIN</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Téléphone</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse" /></td>
                </tr>
              ))
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Aucun employé trouvé</td>
              </tr>
            ) : employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-brand-600">{emp.auto_id}</span>
                    <button
                      onClick={() => handleRegenerateId(emp.id)}
                      className="p-1 text-gray-400 hover:text-brand-600"
                      title="Générer nouveau ID"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-900 font-medium">{emp.name}</td>
                <td className="px-6 py-4 text-gray-600">{emp.prename}</td>
                <td className="px-6 py-4 text-gray-600 font-mono">{emp.cin}</td>
                <td className="px-6 py-4 text-gray-600">{emp.phone}</td>
                <td className="px-6 py-4 text-gray-600">{emp.user?.email || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingEmployee(emp)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editingEmployee ? 'Modifier l\'employé' : 'Ajouter un employé'}</h3>
              <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={formData.prename}
                    onChange={e => setFormData({ ...formData, prename: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CIN (8 chiffres)</label>
                <input
                  type="text"
                  value={formData.cin}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                    setFormData({ ...formData, cin: val })
                    setCinError(validateCin(val))
                  }}
                  className={`w-full px-3 py-2 border rounded-lg ${cinError ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="12345678"
                  maxLength={8}
                  required
                />
                {cinError && <p className="text-red-500 text-xs mt-1">{cinError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (8 chiffres)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                    setFormData({ ...formData, phone: val })
                    setPhoneError(validatePhone(val))
                  }}
                  className={`w-full px-3 py-2 border rounded-lg ${phoneError ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="21234567"
                  maxLength={8}
                  required
                />
                {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  required={!editingEmployee}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Employé (optionnel)</label>
                <input
                  type="text"
                  value={formData.auto_id}
                  onChange={e => setFormData({ ...formData, auto_id: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="EMPXXXXXXXX"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" className="flex-1 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                  {editingEmployee ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Confirmer la suppression</h3>
            <p className="text-gray-500 mb-6">
              Êtes-vous sûr de vouloir supprimer <br/>
              <span className="font-medium text-gray-900">{deletingEmployee.name} {deletingEmployee.prename}</span> ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingEmployee(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
                Annuler
              </button>
              <button onClick={() => handleDelete(deletingEmployee.id)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}