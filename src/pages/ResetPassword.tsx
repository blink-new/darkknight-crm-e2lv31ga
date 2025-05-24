import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { BrandLogo } from '@/components/ui/BrandLogo';

const formSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    // Get the hash from the URL
    const hashFromUrl = window.location.hash.substring(1);
    if (hashFromUrl) {
      setHash(hashFromUrl);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!hash) {
      toast({
        title: 'Error',
        description: 'Invalid or expired reset link',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'Password has been reset successfully',
      });
      
      // Redirect to login page on successful password reset
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md p-4">
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto mb-2">
              <BrandLogo size={420} />
            </div>
            <CardTitle className="text-3xl font-bold text-yellow-500">Set New Password</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hash ? (
              <div className="text-center text-red-500">
                Invalid or expired reset link. Please request a new password reset.
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Set New Password'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/login')} 
              className="text-yellow-500 w-full"
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}