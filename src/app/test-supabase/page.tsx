import TestSupabase from '@/components/TestSupabase'
import DebugSupabase from '@/components/DebugSupabase'
import SimpleSupabaseTest from '@/components/SimpleSupabaseTest'

export default function TestSupabasePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <SimpleSupabaseTest />
        <DebugSupabase />
        <TestSupabase />
      </div>
    </div>
  )
} 