import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { Send, Search, User, MessageCircle, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const MessagesPage = () => {
  const { get, post, del } = useApi();
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);
      const interval = setInterval(() => loadMessages(selectedConversation._id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const res = await get('/messages/conversations');
      if (res?.success) {
        setConversations(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const res = await get(`/messages/${conversationId}`);
      if (res?.success) {
        setMessages(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const res = await post('/messages', {
        recipientId: selectedConversation.participant._id,
        content: newMessage
      });

      if (res?.success) {
        setNewMessage('');
        loadMessages(selectedConversation._id);
        loadConversations(); // Update last message
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

    try {
      const res = await del(`/messages/conversation/${id}`);
      if (res?.success) {
        setConversations(conversations.filter(c => c._id !== id));
        if (selectedConversation?._id === id) {
          setSelectedConversation(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.participant?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-200px)]">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <MessageCircle className="w-8 h-8" />
        Messages
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Conversations List */}
        <div className="bg-card rounded-lg shadow overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map(conv => (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 border-b cursor-pointer hover:bg-secondary transition-colors ${
                    selectedConversation?._id === conv._id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{conv.participant?.username}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {conv.lastMessage?.content}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(e, conv._id)}
                      className="p-2 hover:bg-red-500/20 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(conv.updatedAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="md:col-span-2 bg-card rounded-lg shadow overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedConversation.participant?.username}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.participant?.role === 'admin' && 'Admin • '}
                    {selectedConversation.participant?.rank}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                  const isOwn = msg.sender._id === user?._id;
                  const showAvatar = index === 0 || 
                    messages[index - 1]?.sender._id !== msg.sender._id;

                  return (
                    <div
                      key={msg._id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      ) : (
                        <div className="w-8" />
                      )}
                      
                      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-primary text-white'
                              : 'bg-secondary'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 px-1">
                          {formatDate(msg.createdAt, true)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-2 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p>Choose from your existing conversations or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
