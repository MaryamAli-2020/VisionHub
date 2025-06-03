
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Send, Search, MessageCircle, Users, 
  MoreVertical, Phone, Video, Info
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostgrestError } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";

type Tables = Database['public']['Tables'];
type TableRow<T extends keyof Tables> = Tables[T]['Row'];

type DBProfile = TableRow<'profiles'>;
type DBMessage = TableRow<'messages'>;
type DBConversation = TableRow<'conversations'>;

type Profile = Pick<DBProfile, 'id' | 'username' | 'full_name' | 'avatar_url' | 'specialty'>;

interface Message extends Omit<DBMessage, 'message_type'> {
  sender_profile?: Profile;
  message_type?: 'text' | 'media';
}

interface MessageWithProfile extends Message {
  sender_profile: Profile;
}

interface ConversationWithDetails extends Omit<DBConversation, 'participant_profiles'> {
  participant_profiles: Profile[];
  last_message?: Message;
  unread_count: number;
  messages?: Message[];
}

interface MutualConnection extends Profile {
  is_mutual: boolean;
}

export default function MessagesScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Enhanced conversations query with better error handling
  const { data: conversations, isLoading: conversationsLoading, error: conversationsError } = useQuery<ConversationWithDetails[], PostgrestError>({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      // Ensure the data matches ConversationWithDetails type
      return (
        data?.map((raw: any) => ({
          ...raw,
          participant_profiles: raw.participant_profiles ?? [],
          unread_count: raw.unread_count ?? 0,
          last_message: raw.last_message ?? undefined,
          messages: raw.messages ?? undefined,
        })) ?? []
      );
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Enhanced mutual connections query
  const { data: mutualConnections, isLoading: connectionsLoading } = useQuery<MutualConnection[], PostgrestError>({
    queryKey: ['mutual-connections', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        // Get users I follow
        const { data: myFollows, error: myFollowsError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (myFollowsError) throw myFollowsError;

        // Get users who follow me
        const { data: myFollowers, error: myFollowersError } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', user.id);

        if (myFollowersError) throw myFollowersError;

        // Find mutual followers
        const myFollowIds = new Set(myFollows?.map(f => f.following_id) || []);
        const myFollowerIds = new Set(myFollowers?.map(f => f.follower_id) || []);
        const mutualIds = [...myFollowIds].filter(id => myFollowerIds.has(id));

        if (mutualIds.length === 0) return [];

        // Get profiles for mutual connections
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, specialty')
          .in('id', mutualIds);

        if (profilesError) throw profilesError;

        return profiles?.map(profile => ({
          ...profile,
          is_mutual: true
        })) || [];
      } catch (error) {
        console.error('Error fetching mutual connections:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  // Get the selected conversation details
  const selectedConversationData = conversations?.find(c => c.id === selectedConversation);
  
  // Get the other participant in the conversation
  const otherParticipant = selectedConversationData?.participant_profiles?.find(
    p => p.id !== user?.id
  );

  // Enhanced messages query
  const { data: messages, isLoading: messagesLoading } = useQuery<MessageWithProfile[], PostgrestError>({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!sender_id(id, username, full_name, avatar_url, specialty)
        `)
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      return data?.map(msg => ({
        ...msg,
        message_type: (msg.message_type as 'text' | 'media') || 'text',
        sender_profile: msg.sender_profile as Profile
      })) || [];
    },
    enabled: !!selectedConversation,
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000, // 10 seconds
    retry: 3,
  });

  // Enhanced conversation creation/retrieval
  const createOrGetConversationMutation = useMutation({
    mutationFn: async (participantId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      try {
        // First try to find an existing conversation      
        const { data: existingConversations, error: searchError } = await supabase
          .from('conversations')
          .select(`
            *,
            messages(
              *,
              sender_profile:profiles!sender_id(id, username, full_name, avatar_url, specialty)
            )
          `)
          .filter('participant_ids', 'cs', `{${user.id}}`)
          .filter('participant_ids', 'cs', `{${participantId}}`)
          .limit(1);

        if (searchError) {
          console.error('Search error:', searchError);
          throw new Error('Failed to check existing conversations');
        }

        const existingConversation = existingConversations?.[0];
        let conversationToReturn: ConversationWithDetails;
        
        if (existingConversation) {
          console.log('Found existing conversation:', existingConversation);
          // Fetch participant profiles for existing conversation
          const { data: existingProfiles, error: existingProfilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, specialty')
            .in('id', [user.id, participantId]);

          if (existingProfilesError) {
            console.error('Profile fetch error:', existingProfilesError);
            throw existingProfilesError;
          }

          conversationToReturn = {
            ...existingConversation,
            participant_profiles: existingProfiles || [],
            last_message: existingConversation.messages?.[0] || null,
            unread_count: 0,
            messages: []
          };
        } else {
          console.log('Creating new conversation between', user.id, 'and', participantId);
          // Create new conversation if none exists
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
              participant_ids: [user.id, participantId],
              created_by: user.id,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Create error:', createError);
            throw new Error('Failed to create conversation');
          }

          console.log('Created new conversation:', newConversation);
          // Fetch participant profiles for new conversation
          const { data: newProfiles, error: newProfilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, specialty')
            .in('id', [user.id, participantId]);

          if (newProfilesError) {
            console.error('Profile fetch error:', newProfilesError);
            throw newProfilesError;
          }

          conversationToReturn = {
            ...newConversation,
            participant_profiles: newProfiles || [],
            unread_count: 0,
            messages: []
          };
        }

        return conversationToReturn;
      } catch (error) {
        console.error('Error creating/getting conversation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setShowNewChatDialog(false);
      setSelectedParticipantId(null);
      setSearchTerm('');
      
      queryClient.setQueryData(['conversations', user?.id], (old: ConversationWithDetails[] | undefined) => {
        if (!old) return [data];
        const filtered = old.filter(c => c.id !== data.id);
        return [data, ...filtered];
      });
      
      setSelectedConversation(data.id);
      toast({
        title: "Success",
        description: "Conversation ready"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create conversation",
        variant: "destructive"
      });
    }
  });

  // Enhanced message sending
  const sendMessage = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!selectedConversation || !user?.id || !content.trim()) {
        throw new Error('Invalid message data');
      }

      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        throw new Error('Message cannot be empty');
      }

      try {
        const { data, error } = await supabase
          .from('messages')
          .insert([{
            conversation_id: selectedConversation,
            sender_id: user.id,
            content: trimmedContent
          }])
          .select(`
            *,
            sender_profile:profiles!sender_id(id, username, full_name, avatar_url, specialty)
          `)
          .single();

        if (error) throw error;
        
        return {
          ...data,
          message_type: (data.message_type as 'text' | 'media') || 'text',
          sender_profile: data.sender_profile as Profile
        };
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    onMutate: async ({ content }) => {
      // Optimistic update
      const optimisticMessage: MessageWithProfile = {
        id: `temp-${Date.now()}`,
        conversation_id: selectedConversation!,
        sender_id: user!.id,
        content: content.trim(),
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_type: 'text',
        sender_profile: {
          id: user!.id,
          username: user!.user_metadata?.username || 'You',
          full_name: user!.user_metadata?.full_name || 'You',
          avatar_url: user!.user_metadata?.avatar_url,
          specialty: user!.user_metadata?.specialty
        }
      };

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', selectedConversation] });
      
      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['messages', selectedConversation]);
      
      // Optimistically update
      queryClient.setQueryData(['messages', selectedConversation], (old: MessageWithProfile[] | undefined) => {
        return [...(old || []), optimisticMessage];
      });

      return { previousMessages, optimisticMessage };
    },
    onSuccess: (newMessage, variables, context) => {
      setMessageText('');
      
      // Replace optimistic message with real one
      queryClient.setQueryData(['messages', selectedConversation], (old: MessageWithProfile[] | undefined) => {
        if (!old) return [newMessage];
        return old.map(msg => 
          msg.id === context?.optimisticMessage.id ? newMessage : msg
        );
      });
      
      // Update conversations list
      queryClient.setQueryData(['conversations', user?.id], (old: ConversationWithDetails[] | undefined) => {
        if (!old) return old;
        return old.map(conversation => {
          if (conversation.id === selectedConversation) {
            return {
              ...conversation,
              last_message: newMessage,
              updated_at: new Date().toISOString()
            };
          }
          return conversation;
        });
      });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', selectedConversation], context.previousMessages);
      }
      
      console.error('Send message error:', error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  });

  // Enhanced mark as read functionality
  const markAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    },
    onError: (error) => {
      console.error('Mark as read error:', error);
    }
  });

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages && messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (selectedConversation && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [selectedConversation]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      markAsRead.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  // Enhanced message sending handler
  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !selectedConversation || sendMessage.isPending) return;
    
    sendMessage.mutate({
      content: messageText.trim()
    });
  }, [messageText, selectedConversation, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const filteredConnections = mutualConnections?.filter(connection => 
    connection.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.username?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handle loading states
  if (conversationsLoading && !conversations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (conversationsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load conversations</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          </div>
          <Button
            onClick={() => setShowNewChatDialog(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white"
            disabled={connectionsLoading}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
              <Button
                onClick={() => setShowNewChatDialog(true)}
                variant="outline"
                size="icon"
                disabled={connectionsLoading}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {!conversations || conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-2">No conversations yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Start chatting with your connections
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowNewChatDialog(true)}
                  disabled={connectionsLoading}
                >
                  Start New Chat
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((conversation) => {
                  const participant = conversation.participant_profiles.find(p => p.id !== user?.id);
                  if (!participant) return null;
                  
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.id ? 'bg-slate-50 border-r-2 border-slate-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={participant.avatar_url || "/placeholder.svg"}
                            alt={participant.full_name || "User"}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {conversation.unread_count && conversation.unread_count > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {participant.full_name || participant.username}
                          </p>
                          {conversation.last_message && (
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                              {conversation.last_message.content}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {conversation.updated_at && new Date(conversation.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation && otherParticipant ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <img
                    src={otherParticipant.avatar_url || "/placeholder.svg"}
                    alt={otherParticipant.full_name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {otherParticipant.full_name || otherParticipant.username}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {otherParticipant.specialty || 'VisionHub Member'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" disabled>
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled>
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled>
                    <Info className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled>View Profile</DropdownMenuItem>
                      <DropdownMenuItem disabled>Block User</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" disabled>
                        Delete Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!messages || messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No messages yet</p>
                  <p className="text-sm text-gray-500">
                    Start the conversation by sending a message
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMyMessage = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-2 ${
                        isMyMessage ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <img
                        src={message.sender_profile?.avatar_url || "/placeholder.svg"}
                        alt={message.sender_profile?.full_name || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className={`max-w-[70%] space-y-1`}>
                        <div className={`rounded-2xl px-4 py-2 ${
                          isMyMessage 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {message.content}
                        </div>
                        <p className={`text-xs text-gray-500 ${
                          isMyMessage ? 'text-right' : ''
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (messageText.trim()) {
                    sendMessage.mutate({ content: messageText });
                  }
                }}
                className="flex items-end space-x-3"
              >
                <div className="flex-1">
                  <Input
                    ref={messageInputRef}
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (messageText.trim()) {
                          sendMessage.mutate({ content: messageText });
                        }
                      }
                    }}
                    className="min-h-[2.5rem]"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!messageText.trim() || sendMessage.isPending}
                >
                  {sendMessage.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">Select a conversation</p>
              <p className="text-sm text-gray-500">
                Choose from your existing conversations or start a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {mutualConnections && mutualConnections.filter(conn =>
                conn.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conn.username?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((conn) => (
                <button
                  key={conn.id}
                  onClick={() => {
                    createOrGetConversationMutation.mutate(conn.id);
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={conn.avatar_url || "/placeholder.svg"}
                    alt={conn.full_name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-gray-900">
                      {conn.full_name || conn.username}
                    </p>
                    {conn.specialty && (
                      <p className="text-sm text-gray-500">{conn.specialty}</p>
                    )}
                  </div>
                  <Users className="w-5 h-5 text-gray-400" />
                </button>
              ))}
              {(!mutualConnections || !mutualConnections.filter(conn =>
                conn.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conn.username?.toLowerCase().includes(searchTerm.toLowerCase())
              ).length) && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No connections found</p>
                  <p className="text-sm text-gray-500">
                    Try searching for a different name
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
