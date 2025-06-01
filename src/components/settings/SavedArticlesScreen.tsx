import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SavedArticle } from '@/types/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function SavedArticlesScreen() {
  const { user } = useAuth();

  const { data: savedArticles, isLoading } = useQuery({
    queryKey: ['saved-articles', user?.id] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_articles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform and validate the data to match our SavedArticle interface
      return (data || []).map((item): SavedArticle => {
        // Validate article_type
        const articleType = item.article_type as 'article' | 'tutorial' | 'news';
        if (!['article', 'tutorial', 'news'].includes(articleType)) {
          throw new Error(`Invalid article_type: ${articleType}`);
        }
        
        return {
          id: item.id,
          user_id: item.user_id,
          title: item.title,
          description: item.description || undefined,
          article_url: item.article_url,
          article_type: articleType,
          thumbnail_url: item.thumbnail_url || undefined,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      });
    },
    enabled: !!user?.id
  });

  const handleRemoveArticle = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
      toast.success('Article removed from saved items');
    } catch (error) {
      toast.error('Failed to remove article');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse mb-4" />
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse mb-4" />
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {(!savedArticles || savedArticles.length === 0) ? (
        <div className="text-center py-12">
          <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No saved articles yet</h3>
          <p className="text-gray-500">Articles you save will appear here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {savedArticles.map((article) => (
            <Card key={article.id}>
              <CardHeader className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {article.title}
                    </CardTitle>
                    {article.description && (
                      <p className="text-sm text-gray-500">{article.description}</p>
                    )}
                  </div>
                  {article.thumbnail_url && (
                    <img
                      src={article.thumbnail_url}
                      alt={article.title}
                      className="w-24 h-16 object-cover rounded-lg ml-4"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="capitalize px-2 py-1 bg-gray-100 rounded-full">
                    {article.article_type}
                  </span>
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(article.article_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveArticle(article.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
