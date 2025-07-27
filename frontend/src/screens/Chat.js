import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { getToken } from '../utils/auth';
import useAuth from '../hooks/useAuth';
import { getApi, postApi } from '../utils/api';

const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [profile, setProfile] = useState(null); // <-- new
  const messagesEndRef = useRef(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchProfile();
    fetchConversations();
    // Start polling for new messages every 3 seconds
    const interval = setInterval(() => {
      if (selectedConversation) {
        const otherUser = getOtherUser(selectedConversation);
        if (user.role === 'superadmin') {
          fetchMessagesSuperAdmin(selectedConversation.roomId);
        } else {
          fetchMessages(otherUser?._id);
        }
      }
    }, 3000);
    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchProfile = async () => {
    if (user.role !== 'user') return;
    try {
      const data = await getApi('/api/users/profile');
      setProfile(data);
    } catch (err) {}
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const conversations = await getApi('/api/chat/conversations');
      setConversations(conversations);
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId, roomId) => {
    try {
      let url;
      if (user.role === 'superadmin' && roomId) {
        url = `/api/chat/messages/room/${roomId}`;
      } else {
        url = `/api/chat/messages/${otherUserId}`;
      }
      const { messages } = await getApi(url);
      setMessages(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    if (user.role === 'superadmin') {
      await fetchMessagesSuperAdmin(conversation.roomId);
    } else {
      const otherUser = conversation.participants.find(p => p._id !== user.id);
      await fetchMessages(otherUser._id);
    }
  };

  const fetchMessagesSuperAdmin = async (roomId) => {
    try {
      const { messages } = await getApi(`/api/chat/messages/room/${roomId}`);
      setMessages(messages);
    } catch (error) {
      console.error('Error fetching messages (superadmin):', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const otherUser = selectedConversation.participants.find(p => p._id !== user.id);
      const sentMessage = await postApi('/api/chat/send', {
        receiverId: otherUser._id,
        message: newMessage.trim()
      });
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      // Refresh conversations to update last message
      fetchConversations();
    } catch (error) {
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.participants.find(p => p._id !== user.id);
    return otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           otherUser.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getOtherUser = (conversation) => {
    if (!conversation || !conversation.participants || !user) {
      return null;
    }
    return conversation.participants.find(p => p._id !== user.id);
  };

  const getUnreadCount = (conversation) => {
    const otherUser = getOtherUser(conversation);
    // Add null check for unreadCount
    if (!conversation.unreadCount || !otherUser) {
      return 0;
    }
    return conversation.unreadCount[otherUser._id] || 0;
  };

  return (
    <Container fluid className="h-100">
      <Row className="h-100">
        {/* Conversations Sidebar */}
        <Col md={4} className="border-end p-0">
          <Card className="h-100 rounded-0">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Chats</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {/* Search */}
              <div className="p-3 border-bottom">
                <Form.Control
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Conversations List */}
              <div className="conversations-list" style={{ height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {loading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" />
                  </div>
                ) :
                  user.role === 'user' && filteredConversations.length === 0 && profile?.createdBy ? (
                    <div
                      className={`conversation-item p-3 border-bottom cursor-pointer ${selectedConversation === 'admin' ? 'bg-light' : ''}`}
                      onClick={() => setSelectedConversation({
                        _id: profile.createdBy._id,
                        participants: [
                          { _id: user.id, name: profile.name, email: profile.email, role: 'user' },
                          { _id: profile.createdBy._id, name: profile.createdBy.name, email: profile.createdBy.email, role: 'admin' }
                        ]
                      })}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{profile.createdBy.name}</h6>
                          <small className="text-muted">{profile.createdBy.email}</small>
                          <p className="mb-1 text-truncate small text-muted">Start a conversation</p>
                        </div>
                        <div className="text-end">
                          <Badge bg="secondary">admin</Badge>
                        </div>
                      </div>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center p-4 text-muted">
                      {searchTerm ? 'No conversations found' : 'No conversations yet'}
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const otherUser = getOtherUser(conversation);
                      const unreadCount = getUnreadCount(conversation);
                      const isSelected = selectedConversation?._id === conversation._id;

                      // Skip rendering if otherUser is null
                      if (!otherUser) {
                        return null;
                      }

                      return (
                        <div
                          key={conversation._id}
                          className={`conversation-item p-3 border-bottom cursor-pointer ${
                            isSelected ? 'bg-light' : ''
                          }`}
                          onClick={() => handleConversationSelect(conversation)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{otherUser.name}</h6>
                              <small className="text-muted">{otherUser.email}</small>
                              {conversation.lastMessage && (
                                <p className="mb-1 text-truncate small">
                                  {conversation.lastMessageSender?._id === user.id ? 'You: ' : ''}
                                  {conversation.lastMessage}
                                </p>
                              )}
                            </div>
                            <div className="text-end">
                              <small className="text-muted">
                                {conversation.lastMessageTime && formatTime(conversation.lastMessageTime)}
                              </small>
                              {unreadCount > 0 && (
                                <Badge bg="danger" className="ms-2">
                                  {unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                }
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Chat Window */}
        <Col md={8} className="p-0">
          {selectedConversation ? (
            <Card className="h-100 rounded-0">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">
                      {getOtherUser(selectedConversation)?.name || 'Unknown User'}
                    </h6>
                    <small className="text-muted">
                      {getOtherUser(selectedConversation)?.email || 'No email'}
                    </small>
                  </div>
                  <Badge bg="secondary">
                    {getOtherUser(selectedConversation)?.role || 'Unknown'}
                  </Badge>
                </div>
              </Card.Header>

              <Card.Body className="p-0 d-flex flex-column">
                {/* Messages Area */}
                <div 
                  className="messages-area flex-grow-1 p-3"
                  style={{ height: 'calc(100vh - 300px)', overflowY: 'auto' }}
                >
                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderId._id === user.id;
                    const showDate = index === 0 || 
                      formatDate(message.createdAt) !== formatDate(messages[index - 1]?.createdAt);

                    return (
                      <div key={message._id}>
                        {showDate && (
                          <div className="text-center my-2">
                            <small className="text-muted bg-light px-2 py-1 rounded">
                              {formatDate(message.createdAt)}
                            </small>
                          </div>
                        )}
                        <div className={`message-bubble mb-2 ${isOwnMessage ? 'text-end' : ''}`}>
                          <div
                            className={`d-inline-block p-2 rounded ${
                              isOwnMessage 
                                ? 'bg-primary text-white' 
                                : 'bg-light text-dark'
                            }`}
                            style={{ maxWidth: '70%' }}
                          >
                            <div className="message-text">{message.message}</div>
                            <small className={`message-time ${isOwnMessage ? 'text-white-50' : 'text-muted'}`}>
                              {formatTime(message.createdAt)}
                              {message.seen && isOwnMessage && (
                                <span className="ms-1">✓✓</span>
                              )}
                            </small>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="message-input p-3 border-top">
                  <Form onSubmit={handleSendMessage}>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                        className="me-2"
                      />
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={sending || !newMessage.trim()}
                      >
                        {sending ? <Spinner animation="border" size="sm" /> : 'Send'}
                      </Button>
                    </div>
                  </Form>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <div className="h-100 d-flex align-items-center justify-content-center">
              <div className="text-center text-muted">
                <h5>Select a conversation to start chatting</h5>
                <p>Choose from the list on the left to begin messaging</p>
              </div>
            </div>
          )}
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="position-fixed top-0 end-0 m-3" style={{ zIndex: 1050 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default Chat; 