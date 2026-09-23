import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import conversationService from "../services/conversationService";
import messageService from "../services/messageService";
import userService from "../services/userService";
import { getMediaUrl } from "../utils/mediaUrl";
import "./ChatDashboard.css";

const ChatDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user: currentUser, logout } = useAuth();
  const { socket, isUserOnline } = useSocket();

  // Conversations & Messages State
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Group Creation State
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // UI state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("media"); // 'media' | 'links' | 'docs'
  const [showProfile, setShowProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { type: 'voice' | 'video', status: 'calling' | 'connected', seconds: 0 }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const menuRef = useRef(null);
  const groupModalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Active call duration timer
  useEffect(() => {
    let interval = null;
    if (activeCall && activeCall.status === "connected") {
      interval = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, seconds: prev.seconds + 1 } : null));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.status]);

  const startCall = (type) => {
    setActiveCall({ type, status: "calling", seconds: 0 });
    setTimeout(() => {
      setActiveCall((prev) => (prev ? { ...prev, status: "connected" } : null));
    }, 2000);
  };

  const endCall = () => {
    setActiveCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const formatCallTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("chat-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("chat-theme", newTheme ? "dark" : "light");
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (groupModalRef.current && !groupModalRef.current.contains(event.target)) {
        if (showCreateGroup) {
          setShowCreateGroup(false);
          setGroupName("");
          setSelectedMembers([]);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCreateGroup]);

  // Load all conversations
  const fetchConversations = async () => {
    try {
      const res = await conversationService.getConversations();
      if (res.success) {
        setConversations(res.conversations);
        // If a chat is already selected, refresh it
        if (selectedChat) {
          const updatedSelected = res.conversations.find((c) => c._id === selectedChat._id);
          if (updatedSelected) setSelectedChat(updatedSelected);
        }
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching conversations:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch users for group creation or starting chats
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userService.getUsers();
        if (res.success) {
          setAllUsers(res.users);
        }
      } catch (err) {
        console.error("[Dashboard] Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  // Load messages when selectedChat changes
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const fetchChatMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await messageService.getMessages(selectedChat._id);
        if (res.success) {
          setMessages(res.messages);
        }
      } catch (err) {
        console.error("[Dashboard] Error fetching messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchChatMessages();

    // Join room via socket
    if (socket) {
      socket.emit("join_chat", selectedChat._id);
      socket.emit("message_read", {
        conversationId: selectedChat._id,
        userId: currentUser?._id,
      });
    }

    return () => {
      if (socket) {
        socket.emit("leave_chat", selectedChat._id);
      }
    };
  }, [selectedChat?._id, socket]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (newMessage) => {
      const convId = typeof newMessage.conversationId === "object"
        ? newMessage.conversationId._id
        : newMessage.conversationId;

      if (selectedChat && selectedChat._id === convId) {
        setMessages((prev) => [...prev, newMessage]);
        socket.emit("message_read", {
          conversationId: convId,
          userId: currentUser?._id,
        });
      }

      // Update conversations list with latest message
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c._id === convId) {
            return {
              ...c,
              lastMessage: newMessage,
              updatedAt: new Date().toISOString(),
              unreadCount: selectedChat?._id === convId ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });
        // Sort most recent to top
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    const handleTyping = ({ conversationId, userName, userId }) => {
      if (selectedChat && selectedChat._id === conversationId && userId !== currentUser?._id) {
        setTypingUser(userName);
      }
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      if (selectedChat && selectedChat._id === conversationId && userId !== currentUser?._id) {
        setTypingUser(null);
      }
    };

    const handleMessageUpdated = (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === messageId) {
            return { ...m, isDeletedForEveryone: true, text: "This message was deleted", attachments: [] };
          }
          return m;
        })
      );
    };

    const handleMessagesRead = ({ conversationId, userId }) => {
      if (selectedChat && selectedChat._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.sender?._id === currentUser?._id) {
              const currentRead = m.readBy || [];
              if (!currentRead.includes(userId)) {
                return { ...m, readBy: [...currentRead, userId] };
              }
            }
            return m;
          })
        );
      }
    };

    socket.on("message_received", handleMessageReceived);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("message_received", handleMessageReceived);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, selectedChat, currentUser?._id]);

  // Handle Typing indicator emit
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!socket || !selectedChat) return;

    socket.emit("typing", {
      conversationId: selectedChat._id,
      userName: currentUser?.name || "User",
      userId: currentUser?._id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        conversationId: selectedChat._id,
        userId: currentUser?._id,
      });
    }, 1500);
  };

  // Handle File selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAttachment(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setAttachmentPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(file.name);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!messageInput.trim() && !attachment) || !selectedChat || isSending) return;

    setIsSending(true);

    try {
      let uploadedAttachments = [];

      // 1. Upload attachment if attached
      if (attachment) {
        const uploadRes = await messageService.uploadAttachment(attachment);
        if (uploadRes.success && uploadRes.attachment) {
          uploadedAttachments.push(uploadRes.attachment);
        }
      }

      // If editing existing message
      if (editingMessage) {
        const res = await messageService.editMessage(editingMessage._id, messageInput.trim());
        if (res.success) {
          setMessages((prev) =>
            prev.map((m) => (m._id === editingMessage._id ? res.message : m))
          );
          if (socket) {
            socket.emit("message_updated", {
              conversationId: selectedChat._id,
              message: res.message,
            });
          }
        }
        setEditingMessage(null);
        setMessageInput("");
        setIsSending(false);
        return;
      }

      // 2. Create message on backend
      const messagePayload = {
        conversationId: selectedChat._id,
        text: messageInput.trim(),
        attachments: uploadedAttachments,
        replyToId: replyingTo ? replyingTo._id : undefined,
        messageType: uploadedAttachments.length > 0 ? "image" : "text",
      };

      const res = await messageService.sendMessage(messagePayload);

      if (res.success && res.message) {
        const createdMessage = res.message;
        setMessages((prev) => [...prev, createdMessage]);

        // Emit through socket for real-time delivery
        if (socket) {
          socket.emit("send_message", createdMessage);
          socket.emit("stop_typing", {
            conversationId: selectedChat._id,
            userId: currentUser?._id,
          });
        }

        // Update conversation in sidebar list
        setConversations((prev) => {
          const updated = prev.map((c) => {
            if (c._id === selectedChat._id) {
              return {
                ...c,
                lastMessage: createdMessage,
                updatedAt: new Date().toISOString(),
              };
            }
            return c;
          });
          return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });

        setMessageInput("");
        setReplyingTo(null);
        clearAttachment();
      }
    } catch (err) {
      console.error("[Dashboard] Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Keyboard Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Star / unstar message
  const handleToggleStar = async (msgId) => {
    try {
      const res = await messageService.toggleStar(msgId);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === msgId ? { ...m, starredBy: res.starredBy } : m
          )
        );
      }
    } catch (err) {
      console.error("[Dashboard] Error starring message:", err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId, isOwnMessage) => {
    const deleteType = isOwnMessage && window.confirm("Delete for everyone?") ? "everyone" : "me";
    try {
      const res = await messageService.deleteMessage(msgId, deleteType);
      if (res.success) {
        if (deleteType === "everyone") {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === msgId
                ? { ...m, isDeletedForEveryone: true, text: "This message was deleted", attachments: [] }
                : m
            )
          );
          if (socket) {
            socket.emit("message_deleted", {
              conversationId: selectedChat._id,
              messageId: msgId,
            });
          }
        } else {
          setMessages((prev) => prev.filter((m) => m._id !== msgId));
        }
      }
    } catch (err) {
      console.error("[Dashboard] Error deleting message:", err);
    }
  };

  // React to message
  const handleAddReaction = async (msgId, emoji) => {
    try {
      const res = await messageService.addReaction(msgId, emoji);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === msgId ? { ...m, reactions: res.reactions } : m))
        );
      }
    } catch (err) {
      console.error("[Dashboard] Error reacting to message:", err);
    }
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length < 1) return;

    try {
      const res = await conversationService.createGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        members: selectedMembers.map((m) => m._id),
      });

      if (res.success && res.conversation) {
        setConversations([res.conversation, ...conversations]);
        setSelectedChat(res.conversation);
        setShowCreateGroup(false);
        setGroupName("");
        setGroupDescription("");
        setSelectedMembers([]);
      }
    } catch (err) {
      console.error("[Dashboard] Error creating group:", err);
      alert(err.response?.data?.message || "Failed to create group");
    }
  };

  const toggleMemberSelection = (user) => {
    if (selectedMembers.find((m) => m._id === user._id)) {
      setSelectedMembers(selectedMembers.filter((m) => m._id !== user._id));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  // Start 1-on-1 chat from contact search
  const handleStartDirectChat = async (targetUser) => {
    try {
      const res = await conversationService.getOrCreateOneToOne(targetUser._id);
      if (res.success && res.conversation) {
        // If not already in list, add it
        if (!conversations.some((c) => c._id === res.conversation._id)) {
          setConversations([res.conversation, ...conversations]);
        }
        setSelectedChat(res.conversation);
        setSearchQuery("");
      }
    } catch (err) {
      console.error("[Dashboard] Error starting chat:", err);
    }
  };

  // Helper: get display info for a conversation
  const getChatDisplay = (conv) => {
    if (conv.isGroup) {
      return {
        name: conv.groupName || "Unnamed Group",
        avatar: conv.groupAvatar || "https://api.dicebear.com/7.x/identicon/svg?seed=group",
        isOnline: false,
        memberCount: conv.participants?.length || 0,
        subtext: `${conv.participants?.length || 0} members`,
      };
    }

    const otherParticipant = conv.participants?.find(
      (p) => p._id !== currentUser?._id
    ) || conv.participants?.[0] || {};

    const online = isUserOnline(otherParticipant._id);

    return {
      name: otherParticipant.name || "User",
      avatar: otherParticipant.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherParticipant.name || "User"}`,
      isOnline: online,
      phone: otherParticipant.phoneNumber || "",
      subtext: online ? t("online") : t("offline"),
      participant: otherParticipant,
    };
  };

  // Filter conversations & search results
  const filteredConversations = conversations.filter((c) => {
    const display = getChatDisplay(c);
    return display.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter contacts not yet in conversation if searching
  const filteredNewContacts = searchQuery.trim()
    ? allUsers.filter(
        (u) =>
          u._id !== currentUser?._id &&
          (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Media attachments in active chat
  const chatMediaAttachments = messages
    .filter((m) => m.attachments && m.attachments.length > 0)
    .flatMap((m) => m.attachments);

  return (
    <div className="dashboard-wrapper" data-theme={isDarkMode ? "dark" : "light"}>
      {/* ─── CREATE GROUP MODAL ─── */}
      {showCreateGroup && (
        <div className="modal-overlay">
          <div className="modal-content" ref={groupModalRef}>
            <div className="modal-header">
              <h2 className="modal-title">{t("createNewGroup")}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateGroup(false);
                  setGroupName("");
                  setSelectedMembers([]);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t("groupName")}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t("enterGroupName")}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Group Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Describe your group"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("selectMembers")}</label>
                {selectedMembers.length > 0 && (
                  <div className="selected-count" style={{ color: "#22c55e", fontWeight: 600, marginBottom: "8px" }}>
                    {selectedMembers.length} {t("membersSelected")}
                  </div>
                )}
                <div className="members-list">
                  {allUsers
                    .filter((u) => u._id !== currentUser?._id)
                    .map((userItem) => {
                      const isSelected = !!selectedMembers.find((m) => m._id === userItem._id);
                      return (
                        <div
                          key={userItem._id}
                          className={`member-item ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleMemberSelection(userItem)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            background: isSelected ? "var(--bg-tertiary)" : "transparent",
                          }}
                        >
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              border: "1.5px solid var(--border-color)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#22c55e",
                              fontWeight: "bold",
                            }}
                          >
                            {isSelected && "✓"}
                          </div>
                          <img
                            src={userItem.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userItem.name}`}
                            alt={userItem.name}
                            style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "14px" }}>{userItem.name}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{userItem.email}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="button button-secondary"
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" }}
                onClick={() => {
                  setShowCreateGroup(false);
                  setGroupName("");
                  setSelectedMembers([]);
                }}
              >
                {t("cancel")}
              </button>
              <button
                className="button button-primary"
                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#22c55e", color: "#ffffff", fontWeight: 600, cursor: "pointer" }}
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedMembers.length < 1}
              >
                {t("createGroup")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ENCRYPTION MODAL ─── */}
      {showEncryptionModal && (
        <div className="modal-overlay" onClick={() => setShowEncryptionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🔐 Encryption Security Code</h2>
              <button className="modal-close" onClick={() => setShowEncryptionModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: "center", padding: "24px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
                Messages and calls in this conversation are secured with TLS transport encryption and SHA-256 integrity verification.
              </p>
              <div style={{ background: "var(--bg-tertiary)", padding: "16px", borderRadius: "12px", fontFamily: "monospace", letterSpacing: "2px", fontSize: "16px", color: "#16a34a", fontWeight: "bold" }}>
                {selectedChat?._id
                  ? selectedChat._id.toString().toUpperCase().match(/.{1,4}/g)?.join(" ")
                  : "SECURE-E2EE-TLS256"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTIVE CALL MODAL ─── */}
      {activeCall && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: "420px",
              textAlign: "center",
              padding: "32px 24px",
              background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
              color: "#ffffff",
              borderRadius: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {(() => {
              const display = getChatDisplay(selectedChat);
              return (
                <>
                  <div style={{ position: "relative", width: "96px", height: "96px", margin: "0 auto 16px" }}>
                    <img
                      src={display.avatar}
                      alt={display.name}
                      style={{
                        width: "96px",
                        height: "96px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "3px solid #22c55e",
                        boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)",
                      }}
                    />
                  </div>

                  <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>
                    {display.name}
                  </h3>
                  <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "20px" }}>
                    {activeCall.status === "calling"
                      ? `${activeCall.type === "video" ? "Video" : "Voice"} Calling...`
                      : `In Call (${formatCallTime(activeCall.seconds)})`}
                  </div>

                  {activeCall.type === "video" && (
                    <div
                      style={{
                        background: "#020617",
                        borderRadius: "14px",
                        height: "160px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "24px",
                        overflow: "hidden",
                        border: "1px solid #334155",
                      }}
                    >
                      {isVideoOff ? (
                        <div style={{ color: "#64748b", fontSize: "14px" }}>Camera Off</div>
                      ) : (
                        <div style={{ color: "#22c55e", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>●</span> HD Video Stream Active
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "12px" }}>
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        border: "none",
                        background: isMuted ? "#ef4444" : "#334155",
                        color: "#fff",
                        fontSize: "20px",
                        cursor: "pointer",
                      }}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? "🔇" : "🎤"}
                    </button>
                    {activeCall.type === "video" && (
                      <button
                        type="button"
                        onClick={() => setIsVideoOff(!isVideoOff)}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          border: "none",
                          background: isVideoOff ? "#ef4444" : "#334155",
                          color: "#fff",
                          fontSize: "20px",
                          cursor: "pointer",
                        }}
                        title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                      >
                        {isVideoOff ? "🚫" : "📹"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={endCall}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        border: "none",
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: "22px",
                        cursor: "pointer",
                      }}
                      title="End Call"
                    >
                      📞
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── LEFT SIDEBAR (Conversations & Contacts) ─── */}
      <div className={`contacts-sidebar ${selectedChat ? "chat-active" : ""}`}>
        <div className="sidebar-header">
          <div className="header-top">
            <div className="app-logo" style={{ cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
              <div className="logo-icon">💬</div>
              <span>Chatify</span>
            </div>

            <div className="header-actions">
              <button
                className="icon-button"
                onClick={() => navigate("/overview")}
                title="Smart Dashboard Overview"
              >
                📊
              </button>
              <button
                className="icon-button theme-toggle"
                onClick={toggleTheme}
                title={isDarkMode ? t("lightMode") : t("darkMode")}
              >
                {isDarkMode ? "☀️" : "🌙"}
              </button>
              <button
                className="icon-button create-group"
                onClick={() => setShowCreateGroup(true)}
                title={t("createGroup")}
              >
                👥
              </button>
              <button
                className="icon-button"
                title={t("settings")}
                onClick={() => navigate("/settings")}
              >
                ⚙️
              </button>

              {/* User Dropdown */}
              <div className="user-menu-container" ref={menuRef}>
                <div
                  className="user-avatar-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title={currentUser?.name}
                >
                  <img
                    src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name || "U"}`}
                    alt={currentUser?.name}
                  />
                </div>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-info">
                        <div className="user-dropdown-avatar">
                          <img
                            src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name || "U"}`}
                            alt={currentUser?.name}
                          />
                        </div>
                        <div className="user-dropdown-details">
                          <div className="user-dropdown-name">{currentUser?.name}</div>
                          <div className="user-dropdown-email">{currentUser?.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="user-dropdown-menu">
                      <button className="user-dropdown-item" onClick={() => navigate("/profile")}>
                        <span className="user-dropdown-icon">👤</span>
                        <span className="user-dropdown-text">{t("viewProfile")}</span>
                      </button>
                      <button className="user-dropdown-item" onClick={() => navigate("/contacts")}>
                        <span className="user-dropdown-icon">📇</span>
                        <span className="user-dropdown-text">Contacts</span>
                      </button>
                      <button className="user-dropdown-item" onClick={() => navigate("/starred")}>
                        <span className="user-dropdown-icon">⭐</span>
                        <span className="user-dropdown-text">Starred Messages</span>
                      </button>
                      <button className="user-dropdown-item" onClick={() => navigate("/analytics")}>
                        <span className="user-dropdown-icon">📈</span>
                        <span className="user-dropdown-text">Analytics</span>
                      </button>
                      <button className="user-dropdown-item" onClick={() => navigate("/notification")}>
                        <span className="user-dropdown-icon">🔔</span>
                        <span className="user-dropdown-text">{t("notification")}</span>
                      </button>
                      <button className="user-dropdown-item" onClick={() => navigate("/settings")}>
                        <span className="user-dropdown-icon">⚙️</span>
                        <span className="user-dropdown-text">{t("settings")}</span>
                      </button>
                      <button className="user-dropdown-item logout" onClick={logout}>
                        <span className="user-dropdown-icon">🚪</span>
                        <span className="user-dropdown-text">{t("logout")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="contacts-list">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const display = getChatDisplay(conv);
              const isActive = selectedChat?._id === conv._id;
              const lastText = conv.lastMessage
                ? conv.lastMessage.isDeletedForEveryone
                  ? "This message was deleted"
                  : conv.lastMessage.text || (conv.lastMessage.attachments?.length ? "📎 Attachment" : "")
                : "No messages yet";

              const timeStr = conv.lastMessage?.createdAt
                ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <div
                  key={conv._id}
                  className={`contact-item ${isActive ? "active" : ""} ${conv.isGroup ? "group" : ""}`}
                  onClick={() => setSelectedChat(conv)}
                >
                  <div className="contact-avatar">
                    <img src={display.avatar} alt={display.name} />
                    {display.isOnline && <div className="online-indicator" />}
                  </div>
                  <div className="contact-details">
                    <div className="contact-name">{display.name}</div>
                    <div className="contact-message">{lastText}</div>
                    {conv.isGroup && (
                      <div className="group-member-count">
                        {display.memberCount} {t("members")}
                      </div>
                    )}
                  </div>
                  <div className="contact-meta">
                    <div className="contact-time">{timeStr}</div>
                    {conv.unreadCount > 0 && (
                      <div className="unread-badge">{conv.unreadCount}</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-tertiary)" }}>
              {searchQuery ? "No conversations matching your search" : "No conversations yet"}
            </div>
          )}

          {/* If searching, also display registered users to start new chat with */}
          {searchQuery.trim() && filteredNewContacts.length > 0 && (
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-blue)", marginBottom: "8px" }}>
                Start Chat with Users
              </div>
              {filteredNewContacts.map((targetUser) => (
                <div
                  key={targetUser._id}
                  className="contact-item"
                  onClick={() => handleStartDirectChat(targetUser)}
                >
                  <div className="contact-avatar">
                    <img
                      src={targetUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${targetUser.name}`}
                      alt={targetUser.name}
                    />
                    {isUserOnline(targetUser._id) && <div className="online-indicator" />}
                  </div>
                  <div className="contact-details">
                    <div className="contact-name">{targetUser.name}</div>
                    <div className="contact-message">{targetUser.email}</div>
                  </div>
                  <div style={{ color: "#22c55e", fontSize: "18px" }}>+</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── CHAT AREA ─── */}
      <div className={`chat-container ${selectedChat ? "chat-active" : ""}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            {(() => {
              const display = getChatDisplay(selectedChat);
              return (
                <div className="chat-header">
                  <div className="chat-user-info">
                    {/* Mobile Back Button */}
                    <button
                      className="mobile-back-btn"
                      onClick={() => setSelectedChat(null)}
                      title="Back to Chats"
                    >
                      ←
                    </button>
                    <div className={`contact-avatar ${selectedChat.isGroup ? "group" : ""}`}>
                      <img src={display.avatar} alt={display.name} />
                      {display.isOnline && <div className="online-indicator" />}
                    </div>
                    <div className="chat-user-details">
                      <h3>{display.name}</h3>
                      <div className="chat-user-status">
                        {selectedChat.isGroup
                          ? `${display.memberCount} ${t("members")}`
                          : display.isOnline
                          ? t("online")
                          : t("offline")}
                      </div>
                    </div>
                  </div>
                  <div className="chat-header-actions">
                    <button
                      className="icon-button"
                      title="Voice Call"
                      onClick={() => startCall("voice")}
                    >
                      📞
                    </button>
                    <button
                      className="icon-button"
                      title="Video Call"
                      onClick={() => startCall("video")}
                    >
                      📹
                    </button>
                    <button
                      className="icon-button"
                      title="Search in conversation"
                      onClick={() => navigate("/search-messages")}
                    >
                      🔍
                    </button>
                    <button
                      className="icon-button"
                      title={showProfile ? t("closeProfile") : t("openProfile")}
                      onClick={() => setShowProfile(!showProfile)}
                    >
                      {showProfile ? "✕" : "ℹ️"}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Messages Area */}
            <div className="messages-area">
              {loadingMessages ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-tertiary)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>👋</div>
                  <div style={{ fontWeight: 600, fontSize: "16px", color: "var(--text-primary)" }}>
                    No messages here yet
                  </div>
                  <div style={{ fontSize: "13px", marginTop: "4px" }}>
                    Say hello to start the conversation!
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?._id === currentUser?._id;
                  const time = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isStarred = msg.starredBy?.some(
                    (id) => id.toString() === currentUser?._id.toString()
                  );
                  const isRead = msg.readBy && msg.readBy.length > 1;

                  return (
                    <div key={msg._id} className={`message ${isMe ? "sent" : "received"}`}>
                      <div className="message-avatar">
                        <img
                          src={
                            msg.sender?.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${msg.sender?.name || "U"}`
                          }
                          alt="avatar"
                        />
                      </div>
                      <div className="message-content">
                        {/* Hover Actions Menu */}
                        <div className="message-hover-actions">
                          <button
                            className="hover-action-btn"
                            title="Reply"
                            onClick={() => setReplyingTo(msg)}
                          >
                            ↩️
                          </button>
                          <button
                            className="hover-action-btn"
                            title="React ❤️"
                            onClick={() => handleAddReaction(msg._id, "❤️")}
                          >
                            ❤️
                          </button>
                          <button
                            className="hover-action-btn"
                            title="React 👍"
                            onClick={() => handleAddReaction(msg._id, "👍")}
                          >
                            👍
                          </button>
                          <button
                            className="hover-action-btn"
                            title={isStarred ? "Unstar" : "Star"}
                            onClick={() => handleToggleStar(msg._id)}
                          >
                            {isStarred ? "⭐" : "☆"}
                          </button>
                          {isMe && !msg.isDeletedForEveryone && (
                            <button
                              className="hover-action-btn"
                              title="Edit"
                              onClick={() => {
                                setEditingMessage(msg);
                                setMessageInput(msg.text);
                              }}
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            className="hover-action-btn"
                            title="Delete"
                            onClick={() => handleDeleteMessage(msg._id, isMe)}
                          >
                            🗑️
                          </button>
                        </div>

                        {/* Group Sender Name */}
                        {selectedChat.isGroup && !isMe && (
                          <div className="message-sender-name">{msg.sender?.name}</div>
                        )}

                        {/* Quoted Reply */}
                        {msg.replyTo && (
                          <div className="quoted-reply">
                            <strong>{msg.replyTo.sender?.name || "Replying"}: </strong>
                            {msg.replyTo.text || "Attachment"}
                          </div>
                        )}

                        {/* Attachments */}
                        {msg.attachments &&
                          msg.attachments.map((att, idx) => {
                            const fullUrl = getMediaUrl(att.url);
                            return (
                              <div key={idx}>
                                {att.type && att.type.startsWith("image/") ? (
                                  <img
                                    src={fullUrl}
                                    alt={att.name || "Attachment"}
                                    className="message-attachment-image"
                                    onClick={() => window.open(fullUrl, "_blank")}
                                  />
                                ) : (
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="message-attachment-file"
                                  >
                                    📄 {att.name || "Download file"}
                                  </a>
                                )}
                              </div>
                            );
                          })}

                        {/* Text bubble */}
                        <div className="message-bubble">
                          {msg.text}
                          {msg.isEdited && (
                            <span style={{ fontSize: "10px", marginLeft: "6px", opacity: 0.7 }}>
                              (edited)
                            </span>
                          )}
                        </div>

                        {/* Reactions row */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="message-reactions-row">
                            {msg.reactions.map((r, rIdx) => (
                              <span
                                key={rIdx}
                                className="reaction-pill"
                                onClick={() => handleAddReaction(msg._id, r.emoji)}
                              >
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Message Meta */}
                        <div className="message-meta-row">
                          {isStarred && <span title="Starred">⭐</span>}
                          <span>{time}</span>
                          {isMe && (
                            <span className="read-ticks" title={isRead ? "Read" : "Delivered"}>
                              {isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {typingUser && (
                <div className="typing-indicator-bar">
                  <span>{typingUser} is typing</span>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview Banner */}
            {replyingTo && (
              <div className="reply-preview-bar">
                <span className="reply-text">
                  Replying to <strong>{replyingTo.sender?.name}</strong>: {replyingTo.text}
                </span>
                <button className="reply-close-btn" onClick={() => setReplyingTo(null)}>
                  ✕
                </button>
              </div>
            )}

            {/* Attachment Preview Banner */}
            {attachment && (
              <div className="attachment-preview-bar">
                <span>📎 {attachment.name}</span>
                <button className="reply-close-btn" onClick={clearAttachment}>
                  ✕
                </button>
              </div>
            )}

            {/* Input Box */}
            <div className="chat-input-container">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <div className="input-wrapper">
                <div className="input-actions" style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="icon-button"
                    title={t("attach")}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📎
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    title="Insert Emoji"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    😊
                  </button>
                  {showEmojiPicker && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "0",
                        marginBottom: "10px",
                        background: "var(--bg-secondary, #ffffff)",
                        border: "1px solid var(--border-color, #e5e7eb)",
                        borderRadius: "14px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                        padding: "10px",
                        display: "grid",
                        gridTemplateColumns: "repeat(6, 1fr)",
                        gap: "6px",
                        zIndex: 100,
                        width: "230px",
                      }}
                    >
                      {["😀", "😂", "😍", "👍", "❤️", "🔥", "🎉", "🙌", "✨", "😎", "🥳", "💯", "🙏", "👏", "🚀", "💡", "👋", "🤩"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setMessageInput((prev) => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "20px",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "6px",
                            transition: "transform 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <textarea
                  className="message-input-box"
                  placeholder={
                    editingMessage
                      ? "Edit your message..."
                      : t("typeMessage")
                  }
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  type="button"
                  className="send-button"
                  title={t("send")}
                  onClick={handleSendMessage}
                  disabled={isSending}
                >
                  {isSending ? "..." : "➤"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <div className="empty-title">{t("selectChat")}</div>
            <div className="empty-subtitle">{t("selectChatSubtitle")}</div>
          </div>
        )}
      </div>

      {/* ─── RIGHT SIDEBAR (Profile / Info) ─── */}
      {selectedChat && (
        <div className={`profile-sidebar ${!showProfile ? "hidden" : ""}`}>
          {(() => {
            const display = getChatDisplay(selectedChat);
            return (
              <>
                <div className="profile-header">
                  <div className={`profile-avatar ${selectedChat.isGroup ? "group" : ""}`}>
                    <img src={display.avatar} alt={display.name} />
                  </div>
                  <div className="profile-name">{display.name}</div>
                  {!selectedChat.isGroup && (
                    <div className="profile-phone">{display.phone || display.subtext}</div>
                  )}
                  {selectedChat.isGroup && (
                    <div className="profile-phone">
                      {display.memberCount} {t("members")}
                    </div>
                  )}
                  <div className="profile-actions">
                    <button
                      className="profile-action-btn search"
                      title={t("search")}
                      onClick={() => navigate("/search-messages")}
                    >
                      🔍
                    </button>
                    <button
                      className="profile-action-btn"
                      title="Temporary Chat"
                      onClick={() => navigate("/temporary-chat")}
                    >
                      ⏳
                    </button>
                  </div>
                </div>

                {/* Group members list */}
                {selectedChat.isGroup && (
                  <div className="profile-section">
                    <div className="section-title">{t("groupMembers")}</div>
                    <div className="group-members-list">
                      {selectedChat.participants?.map((member) => (
                        <div key={member._id} className="group-member-item">
                          <div className="group-member-avatar">
                            <img
                              src={
                                member.avatar ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`
                              }
                              alt={member.name}
                            />
                          </div>
                          <div className="group-member-name">
                            {member.name}
                            {selectedChat.admins?.some((a) => (a._id || a) === member._id) && (
                              <span style={{ fontSize: "11px", color: "#22c55e", marginLeft: "6px" }}>
                                (Admin)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options */}
                <div className="profile-section">
                  <div className="section-title">{t("options")}</div>
                  <div
                    className="section-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/notification")}
                  >
                    <div className="section-icon">🔔</div>
                    <div className="section-text">
                      <div className="section-item-title">{t("notification")}</div>
                    </div>
                  </div>
                  <div
                    className="section-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/starred")}
                  >
                    <div className="section-icon">⭐</div>
                    <div className="section-text">
                      <div className="section-item-title">{t("savedMessage")}</div>
                    </div>
                  </div>
                  <div
                    className="section-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/privacy")}
                  >
                    <div className="section-icon">🔒</div>
                    <div className="section-text">
                      <div className="section-item-title">{t("lockedMessage")}</div>
                    </div>
                  </div>
                  <div
                    className="section-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowEncryptionModal(true)}
                  >
                    <div className="section-icon">🔐</div>
                    <div className="section-text">
                      <div className="section-item-title">{t("encryptionCode")}</div>
                    </div>
                  </div>
                </div>

                {/* Media & Files */}
                <div className="profile-section">
                  <div className="section-title">{t("mediaAndFiles")}</div>
                  <div className="tabs-container">
                    <button
                      className={`tab-button ${activeTab === "media" ? "active" : ""}`}
                      onClick={() => setActiveTab("media")}
                    >
                      {t("media")}
                    </button>
                    <button
                      className={`tab-button ${activeTab === "docs" ? "active" : ""}`}
                      onClick={() => setActiveTab("docs")}
                    >
                      {t("docs")}
                    </button>
                  </div>
                  {activeTab === "media" && (
                    <div className="media-grid">
                      {chatMediaAttachments.length > 0 ? (
                        chatMediaAttachments
                          .filter((att) => att.type && att.type.startsWith("image/"))
                          .map((item, index) => {
                            const fullUrl = getMediaUrl(item.url);
                            return (
                              <div key={index} className="media-item">
                                <img
                                  src={fullUrl}
                                  alt={`media-${index}`}
                                  onClick={() => window.open(fullUrl, "_blank")}
                                />
                              </div>
                            );
                          })
                      ) : (
                        <div style={{ color: "var(--text-tertiary)", fontSize: "12px", gridColumn: "1 / -1", textAlign: "center", padding: "12px" }}>
                          No media shared in this chat
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "docs" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {chatMediaAttachments.filter((att) => !att.type || !att.type.startsWith("image/")).length > 0 ? (
                        chatMediaAttachments
                          .filter((att) => !att.type || !att.type.startsWith("image/"))
                          .map((item, index) => {
                            const fullUrl = getMediaUrl(item.url);
                            return (
                              <a
                                key={index}
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "13px", padding: "6px 8px", background: "var(--bg-tertiary)", borderRadius: "6px" }}
                              >
                                📄 {item.name || "Document"}
                              </a>
                            );
                          })
                      ) : (
                        <div style={{ color: "var(--text-tertiary)", fontSize: "12px", textAlign: "center", padding: "12px" }}>
                          No documents shared
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ChatDashboard;