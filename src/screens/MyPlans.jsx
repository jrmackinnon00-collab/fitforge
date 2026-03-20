import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, doc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import useAuthStore from '../store/useAuthStore'
import LoadingSpinner from '../components/LoadingSpinner'
import { Plus, MoreVertical, CheckCircle, Edit, Copy, Archive, Trash2 } from 'lucide-react'

function MyPlans() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState(null)

  useEffect(() => {
    if (user) fetchPlans()
  }, [user])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const plansRef = collection(db, 'users', user.uid, 'plans')
      const q = query(plansRef, orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const planList = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => !p.archived)
      setPlans(planList)
    } catch (err) {
      console.error('Error fetching plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetActive = async (planId) => {
    try {
      // Deactivate all plans
      for (const plan of plans) {
        await updateDoc(doc(db, 'users', user.uid, 'plans', plan.id), {
          isActive: false,
        })
      }
      // Activate selected plan
      await updateDoc(doc(db, 'users', user.uid, 'plans', planId), {
        isActive: true,
      })
      setPlans(plans.map((p) => ({ ...p, isActive: p.id === planId })))
    } catch (err) {
      console.error('Error setting active plan:', err)
    }
    setOpenMenuId(null)
  }

  const handleDuplicate = async (plan) => {
    try {
      const { addDoc } = await import('firebase/firestore')
      const plansRef = collection(db, 'users', user.uid, 'plans')
      await addDoc(plansRef, {
        ...plan,
        planName: `${plan.planName} (Copy)`,
        isActive: false,
        createdAt: new Date().toISOString(),
      })
      fetchPlans()
    } catch (err) {
      console.error('Error duplicating plan:', err)
    }
    setOpenMenuId(null)
  }

  const handleArchive = async (planId) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'plans', planId), {
        archived: true,
        isActive: false,
      })
      setPlans(plans.filter((p) => p.id !== planId))
    } catch (err) {
      console.error('Error archiving plan:', err)
    }
    setOpenMenuId(null)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Plans</h1>
        <button
          onClick={() => navigate('/dashboard/plans/new')}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold text-sm min-h-[44px] active:scale-95 transition-all"
        >
          <Plus size={18} />
          New Plan
        </button>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Plans Yet</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-6">
            Create your first workout plan or generate one with AI
          </p>
          <button
            onClick={() => navigate('/dashboard/plans/new')}
            className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-semibold active:scale-95 transition-all"
          >
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                      {plan.planName || 'Unnamed Plan'}
                    </h3>
                    {plan.isActive && (
                      <span className="shrink-0 flex items-center gap-1 bg-orange-500/10 text-orange-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} />
                        Active
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-slate-400 dark:text-slate-500 text-xs mb-2 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{plan.days?.length || 0} days</span>
                    <span>•</span>
                    <span>Created {formatDate(plan.createdAt)}</span>
                  </div>
                </div>

                {/* 3-dot Menu Button */}
                <button
                  onClick={() => setOpenMenuId(openMenuId === plan.id ? null : plan.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Dropdown Menu */}
              {openMenuId === plan.id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOpenMenuId(null)}
                  />
                  <div className="absolute right-4 top-12 z-20 bg-white dark:bg-slate-700 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-600 overflow-hidden min-w-[180px]">
                    <button
                      onClick={() => navigate(`/dashboard/plans/${plan.id}/edit`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 text-sm transition-colors"
                    >
                      <Edit size={16} />
                      Edit Plan
                    </button>
                    {!plan.isActive && (
                      <button
                        onClick={() => handleSetActive(plan.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-sm transition-colors"
                      >
                        <CheckCircle size={16} />
                        Set as Active
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicate(plan)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 text-sm transition-colors"
                    >
                      <Copy size={16} />
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleArchive(plan.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600 text-sm transition-colors border-t border-slate-100 dark:border-slate-600"
                    >
                      <Archive size={16} />
                      Archive
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyPlans
