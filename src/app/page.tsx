import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FadeIn, SlideUp } from '@/components/ui/motion'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white">
      <FadeIn delay={0.2} className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          SchoolOS - Indian School Management System
        </p>
      </FadeIn>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-to-br before:from-transparent before:to-blue-700 before:opacity-10 before:blur-2xl after:absolute after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-to-t after:from-sky-900 after:via-[#0141ff] after:opacity-40 after:blur-2xl z-[-1]">
        <SlideUp delay={0.4}>
          <h1 className="text-6xl font-bold text-center">SchoolOS</h1>
        </SlideUp>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-1 lg:text-left mt-12">
        <FadeIn delay={0.6} className="flex justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="animate-pulse">Login to Portal</Button>
          </Link>
        </FadeIn>
      </div>
    </main>
  )
}
