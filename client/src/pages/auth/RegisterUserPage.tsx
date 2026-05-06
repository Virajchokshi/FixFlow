import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { registerUserSchema, RegisterUserFormData } from '@/lib/validations';
import { useAuthContext } from '@/context/AuthContext';
import { authApi } from '@/api/auth.api';
import { toast } from 'sonner';

export function RegisterUserPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterUserFormData>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: { role: 'user' },
  });

  const onSubmit = async (data: RegisterUserFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      setUser(response.data);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="FixFlow" className="h-28 w-auto object-contain" />
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Resident / User</span>
            </div>
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Submit and track your maintenance requests</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Hidden role field */}
              <input type="hidden" {...register('role')} value="user" />

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" placeholder="John Smith" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" placeholder="Min 8 characters" autoComplete="new-password" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number <span className="text-fixflow-muted">(optional)</span></Label>
                <Input id="phone" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>

            <div className="mt-4 space-y-2 text-center text-sm text-fixflow-muted">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="text-fixflow-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
              <p>
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-1 text-xs text-fixflow-muted hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to role selection
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
