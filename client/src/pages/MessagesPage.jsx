import { useState, useEffect, useRef } from 'react';
import { useApiCall } from '../hooks/useApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Send, Search, User, MessageCircle, Trash2, Plus } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const MessagesPage = () => {
  const { call } = useApiCall();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');

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
      const res = await call('get', '/messages');
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
      const res = await call('get', `/messages/${conversationId}`);
      if (res?.success) {
        setMessages(res.data?.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const startConversation = async (recipientUsername, subject, content) => {
    setSending(true);
    try {
      const res = await call('post', '/messages', {
        recipientUsername,
        subject,
        content
      });

      if (res?.success) {
        loadConversations();
        return res.data?._id;
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const res = await call('post', `/messages/${selectedConversation._id}/reply`, {
        content: newMessage
      });

      if (res?.success) {
        setNewMessage('');
        loadMessages(selectedConversation._id);
        loadConversations();
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
      const res = await call('delete', `/messages/${id}`);
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

  const markAsRead = async (conversationId) => {
    try {
      await call('put', `/messages/${conversationId}/read`);
    } catch (error) {
      console.error('Failed to mark as read:', error);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageCircle className="w-8 h-8" />
          Messages
        </h1>
        <button
          onClick={() => setShowNewMessageModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">New Message</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                 const convId = await startConversation(newRecipient, newSubject, newContent);
                 if (convId) {
                   setShowNewMessageModal(false);
                   setNewRecipient('');
                   setNewSubject('');
                   setNewContent('');
                   // Load the new conversation
                   const res = await call('get', `/messages/${convId}`);
                   if (res?.success) {
                     setSelectedConversation({
                       _id: convId,
                       participant: res.data.participants.find(p => p._id !== user._id)
                     });
                     setMessages(res.data.messages || []);
                   }
                 }
              } catch (error) {
                alert('Failed to send message: ' + (error?.response?.data?.message || 'User not found'));
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient Username</label>
                  <input
                    type="text"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    minLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                    required
                    minLength={1}
                    maxLength={10000}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewMessageModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      onClick={() => {
                        setSelectedConversation(conv);
                        markAsRead(conv._id);
                      }}
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
                            <p className="font-medium">{conv.otherParticipant?.username}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {conv.lastMessage?.content}
                            </p>
                          </div>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(conv.updatedAt)}
                        </p>
                        <button
                          onClick={(e) => deleteConversation(e, conv._id)}
                          className="p-2 hover:bg-red-500/20 rounded text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No conversations yet</p>
                    <button
                      onClick={() => setShowNewMessageModal(true)}
                      className="mt-3 text-primary hover:underline text-sm"
                    >
                      Start a conversation
                    </button>
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
                      <h3 className="font-semibold">{selectedConversation.otherParticipant?.username}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.otherParticipant?.role === 'admin' && 'Admin • '}
                        {selectedConversation.otherParticipant?.role === 'moderator' && 'Moderator • '}
                        {selectedConversation.otherParticipant?.rank || 'Member'}
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
