import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const profileFormSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Invalid email address' }).optional(),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function Profile() {
  const { profile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email,
        phone: profile.phone || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await updateProfile(data);
      
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
        description: 'Profile updated successfully',
      });
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

  if (!profile) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-24 w-24 rounded-full bg-zinc-700 mx-auto mb-4"></div>
          <div className="h-8 w-64 bg-zinc-700 rounded mb-4"></div>
          <div className="h-4 w-40 bg-zinc-700 rounded"></div>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    if (!profile.first_name && !profile.last_name) return 'U';
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`;
  };

  return (
    <div className="container max-w-4xl py-10">
      <Tabs defaultValue="general" className="w-full">
        <div className="mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <Avatar className="h-24 w-24 border-4 border-yellow-500/20">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="text-xl font-bold bg-yellow-500/10 text-yellow-500">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">
              {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-zinc-400">
              {profile.email} · <span className="capitalize">{profile.role}</span>
            </p>
          </div>
          
          <TabsList className="grid w-full md:w-auto grid-cols-2 h-auto bg-zinc-800/50">
            <TabsTrigger value="general" className="px-4 py-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="px-4 py-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              Security
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="general" className="mt-0">
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="first_name"
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
                      name="last_name"
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="bruce@wayne.com"
                            {...field}
                            disabled
                            className="bg-zinc-800/50 border-zinc-700 opacity-70"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+1 (555) 123-4567"
                            {...field}
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <Button 
                      type="submit" 
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-0">
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Change Password</h3>
                <p className="text-sm text-zinc-400">
                  Update your password to keep your account secure
                </p>
              </div>
              <div>
                <Button 
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => {
                    // Password reset flow will be handled separately
                    toast({
                      title: 'Password Reset',
                      description: 'A password reset link has been sent to your email',
                    });
                  }}
                >
                  Reset Password
                </Button>
              </div>
            </CardContent>
            <CardFooter className="border-t border-zinc-800 pt-6 flex flex-col items-start gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Account Role</h3>
                <p className="text-sm text-zinc-400">
                  Your current role is <span className="font-medium text-yellow-500 capitalize">{profile.role}</span>
                </p>
                <p className="text-xs text-zinc-500">
                  Roles determine what actions you can perform in the system. Contact an administrator if you need your role changed.
                </p>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}