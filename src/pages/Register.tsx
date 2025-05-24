import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
});

export function Register() {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(
        values.email, 
        values.password, 
        { 
          first_name: values.firstName, 
          last_name: values.lastName 
        }
      );
      
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
        description: 'Account created successfully! You can now sign in.',
      });
      
      // Redirect to login page on successful registration
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred during registration',
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
            <CardTitle className="text-3xl font-bold text-yellow-500">Create Account</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Bruce" 
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
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Wayne" 
                            {...field} 
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
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
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-center">
            <div className="text-sm text-zinc-400 w-full">
              Already have an account?{' '}
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