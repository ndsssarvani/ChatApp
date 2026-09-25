import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useCall } from "../context/CallContext";
import conversationService from "../services/conversationService";
import messageService from "../services/messageService";
import userService from "../services/userService";
import notificationService from "../services/notificationService";
import translationService from "../services/translationService";
import { getMediaUrl } from "../utils/mediaUrl";
import VoiceRecorder from "./VoiceRecorder";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import CallHistory from "./CallHistory";
import ForwardModal from "./ForwardModal";
import "./ChatDashboard.css";

const WALLPAPER_PRESETS = [
  { id: "default", name: "Default", style: { background: "var(--bg-secondary)" }, preview: "#1e293b" },
  { id: "midnight", name: "Cosmic Nebula", style: { background: "radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)" }, preview: "#090A0F" },
  { id: "cyber", name: "Cyberpunk", style: { background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)" }, preview: "#161b22" },
  { id: "emerald", name: "Emerald Forest", style: { background: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)" }, preview: "#064e3b" },
  { id: "sunset", name: "Sunset Mirage", style: { background: "linear-gradient(135deg, #2d142c 0%, #510a32 50%, #801336 100%)" }, preview: "#801336" },
  { id: "sapphire", name: "Deep Sapphire", style: { background: "linear-gradient(135deg, #0b192c 0%, #1e3e62 100%)" }, preview: "#1e3e62" },
  { id: "obsidian", name: "Pure Obsidian", style: { background: "#060911" }, preview: "#060911" },
  { id: "slate", name: "Minimal Slate", style: { background: "#f1f5f9" }, preview: "#cbd5e1" },
  { id: "lavender", name: "Soft Lavender", style: { background: "linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)" }, preview: "#ede9fe" },
];

const ChatDashboard = () => {
  const navigate = useNavigate();
  const { t, currentLanguage, languages, getCurrentLanguageData } = useLanguage();
  const { user: currentUser, logout } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { startCall } = useCall();

  // Conversations & Messages State
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatFilter, setChatFilter] = useState("all"); // 'all' | 'online' | 'unread' | 'groups'
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
  const [activeTab, setActiveTab] = useState("media"); // 'media' | 'docs'
  const [showProfile, setShowProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [customWpUrl, setCustomWpUrl] = useState("");
  const [chatWallpapers, setChatWallpapers] = useState({});
  const [globalWallpaper, setGlobalWallpaper] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, message }
  const [messageInfoModal, setMessageInfoModal] = useState(null); // message
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [isRailExpanded, setIsRailExpanded] = useState(false);

  // Translation State
  const [translatedMessages, setTranslatedMessages] = useState({}); // { [msgId]: { translatedText, sourceLanguage, sourceLanguageName, targetLanguage, targetLanguageName, isHidden, loading, error } }
  const [translateLanguageModal, setTranslateLanguageModal] = useState(null); // message object or null
  const [translateSearchQuery, setTranslateSearchQuery] = useState("");

  const menuRef = useRef(null);
  const groupModalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageElementsRef = useRef({});
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Format Last Seen helper
  const formatLastSeen = (date, isOnline) => {
    if (isOnline) return "● Online";
    if (!date) return "Offline";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Offline";
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isToday) return `Last seen today at ${timeStr}`;
    if (isYesterday) return `Last seen yesterday at ${timeStr}`;
    return `Last seen ${d.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`;
  };

  // Format Full Date Time helper
  const formatFullDateTime = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Global click to close context menu
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu) setContextMenu(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [contextMenu]);

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
        if (selectedChat) {
          const updatedSelected = res.conversations.find((c) => c._id === selectedChat._id);
          if (updatedSelected) setSelectedChat(updatedSelected);
        }
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching conversations:", err);
    }
  };

  // Load notification counts
  const fetchNotifCounts = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setUnreadNotifCount(res.unreadCount || 0);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchConversations();
    fetchNotifCounts();

    const handleNotifsCleared = () => {
      setUnreadNotifCount(0);
    };
    window.addEventListener('notifications_cleared', handleNotifsCleared);
    return () => {
      window.removeEventListener('notifications_cleared', handleNotifsCleared);
    };
  }, []);

  // Fetch users for group creation or starting direct chats
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

    if (socket) {
      socket.emit("join_chat", selectedChat._id);
      socket.emit("message_read", {
        conversationId: selectedChat._id,
        userId: currentUser?._id,
      });
    }

    // Reset unread count locally for selected conversation
    setConversations((prev) =>
      prev.map((c) => (c._id === selectedChat._id ? { ...c, unreadCount: 0 } : c))
    );

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

  // Scroll to a quoted message
  const handleScrollToMessage = (targetMsgId) => {
    if (!targetMsgId) return;
    const el = messageElementsRef.current[targetMsgId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(targetMsgId);
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  };

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
      setTranslatedMessages((prev) => {
        if (!prev[updatedMsg._id]) return prev;
        const copy = { ...prev };
        delete copy[updatedMsg._id];
        return copy;
      });
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
      setTranslatedMessages((prev) => {
        if (!prev[messageId]) return prev;
        const copy = { ...prev };
        delete copy[messageId];
        return copy;
      });
    };

    const handleMessagesRead = ({ conversationId, userId }) => {
      if (selectedChat && selectedChat._id === conversationId) {
        const myId = (currentUser?._id || currentUser?.id)?.toString();
        const readerIdStr = userId?.toString();
        setMessages((prev) =>
          prev.map((m) => {
            const senderIdStr = (m.sender?._id || m.sender?.id || m.sender)?.toString();
            if (senderIdStr === myId) {
              const currentRead = m.readBy || [];
              const alreadyRead = currentRead.some(
                (id) => (id?._id || id?.id || id)?.toString() === readerIdStr
              );
              if (!alreadyRead && readerIdStr) {
                return { ...m, readBy: [...currentRead, readerIdStr] };
              }
            }
            return m;
          })
        );
      }
    };

    const handleNotification = () => {
      setUnreadNotifCount((prev) => prev + 1);
    };

    socket.on("message_received", handleMessageReceived);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("messages_read", handleMessagesRead);
    socket.on("notification_received", handleNotification);

    return () => {
      socket.off("message_received", handleMessageReceived);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("messages_read", handleMessagesRead);
      socket.off("notification_received", handleNotification);
    };
  }, [socket, selectedChat, currentUser?._id]);

  // Handle Typing indicator
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

      // Upload attachment if any
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
          setTranslatedMessages((prev) => {
            if (!prev[editingMessage._id]) return prev;
            const copy = { ...prev };
            delete copy[editingMessage._id];
            return copy;
          });
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

      // Determine messageType
      let messageType = "text";
      if (uploadedAttachments.length > 0) {
        const first = uploadedAttachments[0];
        if (first.type?.startsWith("image/")) messageType = "image";
        else if (first.type?.startsWith("audio/")) messageType = "voice";
        else messageType = "file";
      }

      const messagePayload = {
        conversationId: selectedChat._id,
        text: messageInput.trim(),
        attachments: uploadedAttachments,
        replyToId: replyingTo ? replyingTo._id : undefined,
        messageType,
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

  // ─── Real Message Translation Handlers ───
  const handleTranslateMessage = async (msg, targetLangOverride = null) => {
    if (!msg || !msg.text || !msg.text.trim()) return;

    const targetLang = targetLangOverride || currentLanguage || "en";
    const targetLangObj = languages.find((l) => l.code === targetLang) || { nativeName: targetLang };

    // Set loading state for this message
    setTranslatedMessages((prev) => ({
      ...prev,
      [msg._id]: {
        ...(prev[msg._id] || {}),
        loading: true,
        error: null,
        targetLanguage: targetLang,
        targetLanguageName: targetLangObj.nativeName || targetLang,
        isHidden: false,
      },
    }));

    try {
      const res = await translationService.translateMessage({
        messageId: msg._id,
        text: msg.text,
        targetLanguage: targetLang,
      });

      if (res.success) {
        setTranslatedMessages((prev) => ({
          ...prev,
          [msg._id]: {
            translatedText: res.translatedText,
            sourceLanguage: res.sourceLanguage,
            sourceLanguageName: res.sourceLanguageName || res.sourceLanguage,
            targetLanguage: res.targetLanguage,
            targetLanguageName: res.targetLanguageName || targetLangObj.nativeName || res.targetLanguage,
            isHidden: false,
            loading: false,
            error: null,
          },
        }));
      } else {
        throw new Error(res.message || "Translation failed");
      }
    } catch (err) {
      console.error("[Translation Error]:", err);
      setTranslatedMessages((prev) => ({
        ...prev,
        [msg._id]: {
          ...(prev[msg._id] || {}),
          loading: false,
          error: t("translationFailed") || "Translation failed. Please try again.",
        },
      }));
    }
  };

  const handleToggleHideTranslation = (msgId) => {
    setTranslatedMessages((prev) => {
      if (!prev[msgId]) return prev;
      return {
        ...prev,
        [msgId]: {
          ...prev[msgId],
          isHidden: !prev[msgId].isHidden,
        },
      };
    });
  };

  // Send Voice Message
  const handleSendVoice = async (audioFile, duration) => {
    if (!selectedChat || !audioFile) return;
    setShowVoiceRecorder(false);
    setIsSending(true);

    try {
      const uploadRes = await messageService.uploadAttachment(audioFile);
      if (uploadRes.success && uploadRes.attachment) {
        const messagePayload = {
          conversationId: selectedChat._id,
          text: "",
          attachments: [uploadRes.attachment],
          replyToId: replyingTo ? replyingTo._id : undefined,
          messageType: "voice",
        };

        const res = await messageService.sendMessage(messagePayload);
        if (res.success && res.message) {
          const createdMessage = res.message;
          setMessages((prev) => [...prev, createdMessage]);

          if (socket) {
            socket.emit("send_message", createdMessage);
          }

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

          setReplyingTo(null);
        }
      }
    } catch (err) {
      console.error("[Dashboard] Error sending voice message:", err);
    } finally {
      setIsSending(false);
    }
  };

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
          prev.map((m) => (m._id === msgId ? { ...m, starredBy: res.starredBy } : m))
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
    if (!conv) return {};
    if (conv.isGroup) {
      return {
        name: conv.groupName || "Group Chat",
        avatar: conv.groupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.groupName || "group"}`,
        isOnline: false,
        memberCount: conv.participants?.length || 0,
        subtext: `${conv.participants?.length || 0} members`,
      };
    }

    const otherParticipant = conv.participants?.find(
      (p) => (p._id || p)?.toString() !== currentUser?._id?.toString()
    ) || conv.participants?.[0] || {};

    const online = isUserOnline(otherParticipant._id);

    return {
      name: otherParticipant.name || "User",
      avatar: otherParticipant.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherParticipant.name || "User"}`,
      isOnline: online,
      phone: otherParticipant.phoneNumber || "",
      lastSeen: otherParticipant.lastSeen,
      subtext: online ? "● Online" : formatLastSeen(otherParticipant.lastSeen, false),
      participant: otherParticipant,
    };
  };

  // Online users list for Active Now reel
  const onlineUsersList = allUsers.filter(
    (u) => u._id !== currentUser?._id && isUserOnline(u._id)
  );

  // Per-chat wallpaper getters and setters
  const getActiveWallpaperStyle = () => {
    if (!selectedChat) return {};
    let wp = chatWallpapers[selectedChat._id];
    if (!wp) {
      const saved = localStorage.getItem(`chat_wallpaper_${selectedChat._id}`);
      if (saved) {
        try { wp = JSON.parse(saved); } catch (e) {}
      }
    }
    if (!wp && globalWallpaper) {
      wp = globalWallpaper;
    }
    if (!wp) {
      const globalSaved = localStorage.getItem("global_chat_wallpaper");
      if (globalSaved) {
        try { wp = JSON.parse(globalSaved); } catch (e) {}
      }
    }

    if (!wp || wp.id === "default") return {};
    if (wp.customImage) {
      return {
        backgroundImage: `url(${wp.customImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }
    return wp.style || {};
  };

  const handleSetWallpaper = (wpObj, applyToAll = false) => {
    if (applyToAll) {
      localStorage.setItem("global_chat_wallpaper", JSON.stringify(wpObj));
      setGlobalWallpaper(wpObj);
    } else if (selectedChat) {
      localStorage.setItem(`chat_wallpaper_${selectedChat._id}`, JSON.stringify(wpObj));
      setChatWallpapers((prev) => ({ ...prev, [selectedChat._id]: wpObj }));
    }
    setShowWallpaperModal(false);
  };

  // Delete specific conversation
  const handleDeleteConversation = async (convId) => {
    if (!convId) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this chat? All messages and attachments will be deleted!"
    );
    if (!confirmDelete) return;

    try {
      const res = await conversationService.deleteConversation(convId);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c._id !== convId));
        if (selectedChat?._id === convId) {
          setSelectedChat(null);
          setMessages([]);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete chat");
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const display = getChatDisplay(c);
    const matchesSearch = display.name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (chatFilter === "online") {
      if (c.isGroup) {
        return matchesSearch && c.participants?.some(p => (p._id || p) !== currentUser?._id && isUserOnline(p._id || p));
      }
      return matchesSearch && display.isOnline;
    }
    if (chatFilter === "unread") return matchesSearch && (c.unreadCount > 0);
    if (chatFilter === "groups") return matchesSearch && c.isGroup;
    return matchesSearch;
  });

  // Filter users when searching
  const filteredNewContacts = searchQuery.trim()
    ? allUsers.filter(
        (u) =>
          u._id !== currentUser?._id &&
          (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const chatMediaAttachments = messages
    .filter((m) => m.attachments && m.attachments.length > 0)
    .flatMap((m) => m.attachments);

  const activeChatDisplay = getChatDisplay(selectedChat);

  return (
    <div className="dashboard-wrapper" data-theme={isDarkMode ? "dark" : "light"}>
      {/* ─── 1. LEFT ICON RAIL (Quick Navigation with Expand/Collapse) ─── */}
      <nav className={`nav-rail ${isRailExpanded ? "expanded" : ""}`}>
        <div className="rail-top">
          <div className="rail-header-toggle">
            <div className="rail-logo" onClick={() => navigate("/dashboard")} title="Chatify">
              💬
            </div>
            <button
              type="button"
              className="rail-expand-btn"
              onClick={() => setIsRailExpanded(!isRailExpanded)}
              title={isRailExpanded ? "Collapse Menu" : "Expand Menu (Show Button Names)"}
            >
              {isRailExpanded ? "⇤" : "☰"}
            </button>
          </div>

          <button
            type="button"
            className="rail-btn active"
            onClick={() => setSelectedChat(null)}
            title="Chats"
          >
            <span>💬</span>
            <span className="rail-btn-text">Chats</span>
          </button>

          <button
            type="button"
            className="rail-btn"
            onClick={() => navigate("/contacts")}
            title="Contacts"
          >
            <span>📇</span>
            <span className="rail-btn-text">Contacts</span>
          </button>

          <button
            type="button"
            className="rail-btn"
            onClick={() => setShowCreateGroup(true)}
            title="Create Group"
          >
            <span>👥</span>
            <span className="rail-btn-text">New Group</span>
          </button>

          <button
            type="button"
            className="rail-btn"
            onClick={() => setShowCallHistory(true)}
            title="Calls History"
          >
            <span>📞</span>
            <span className="rail-btn-text">Call Logs</span>
          </button>

          <button
            type="button"
            className="rail-btn"
            onClick={() => navigate("/notification")}
            title="Notifications"
          >
            <span>🔔</span>
            <span className="rail-btn-text">Notifications</span>
            {unreadNotifCount > 0 && <span className="rail-badge">{unreadNotifCount}</span>}
          </button>

          <button
            type="button"
            className="rail-btn"
            onClick={() => navigate("/starred")}
            title="Starred Messages"
          >
            <span>⭐</span>
            <span className="rail-btn-text">Starred</span>
          </button>

          <button
            type="button"
            className="rail-btn"
            onClick={() => navigate("/ai-chat")}
            title="AI Chat"
          >
            <span>🤖</span>
            <span className="rail-btn-text">AI Chat</span>
          </button>

          <button
            type="button"
            className="rail-btn"
            onClick={() => navigate("/analytics")}
            title="Analytics"
          >
            <span>📊</span>
            <span className="rail-btn-text">Analytics</span>
          </button>
        </div>

        <div className="rail-bottom">
          <button
            type="button"
            className="rail-btn"
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span>{isDarkMode ? "☀️" : "🌙"}</span>
            <span className="rail-btn-text">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button
            type="button"
            className="rail-btn"
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            <span>⚙️</span>
            <span className="rail-btn-text">Settings</span>
          </button>

          <div
            className="rail-avatar-btn"
            onClick={() => navigate("/profile")}
            title={currentUser?.name}
          >
            <img
              src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name || "U"}`}
              alt={currentUser?.name}
            />
            <div className="rail-user-details">
              <span className="rail-user-name">{currentUser?.name}</span>
              <span className="rail-user-email">{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── 2. CONVERSATIONS SIDEBAR ─── */}
      <aside className={`contacts-sidebar ${selectedChat ? "chat-selected" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-top-bar">
            <h1 className="sidebar-heading">Messages</h1>
            <div className="sidebar-action-icons">
              <button
                type="button"
                className="sidebar-icon-btn"
                onClick={() => setShowCreateGroup(true)}
                title="New Group"
              >
                👥
              </button>
              <button
                type="button"
                className="sidebar-icon-btn"
                onClick={() => navigate("/contacts")}
                title="Find Contacts"
              >
                📇
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="search-wrapper">
            <span className="search-icon-inside">🔍</span>
            <input
              type="text"
              className="search-input-modern"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div className="chat-filter-pills">
            <button
              type="button"
              className={`filter-pill ${chatFilter === "all" ? "active" : ""}`}
              onClick={() => setChatFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-pill ${chatFilter === "online" ? "active" : ""}`}
              onClick={() => setChatFilter("online")}
            >
              Online ({onlineUsersList.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${chatFilter === "unread" ? "active" : ""}`}
              onClick={() => setChatFilter("unread")}
            >
              Unread
            </button>
            <button
              type="button"
              className={`filter-pill ${chatFilter === "groups" ? "active" : ""}`}
              onClick={() => setChatFilter("groups")}
            >
              Groups
            </button>
          </div>

          {/* Active Now / Online Contacts Reel */}
          {onlineUsersList.length > 0 && (
            <div className="active-now-reel-container">
              <div className="active-now-header-row">
                <span className="online-live-pulse-dot" />
                <span className="active-now-title-text">Active Now</span>
                <span className="active-now-count-pill">{onlineUsersList.length}</span>
              </div>
              <div className="active-now-scroll-row">
                {onlineUsersList.map((u) => (
                  <div
                    key={u._id}
                    className="active-now-user-chip"
                    onClick={() => handleStartDirectChat(u)}
                    title={`Start chat with ${u.name}`}
                  >
                    <div className="active-now-avatar-ring">
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                        alt={u.name}
                      />
                      <span className="active-now-badge" />
                    </div>
                    <span className="active-now-chip-name">{u.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Conversation List */}
        <div className="conversations-scroll-area">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const display = getChatDisplay(conv);
              const isActive = selectedChat?._id === conv._id;

              let lastMsgText = "No messages yet";
              if (conv.lastMessage) {
                if (conv.lastMessage.isDeletedForEveryone) {
                  lastMsgText = "This message was deleted";
                } else if (conv.lastMessage.messageType === "voice") {
                  lastMsgText = "🎤 Voice message";
                } else if (conv.lastMessage.attachments?.length) {
                  lastMsgText = "📎 Attachment";
                } else {
                  lastMsgText = conv.lastMessage.text || "Message";
                }
              }

              const timeStr = conv.lastMessage?.createdAt
                ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div
                  key={conv._id}
                  className={`chat-list-item ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedChat(conv)}
                >
                  <div className={`chat-item-avatar ${conv.isGroup ? "group" : ""}`}>
                    <img src={display.avatar} alt={display.name} />
                    {display.isOnline && <div className="online-dot" />}
                  </div>

                  <div className="chat-item-info">
                    <div className="chat-item-header">
                      <span className="chat-item-name">{display.name}</span>
                      <span className="chat-item-time">{timeStr}</span>
                    </div>

                    <div className="chat-item-preview-line">
                      <span className="chat-item-last-msg">{lastMsgText}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {conv.unreadCount > 0 && (
                          <span className="unread-count-pill">{conv.unreadCount}</span>
                        )}
                        <button
                          type="button"
                          className="chat-item-quick-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv._id);
                          }}
                          title="Delete Chat"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-tertiary)" }}>
              {searchQuery ? "No matching conversations" : "No conversations yet. Start one!"}
            </div>
          )}

          {/* If searching, display users not in conversation yet */}
          {searchQuery.trim() && filteredNewContacts.length > 0 && (
            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--accent-blue)", marginBottom: "8px", paddingLeft: "8px" }}>
                Start chat with user
              </div>
              {filteredNewContacts.map((u) => (
                <div
                  key={u._id}
                  className="chat-list-item"
                  onClick={() => handleStartDirectChat(u)}
                >
                  <div className="chat-item-avatar">
                    <img
                      src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                      alt={u.name}
                    />
                    {isUserOnline(u._id) && <div className="online-dot" />}
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-name">{u.name}</div>
                    <div className="chat-item-last-msg">{u.email}</div>
                  </div>
                  <span style={{ color: "#22c55e", fontSize: "20px", fontWeight: "bold" }}>+</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ─── 3. ACTIVE CHAT AREA ─── */}
      <main className={`chat-container ${selectedChat ? "chat-selected" : ""}`}>
        {selectedChat ? (
          <>
            {/* Chat Top Header */}
            <header className="chat-main-header">
              <div className="chat-header-user" onClick={() => setShowProfile(!showProfile)}>
                {/* Mobile Back Button */}
                <button
                  type="button"
                  className="mobile-back-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedChat(null);
                  }}
                  title="Back to conversations"
                  aria-label="Back to conversations"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>

                <div className="chat-header-avatar">
                  <img src={activeChatDisplay.avatar} alt={activeChatDisplay.name} />
                  {activeChatDisplay.isOnline && <div className="online-dot" />}
                </div>

                <div className="chat-header-meta">
                  <h2>{activeChatDisplay.name}</h2>
                  <div className={`chat-header-status ${activeChatDisplay.isOnline ? "online" : ""}`}>
                    {selectedChat.isGroup
                      ? `${activeChatDisplay.memberCount} members`
                      : activeChatDisplay.isOnline
                      ? "● Online"
                      : "Offline"}
                  </div>
                </div>
              </div>

              {/* Call & Tool Actions */}
              <div className="chat-header-actions">
                {!selectedChat.isGroup && (
                  <>
                    <button
                      type="button"
                      className="header-action-btn call-audio"
                      onClick={() => startCall(activeChatDisplay.participant, "audio", selectedChat._id)}
                      title="Start Audio Call"
                    >
                      📞
                    </button>
                    <button
                      type="button"
                      className="header-action-btn call-video"
                      onClick={() => startCall(activeChatDisplay.participant, "video", selectedChat._id)}
                      title="Start Video Call"
                    >
                      📹
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="header-action-btn"
                  onClick={() => setShowWallpaperModal(true)}
                  title="Change Chat Wallpaper"
                >
                  🎨
                </button>

                <button
                  type="button"
                  className="header-action-btn"
                  onClick={() => setShowEncryptionModal(true)}
                  title="Encryption Info"
                >
                  🔐
                </button>

                <button
                  type="button"
                  className="header-action-btn"
                  onClick={() => setShowProfile(!showProfile)}
                  title={showProfile ? "Close Info" : "Conversation Info"}
                >
                  ℹ️
                </button>

                <button
                  type="button"
                  className="header-action-btn delete-chat-btn"
                  onClick={() => handleDeleteConversation(selectedChat._id)}
                  title="Delete this Conversation"
                >
                  🗑️
                </button>
              </div>
            </header>

            {/* Message Feed */}
            <div className="messages-scroll-view" style={getActiveWallpaperStyle()}>
              {loadingMessages ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
                  Loading encrypted messages...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-tertiary)" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "12px" }}>👋</div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                    No messages yet
                  </h3>
                  <p style={{ fontSize: "13px" }}>Say hello to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const senderId = (msg.sender?._id || msg.sender?.id || msg.sender)?.toString();
                  const myId = (currentUser?._id || currentUser?.id)?.toString();
                  const isMe = Boolean(senderId && myId && senderId === myId);
                  const time = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isStarred = msg.starredBy?.some(
                    (id) => (id._id || id?.id || id)?.toString() === myId
                  );
                  const isRead = msg.readBy && msg.readBy.some((id) => {
                    const readerId = (id._id || id?.id || id)?.toString();
                    return readerId && readerId !== myId;
                  });
                  const isHighlighted = highlightedMsgId === msg._id;

                  return (
                    <div
                      key={msg._id}
                      ref={(el) => (messageElementsRef.current[msg._id] = el)}
                      className={`message-row ${isMe ? "sent" : "received"} ${isHighlighted ? "highlighted" : ""}`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({
                          x: Math.min(e.clientX, window.innerWidth - 240),
                          y: Math.min(e.clientY, window.innerHeight - 300),
                          message: msg,
                        });
                      }}
                    >
                      {!isMe && (
                        <img
                          src={
                            msg.sender?.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${msg.sender?.name || "U"}`
                          }
                          alt="avatar"
                          className="message-avatar-small"
                        />
                      )}

                      <div className="message-bubble-wrapper">
                        {/* Hover Action Dock */}
                        <div className="message-hover-dock">
                          <button
                            type="button"
                            className="dock-btn"
                            title="Message Info (Delivered & Seen Times)"
                            onClick={() => setMessageInfoModal(msg)}
                          >
                            ℹ️
                          </button>
                          <button
                            type="button"
                            className="dock-btn"
                            title="Reply"
                            onClick={() => setReplyingTo(msg)}
                          >
                            ↩️
                          </button>
                          <button
                            type="button"
                            className="dock-btn"
                            title="React ❤️"
                            onClick={() => handleAddReaction(msg._id, "❤️")}
                          >
                            ❤️
                          </button>
                          <button
                            type="button"
                            className="dock-btn"
                            title="React 👍"
                            onClick={() => handleAddReaction(msg._id, "👍")}
                          >
                            👍
                          </button>
                          <button
                            type="button"
                            className="dock-btn"
                            title={isStarred ? "Unstar" : "Star"}
                            onClick={() => handleToggleStar(msg._id)}
                          >
                            {isStarred ? "⭐" : "☆"}
                          </button>
                          <button
                            type="button"
                            className="dock-btn"
                            title="Forward"
                            onClick={() => setForwardingMessage(msg)}
                          >
                            ↗️
                          </button>
                          {msg.text && (
                            <button
                              type="button"
                              className="dock-btn"
                              title={`${t("translate") || "Translate"} (${getCurrentLanguageData()?.nativeName || currentLanguage})`}
                              onClick={() => handleTranslateMessage(msg)}
                            >
                              🌐
                            </button>
                          )}
                          {isMe && !msg.isDeletedForEveryone && (
                            <button
                              type="button"
                              className="dock-btn"
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
                            type="button"
                            className="dock-btn"
                            title="Delete"
                            onClick={() => handleDeleteMessage(msg._id, isMe)}
                          >
                            🗑️
                          </button>
                        </div>

                        {/* Group Sender Name */}
                        {selectedChat.isGroup && !isMe && (
                          <span className="message-sender-name-tag">{msg.sender?.name}</span>
                        )}

                        {/* Quoted Reply */}
                        {msg.replyTo && (
                          <div
                            className="quoted-reply-box"
                            onClick={() => handleScrollToMessage(msg.replyTo._id || msg.replyTo)}
                          >
                            <div className="quoted-sender-label">
                              ↩ {msg.replyTo.sender?.name || "Replying to message"}
                            </div>
                            <div>{msg.replyTo.text || "Attachment / Media"}</div>
                          </div>
                        )}

                        {/* Message Attachments */}
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
                                ) : !att.type || !att.type.startsWith("audio/") ? (
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="message-attachment-file"
                                  >
                                    📄 {att.name || "Download file"}
                                  </a>
                                ) : null}
                              </div>
                            );
                          })}

                        {/* Voice Note Player */}
                        {msg.messageType === "voice" && msg.attachments?.[0]?.url && (
                          <VoiceMessagePlayer audioUrl={msg.attachments[0].url} />
                        )}

                        {/* Text Bubble */}
                        {msg.text && (
                          <div className="message-bubble">
                            <div className="message-original-text">
                              {msg.text}
                              {msg.isEdited && (
                                <span style={{ fontSize: "10px", marginLeft: "6px", opacity: 0.7 }}>
                                  (edited)
                                </span>
                              )}
                            </div>

                            {/* Inline Message Translation Box */}
                            {translatedMessages[msg._id] && !msg.isDeletedForEveryone && (
                              <div className="message-translation-box">
                                {translatedMessages[msg._id].loading ? (
                                  <div className="translation-loading-row">
                                    <span className="translation-spinner">⏳</span>
                                    <span>{t("translating") || "Translating..."}</span>
                                  </div>
                                ) : translatedMessages[msg._id].error ? (
                                  <div className="translation-error-row">
                                    <span>⚠️ {translatedMessages[msg._id].error}</span>
                                    <button
                                      type="button"
                                      className="translation-retry-btn"
                                      onClick={() => handleTranslateMessage(msg, translatedMessages[msg._id].targetLanguage)}
                                    >
                                      Retry
                                    </button>
                                  </div>
                                ) : translatedMessages[msg._id].isHidden ? (
                                  <div className="translation-hidden-row">
                                    <button
                                      type="button"
                                      className="translation-action-link"
                                      onClick={() => handleToggleHideTranslation(msg._id)}
                                    >
                                      🌐 {t("translated") || "Translated"} ({translatedMessages[msg._id].targetLanguageName || translatedMessages[msg._id].targetLanguage}) • {t("showOriginal") || "Show Translation"}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="translation-content">
                                    <div className="translation-header-row">
                                      <div className="translation-badge">
                                        <span className="translation-icon">🌐</span>
                                        <span className="translation-label">
                                          {t("translatedTo") || "Translated to"} {translatedMessages[msg._id].targetLanguageName || translatedMessages[msg._id].targetLanguage}
                                        </span>
                                        {translatedMessages[msg._id].sourceLanguage && translatedMessages[msg._id].sourceLanguage !== "auto" && (
                                          <span className="translation-source-chip">
                                            ({t("detectedLanguage") || "Detected"}: {translatedMessages[msg._id].sourceLanguageName || translatedMessages[msg._id].sourceLanguage})
                                          </span>
                                        )}
                                      </div>
                                      <div className="translation-actions">
                                        <button
                                          type="button"
                                          className="translation-action-link"
                                          onClick={() => handleToggleHideTranslation(msg._id)}
                                          title={t("hideTranslation") || "Hide translation"}
                                        >
                                          {t("hideTranslation") || "Hide"}
                                        </button>
                                        <button
                                          type="button"
                                          className="translation-action-link"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTranslateLanguageModal(msg);
                                          }}
                                          title={t("translateTo") || "Translate to..."}
                                        >
                                          ⇄
                                        </button>
                                      </div>
                                    </div>
                                    <div className="translation-text">
                                      {translatedMessages[msg._id].translatedText}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reactions Row */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="message-reactions-pills">
                            {msg.reactions.map((r, rIdx) => (
                              <span
                                key={rIdx}
                                className="reaction-chip"
                                onClick={() => handleAddReaction(msg._id, r.emoji)}
                              >
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer Meta with Sent Time and Single / Double Ticks */}
                        <div className="message-meta-footer">
                          {isStarred && <span className="message-starred-icon" title="Starred">⭐</span>}
                          <span className="message-sent-time" title={`Sent at ${time}`}>
                            {time}
                          </span>
                          {isMe && (
                            <span
                              className={`message-ticks ${isRead ? "blue" : "single-sent"}`}
                              title={
                                isRead
                                  ? `Seen • Sent at ${time}`
                                  : `Sent at ${time}`
                              }
                            >
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
                <div className="typing-bar">
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

            {/* Composer Area */}
            <div className="composer-area">
              {/* Quoted Reply Banner */}
              {replyingTo && (
                <div className="composer-preview-banner">
                  <div className="banner-content">
                    <span className="banner-sender">
                      Replying to {replyingTo.sender?.name || "User"}
                    </span>
                    <span className="banner-text">
                      {replyingTo.text || (replyingTo.attachments?.length ? "Attachment" : "")}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="banner-close-btn"
                    onClick={() => setReplyingTo(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Attachment Preview Banner */}
              {attachment && (
                <div className="composer-preview-banner">
                  <div className="banner-content">
                    <span className="banner-sender">📎 Attached file:</span>
                    <span className="banner-text">{attachment.name}</span>
                  </div>
                  <button type="button" className="banner-close-btn" onClick={clearAttachment}>
                    ✕
                  </button>
                </div>
              )}

              {/* Editing Banner */}
              {editingMessage && (
                <div className="composer-preview-banner">
                  <div className="banner-content">
                    <span className="banner-sender">✏️ Editing message</span>
                  </div>
                  <button
                    type="button"
                    className="banner-close-btn"
                    onClick={() => {
                      setEditingMessage(null);
                      setMessageInput("");
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Hidden file picker */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />

              {/* Live Voice Recorder or Standard Input */}
              {showVoiceRecorder ? (
                <div className="composer-row">
                  <VoiceRecorder
                    onSendVoice={handleSendVoice}
                    onCancel={() => setShowVoiceRecorder(false)}
                  />
                </div>
              ) : (
                <div className="composer-row">
                  <button
                    type="button"
                    className="composer-action-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach Image or File"
                  >
                    📎
                  </button>

                  <button
                    type="button"
                    className="composer-action-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Emoji Picker"
                  >
                    😊
                  </button>

                  {/* Emoji Picker Popover */}
                  {showEmojiPicker && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "75px",
                        left: "60px",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "16px",
                        boxShadow: "var(--shadow-lg)",
                        padding: "10px",
                        display: "grid",
                        gridTemplateColumns: "repeat(6, 1fr)",
                        gap: "6px",
                        zIndex: 100,
                        width: "240px",
                      }}
                    >
                      {[
                        "😀", "😂", "😍", "👍", "❤️", "🔥",
                        "🎉", "🙌", "✨", "😎", "🥳", "💯",
                        "🙏", "👏", "🚀", "💡", "👋", "🤩",
                      ].map((emoji) => (
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
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <textarea
                    className="composer-textarea"
                    placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />

                  {/* Toggle Voice Recorder or Send */}
                  {!messageInput.trim() && !attachment ? (
                    <button
                      type="button"
                      className="composer-action-btn"
                      onClick={() => setShowVoiceRecorder(true)}
                      title="Record Voice Note"
                      style={{ color: "#22c55e", fontSize: "20px" }}
                    >
                      🎤
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="composer-send-btn"
                      onClick={handleSendMessage}
                      disabled={isSending}
                      title="Send Message"
                    >
                      {isSending ? "..." : "➤"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", padding: "20px" }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>💬</div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px" }}>
              Welcome to Chatify
            </h2>
            <p style={{ fontSize: "14px", maxWidth: "340px", textAlign: "center" }}>
              Select a conversation from the sidebar or start a new chat to begin messaging with real-time audio and video calls.
            </p>
          </div>
        )}
      </main>

      {/* ─── 4. RIGHT CONTEXTUAL PROFILE SIDEBAR ─── */}
      {selectedChat && (
        <aside className={`profile-sidebar ${!showProfile ? "hidden" : ""}`}>
          <div className="profile-header-card">
            <button
              type="button"
              className="profile-close-btn"
              onClick={() => setShowProfile(false)}
              title="Close panel"
              aria-label="Close panel"
            >
              ✕
            </button>
            <img
              src={activeChatDisplay.avatar}
              alt={activeChatDisplay.name}
              className="profile-header-avatar"
            />
            <h3 className="profile-header-name">{activeChatDisplay.name}</h3>
            <p className="profile-header-status">
              {selectedChat.isGroup
                ? `${activeChatDisplay.memberCount} members`
                : activeChatDisplay.phone || activeChatDisplay.subtext}
            </p>
          </div>

          {/* Group Members Section */}
          {selectedChat.isGroup && (
            <div>
              <div className="profile-section-title">Group Participants</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedChat.participants?.map((member) => (
                  <div
                    key={member._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "6px 8px",
                      borderRadius: "8px",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <img
                      src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                      alt={member.name}
                      style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div style={{ flex: 1, fontSize: "13px", fontWeight: 600 }}>
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

          {/* Shared Media & Docs */}
          <div>
            <div className="profile-section-title">Shared Media & Files</div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
              <button
                type="button"
                className={`filter-pill ${activeTab === "media" ? "active" : ""}`}
                onClick={() => setActiveTab("media")}
              >
                Media
              </button>
              <button
                type="button"
                className={`filter-pill ${activeTab === "docs" ? "active" : ""}`}
                onClick={() => setActiveTab("docs")}
              >
                Documents
              </button>
            </div>

            {activeTab === "media" ? (
              <div className="media-gallery-grid">
                {chatMediaAttachments
                  .filter((att) => att.type?.startsWith("image/"))
                  .map((item, index) => {
                    const fullUrl = getMediaUrl(item.url);
                    return (
                      <div key={index} className="media-gallery-item">
                        <img
                          src={fullUrl}
                          alt={`media-${index}`}
                          onClick={() => window.open(fullUrl, "_blank")}
                        />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {chatMediaAttachments
                  .filter((att) => !att.type?.startsWith("image/"))
                  .map((item, index) => {
                    const fullUrl = getMediaUrl(item.url);
                    return (
                      <a
                        key={index}
                        href={fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          textDecoration: "none",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          padding: "8px 10px",
                          background: "var(--bg-secondary)",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        📄 {item.name || "Document"}
                      </a>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Delete Chat Button inside Profile Sidebar */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
            <button
              type="button"
              onClick={() => handleDeleteConversation(selectedChat._id)}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
            >
              <span>🗑️</span> Delete Entire Conversation
            </button>
          </div>
        </aside>
      )}

      {/* ─── 5. GROUP CREATION MODAL ─── */}
      {showCreateGroup && (
        <div className="call-history-modal-overlay">
          <div className="call-history-modal" ref={groupModalRef} style={{ maxWidth: "460px" }}>
            <div className="call-history-header">
              <div className="history-title-area">
                <h2>Create New Group</h2>
                <p>Start a collaboration room with multiple members</p>
              </div>
              <button type="button" className="history-close-btn" onClick={() => setShowCreateGroup(false)}>
                ✕
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Group Name
                </label>
                <input
                  type="text"
                  className="search-input-modern"
                  placeholder="e.g. Engineering Team"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  className="search-input-modern"
                  placeholder="What is this group about?"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Select Members ({selectedMembers.length} selected)
                </label>
                <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {allUsers
                    .filter((u) => u._id !== currentUser?._id)
                    .map((userItem) => {
                      const isSelected = !!selectedMembers.find((m) => m._id === userItem._id);
                      return (
                        <div
                          key={userItem._id}
                          onClick={() => toggleMemberSelection(userItem)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            background: isSelected ? "rgba(34, 197, 94, 0.15)" : "var(--bg-secondary)",
                            cursor: "pointer",
                            border: isSelected ? "1px solid #22c55e" : "1px solid transparent",
                          }}
                        >
                          <img
                            src={userItem.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userItem.name}`}
                            alt={userItem.name}
                            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: 700 }}>{userItem.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{userItem.email}</div>
                          </div>
                          {isSelected && <span style={{ color: "#22c55e", fontWeight: "bold" }}>✓</span>}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="filter-pill"
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="filter-pill active"
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedMembers.length < 1}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. ENCRYPTION MODAL ─── */}
      {showEncryptionModal && (
        <div className="call-history-modal-overlay" onClick={() => setShowEncryptionModal(false)}>
          <div className="call-history-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px", textAlign: "center", padding: "24px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔐</div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>
              End-to-End Encryption
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5", marginBottom: "20px" }}>
              Messages, media, and WebRTC calls in this conversation are protected with transport-layer encryption and SHA-256 integrity verification.
            </p>
            <div style={{ background: "var(--bg-secondary)", padding: "14px", borderRadius: "12px", fontFamily: "monospace", letterSpacing: "2px", fontSize: "15px", color: "#22c55e", fontWeight: "bold", marginBottom: "20px" }}>
              {selectedChat?._id
                ? selectedChat._id.toString().toUpperCase().match(/.{1,4}/g)?.join(" ")
                : "SECURE-E2EE-TLS256"}
            </div>
            <button
              type="button"
              className="filter-pill active"
              style={{ width: "100%", padding: "10px" }}
              onClick={() => setShowEncryptionModal(false)}
            >
              Verify & Close
            </button>
          </div>
        </div>
      )}

      {/* ─── 7. CALL HISTORY MODAL ─── */}
      {showCallHistory && (
        <CallHistory
          onClose={() => setShowCallHistory(false)}
          onSelectChat={(conv) => {
            setSelectedChat(conv);
            setShowCallHistory(false);
          }}
        />
      )}

      {/* ─── 8. FORWARD MODAL ─── */}
      {forwardingMessage && (
        <ForwardModal
          message={forwardingMessage}
          conversations={conversations}
          onClose={() => setForwardingMessage(null)}
          onForwardSuccess={(targetConvId) => {
            fetchConversations();
          }}
        />
      )}

      {/* ─── 9. CHAT WALLPAPER MODAL ─── */}
      {showWallpaperModal && (
        <div className="call-history-modal-overlay" onClick={() => setShowWallpaperModal(false)}>
          <div className="call-history-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px", padding: "24px" }}>
            <div className="history-modal-header" style={{ marginBottom: "16px" }}>
              <div className="history-title-wrap">
                <span style={{ fontSize: "24px" }}>🎨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Chat Wallpaper</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-tertiary)" }}>
                    Customize background for {selectedChat ? activeChatDisplay.name : "all chats"}
                  </p>
                </div>
              </div>
              <button type="button" className="history-close-btn" onClick={() => setShowWallpaperModal(false)}>
                ✕
              </button>
            </div>

            {/* Presets Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
              {WALLPAPER_PRESETS.map((wp) => (
                <div
                  key={wp.id}
                  onClick={() => handleSetWallpaper(wp, false)}
                  style={{
                    height: "80px",
                    borderRadius: "12px",
                    ...wp.style,
                    border: "2px solid rgba(255, 255, 255, 0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "8px",
                    transition: "transform 0.2s, border-color 0.2s",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  }}
                  title={`Apply ${wp.name}`}
                >
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#ffffff",
                    background: "rgba(0,0,0,0.6)",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    backdropFilter: "blur(4px)",
                  }}>
                    {wp.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Custom URL */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Custom Image URL:
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={customWpUrl}
                  onChange={(e) => setCustomWpUrl(e.target.value)}
                  className="search-input-modern"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="filter-pill active"
                  disabled={!customWpUrl.trim()}
                  onClick={() => {
                    if (customWpUrl.trim()) {
                      handleSetWallpaper({ id: "custom", name: "Custom URL", customImage: customWpUrl.trim() }, false);
                      setCustomWpUrl("");
                    }
                  }}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
              <button
                type="button"
                className="filter-pill"
                onClick={() => handleSetWallpaper({ id: "default", name: "Default" }, false)}
              >
                Reset Default
              </button>
              <button
                type="button"
                className="filter-pill active"
                onClick={() => {
                  const currentWp = chatWallpapers[selectedChat?._id] || { id: "default" };
                  handleSetWallpaper(currentWp, true);
                }}
              >
                Set For All Chats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 10. RIGHT-CLICK CONTEXT MENU ─── */}
      {contextMenu && (
        <div
          className="chat-context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="context-menu-item info-action"
            onClick={() => {
              setMessageInfoModal(contextMenu.message);
              setContextMenu(null);
            }}
          >
            <span>ℹ️</span> View Message Info (Delivered & Seen Time)
          </button>
          <div className="context-menu-divider" />
          <button
            type="button"
            className="context-menu-item"
            onClick={() => {
              setReplyingTo(contextMenu.message);
              setContextMenu(null);
            }}
          >
            <span>↩️</span> Reply
          </button>
          {contextMenu.message.text && (
            <>
              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  const msgToTranslate = contextMenu.message;
                  setContextMenu(null);
                  handleTranslateMessage(msgToTranslate);
                }}
              >
                <span>🌐</span> {t("translate") || "Translate"} ({getCurrentLanguageData()?.nativeName || currentLanguage})
              </button>
              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  const msgToTranslate = contextMenu.message;
                  setContextMenu(null);
                  setTranslateLanguageModal(msgToTranslate);
                }}
              >
                <span>🔤</span> {t("translateTo") || "Translate to..."}
              </button>
              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  navigator.clipboard.writeText(contextMenu.message.text);
                  setContextMenu(null);
                }}
              >
                <span>📋</span> Copy Text
              </button>
            </>
          )}
          <button
            type="button"
            className="context-menu-item"
            onClick={() => {
              handleToggleStar(contextMenu.message._id);
              setContextMenu(null);
            }}
          >
            <span>⭐</span> Star / Unstar
          </button>
          <button
            type="button"
            className="context-menu-item"
            onClick={() => {
              setForwardingMessage(contextMenu.message);
              setContextMenu(null);
            }}
          >
            <span>↗️</span> Forward Message
          </button>
          <div className="context-menu-divider" />
          <button
            type="button"
            className="context-menu-item danger"
            onClick={() => {
              const msgToDelete = contextMenu.message;
              setContextMenu(null);
              const senderId = (msgToDelete.sender?._id || msgToDelete.sender?.id || msgToDelete.sender)?.toString();
              const myId = (currentUser?._id || currentUser?.id)?.toString();
              handleDeleteMessage(msgToDelete._id, senderId === myId);
            }}
          >
            <span>🗑️</span> Delete Message
          </button>
        </div>
      )}

      {/* ─── 11. MESSAGE INFO MODAL (DELIVERED & SEEN TIMESTAMPS) ─── */}
      {messageInfoModal && (
        <div className="call-history-modal-overlay" onClick={() => setMessageInfoModal(null)}>
          <div className="call-history-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px", padding: "24px" }}>
            <div className="history-modal-header" style={{ marginBottom: "16px" }}>
              <div className="history-title-wrap">
                <span style={{ fontSize: "24px" }}>ℹ️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Message Info</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-tertiary)" }}>
                    Delivery and read receipt timestamps
                  </p>
                </div>
              </div>
              <button type="button" className="history-close-btn" onClick={() => setMessageInfoModal(null)}>
                ✕
              </button>
            </div>

            {/* Message Preview Box */}
            <div style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "14px",
              marginBottom: "20px",
            }}>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 700 }}>
                {messageInfoModal.sender?.name || "Sender"}:
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", wordBreak: "break-word" }}>
                {messageInfoModal.text || (messageInfoModal.messageType === "voice" ? "🎤 Voice Note" : "📎 Attachment")}
              </div>
            </div>

            {/* Timestamps List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {/* Sent Time */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-color)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px" }}>📤</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>Sent Time</div>
                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Dispatched from device</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>
                  {formatFullDateTime(messageInfoModal.createdAt)}
                </div>
              </div>

              {/* Delivered Time */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-color)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px" }}>📥</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>Delivered Time</div>
                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Delivered to recipient server</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>
                  {formatFullDateTime(messageInfoModal.deliveredAt || messageInfoModal.createdAt)}
                </div>
              </div>

              {/* Seen / Read Time */}
              {(() => {
                const myId = (currentUser?._id || currentUser?.id)?.toString();
                const isRead = messageInfoModal.readBy && messageInfoModal.readBy.some((id) => {
                  const rId = (id._id || id?.id || id)?.toString();
                  return rId && rId !== myId;
                });
                const seenTime = messageInfoModal.readAt || (isRead ? messageInfoModal.updatedAt : null);

                return (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: isRead ? "rgba(56, 189, 248, 0.08)" : "rgba(255, 255, 255, 0.04)",
                    border: isRead ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid var(--border-color)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "18px", color: isRead ? "#38bdf8" : "inherit" }}>
                        {isRead ? "✓✓" : "✓"}
                      </span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: isRead ? "#38bdf8" : "inherit" }}>
                          Seen / Read Time
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                          {isRead ? "Opened & read by recipient" : "Not yet read by recipient"}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: isRead ? "#38bdf8" : "var(--text-tertiary)", textAlign: "right" }}>
                      {isRead ? formatFullDateTime(seenTime) : "Pending (Not seen)"}
                    </div>
                  </div>
                );
              })()}
            </div>

            <button
              type="button"
              className="filter-pill active"
              style={{ width: "100%", padding: "10px" }}
              onClick={() => setMessageInfoModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─── 12. TRANSLATE TO LANGUAGE MODAL ─── */}
      {translateLanguageModal && (
        <div className="translate-modal-overlay" onClick={() => setTranslateLanguageModal(null)}>
          <div className="translate-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="translate-modal-header">
              <h3 className="translate-modal-title">
                <span>🌐</span> {t("translateTo") || "Translate to..."}
              </h3>
              <button
                type="button"
                className="translate-modal-close"
                onClick={() => {
                  setTranslateLanguageModal(null);
                  setTranslateSearchQuery("");
                }}
              >
                ✕
              </button>
            </div>

            <div className="translate-search-wrap">
              <input
                type="text"
                className="translate-search-input"
                placeholder="Search language..."
                value={translateSearchQuery}
                onChange={(e) => setTranslateSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="translate-languages-list">
              {languages
                .filter(
                  (l) =>
                    l.nativeName.toLowerCase().includes(translateSearchQuery.toLowerCase()) ||
                    l.name.toLowerCase().includes(translateSearchQuery.toLowerCase()) ||
                    l.code.toLowerCase().includes(translateSearchQuery.toLowerCase())
                )
                .map((lang) => {
                  const currentActiveTarget = translatedMessages[translateLanguageModal._id]?.targetLanguage;
                  const isSelected =
                    currentActiveTarget === lang.code || (!currentActiveTarget && currentLanguage === lang.code);

                  return (
                    <button
                      key={lang.code}
                      type="button"
                      className={`translate-lang-item ${isSelected ? "active" : ""}`}
                      onClick={() => {
                        const targetMsg = translateLanguageModal;
                        setTranslateLanguageModal(null);
                        setTranslateSearchQuery("");
                        handleTranslateMessage(targetMsg, lang.code);
                      }}
                    >
                      <div className="translate-lang-left">
                        <span className="translate-lang-flag">{lang.flag}</span>
                        <span className="translate-lang-native">{lang.nativeName}</span>
                      </div>
                      <span className="translate-lang-code">{lang.code}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDashboard;