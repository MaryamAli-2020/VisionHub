import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LinkedAccount } from '@/types/settings';
import { Button } from '@/components/ui/button';
import { Link2, Github, Twitter, Facebook, Mail, Unlink } from 'lucide-react';
import { toast } from 'sonner';

const PROVIDERS = {
  google: {
    name: 'Google',
    icon: Mail,
    color: 'bg-red-500'
  },
  github: {
    name: 'GitHub',
    icon: Github,
    color: 'bg-gray-900'
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-blue-400'
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600'
  }
} as const;

export function LinkedAccountsScreen() {
  const { user } = useAuth();
  const { data: linkedAccounts, isLoading } = useQuery<LinkedAccount[]>({
    queryKey: ['linked-accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linked_accounts')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Map the database response to our interface type
      return (data ?? []).map((account): LinkedAccount => ({
        id: account.id,
        user_id: account.user_id,
        provider: account.provider as LinkedAccount['provider'],
        provider_user_id: account.provider_user_id,
        provider_account_data: account.provider_account_data as LinkedAccount['provider_account_data'],
        created_at: account.created_at
      }));
    },
    enabled: !!user?.id
  });

  const handleUnlink = async (provider: string) => {
    try {
      const { error } = await supabase
        .from('linked_accounts')
        .delete()
        .eq('user_id', user?.id)
        .eq('provider', provider);

      if (error) throw error;
      toast.success(`Unlinked ${provider} account`);
    } catch (error) {
      toast.error('Failed to unlink account');
    }
  };

  const handleLink = async (provider: string) => {
    // This would typically integrate with the provider's OAuth flow
    toast.info('OAuth integration coming soon');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse mb-4" />
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse mb-4" />
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="grid gap-4">
        {Object.entries(PROVIDERS).map(([providerId, provider]) => {
          const linkedAccount = linkedAccounts?.find(
            account => account.provider === providerId
          );
          const Icon = provider.icon;

          return (
            <div
              key={providerId}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg text-white ${provider.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium">{provider.name}</h3>
                  {linkedAccount && (
                    <p className="text-sm text-gray-500">
                      {linkedAccount.provider_account_data.email || 
                       linkedAccount.provider_account_data.name}
                    </p>
                  )}
                </div>
              </div>
              
              {linkedAccount ? (
                <Button
                  variant="outline"
                  onClick={() => handleUnlink(providerId)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Unlink
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleLink(providerId)}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Link
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
