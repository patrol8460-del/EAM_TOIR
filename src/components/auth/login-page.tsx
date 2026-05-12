'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Wrench, Mail, Lock, Eye, EyeOff, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'

const loginSchema = z.object({
  email: z.string().email('Введите корректный email адрес'),
  password: z.string().min(1, 'Введите пароль'),
  remember: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

const demoCredentials = [
  { email: 'admin@enterprise.ru', password: 'admin123', role: 'Администратор' },
  { email: 'manager@enterprise.ru', password: 'manager123', role: 'Менеджер' },
  { email: 'engineer@enterprise.ru', password: 'engineer123', role: 'Инженер' },
]

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  const rememberValue = watch('remember')

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Ошибка авторизации')
      }

      const result = await res.json()
      login(result.user)

      if (data.remember) {
        localStorage.setItem('rm_email', data.email)
      } else {
        localStorage.removeItem('rm_email')
      }

      toast.success('Добро пожаловать!', {
        description: `Вы вошли как ${result.user.name}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Произошла ошибка при входе'
      toast.error('Ошибка входа', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = (email: string, password: string) => {
    setValue('email', email)
    setValue('password', password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0F1B2D] via-[#162236] to-[#1a2a42] p-4">
      {/* Subtle background pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 -top-40 size-96 rounded-full bg-[#FF9900]/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-[#FF9900]/3 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-xl border border-white/10 bg-white p-8 shadow-2xl">
          {/* Logo and title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-[#FF9900] shadow-lg shadow-[#FF9900]/20">
              <Wrench className="size-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">ЦС ТОРО</h1>
            <p className="mt-1 text-sm text-gray-500">
              Система управления ремонтной службой
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@enterprise.ru"
                  className="h-11 pl-10 border-gray-200 focus-visible:border-[#FF9900] focus-visible:ring-[#FF9900]/30"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Пароль
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  className="h-11 pl-10 pr-10 border-gray-200 focus-visible:border-[#FF9900] focus-visible:ring-[#FF9900]/30"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberValue}
                  onCheckedChange={(checked) => setValue('remember', checked === true)}
                  className="border-gray-300 data-[state=checked]:bg-[#FF9900] data-[state=checked]:border-[#FF9900] data-[state=checked]:text-white"
                />
                <Label htmlFor="remember" className="cursor-pointer text-sm text-gray-600">
                  Запомнить меня
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-[#FF9900] hover:text-[#E68A00] transition-colors"
              >
                Забыли пароль?
              </button>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full bg-[#FF9900] text-white font-medium shadow-lg shadow-[#FF9900]/20 hover:bg-[#E68A00] transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Вход...</span>
                </div>
              ) : (
                'Войти'
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Info className="size-3.5 text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Демо-доступ
              </span>
            </div>
            <div className="space-y-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => fillDemo(cred.email, cred.password)}
                  className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-left transition-all hover:border-[#FF9900]/50 hover:bg-[#FF9900]/5"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-700">{cred.email}</p>
                    <p className="text-[10px] text-gray-400">{cred.password}</p>
                  </div>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                    {cred.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-white/30">
          &copy; 2025 ЦС ТОРО. Все права защищены.
        </p>
      </div>
    </div>
  )
}
