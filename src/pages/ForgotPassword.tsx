import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BrandLogo } from '@/components/ui/BrandLogo';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(values.email);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
      setIsSubmitted(true);
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
              <BrandLogo size={210} />
            </div>
            <CardTitle className="text-3xl font-bold text-yellow-500">Reset Password</CardTitle>
            <CardDescription className="text-zinc-400">
              {isSubmitted 
                ? 'Check your email for a reset link'
                : 'Enter your email to receive a password reset link'
              }
            </CardDescription>
          </CardHeader>
          {!isSubmitted ? (
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="bruce@wayne.com" 
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
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          ) : (
            <CardContent className="text-center py-6">
              <div className="text-green-500 mb-4">
                If an account exists with this email, you'll receive a password reset link shortly.
              </div>
              <Button 
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="mr-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Try Again
              </Button>
            </CardContent>
          )}
          <CardFooter className="text-center">
            <div className="text-sm text-zinc-400 w-full">
              Remember your password?{' '}
              <Link to="/login" className="text-yellow-500 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}