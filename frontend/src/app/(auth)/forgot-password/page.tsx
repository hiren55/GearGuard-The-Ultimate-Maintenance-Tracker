'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Wrench, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { resetPassword, isLoading } = useAuth();
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const result = await resetPassword(data.email);

    if (result.success) {
      setIsEmailSent(true);
      toast.success('Password reset email sent!');
    } else {
      toast.error(result.error || 'Failed to send reset email');
    }
  };

  return (
    <>
      {/* Mobile logo */}
      <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wrench className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold">GearGuard</span>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            {isEmailSent
              ? 'Check your email for a reset link'
              : "Enter your email and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEmailSent ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                We've sent a password reset link to{' '}
                <span className="font-medium text-foreground">{getValues('email')}</span>
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsEmailSent(false)}
                  className="text-primary hover:underline"
                >
                  try again
                </button>
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Back to login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  error={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Send reset link
              </Button>

              <Button variant="ghost" asChild className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}
