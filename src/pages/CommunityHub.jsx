import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import {
  ArrowLeft,
  Bell,
  CircleCheck,
  Share2,
  EllipsisVertical,
  Video,
  Heart,
  Image,
  MapPin,
  MessageSquare,
  Eye,
  Trash2,
  Plus,
  Compass,
  ChevronRight,
  Search,
  Shield,
  Globe,
  Phone,
  LogOut,
  Home,
  User,
  X,
  Loader2,
  Paperclip,
  ExternalLink,
  Download,
  FileText,
  Bookmark,
  Ban,
  UsersRound,
  FileCode,
  File as FileIcon,
  MessageCircle,
  Send,
  Sparkles,
  CloudUpload,
  Settings,
  MoreVertical
} from 'lucide-react';

// Custom EmptyState component to display clean notification graphics
const EmptyState = ({ icon: Icon, title, subtitle, color }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 border border-white/5 rounded-2xl max-w-sm mx-auto space-y-3">
    <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center ${color}`}>
      {Icon && <Icon size={20} />}
    </div>
    <div>
      <h4 className="text-sm font-black text-white">{title}</h4>
      <p className="text-[10px] text-text-secondary mt-1">{subtitle}</p>
    </div>
  </div>
);

export default function CommunityHub() {
  const { user, API, updateProfile } = useContext(AuthContext);
  const { socket, startCall } = useContext(SocketContext) || { socket: null, startCall: null };
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Core navigation and sub-tabs state
  const [activeTab, setActiveTab] = useState('home');
  const [chatSubTab, setChatSubTab] = useState('personal');
  const [joinedGroupsTab, setJoinedGroupsTab] = useState('joined_groups');
  const [postsTab, setPostsTab] = useState('posts');

  // Network and content data state
  const [friendsList, setFriendsList] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [callsHistory, setCallsHistory] = useState([]);
  const [unreadChats, setUnreadChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [chatWallpaper, setChatWallpaper] = useState(null);

  // Popup menus & reporting states
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [showReportModal, setShowReportModal] = useState(false);
  const [inviteGroupData, setInviteGroupData] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(false);

  // Upload post attachments state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [allowLikes, setAllowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowShares, setAllowShares] = useState(true);
  const [postVisibility, setPostVisibility] = useState('public');
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [hideCommentsCount, setHideCommentsCount] = useState(false);

  // Previewing attachments
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewPdfName, setPreviewPdfName] = useState(null);

  // Community Feed states
  const [posts, setPosts] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState(() => {
    const saved = localStorage.getItem('student_saved_post_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  
  // Advanced Story System States
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [storyForm, setStoryForm] = useState({
    type: 'text',
    category: 'study_progress',
    status: '',
    media: '',
    visibility: 'public',
    mentions: []
  });
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryGroupUser, setActiveStoryGroupUser] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyViewersList, setStoryViewersList] = useState([]);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [storyReplyText, setStoryReplyText] = useState('');

  // Post comments states
  const [postComments, setPostComments] = useState([]);
  const [commentPostId, setCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Create post form states
  const [postCategory, setPostCategory] = useState('notes');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postLink, setPostLink] = useState('');
  const [postFileName, setPostFileName] = useState('');
  const [postFileSize, setPostFileSize] = useState('');

  // Discover and network connection suggestions state
  const [selectedUserForConnect, setSelectedUserForConnect] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    collegeName: user?.collegeName || '',
    branch: user?.branch || '',
    year: user?.year || 1,
    semester: user?.semester || 1,
    rollNumber: user?.rollNumber || '',
  });
  const [isProfilePublic, setIsProfilePublic] = useState(user?.profileVisibility === 'public');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [suggestions, setSuggestions] = useState({
    suggestedStudents: [],
    suggestedGroups: [],
    trendingNotes: [],
    trendingColleges: [],
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Global searching students state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selectedGroupCategory, setSelectedGroupCategory] = useState('general');
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  // Community Phase 1 states
  const [feedTab, setFeedTab] = useState('for_you');
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  const [comments, setComments] = useState([]);
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [replyToCommentAuthor, setReplyToCommentAuthor] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');

  const [savedPosts, setSavedPosts] = useState([]);
  const [subView, setSubView] = useState('home'); // 'home', 'search', 'chats', 'notifications', 'profile'
  const [profileUserId, setProfileUserId] = useState(null);
  const [otherUserProfileData, setOtherUserProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [profileStats, setProfileStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    groupsCount: 0,
    notesCount: 0,
    savedPostsCount: 0
  });

  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editPostData, setEditPostData] = useState(null);

  const [postHashtags, setPostHashtags] = useState('');
  const [postSubjectTags, setPostSubjectTags] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Complete profile form state (Welcome onboarding card)
  const [completeProfileForm, setCompleteProfileForm] = useState({
    fullName: user?.fullName || '',
    username: '',
    collegeName: '',
    branch: '',
    year: 1,
    semester: 1,
    avatar: '',
    gender: 'Prefer Not To Say',
  });
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);

  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // Group Chat Modal States
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [groupCategory, setGroupCategory] = useState('Study');
  const [groupCollege, setGroupCollege] = useState('');
  const [groupBranch, setGroupBranch] = useState('');
  const [groupYear, setGroupYear] = useState('');
  const [groupPrivacy, setGroupPrivacy] = useState('public');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Group Info & Settings Panel States
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [groupMembersList, setGroupMembersList] = useState([]);
  const [myGroupRole, setMyGroupRole] = useState('member'); // owner | admin | moderator | member
  const [groupMuted, setGroupMuted] = useState(false);
  const [groupPinned, setGroupPinned] = useState(false);

  // Edit Group details states
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupAvatar, setEditGroupAvatar] = useState('');
  const [editGroupCategory, setEditGroupCategory] = useState('Study');
  const [editGroupCollege, setEditGroupCollege] = useState('');
  const [editGroupBranch, setEditGroupBranch] = useState('');
  const [editGroupYear, setEditGroupYear] = useState('');
  const [editGroupPrivacy, setEditGroupPrivacy] = useState('public');

  // Add members state
  const [addMembersSelected, setAddMembersSelected] = useState([]);

  // Search messages state
  const [groupMessageSearchQuery, setGroupMessageSearchQuery] = useState('');
  const [groupMessageSearchResults, setGroupMessageSearchResults] = useState([]);
  const [isSearchingGroupMessages, setIsSearchingGroupMessages] = useState(false);

  // Advanced messaging states
  const [chatAttachment, setChatAttachment] = useState(null); // { url, type, name }
  const [replyMessage, setReplyMessage] = useState(null); // msg object
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [discoveredGroupsList, setDiscoveredGroupsList] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showNotesShareModal, setShowNotesShareModal] = useState(false);
  const [myNotesList, setMyNotesList] = useState([]);

  const fetchMyNotesForShare = async () => {
    try {
      const { data } = await API.get('/notes');
      setMyNotesList(data || []);
      setShowNotesShareModal(true);
    } catch (err) {
      toast.error('Failed to load notes');
    }
  };

  useEffect(() => {
    if (!window.visualViewport) return;
    const handleResize = () => {
      setViewportHeight(window.visualViewport.height);
    };
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Auto scroll chat viewport helper
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);

  // Sync activeChat state with ref for websocket handling
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Connect & listen to WebSocket events for real-time secure messaging
  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (msg) => {
        if (
          activeChatRef.current &&
          ((msg.isGroup && msg.recipient === activeChatRef.current.id) ||
            (!msg.isGroup &&
              (msg.sender._id === activeChatRef.current.id ||
                msg.recipient === activeChatRef.current.id)))
        ) {
          setMessages((prev) => {
            // Prevent duplicate messages
            if (prev.some((m) => m._id === msg._id)) return prev;
            // Clean up temporary sent message
            const filtered = prev.filter(
              (m) => !(m._id?.startsWith('temp_') && m.sender._id === msg.sender._id)
            );
            return [...filtered, msg];
          });
          setTimeout(scrollToBottom, 50);
        }
      };

      const handleNewMessageNotification = (data) => {
        if (!activeChatRef.current || activeChatRef.current.id !== data.message.sender._id) {
          toast(`New message from ${data.message.sender.fullName}`, { icon: '💬' });
        }
      };

      const handlePostCreated = (newPost) => {
        setPosts((prev) => {
          if (prev.some((p) => p._id === newPost._id)) return prev;
          return [newPost, ...prev];
        });
        setProfileStats((prev) => ({ ...prev, postsCount: prev.postsCount + 1 }));
      };

      const handlePostUpdated = (updatedPost) => {
        setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
      };

      const handlePostDeleted = ({ postId }) => {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        setProfileStats((prev) => ({ ...prev, postsCount: Math.max(0, prev.postsCount - 1) }));
      };

      const handlePostLiked = ({ postId, likes, likesCount }) => {
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                likes,
                likesCount,
                isLiked: likes.includes(user?._id)
              };
            }
            return p;
          })
        );
      };

      const handleCommentAdded = ({ postId, comment }) => {
        setComments((prev) => {
          if (prev.some((c) => c._id === comment._id)) return prev;
          return [...prev, comment];
        });
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                commentsCount: (p.commentsCount || 0) + 1
              };
            }
            return p;
          })
        );
      };

      const handleCommentEdited = ({ postId, comment }) => {
        setComments((prev) => prev.map((c) => (c._id === comment._id ? comment : c)));
      };

      const handleCommentDeleted = ({ postId, commentId }) => {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                commentsCount: Math.max(0, (p.commentsCount || 0) - 1)
              };
            }
            return p;
          })
        );
      };

      const handleFollowUpdated = ({ followerId, followingId, followersCount, followingCount }) => {
        if (followerId === user?._id?.toString()) {
          setProfileStats((prev) => ({ ...prev, followingCount }));
        }
        if (followingId === user?._id?.toString()) {
          setProfileStats((prev) => ({ ...prev, followersCount }));
        }

        setPosts((prev) =>
          prev.map((p) => {
            if (p.author?._id === followingId) {
              return { ...p, isFollowing: followerId === user?._id?.toString() };
            }
            return p;
          })
        );
      };

      const handleStoryCreated = (newStory) => {
        setStories((prev) => {
          if (prev.some((s) => s._id === newStory._id)) return prev;
          return [newStory, ...prev];
        });
      };

      const handleStoryViewed = ({ storyId, userId }) => {
        setStories((prev) =>
          prev.map((s) => {
            if (s._id === storyId) {
              if (s.views.includes(userId)) return s;
              return { ...s, views: [...s.views, userId] };
            }
            return s;
          })
        );
      };

      const handleStoryDeleted = ({ storyId }) => {
        setStories((prev) => prev.filter((s) => s._id !== storyId));
      };

      const handleProfileUpdated = ({ userId, user: updatedUser }) => {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.user?._id === userId) {
              return { ...p, user: { ...p.user, ...updatedUser } };
            }
            return p;
          })
        );
        setStories((prev) =>
          prev.map((s) => {
            if (s.user?._id === userId) {
              return { ...s, user: { ...s.user, ...updatedUser } };
            }
            return s;
          })
        );
        setActiveChat((prev) => {
          if (prev && prev._id === userId) {
            return { ...prev, ...updatedUser };
          }
          return prev;
        });
        setFriendsList((prev) =>
          prev.map((f) => (f._id === userId ? { ...f, ...updatedUser } : f))
        );
        setSuggestions((prev) => {
          if (!prev) return prev;
          const updatedClassmates = (prev.classmates || []).map((c) =>
            c._id === userId ? { ...c, ...updatedUser } : c
          );
          return { ...prev, classmates: updatedClassmates };
        });
        setSearchResults((prev) =>
          prev.map((r) => (r._id === userId ? { ...r, ...updatedUser } : r))
        );
        setOtherUserProfileData((prev) => {
          if (prev && prev.user?._id === userId) {
            return { ...prev, user: { ...prev.user, ...updatedUser } };
          }
          return prev;
        });
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('new_message_notification', handleNewMessageNotification);
      socket.on('post_created', handlePostCreated);
      socket.on('post_updated', handlePostUpdated);
      socket.on('post_deleted', handlePostDeleted);
      socket.on('post_liked', handlePostLiked);
      socket.on('comment_added', handleCommentAdded);
      socket.on('comment_edited', handleCommentEdited);
      socket.on('comment_deleted', handleCommentDeleted);
      socket.on('follow_updated', handleFollowUpdated);
      socket.on('story_created', handleStoryCreated);
      socket.on('story_viewed', handleStoryViewed);
      socket.on('story_deleted', handleStoryDeleted);
      socket.on('profile_updated', handleProfileUpdated);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('new_message_notification', handleNewMessageNotification);
        socket.off('post_created', handlePostCreated);
        socket.off('post_updated', handlePostUpdated);
        socket.off('post_deleted', handlePostDeleted);
        socket.off('post_liked', handlePostLiked);
        socket.off('comment_added', handleCommentAdded);
        socket.off('comment_edited', handleCommentEdited);
        socket.off('comment_deleted', handleCommentDeleted);
        socket.off('follow_updated', handleFollowUpdated);
        socket.off('story_created', handleStoryCreated);
        socket.off('story_viewed', handleStoryViewed);
        socket.off('story_deleted', handleStoryDeleted);
        socket.off('profile_updated', handleProfileUpdated);
      };
    }
  }, [socket]);

  // Fetch initial feed, network details, and college insights
  useEffect(() => {
    fetchFriends();
    fetchGroups();
    fetchPosts();
    fetchStories();
    fetchCalls();
    fetchSuggestions();
  }, []);

  // Sync state values from route params (routing transitions)
  useEffect(() => {
    if (location.state) {
      const {
        activeTab: tab,
        chatSubTab: subTab,
        openChatId,
        openChatName,
        openChatType,
      } = location.state;

      if (tab) setActiveTab(tab);
      if (subTab) setChatSubTab(subTab);
      if (openChatId) {
        setActiveTab('chats');
        setChatSubTab(openChatType === 'group' ? 'groups' : 'personal');
        const roomId = openChatType === 'group' ? openChatId : [user?._id, openChatId].sort().join('_');
        setActiveChat({
          type: openChatType || 'personal',
          id: openChatId,
          name: openChatName || 'Student Peer',
          avatar: null,
          roomId,
        });
      }
      // Clean location state parameters after ingestion
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, user, navigate]);

  // Handle invite links when parameters search query triggers
  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite) {
      checkInviteCode(invite);
    }
  }, [location.search]);

  // Join room when activeChat selection updates
  useEffect(() => {
    if (activeChat) {
      setChatWallpaper(localStorage.getItem(`chat_wallpaper_${activeChat.roomId}`) || null);
      if (socket) {
        socket.emit('join_room', activeChat.roomId);
        fetchMessages(activeChat.id, activeChat.type === 'group');
      }
    }
  }, [activeChat, socket]);

  // Real-time username check on completed profile state
  useEffect(() => {
    const cleaned = (completeProfileForm.username || '').trim().toLowerCase();
    if (!cleaned || cleaned.length < 4 || !/^[a-zA-Z0-9_]{4,30}$/.test(cleaned)) {
      setUsernameChecked(false);
      setIsUsernameAvailable(false);
      setUsernameSuggestions([]);
      setCheckingUsername(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { data } = await API.get(`/auth/check-username?username=${cleaned}`);
        setIsUsernameAvailable(data.available);
        setUsernameSuggestions(data.suggestions || []);
        setUsernameChecked(true);
      } catch (err) {
        console.error('Error checking username:', err);
      } finally {
        setCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [completeProfileForm.username, API]);

  // Handle avatar photo changes
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await API.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.status === 200) {
        await updateProfile(response.data);
        toast.success('Profile photo updated successfully!');
      }
    } catch {
      toast.error('Failed to upload profile photo');
    }
  };

  // Remove existing avatar image
  const handleRemoveAvatar = async () => {
    try {
      const response = await updateProfile({ avatar: '' });
      if (response.ok) {
        toast.success('Profile photo removed!');
      } else {
        toast.error('Failed to remove profile photo');
      }
    } catch {
      toast.error('Failed to remove profile photo');
    }
  };

  // Attachment handler for feed posts builder
  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));

      if (file.type.startsWith('image/')) {
        setFileType('image');
      } else if (file.type.startsWith('video/')) {
        setFileType('video');
      } else if (file.type === 'application/pdf') {
        setFileType('pdf');
      } else {
        setFileType('document');
      }
      setPostFileName(file.name);
    }
  };

  // Searching query handler
  const handleSearch = async (val) => {
    setSearchQuery(val);
    fetchPosts(feedTab, 1, false, val);
    
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await API.post('/community/friends/search', { query: val });
      setSearchResults(Array.isArray(data) ? data : [data]);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Connect Suggestions
  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { data } = await API.get('/community/discover/suggestions');
      setSuggestions(
        data || {
          suggestedStudents: [],
          suggestedGroups: [],
          trendingNotes: [],
          trendingColleges: [],
        }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Setup Complete Profile handler
  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!completeProfileForm.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!completeProfileForm.username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!isUsernameAvailable) {
      toast.error('Please choose an available username');
      return;
    }
    if (!completeProfileForm.collegeName.trim()) {
      toast.error('College / University is required');
      return;
    }
    if (!completeProfileForm.branch.trim()) {
      toast.error('Branch is required');
      return;
    }

    try {
      const res = await updateProfile(completeProfileForm);
      if (res.ok) {
        toast.success('Community profile completed! Welcome!');
      } else {
        toast.error(res.message || 'Failed to save profile details');
      }
    } catch {
      toast.error('Server error completing profile');
    }
  };

  const fetchOtherUserProfile = async (id) => {
    setLoadingProfile(true);
    try {
      const { data } = await API.get(`/community/profile/${id}`);
      setOtherUserProfileData(data);
    } catch (err) {
      toast.error('Failed to load student profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const openStudentProfile = (id) => {
    if (!id) return;
    setProfileUserId(id);
    setSubView('profile');
    fetchOtherUserProfile(id);
  };

  const fetchDbNotifications = async () => {
    try {
      const { data } = await API.get('/notifications');
      setDbNotifications(data || []);
    } catch (err) {
      console.error('[fetchDbNotifications]', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      toast.success('All notifications marked as read');
      fetchDbNotifications();
    } catch (err) {
      console.error('[handleMarkAllNotificationsRead]', err);
      toast.error('Failed to mark notifications read');
    }
  };

  // Scroll to bottom viewport helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Data Fetching: Calls, Friends, Groups, Posts, Stories, Messages
  const fetchCalls = async () => {
    try {
      const { data } = await API.get('/community/calls');
      setCallsHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFriends = async () => {
    try {
      const { data } = await API.get('/community/friends');
      setFriendsList(data.friends || []);
      setFriendRequests(data.requests || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data } = await API.get('/community/groups');
      setGroupsList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async (tabVal = feedTab, pageNum = 1, append = false, queryVal = searchQuery) => {
    try {
      if (pageNum === 1) {
        setFeedHasMore(true);
      }
      const { data } = await API.get(`/community/posts?tab=${tabVal}&page=${pageNum}&limit=10&search=${encodeURIComponent(queryVal)}`);
      if (Array.isArray(data)) {
        if (data.length < 10) {
          setFeedHasMore(false);
        }
        if (append) {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p._id));
            const newPosts = data.filter((p) => !existingIds.has(p._id));
            return [...prev, ...newPosts];
          });
        } else {
          setPosts(data);
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const loadMorePosts = async () => {
    if (fetchingMore || !feedHasMore) return;
    setFetchingMore(true);
    const nextPage = feedPage + 1;
    await fetchPosts(feedTab, nextPage, true);
    setFeedPage(nextPage);
    setFetchingMore(false);
  };

  const fetchComments = async () => {
    if (!commentPostId) return;
    try {
      const { data } = await API.get(`/community/posts/${commentPostId}/comments`);
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const { data } = await API.get('/community/posts/saved');
      setSavedPosts(data || []);
      setSavedPostIds((data || []).map(p => p._id));
    } catch (err) {
      console.error('Error fetching saved posts:', err);
    }
  };

  const fetchProfileStats = async () => {
    try {
      const { data } = await API.get('/community/profile/stats');
      setProfileStats(data);
    } catch (err) {
      console.error('Error fetching profile stats:', err);
    }
  };

  const handleToggleFollow = async (authorId, isFollowing) => {
    const previousPosts = [...posts];
    const previousStats = { ...profileStats };

    // Optimistic Update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.author?._id === authorId) {
          return { ...p, isFollowing: !isFollowing };
        }
        return p;
      })
    );

    setProfileStats(prev => ({
      ...prev,
      followingCount: isFollowing ? Math.max(0, prev.followingCount - 1) : prev.followingCount + 1
    }));

    try {
      const endpoint = isFollowing ? `/community/unfollow/${authorId}` : `/community/follow/${authorId}`;
      const { data } = await API.post(endpoint);

      setProfileStats(prev => ({
        ...prev,
        followingCount: data.followingCount !== undefined ? data.followingCount : prev.followingCount
      }));

      toast.success(isFollowing ? 'Unfollowed user' : 'Following user');
    } catch (err) {
      // Rollback
      setPosts(previousPosts);
      setProfileStats(previousStats);
      toast.error(err.response?.data?.message || 'Error toggling follow');
    }
  };

  const submitPostReport = async (e) => {
    e.preventDefault();
    if (!reportReason || !reportPostId) return;
    try {
      await API.post(`/community/posts/${reportPostId}/report`, {
        reason: reportReason,
        description: 'Reported via web client'
      });
      toast.success('Post reported. Thank you! 🛡️');
      setReportPostId(null);
    } catch {
      toast.error('Failed to report post');
    }
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    if (!editPostData || !editPostData.title || !editPostData.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      // Parse tags
      const hashs = postHashtags.split(',').map(s => s.trim()).filter(Boolean);
      const subjs = postSubjectTags.split(',').map(s => s.trim()).filter(Boolean);

      const payload = {
        title: editPostData.title.trim(),
        content: editPostData.content.trim(),
        category: editPostData.category,
        hashtags: hashs,
        subjectTags: subjs,
        location: postLocation.trim()
      };

      const { data } = await API.put(`/community/posts/${editPostData._id}`, payload);
      setPosts(prev => prev.map(p => p._id === data._id ? data : p));
      setShowEditPostModal(false);
      setEditPostData(null);
      setPostHashtags('');
      setPostSubjectTags('');
      setPostLocation('');
      toast.success('Post updated successfully!');
    } catch {
      toast.error('Failed to edit post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await API.delete(`/community/posts/${postId}`);
        setPosts(prev => prev.filter(p => p._id !== postId));
        toast.success('Post deleted successfully');
      } catch {
        toast.error('Failed to delete post');
      }
    }
  };

  useEffect(() => {
    setFeedPage(1);
    fetchPosts(feedTab, 1, false);
  }, [feedTab]);

  useEffect(() => {
    if (commentPostId) {
      fetchComments();
    } else {
      setComments([]);
    }
  }, [commentPostId]);

  useEffect(() => {
    fetchSavedPosts();
    fetchProfileStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchProfileStats();
    }
  }, [activeTab]);

  const fetchStories = async () => {
    try {
      const { data } = await API.get('/community/stories');
      setStories(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextStory = () => {
    if (!activeStoryGroup) return;
    setStoryProgress(0);
    if (activeStoryIndex < activeStoryGroup.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      trackStoryView(activeStoryGroup[activeStoryIndex + 1]._id);
    } else {
      setActiveStoryGroup(null);
    }
  };

  const handlePrevStory = () => {
    if (!activeStoryGroup) return;
    setStoryProgress(0);
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      trackStoryView(activeStoryGroup[activeStoryIndex - 1]._id);
    }
  };

  useEffect(() => {
    if (!activeStoryGroup) {
      setStoryProgress(0);
      return;
    }

    if (isStoryPaused) return;

    const intervalTime = 50; 
    const totalDuration = 5000; 
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStoryGroup, activeStoryIndex, isStoryPaused]);

  const createNewStory = async (e) => {
    e.preventDefault();
    if (!storyForm.status.trim()) {
      toast.error('Story text or caption is required');
      return;
    }

    try {
      const { data } = await API.post('/community/stories', storyForm);
      setStories((prev) => [data, ...prev]);
      setShowCreateStoryModal(false);
      setStoryForm({
        type: 'text',
        category: 'study_progress',
        status: '',
        media: '',
        visibility: 'public',
        mentions: []
      });
      toast.success('Story posted successfully!');
    } catch (err) {
      console.error('[createNewStory]', err);
      toast.error('Failed to publish story');
    }
  };

  const playStoryGroup = (group) => {
    if (!group || group.stories.length === 0) return;
    setActiveStoryGroup(group.stories);
    setActiveStoryGroupUser(group.user);
    setActiveStoryIndex(0);
    setStoryReplyText('');
    trackStoryView(group.stories[0]._id);
  };

  const trackStoryView = async (storyId) => {
    try {
      await API.post(`/community/stories/${storyId}/view`);
      setStories((prev) =>
        prev.map((s) => {
          if (s._id === storyId) {
            if (s.views.includes(user._id)) return s;
            return { ...s, views: [...s.views, user._id] };
          }
          return s;
        })
      );
      
      setActiveStoryGroup((prev) => {
        if (!prev) return prev;
        return prev.map((s) => {
          if (s._id === storyId) {
            if (s.views.includes(user._id)) return s;
            return { ...s, views: [...s.views, user._id] };
          }
          return s;
        });
      });
    } catch (err) {
      console.error('[trackStoryView]', err);
    }
  };

  const deleteMyStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      await API.delete(`/community/stories/${storyId}`);
      setStories((prev) => prev.filter((s) => s._id !== storyId));
      
      if (activeStoryGroup) {
        const nextGroup = activeStoryGroup.filter((s) => s._id !== storyId);
        if (nextGroup.length === 0) {
          setActiveStoryGroup(null);
        } else {
          setActiveStoryGroup(nextGroup);
          setActiveStoryIndex((prev) => Math.min(prev, nextGroup.length - 1));
        }
      }
      toast.success('Story deleted successfully');
    } catch (err) {
      console.error('[deleteMyStory]', err);
      toast.error('Failed to delete story');
    }
  };

  const fetchStoryViewers = async (storyId) => {
    try {
      const { data } = await API.get(`/community/stories/${storyId}/viewers`);
      setStoryViewersList(data || []);
      setShowViewersModal(true);
    } catch (err) {
      console.error('[fetchStoryViewers]', err);
      toast.error('Failed to load story viewers');
    }
  };

  const replyToStory = async (e) => {
    e.preventDefault();
    if (!storyReplyText.trim() || !activeStoryGroup) return;

    const currentStory = activeStoryGroup[activeStoryIndex];
    const recipientId = currentStory.user._id;
    const captionText = currentStory.status || 'story';
    const messageContent = `💬 *Replied to your story ("${captionText.slice(0, 30)}...")*:\n${storyReplyText}`;

    try {
      await API.post(`/community/chat/${recipientId}`, {
        content: messageContent
      });
      setStoryReplyText('');
      toast.success('Story reply sent successfully!');
    } catch (err) {
      console.error('[replyToStory]', err);
      toast.error('Failed to send story reply');
    }
  };

  const fetchMessages = async (peerId, isGroup) => {
    try {
      const { data } = await API.get(`/community/chat/${peerId}?isGroup=${isGroup}`);
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    }
  };

  // Add friend connection
  const sendFriendRequest = async (targetId) => {
    try {
      await API.post('/community/friends/request', { targetUserId: targetId });
      toast.success('Friend request sent!');
      setSelectedUserForConnect(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error sending request');
    }
  };

  // Fetch dynamic categories and discover groups
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await API.get('/community/group-categories');
        setDbCategories(data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (subView === 'discover-groups') {
      fetchDiscoverGroups();
    }
  }, [selectedCategory, groupSearchQuery, subView]);

  const fetchDiscoverGroups = async () => {
    try {
      const catVal = selectedCategory || 'all';
      const searchVal = groupSearchQuery || '';
      const { data } = await API.get(`/community/groups/discover?category=${catVal}&search=${encodeURIComponent(searchVal)}`);
      setDiscoveredGroupsList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinGroupFromDiscover = async (inviteCode) => {
    try {
      await API.post(`/community/groups/join/${inviteCode}`);
      toast.success('Joined group successfully!');
      fetchDiscoverGroups();
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    }
  };

  // Message Send Handler
  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && !chatAttachment && !replyMessage) return;

    const contentText = messageText;
    const attachmentVal = chatAttachment;
    const replyVal = replyMessage;

    setMessageText('');
    setChatAttachment(null);
    setReplyMessage(null);

    if (!socket) {
      toast.error('Connection lost. Reconnecting...');
      return;
    }

    const tempMsg = {
      _id: `temp_${Date.now()}`,
      sender: {
        _id: user._id,
        fullName: user.fullName,
        avatar: user.avatar,
      },
      recipient: activeChat.id,
      isGroup: activeChat.type === 'group',
      content: contentText,
      fileUrl: attachmentVal ? attachmentVal.url : null,
      fileType: attachmentVal ? attachmentVal.type : null,
      fileName: attachmentVal ? attachmentVal.name : null,
      replyTo: replyVal ? replyVal : null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    socket.emit(
      'send_message',
      {
        roomId: activeChat.roomId,
        recipient: activeChat.id,
        isGroup: activeChat.type === 'group',
        content: contentText,
        fileUrl: attachmentVal ? attachmentVal.url : null,
        fileType: attachmentVal ? attachmentVal.type : null,
        fileName: attachmentVal ? attachmentVal.name : null,
        replyTo: replyVal ? replyVal._id : null
      },
      (res) => {
        if (res && res.success) {
          setMessages((prev) => prev.map((m) => (m._id === tempMsg._id ? res.message : m)));
        } else {
          toast.error('Message delivery failed');
        }
      }
    );
  };

  // Select current active chat
  const handleSelectChat = (item, type) => {
    const roomId = type === 'group' ? item._id : [user._id, item._id].sort().join('_');
    setActiveChat({
      type,
      id: item._id,
      name: item.name || item.fullName,
      avatar: item.avatar,
      roomId,
      admin: item.admin,
      inviteCode: item.inviteCode,
    });
  };

  // Open Group Info and load details
  const openGroupInfo = async () => {
    if (!activeChat || activeChat.type !== 'group') return;
    try {
      const { data: members } = await API.get(`/community/groups/${activeChat.id}/members`);
      setGroupMembersList(members);
      
      const me = members.find(m => m.user && m.user._id === user._id);
      if (me) {
        setMyGroupRole(me.role);
        setGroupMuted(me.isMuted);
        setGroupPinned(me.isPinned);
      }

      setEditGroupName(activeChat.name || '');
      setEditGroupDesc(activeChat.description || '');
      setEditGroupAvatar(activeChat.avatar || '');
      setEditGroupCategory(activeChat.category || 'Study');
      setEditGroupCollege(activeChat.college || '');
      setEditGroupBranch(activeChat.branch || '');
      setEditGroupYear(activeChat.year || '');
      setEditGroupPrivacy(activeChat.privacy || 'public');

      setAddMembersSelected([]);
      setGroupMessageSearchQuery('');
      setGroupMessageSearchResults([]);
      setIsSearchingGroupMessages(false);

      setShowGroupInfoModal(true);
    } catch (err) {
      toast.error('Failed to load group details');
    }
  };

  // Create Group submission handler
  const handleCreateGroup = async (e) => {
    if (e) e.preventDefault();
    if (!groupName.trim()) return toast.error('Group name is required');
    if (!groupCategory) return toast.error('Category selection is mandatory');
    try {
      const payload = {
        name: groupName,
        description: groupDesc,
        avatar: groupAvatar,
        categoryId: groupCategory, // passes categoryId
        college: groupCollege,
        branch: groupBranch,
        year: groupYear,
        privacy: groupPrivacy,
        memberIds: selectedMembers
      };
      await API.post('/community/groups', payload);
      toast.success('Group created successfully!');
      setShowCreateGroupModal(false);
      
      // Reset fields
      setGroupName('');
      setGroupDesc('');
      setGroupAvatar('');
      setGroupCategory('Study');
      setGroupCollege('');
      setGroupBranch('');
      setGroupYear('');
      setGroupPrivacy('public');
      setSelectedMembers([]);
      
      fetchGroups();
    } catch (err) {
      toast.error('Failed to create group');
    }
  };

  // Edit Group details submission handler
  const handleSaveGroupEdit = async (e) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        name: editGroupName,
        description: editGroupDesc,
        avatar: editGroupAvatar,
        category: editGroupCategory,
        college: editGroupCollege,
        branch: editGroupBranch,
        year: editGroupYear,
        privacy: editGroupPrivacy
      };
      const { data } = await API.put(`/community/groups/${activeChat.id}`, payload);
      toast.success('Group details updated!');
      
      // Update local state
      setActiveChat(prev => ({
        ...prev,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        category: data.category,
        college: data.college,
        branch: data.branch,
        year: data.year,
        privacy: data.privacy
      }));
      
      fetchGroups();
    } catch {
      toast.error('Failed to edit group');
    }
  };

  // Transfer Ownership handler
  const handleTransferOwnership = async (targetUserId) => {
    try {
      await API.post(`/community/groups/${activeChat.id}/transfer-ownership`, { targetUserId });
      toast.success('Ownership transferred successfully!');
      openGroupInfo();
    } catch {
      toast.error('Failed to transfer ownership');
    }
  };

  // Add members submission handler
  const handleAddMembersSubmit = async () => {
    if (!addMembersSelected.length) return toast.error('Select at least one member');
    try {
      await API.post(`/community/groups/${activeChat.id}/members`, { userIds: addMembersSelected });
      toast.success('Members added successfully!');
      setAddMembersSelected([]);
      openGroupInfo();
    } catch {
      toast.error('Failed to add members');
    }
  };

  // Remove member handler
  const handleRemoveMemberSubmit = async (targetUserId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await API.delete(`/community/groups/${activeChat.id}/members/${targetUserId}`);
        toast.success('Member removed!');
        openGroupInfo();
      } catch {
        toast.error('Failed to remove member');
      }
    }
  };

  // Mute Group handler
  const handleToggleMute = async () => {
    try {
      const { data } = await API.post(`/community/groups/${activeChat.id}/mute`);
      setGroupMuted(data.isMuted);
      toast.success(data.message);
    } catch {
      toast.error('Failed to toggle mute');
    }
  };

  // Pin Group handler
  const handleTogglePin = async () => {
    try {
      const { data } = await API.post(`/community/groups/${activeChat.id}/pin`);
      setGroupPinned(data.isPinned);
      toast.success(data.message);
    } catch {
      toast.error('Failed to toggle pin');
    }
  };

  // Search Messages inside group
  const handleSearchGroupMessages = async (val) => {
    setGroupMessageSearchQuery(val);
    if (!val.trim()) {
      setGroupMessageSearchResults([]);
      setIsSearchingGroupMessages(false);
      return;
    }
    setIsSearchingGroupMessages(true);
    try {
      const { data } = await API.get(`/community/groups/${activeChat.id}/messages/search?q=${encodeURIComponent(val)}`);
      setGroupMessageSearchResults(data);
    } catch {
      toast.error('Failed to search messages');
    }
  };

  // Block Peer user
  const blockUser = async () => {
    if (window.confirm(`Are you sure you want to block ${activeChat.name}?`)) {
      try {
        await API.post(`/community/block/${activeChat.id}`);
        toast.success('User blocked');
        setActiveChat(null);
        fetchFriends();
      } catch {
        toast.error('Error blocking user');
      }
    }
  };

  // Leave Group channel
  const leaveGroup = async () => {
    const isOwner = myGroupRole === 'owner' || activeChat.admin === user._id;
    
    if (isOwner) {
      if (window.confirm(`Are you sure you want to delete the group "${activeChat.name}"? This action is permanent.`)) {
        try {
          await API.delete(`/community/groups/${activeChat.id}`);
          toast.success('Group deleted successfully');
          setActiveChat(null);
          fetchGroups();
        } catch {
          toast.error('Failed to delete group');
        }
      }
    } else {
      if (window.confirm(`Are you sure you want to leave the group "${activeChat.name}"?`)) {
        try {
          await API.delete(`/community/groups/${activeChat.id}/leave`);
          toast.success('Left group successfully');
          setActiveChat(null);
          fetchGroups();
        } catch {
          toast.error('Failed to leave group');
        }
      }
    }
  };

  const likePost = async (postId) => {
    const previousPosts = [...posts];
    let isLikedNow = false;

    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          isLikedNow = !p.isLiked;
          let updatedLikes = p.likes || [];
          if (isLikedNow) {
            if (!updatedLikes.includes(user._id)) {
              updatedLikes = [...updatedLikes, user._id];
            }
          } else {
            updatedLikes = updatedLikes.filter((id) => id.toString() !== user._id.toString());
          }
          return {
            ...p,
            likes: updatedLikes,
            isLiked: isLikedNow
          };
        }
        return p;
      })
    );

    try {
      await API.post(`/community/posts/${postId}/like`);
    } catch (err) {
      setPosts(previousPosts);
      toast.error('Failed to like post');
    }
  };

  const toggleBookmark = async (postId) => {
    const previousSavedIds = [...savedPostIds];
    const previousSavedPosts = [...savedPosts];
    const previousStats = { ...profileStats };

    const isSavedNow = !savedPostIds.includes(postId);

    if (isSavedNow) {
      setSavedPostIds((prev) => [...prev, postId]);
      setProfileStats(prev => ({ ...prev, savedPostsCount: prev.savedPostsCount + 1 }));
      toast.success('Post saved successfully! 📚');
    } else {
      setSavedPostIds((prev) => prev.filter((id) => id !== postId));
      setProfileStats(prev => ({ ...prev, savedPostsCount: Math.max(0, prev.savedPostsCount - 1) }));
      toast.success('Post removed from saved collection');
    }

    try {
      await API.post(`/community/posts/${postId}/save`);
      fetchSavedPosts();
    } catch (err) {
      setSavedPostIds(previousSavedIds);
      setSavedPosts(previousSavedPosts);
      setProfileStats(previousStats);
      toast.error('Failed to save post');
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !commentPostId) return;

    try {
      const payload = {
        content: commentText.trim()
      };
      if (replyToCommentId) {
        payload.parentCommentId = replyToCommentId;
      }

      await API.post(`/community/posts/${commentPostId}/comments`, payload);
      setCommentText('');
      setReplyToCommentId(null);
      setReplyToCommentAuthor('');
      fetchComments();
      
      // Update comment count on post locally
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === commentPostId) {
            return {
              ...p,
              commentsList: [...(p.commentsList || []), { author: user, content: commentText.trim(), createdAt: new Date() }]
            };
          }
          return p;
        })
      );
      
      toast.success('Comment published!');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const publishPost = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      toast.error('Please enter title and content details.');
      return;
    }

    let uploadedFileUrl = null;
    let uploadedFileName = null;
    let uploadedFileSize = null;
    let uploadedImages = [];

    // 1. Upload single file if selected (e.g. PDF)
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const toastId = toast.loading('Uploading attachment to secure cloud...');
      try {
        const { data } = await API.post('/community/posts/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedFileUrl = data.url;
        uploadedFileName = data.name;
        uploadedFileSize = data.size;
        toast.success('Attachment uploaded!', { id: toastId });
      } catch (err) {
        toast.error('Attachment upload failed. Publishing text-only.', { id: toastId });
      }
    }

    // 2. Upload multiple images if selected
    if (selectedFiles.length > 0) {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      const toastId = toast.loading('Uploading images to cloud storage...');
      try {
        const { data } = await API.post('/community/posts/upload-multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImages = data.urls || [];
        toast.success('Images uploaded successfully!', { id: toastId });
      } catch (err) {
        toast.error('Images upload failed.', { id: toastId });
      }
    }

    try {
      const hashs = postHashtags.split(',').map((h) => h.trim()).filter(Boolean);
      const subjs = postSubjectTags.split(',').map((s) => s.trim()).filter(Boolean);

      const postPayload = {
        title: postTitle.trim(),
        content: postContent.trim(),
        category: postCategory,
        location: postLocation.trim(),
        hashtags: hashs,
        subjectTags: subjs,
        images: uploadedImages,
        pdfUrl: fileType === 'pdf' ? uploadedFileUrl : null,
        pdfName: fileType === 'pdf' ? uploadedFileName : null,
        pdfSize: fileType === 'pdf' ? uploadedFileSize : null,
        link: postLink || null,
        allowLikes,
        allowComments,
        allowShares,
        visibility: postVisibility,
        hideLikeCount,
        hideCommentsCount
      };

      const { data } = await API.post('/community/posts', postPayload);
      setPosts((prev) => [data, ...prev]);
      toast.success('Successfully posted to community!');

      // Reset Create Post Form state
      setPostTitle('');
      setPostContent('');
      setPostLink('');
      setPostFileName('');
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setFileType(null);
      setPostHashtags('');
      setPostSubjectTags('');
      setPostLocation('');
      setSelectedFiles([]);
      setFilePreviews([]);
      setShowCreatePostModal(false);
      setActiveTab('home');
    } catch {
      toast.error('Failed to publish post');
    }
  };

  const saveProfileChanges = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile(profileForm);
      if (res.ok) {
        toast.success('Profile updated successfully!');
        setShowEditProfileModal(false);
      } else {
        toast.error(res.message || 'Failed to update profile.');
      }
    } catch {
      toast.error('Server error updating profile.');
    }
  };

  const copyPostDeepLink = (postId) => {
    navigator.clipboard.writeText(`studentos://post/${postId}`);
    toast.success('Post deep link copied to clipboard!');
  };

  const checkInviteCode = async (code) => {
    setLoadingInvite(true);
    try {
      const { data } = await API.get(`/community/groups/preview/${code}`);
      setInviteGroupData({ ...data, code });
    } catch {
      toast.error('Invalid group invite link');
      setInviteGroupData(null);
      navigate('/community', { replace: true });
    } finally {
      setLoadingInvite(false);
    }
  };

  // Map network variables for rendering list items
  const mappedFriends = friendsList.map((f) => ({
    _id: f._id,
    name: f.fullName,
    username: f.username,
    avatar: f.avatar,
    lastMessage: 'Tap to open voice & secure chat',
    time: 'Online',
    unread: 0,
    isVerified: true,
    isOnline: f.isOnline || true,
    type: 'user',
    originalData: f,
  }));

  const mappedGroups = groupsList.map((g) => ({
    _id: g._id,
    name: g.name,
    avatar: null,
    lastMessage: `${g.memberCount || 1} members`,
    time: 'Group',
    unread: 0,
    isVerified: false,
    isOnline: false,
    type: 'group',
    originalData: g,
  }));

  return (
    <div className="h-full w-full bg-[#06030c] text-text-primary flex flex-col overflow-hidden font-sans select-none relative">
      {/* Dynamic Gradients */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
        }}
      />

      {user?.username ? (
        <>
          {/* Main Top Bar */}
          <div className="flex flex-col bg-[#0b0714] border-b border-purple-500/10 shrink-0 sticky top-0 z-40">
            <div className="h-16 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <UsersRound size={18} className="text-purple-400" />
                <h1 className="text-base font-extrabold text-white tracking-tight">Community</h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSubView('search')}
                  className={`p-2 rounded-full transition-all cursor-pointer ${subView === 'search' ? 'bg-purple-600/20 text-purple-400' : 'text-text-secondary hover:text-white bg-white/5'}`}
                  title="Search"
                >
                  <Search size={16} />
                </button>
                <button
                  onClick={() => setSubView('chats')}
                  className={`p-2 rounded-full transition-all relative cursor-pointer ${subView === 'chats' ? 'bg-purple-600/20 text-purple-400' : 'text-text-secondary hover:text-white bg-white/5'}`}
                  title="Messages"
                >
                  <MessageCircle size={16} />
                </button>
                <button
                  onClick={() => {
                    setSubView('notifications');
                    fetchDbNotifications();
                  }}
                  className={`p-2 rounded-full transition-all relative cursor-pointer ${subView === 'notifications' ? 'bg-purple-600/20 text-purple-400' : 'text-text-secondary hover:text-white bg-white/5'}`}
                  title="Notifications"
                >
                  <Bell size={16} />
                </button>
              </div>
            </div>

            {/* Category tabs */}
            {subView === 'home' && (
              <div className="flex px-4 pb-3 gap-2 overflow-x-auto scrollbar-none">
                {[
                  { id: 'following', label: 'Following' },
                  { id: 'for_you', label: 'For You' },
                  { id: 'trending', label: 'Trending' },
                  { id: 'latest', label: 'Latest' },
                  { id: 'my_posts', label: 'My Posts' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFeedTab(item.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      feedTab === item.id
                        ? 'bg-purple-600/30 text-purple-200 border-purple-500/35'
                        : 'bg-white/5 text-text-secondary border-transparent hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sub Viewports */}
          <div
            onScroll={(e) => {
              if (subView !== 'home') return;
              const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
              if (scrollHeight - scrollTop <= clientHeight + 50) {
                loadMorePosts();
              }
            }}
            className={`flex-1 min-h-0 relative ${subView === 'chats' ? 'overflow-hidden' : 'overflow-y-auto'}`}
          >
            {subView === 'home' && (
              <div className="max-w-xl mx-auto px-4 py-5 space-y-6">
                {/* Stories Section */}
                <div className="bg-[#0c0816]/40 border border-purple-500/10 rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-white">Stories</p>
                    <span className="text-[8px] text-purple-400 font-bold uppercase tracking-wider">Tap to view</span>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none items-center">
                    {(() => {
                      const userGroupsMap = {};
                      stories.forEach((story) => {
                        if (!story.user) return;
                        const userId = story.user._id;
                        if (!userGroupsMap[userId]) {
                          userGroupsMap[userId] = {
                            user: story.user,
                            stories: []
                          };
                        }
                        userGroupsMap[userId].stories.push(story);
                      });
                      const groupsList = Object.values(userGroupsMap);
                      const myGroup = groupsList.find((g) => g.user._id === user._id);
                      const otherGroups = groupsList.filter((g) => g.user._id !== user._id);

                      return (
                        <>
                          {/* Upload Story shortcut */}
                          <div className="flex flex-col items-center flex-shrink-0 relative">
                            <button
                              onClick={() => {
                                if (myGroup) {
                                  playStoryGroup(myGroup);
                                } else {
                                  setShowCreateStoryModal(true);
                                }
                              }}
                              className="w-14 h-14 rounded-full p-[2.5px] flex items-center justify-center cursor-pointer hover:scale-105 transition-all duration-200"
                              style={{
                                background: myGroup
                                  ? myGroup.stories.some((s) => !s.views.includes(user._id))
                                    ? 'linear-gradient(to top right, #a855f7, #6366f1, #ec4899)'
                                    : 'linear-gradient(to top right, rgba(255,255,255,0.15), rgba(255,255,255,0.3))'
                                  : 'linear-gradient(to top right, #a855f7, #6366f1)'
                              }}
                            >
                              <div className="w-full h-full rounded-full bg-[#0b0714] p-0.5 flex items-center justify-center relative">
                                {user.avatar ? (
                                  <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="avatar" />
                                ) : (
                                  <span className="text-sm font-black text-white">{user?.fullName?.charAt(0) || 'S'}</span>
                                )}
                                {!myGroup && (
                                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-purple-600 rounded-full border-2 border-[#0b0714] flex items-center justify-center text-white text-[10px] font-black">+</div>
                                )}
                              </div>
                            </button>
                            <span className="text-[10px] text-text-secondary font-medium mt-1.5">Your Story</span>
                            
                            {myGroup && (
                              <button
                                onClick={() => setShowCreateStoryModal(true)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full border border-[#0b0714] flex items-center justify-center text-white text-xs font-black shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                                title="Add Story"
                              >
                                +
                              </button>
                            )}
                          </div>

                          {/* Followed Users' stories */}
                          {otherGroups.map((group) => {
                            const hasUnseen = group.stories.some((s) => !s.views.includes(user._id));
                            return (
                              <div
                                key={group.user._id}
                                onClick={() => playStoryGroup(group)}
                                className="flex flex-col items-center flex-shrink-0 cursor-pointer animate-fade-in"
                              >
                                <div
                                  className="w-14 h-14 rounded-full p-[2.5px] flex items-center justify-center hover:scale-105 transition-all duration-200"
                                  style={{
                                    background: hasUnseen
                                      ? 'linear-gradient(to top right, #ec4899, #a855f7, #6366f1)'
                                      : 'linear-gradient(to top right, rgba(255,255,255,0.15), rgba(255,255,255,0.3))'
                                  }}
                                >
                                  <div className="w-full h-full rounded-full bg-[#0b0714] p-0.5">
                                    <div className="w-full h-full rounded-full bg-purple-600/30 flex items-center justify-center text-white text-xs font-black uppercase overflow-hidden">
                                      {group.user?.avatar ? (
                                        <img src={group.user.avatar} className="w-full h-full object-cover" alt="story avatar" />
                                      ) : (
                                        group.user?.fullName?.charAt(0) || 'S'
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10px] text-text-primary font-medium mt-1.5 truncate max-w-[65px]">
                                  {group.user?.fullName?.split(' ')[0]}
                                </span>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Mind status box */}
                <div className="glass-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-xs overflow-hidden shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
                      ) : (
                        user.fullName?.charAt(0) || 'S'
                      )}
                    </div>
                    <button
                      onClick={() => setShowCreatePostModal(true)}
                      className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-left text-text-secondary hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                    >
                      What's on your mind, {user.fullName?.split(' ')[0]}?
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    {[
                      { label: 'Photo', icon: Image, type: 'image', color: 'text-pink-400' },
                      { label: 'Video', icon: Video, type: 'video', color: 'text-blue-400' },
                      { label: 'PDF', icon: FileText, type: 'pdf', color: 'text-red-400' },
                      { label: 'Notes', icon: FileIcon, type: 'notes', color: 'text-emerald-400' },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPostCategory(item.type === 'notes' || item.type === 'pdf' ? 'notes' : item.type === 'video' ? 'project' : 'text');
                          setFileType(item.type);
                          setShowCreatePostModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-[10px] font-black transition-all cursor-pointer"
                      >
                        <item.icon size={13} className={item.color} />
                        <span className="text-text-secondary">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feed Posts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Student Feed</p>
                    <span className="text-[8px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-500/10">
                      Real-time Activity
                    </span>
                  </div>

                  {posts.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title="No posts yet"
                      subtitle="Be the first student to share notes, achievements, or project links."
                      color="text-purple-400"
                    />
                  ) : (
                    posts.map((post) => {
                      const isBookmarked = savedPostIds.includes(post._id);
                      const isLiked = post.likes && post.likes.includes(user._id);
                      const dateStr = new Date(post.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div key={post._id} className="glass-card p-4 hover:border-purple-500/25 transition-all duration-200 relative overflow-hidden">
                          <div className="absolute -right-8 -top-8 h-16 w-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between mb-3">
                            <div
                              onClick={() => openStudentProfile(post.author?._id)}
                              className="flex items-center gap-2.5 cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-[10px] shadow-sm overflow-hidden">
                                {post.author?.avatar ? (
                                  <img src={post.author.avatar} className="w-full h-full object-cover" alt="author avatar" />
                                ) : (
                                  post.author?.fullName?.charAt(0) || 'S'
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-white flex items-center gap-1">
                                  {post.author?.fullName || 'Student'}
                                  {post.author?.isVerified && (
                                    <CircleCheck size={11} className="text-blue-400 fill-blue-400/10" />
                                  )}
                                </h4>
                                <p className="text-[8px] text-purple-400 font-bold uppercase flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span>@{post.author?.username || 'student'}</span>
                                  {(() => {
                                    const opps = post.author?.openToOpportunities || {};
                                    const badges = [
                                      { key: 'internships', label: 'Internship' },
                                      { key: 'teamMembers', label: 'Team' },
                                      { key: 'hackathons', label: 'Hackathons' },
                                      { key: 'freelance', label: 'Freelance' },
                                      { key: 'mentoring', label: 'Mentor' },
                                      { key: 'projectCollaborators', label: 'Collab' },
                                      { key: 'studyPartners', label: 'Study' },
                                      { key: 'placementGroups', label: 'Placement' }
                                    ].filter(b => opps[b.key]).map(b => b.label);
                                    
                                    const customs = opps.custom || [];
                                    const all = [...badges, ...customs];
                                    
                                    if (all.length === 0) return null;
                                    return (
                                      <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-[6px] font-black uppercase tracking-wider leading-none">
                                        🟢 {all[0]}
                                      </span>
                                    );
                                  })()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-[8px] text-text-secondary font-bold">{dateStr}</span>
                              {post.author?._id === user?._id ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditPostData(post);
                                      setPostHashtags((post.hashtags || []).join(', '));
                                      setPostSubjectTags((post.subjectTags || []).join(', '));
                                      setPostLocation(post.location || '');
                                      setShowEditPostModal(true);
                                    }}
                                    className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border border-white/10"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post._id)}
                                    className="px-2 py-0.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border border-red-500/10"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleToggleFollow(post.author?._id, post.isFollowing)}
                                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                    post.isFollowing 
                                      ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                                      : 'bg-purple-600 border-purple-500 hover:bg-purple-500 text-white'
                                  }`}
                                >
                                  {post.isFollowing ? 'Following' : 'Follow'}
                                </button>
                              )}
                          </div>
                          </div>

                          <span className="inline-flex rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[8px] font-black text-purple-300 uppercase tracking-wider mb-2.5">
                            {post.tag || 'Social Update'}
                          </span>

                          <h3 className="text-xs font-black text-white mb-1.5 leading-snug">{post.title}</h3>
                          <p className="text-xs text-text-secondary leading-relaxed mb-3">{post.content}</p>

                          {/* Location */}
                          {post.location && (
                            <div className="flex items-center gap-1 text-[9px] text-text-secondary mb-2 bg-white/5 border border-white/5 rounded px-2 py-0.5 w-max">
                              <MapPin size={10} className="text-purple-400" /> 
                              <span>{post.location}</span>
                            </div>
                          )}

                          {/* Hashtags and Subject Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-3.5">
                            {post.hashtags && post.hashtags.map((h, i) => (
                              <span key={i} className="text-[9px] text-purple-400 font-bold">#{h}</span>
                            ))}
                            {post.subjectTags && post.subjectTags.map((s, i) => (
                              <span key={i} className="text-[9px] text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">{s}</span>
                            ))}
                          </div>

                          {/* Multiple Images Grid */}
                          {post.images && post.images.length > 0 && (
                            <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              {post.images.map((img, i) => (
                                <img key={i} src={img} alt="Media Attachment" className="w-full max-h-48 object-cover rounded-xl border border-white/5 bg-dark-bg" />
                              ))}
                            </div>
                          )}

                          {post.type === 'video' && post.fileUrl && (
                            <div className="mb-4">
                              <video src={post.fileUrl} controls className="w-full max-h-64 object-cover rounded-xl border border-white/5 bg-black" />
                            </div>
                          )}

                          {post.type === 'image' && post.fileUrl && (
                            <div className="mb-4">
                              <img src={post.fileUrl} alt="Post Media" className="w-full max-h-64 object-cover rounded-xl border border-white/5" />
                            </div>
                          )}

                          {(post.type === 'notes' || post.type === 'pdf' || post.pdfUrl) && (post.fileName || post.pdfName) && (
                            <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between mb-4 hover:bg-white/10 hover:border-purple-500/20 transition-all">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 shrink-0">
                                  <FileText size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-extrabold text-white truncate leading-tight">{post.pdfName || post.fileName}</p>
                                  <p className="text-[9px] text-text-secondary mt-0.5">{post.pdfSize || post.fileSize || 'PDF Link'} • Study Material</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setPreviewPdfUrl(post.pdfUrl || post.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
                                    setPreviewPdfName(post.pdfName || post.fileName);
                                  }}
                                  className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[8px] font-black uppercase tracking-wider transition-all"
                                >
                                  Preview
                                </button>
                                <a
                                  href={post.pdfUrl || post.fileUrl || '#'}
                                  download={post.pdfName || post.fileName}
                                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-all shrink-0"
                                >
                                  <Download size={13} />
                                </a>
                              </div>
                            </div>
                          )}

                          {post.type === 'project' && post.link && (
                            <a
                              href={post.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between mb-4 hover:bg-white/10 hover:border-purple-500/20 transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
                                  <FileCode size={16} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-extrabold text-white truncate leading-tight">View Project Repository</p>
                                  <p className="text-[9px] text-text-secondary mt-0.5 truncate">{post.link}</p>
                                </div>
                              </div>
                              <ExternalLink size={14} className="text-text-secondary shrink-0" />
                            </a>
                          )}

                          {/* Footer Action buttons */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <div className="flex items-center gap-4">
                              {post.allowLikes !== false && (
                                <button
                                  onClick={() => likePost(post._id)}
                                  className={`flex items-center gap-1 text-xs font-bold transition-all ${isLiked ? 'text-pink-500' : 'text-text-secondary hover:text-white'}`}
                                >
                                  <Heart size={14} className={isLiked ? 'fill-pink-500' : ''} />
                                  <span>{post.hideLikeCount ? '•' : post.likes ? post.likes.length : 0}</span>
                                </button>
                              )}

                              {post.allowComments !== false && (
                                <button
                                  onClick={() => setCommentPostId(post._id)}
                                  className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-white transition-all"
                                >
                                  <MessageSquare size={14} />
                                  <span>{post.hideCommentsCount ? '•' : post.commentsList ? post.commentsList.length : 0}</span>
                                </button>
                              )}

                               {post.allowShares !== false && (
                                <button
                                  onClick={() => copyPostDeepLink(post._id)}
                                  className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-white transition-all"
                                >
                                  <Share2 size={14} />
                                </button>
                              )}

                              {post.author?._id !== user?._id && (
                                <button
                                  onClick={() => {
                                    setReportPostId(post._id);
                                    setReportReason('Spam');
                                  }}
                                  className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-red-400 transition-all cursor-pointer"
                                  title="Report Post"
                                >
                                  <Shield size={14} />
                                </button>
                              )}
                            </div>

                            <button
                              onClick={() => toggleBookmark(post._id)}
                              className={`transition-all ${isBookmarked ? 'text-purple-400' : 'text-text-secondary hover:text-white'}`}
                            >
                              <Bookmark size={14} className={isBookmarked ? 'fill-purple-400' : ''} />
                            </button>
                          </div>

                          {/* Comments Preview */}
                          {post.commentsList && post.commentsList.length > 0 && post.allowComments !== false && (
                            <div className="mt-3.5 pt-3 border-t border-white/5 space-y-2.5">
                              {post.commentsList.slice(0, 2).map((comment, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-extrabold text-white mr-1.5">
                                    {comment.author?.fullName || comment.author?.username || 'Student'}:
                                  </span>
                                  <span className="text-text-secondary leading-normal">{comment.content}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {subView === 'search' && (
              <div className="max-w-xl mx-auto px-4 py-5 space-y-6">
                {/* Search query box */}
                <div className="glass-card p-3 flex items-center gap-2">
                  <Search size={16} className="text-text-secondary shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search students, posts, projects, notes, colleges, hashtags..."
                    className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-text-secondary"
                  />
                  {searching && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
                </div>

                {searchQuery.trim() !== '' && (
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Search Results</p>
                    {searchResults.length === 0 ? (
                      <div className="p-6 text-center bg-white/5 border border-white/5 rounded-2xl text-[10px] text-text-secondary">
                        No matches found for "{searchQuery}"
                      </div>
                    ) : (
                      searchResults.map((item) => (
                        <div key={item._id} className="p-3 bg-[#0d0a1b]/80 border border-purple-500/10 rounded-2xl flex items-center justify-between hover:border-purple-500/25 transition-all">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              onClick={() => openStudentProfile(item.author?._id || item._id)}
                              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xs overflow-hidden shrink-0 cursor-pointer"
                            >
                              {item.author?.avatar || item.avatar ? (
                                <img src={item.author?.avatar || item.avatar} className="w-full h-full object-cover" alt="avatar" />
                              ) : (
                                (item.author?.fullName || item.fullName || 'S').charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                @{item.author?.username || item.username || 'student'}
                              </p>
                              <p className="text-[9px] text-text-secondary truncate mt-0.5">
                                {item.author?.fullName || item.fullName || item.title || 'Student Update'}
                              </p>
                              {(() => {
                                const opps = (item.author || item).openToOpportunities || {};
                                const badges = [
                                  { key: 'internships', label: 'Internships' },
                                  { key: 'teamMembers', label: 'Team' },
                                  { key: 'hackathons', label: 'Hackathons' },
                                  { key: 'freelance', label: 'Freelance' },
                                  { key: 'mentoring', label: 'Mentor' },
                                  { key: 'projectCollaborators', label: 'Collab' },
                                  { key: 'studyPartners', label: 'Study' },
                                  { key: 'placementGroups', label: 'Placement' }
                                ].filter(b => opps[b.key]).map(b => b.label);
                                
                                const customs = opps.custom || [];
                                const all = [...badges, ...customs];
                                
                                if (all.length === 0) return null;
                                return (
                                  <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                                    {all.slice(0, 3).map((lbl, idx) => (
                                      <span key={idx} className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/25 rounded text-[7px] font-extrabold text-green-400 uppercase tracking-widest leading-none">
                                        🟢 {lbl}
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const directRoom = {
                                  _id: item.author?._id || item._id,
                                  fullName: item.author?.fullName || item.fullName || 'Student',
                                  username: item.author?.username || item.username || 'student',
                                  avatar: item.author?.avatar || item.avatar,
                                  type: 'user'
                                };
                                setActiveChat(directRoom);
                                setSubView('chats');
                              }}
                              className="p-1.5 bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 rounded-lg transition-all"
                            >
                              <MessageCircle size={13} />
                            </button>
                            <button
                              onClick={() => handleToggleFollow(item.author?._id || item._id, item.isFollowing)}
                              className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                item.isFollowing 
                                  ? 'bg-white/10 text-white hover:bg-white/15'
                                  : 'bg-purple-600 text-white hover:bg-purple-500'
                              }`}
                            >
                              {item.isFollowing ? 'Following' : 'Follow'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {searchQuery.trim() === '' && (
                  <>
                    {/* Suggestions Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Suggested Connections</p>
                        <span className="text-[8px] text-text-secondary font-extrabold uppercase">Matches interests</span>
                      </div>

                      {loadingSuggestions ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        </div>
                      ) : !suggestions.suggestedStudents || suggestions.suggestedStudents.length === 0 ? (
                        <p className="text-[10px] text-text-secondary bg-white/5 p-4 rounded-xl text-center">No connection recommendations found.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {suggestions.suggestedStudents.slice(0, 4).map((student) => (
                            <div key={student._id} className="bg-[#0c0817] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:border-purple-500/20 transition-all">
                              <div
                                onClick={() => openStudentProfile(student._id)}
                                className="w-12 h-12 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-300 font-extrabold text-sm overflow-hidden mb-2 cursor-pointer"
                              >
                                {student.avatar ? (
                                  <img src={student.avatar} className="w-full h-full object-cover" alt="avatar" />
                                ) : (
                                  student.fullName.charAt(0)
                                )}
                              </div>
                              <p className="text-xs font-black text-white truncate w-full">@{student.username}</p>
                              <p className="text-[9px] text-text-secondary truncate mt-0.5 w-full">{student.fullName}</p>
                              {(() => {
                                const opps = student.openToOpportunities || {};
                                const badges = [
                                  { key: 'internships', label: 'Internships' },
                                  { key: 'teamMembers', label: 'Team' },
                                  { key: 'hackathons', label: 'Hackathons' },
                                  { key: 'freelance', label: 'Freelance' },
                                  { key: 'mentoring', label: 'Mentor' },
                                  { key: 'projectCollaborators', label: 'Collab' },
                                  { key: 'studyPartners', label: 'Study' },
                                  { key: 'placementGroups', label: 'Placement' }
                                ].filter(b => opps[b.key]).map(b => b.label);
                                
                                const customs = opps.custom || [];
                                const all = [...badges, ...customs];
                                
                                if (all.length === 0) return null;
                                return (
                                  <div className="flex flex-wrap gap-1 mt-1 justify-center w-full max-h-5 overflow-hidden">
                                    <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/25 rounded text-[6px] font-black text-green-400 uppercase tracking-widest leading-none">
                                      🟢 {all[0]}
                                    </span>
                                  </div>
                                );
                              })()}
                              <button
                                onClick={() => handleToggleFollow(student._id, student.isFollowing)}
                                className={`w-full py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border mt-3 ${
                                  student.isFollowing
                                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                                    : 'bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25'
                                }`}
                              >
                                {student.isFollowing ? 'Following' : 'Follow'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Suggested Groups Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Recommended Study Rooms</p>
                      </div>

                      {loadingSuggestions ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        </div>
                      ) : !suggestions.suggestedGroups || suggestions.suggestedGroups.length === 0 ? (
                        <p className="text-[10px] text-text-secondary bg-white/5 p-4 rounded-xl text-center">No group recommendations found.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {suggestions.suggestedGroups.slice(0, 4).map((group) => (
                            <div key={group._id} className="bg-[#0c0817] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:border-purple-500/20 transition-all">
                              <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-300 font-extrabold text-sm overflow-hidden mb-2">
                                {group.avatar ? (
                                  <img src={group.avatar} className="w-full h-full object-cover" alt="avatar" />
                                ) : (
                                  group.name.charAt(0)
                                )}
                              </div>
                              <p className="text-xs font-black text-white truncate w-full">{group.name}</p>
                              <p className="text-[9px] text-text-secondary truncate mt-0.5 w-full">{group.members ? group.members.length : 0} members</p>
                              <button
                                onClick={async () => {
                                  try {
                                    await API.post(`/community/groups/join/${group._id}`);
                                    toast.success(`Joined room: ${group.name}`);
                                    fetchSuggestions();
                                    fetchGroups();
                                  } catch {
                                    toast.error('Failed to join study room');
                                  }
                                }}
                                className="w-full py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg bg-purple-600 border border-purple-500 hover:bg-purple-500 text-white mt-3 transition-all cursor-pointer shadow-lg shadow-purple-600/20"
                              >
                                Join Room
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Trending Study Material */}
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Trending Notes</p>
                        {!suggestions.trendingNotes || suggestions.trendingNotes.length === 0 ? (
                          <p className="text-[9px] text-text-secondary bg-white/5 p-3 rounded-xl text-center">No notes uploaded yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {suggestions.trendingNotes.map((note) => (
                              <div key={note._id} className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-extrabold text-white truncate leading-tight">{note.title}</p>
                                  <p className="text-[8px] text-text-secondary truncate mt-0.5">by @{note.author?.username}</p>
                                </div>
                                <a
                                  href={note.fileUrl}
                                  download
                                  className="p-1 bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25 rounded transition-all shrink-0"
                                >
                                  <Download size={11} />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Active Colleges</p>
                        {!suggestions.trendingColleges || suggestions.trendingColleges.length === 0 ? (
                          <p className="text-[9px] text-text-secondary bg-white/5 p-3 rounded-xl text-center">No colleges active yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {suggestions.trendingColleges.map((college, idx) => (
                              <span
                                key={idx}
                                className="bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-[8px] font-black text-text-secondary hover:text-white transition-all cursor-pointer truncate max-w-full"
                              >
                                🏫 {college}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {subView === 'discover-groups' && (
              <div className="max-w-xl mx-auto px-4 py-5 space-y-6">
                {/* Heading */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSubView('chats')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-all cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Discover Campus Groups</h2>
                      <p className="text-[10px] text-text-secondary mt-1">Explore open study groups, coding clubs, and teams.</p>
                    </div>
                  </div>
                </div>

                {/* Categories filter chips */}
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                        : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                    }`}
                  >
                    🌐 All
                  </button>
                  {dbCategories.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => setSelectedCategory(c.code)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer ${
                        selectedCategory === c.code
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                          : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                      }`}
                    >
                      {c.icon} {c.name}
                    </button>
                  ))}
                </div>

                {/* Group Search Bar */}
                <div className="glass-card p-3 flex items-center gap-2">
                  <Search size={16} className="text-text-secondary shrink-0" />
                  <input
                    type="text"
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    placeholder="Search groups by name, subject, college, branch, year..."
                    className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-text-secondary"
                  />
                  {groupSearchQuery.trim() !== '' && (
                    <button onClick={() => setGroupSearchQuery('')} className="text-text-secondary hover:text-white">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Results Listing */}
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Open Groups (${discoveredGroupsList.length})</p>
                  
                  {discoveredGroupsList.length === 0 ? (
                    <div className="p-10 text-center bg-white/5 border border-white/5 rounded-2xl">
                      <UsersRound className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-bold text-white">No Groups Found</p>
                      <p className="text-[10px] text-text-secondary mt-1">Try resetting category chips or typing another keyword.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {discoveredGroupsList.map((g) => (
                        <div key={g._id} className="bg-[#0c0817] border border-white/5 hover:border-purple-500/25 p-4 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 font-extrabold text-sm overflow-hidden shrink-0">
                              {g.avatar ? <img src={g.avatar} className="w-full h-full object-cover" /> : <UsersRound size={18} />}
                            </div>
                            <div className="min-w-0 space-y-1 text-left">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-black text-white truncate leading-none">{g.name}</h4>
                                <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded text-[7px] font-extrabold uppercase tracking-widest leading-none">
                                  {g.category || 'Study'}
                                </span>
                              </div>
                              <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-2">{g.description || 'No description provided.'}</p>
                              
                              {/* Metadata Row */}
                              {(g.college || g.branch || g.year) && (
                                <p className="text-[8px] text-text-secondary flex items-center gap-1">
                                  {g.college && <span>🏫 {g.college}</span>}
                                  {g.branch && <span>• {g.branch}</span>}
                                  {g.year && <span>• {g.year} Year</span>}
                                </p>
                              )}
                              <p className="text-[8px] text-[#00a884] font-bold">${g.memberCount || 1} campus members active</p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {g.isMember ? (
                              <button
                                onClick={() => {
                                  handleSelectChat(g, 'group');
                                  setSubView('chats');
                                }}
                                className="px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer border border-white/5"
                              >
                                Open Chat
                              </button>
                            ) : (
                              <button
                                onClick={() => handleJoinGroupFromDiscover(g.inviteCode)}
                                className="px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-lg shadow-purple-600/20"
                              >
                                Join Group
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {subView === 'chats' && (
              <div className="h-full flex flex-col md:flex-row relative">
                {/* Sidebar Chat List */}
                <div className={`w-full md:w-80 flex flex-col bg-[#0b0715]/60 border-r border-purple-500/15 ${activeChat ? 'hidden md:flex' : 'flex'} h-full`}>
                  <div className="p-4 pb-2 space-y-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSubView('home')}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-all cursor-pointer"
                          title="Back to feed"
                        >
                          <ArrowLeft size={12} />
                        </button>
                        <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest">Chat Workspace</span>
                      </div>
                      <button
                        onClick={() => setShowCreateGroupModal(true)}
                        className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg text-[9px] font-black hover:bg-purple-500/25 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={10} /> Create Group
                      </button>
                    </div>
                    <div className="flex p-0.5 bg-white/5 border border-white/5 rounded-xl">
                      <button
                        onClick={() => setChatSubTab('personal')}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${chatSubTab === 'personal' ? 'bg-[#5b21b6] text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
                      >
                        Private Chats
                      </button>
                      <button
                        onClick={() => setChatSubTab('groups')}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${chatSubTab === 'groups' ? 'bg-[#5b21b6] text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
                      >
                        Groups
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                    {chatSubTab === 'personal' ? (
                      mappedFriends.length === 0 ? (
                        <EmptyState
                          icon={MessageSquare}
                          title="No private sessions"
                          subtitle="Add friends from Discover to start private encryption sessions."
                          color="text-purple-400"
                        />
                      ) : (
                        mappedFriends.map((peer) => (
                          <button
                            key={peer._id}
                            onClick={() => handleSelectChat(peer.originalData, 'user')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border border-transparent transition-all ${activeChat?.id === peer._id ? 'bg-[#1f2c34] border-[#2b3942]' : 'hover:bg-white/5'}`}
                          >
                            <div className="relative shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-xs overflow-hidden">
                                {peer.avatar ? (
                                  <img src={peer.avatar} className="w-full h-full rounded-full object-cover" alt="avatar" />
                                ) : (
                                  peer.name.charAt(0)
                                )}
                              </div>
                              {peer.isOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#06030c]" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-black text-white truncate">@{peer.username}</p>
                                <span className="text-[8px] text-text-secondary">{peer.time}</span>
                              </div>
                              <p className="text-[10px] text-text-secondary truncate mt-0.5">{peer.name}</p>
                              <p className="text-[9px] text-[#8696a0] truncate mt-0.5">{peer.lastMessage}</p>
                            </div>
                          </button>
                        ))
                      )
                    ) : (
                      <>
                        <button
                          onClick={() => setSubView('discover-groups')}
                          className="w-full mb-3 flex items-center justify-between p-3 rounded-xl border border-dashed border-purple-500/20 bg-purple-950/5 hover:bg-purple-950/10 hover:border-purple-500/40 transition-all cursor-pointer text-left shrink-0"
                        >
                          <div className="flex items-center gap-2">
                            <Compass className="text-purple-400" size={16} />
                            <div>
                              <p className="text-[10px] font-black text-white uppercase tracking-wider">Discover Groups</p>
                              <p className="text-[8px] text-text-secondary">Explore open campus channels</p>
                            </div>
                          </div>
                          <ChevronRight className="text-text-secondary" size={12} />
                        </button>

                        {mappedGroups.length === 0 ? (
                          <EmptyState
                            icon={UsersRound}
                            title="No campus groups"
                            subtitle="Create groups in Bottom Sheet or Join in Discover."
                            color="text-indigo-400"
                          />
                        ) : (
                          mappedGroups.map((group) => (
                            <button
                              key={group._id}
                              onClick={() => handleSelectChat(group.originalData, 'group')}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border border-transparent transition-all ${activeChat?.id === group._id ? 'bg-[#1f2c34] border-[#2b3942]' : 'hover:bg-white/5'}`}
                            >
                              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                                <UsersRound size={16} />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-black text-white truncate">{group.name}</p>
                                <p className="text-[9px] text-[#8696a0] truncate mt-0.5">{group.lastMessage}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Chat window viewport */}
                <div className={`flex-1 flex flex-col ${activeChat ? 'flex' : 'hidden md:flex items-center justify-center'} h-full bg-black/20`}>
                  {activeChat ? (
                    <>
                      {/* Chat Header */}
                      <div className="h-16 flex items-center justify-between px-4 border-b border-[#232d36] shrink-0 z-10" style={{ background: '#101d25' }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <button onClick={() => setActiveChat(null)} className="md:hidden p-1 text-text-secondary hover:text-white">
                            <ArrowLeft size={18} />
                          </button>

                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0 overflow-hidden">
                            {activeChat.avatar ? (
                              <img src={activeChat.avatar} className="w-full h-full object-cover" alt="avatar" />
                            ) : (
                              <span>{activeChat.name.charAt(0)}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <h4 className="text-sm font-black text-white truncate leading-tight">{activeChat.name}</h4>
                              {activeChat.type === 'user' && (
                                <CircleCheck size={11} className="text-blue-400 fill-blue-400/10 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-emerald-400 font-medium">
                              {activeChat.type === 'group' ? 'Group Channel' : 'Online'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {activeChat.type === 'user' && (
                            <>
                              <button onClick={() => startCall && startCall(activeChat.id, activeChat)} className="p-2 text-text-secondary hover:text-white rounded-full hover:bg-white/5 transition-all">
                                <Phone size={18} />
                              </button>
                              <button onClick={() => toast.success('Starting video call...')} className="p-2 text-text-secondary hover:text-white rounded-full hover:bg-white/5 transition-all">
                                <Video size={18} />
                              </button>
                            </>
                          )}

                          <div className="relative">
                            <button onClick={() => setShowChatMenu(!showChatMenu)} className="p-2 text-text-secondary hover:text-white rounded-full hover:bg-white/5 transition-all">
                              <EllipsisVertical size={18} />
                            </button>

                            <AnimatePresence>
                              {showChatMenu && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="absolute right-0 mt-2 w-40 bg-dark-bg border border-dark-border rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                                >
                                  {activeChat.type === 'user' ? (
                                    <button
                                      onClick={() => {
                                        setShowChatMenu(false);
                                        blockUser();
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                    >
                                      <Ban size={12} /> Block User
                                    </button>
                                  ) : (
                                     <>
                                       <button
                                         onClick={() => {
                                           setShowChatMenu(false);
                                           openGroupInfo();
                                         }}
                                         className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-purple-300 hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                                       >
                                         <Settings size={12} /> Group Settings
                                       </button>
                                       <button
                                         onClick={() => {
                                           setShowChatMenu(false);
                                           leaveGroup();
                                         }}
                                         className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                                       >
                                         <LogOut size={12} /> {myGroupRole === 'owner' || activeChat.admin === user._id ? 'Delete Group' : 'Leave Group'}
                                       </button>
                                     </>
                                   )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* Group Channel category sub tabs */}
                      {activeChat.type === 'group' && (
                        <div className="flex gap-2 px-4 py-2 border-b border-[#232d36] overflow-x-auto scrollbar-none shrink-0" style={{ background: '#142029' }}>
                          {[
                            { id: 'general', label: '# general' },
                            { id: 'notes', label: '# notes' },
                            { id: 'announcements', label: '# announcements' },
                            { id: 'resources', label: '# resources' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setSelectedGroupCategory(item.id);
                                toast.success(`Switched to channel ${item.label}`);
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider transition-all shrink-0 ${
                                selectedGroupCategory === item.id
                                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/35'
                                  : 'bg-white/5 text-text-secondary border border-transparent hover:text-white'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Message Viewport */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative min-h-0 custom-scrollbar" style={{ background: '#0b141a' }}>
                        <div className="relative z-10 space-y-4">
                          <div className="flex justify-center my-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffe8c7]/10 border border-[#ffe8c7]/20 text-[#ffe8c7] text-[10px] max-w-[90%] text-center font-bold">
                              <Shield size={11} className="shrink-0" />
                              <span>Messages and calls are end-to-end encrypted</span>
                            </div>
                          </div>

                          {activeChat.type === 'group' && (selectedGroupCategory === 'notes' || selectedGroupCategory === 'resources') ? (
                            <div className="space-y-3">
                              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                                <p className="text-xs font-bold text-white uppercase tracking-wider">💾 Shared Channel Materials</p>
                                <p className="text-[10px] text-text-secondary mt-1">Study materials shared in this channel for download & preview</p>
                              </div>

                              {posts.filter((p) => p.type === 'notes' || p.type === 'pdf').length === 0 ? (
                                <p className="text-text-secondary text-center py-6 text-[10px]">No study files shared in this channel yet.</p>
                              ) : (
                                posts
                                  .filter((p) => p.type === 'notes' || p.type === 'pdf')
                                  .map((file, idx) => (
                                    <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all">
                                      <div className="flex items-center gap-3">
                                        <FileText className="text-red-400" size={18} />
                                        <div>
                                          <p className="text-xs font-extrabold text-white truncate max-w-[200px]">{file.fileName || 'Untitled Study Guide'}</p>
                                          <p className="text-[8px] text-text-secondary">uploaded by @{file.author?.username}</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setPreviewPdfUrl(file.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
                                            setPreviewPdfName(file.fileName);
                                          }}
                                          className="px-2 py-1 bg-purple-600 text-white rounded text-[8px] font-black uppercase transition-all"
                                        >
                                          Preview
                                        </button>
                                        <a href={file.fileUrl} download className="p-1 bg-white/5 hover:bg-white/10 rounded">
                                          <Download size={12} />
                                        </a>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          ) : activeChat.type === 'group' && selectedGroupCategory === 'announcements' ? (
                            <div className="space-y-3">
                              <div className="p-3 bg-[#e0a82e]/10 border border-[#e0a82e]/25 text-[#e0a82e] rounded-xl text-center">
                                <p className="text-xs font-black uppercase tracking-wider">📢 Announcement Broadcast</p>
                                <p className="text-[10px] mt-1">Official alerts, schedules and placements notices appear here</p>
                              </div>

                              {posts.filter((p) => p.type === 'college').length === 0 ? (
                                <div className="p-6 bg-white/5 rounded-xl text-center text-[10px] text-text-secondary">
                                  No official announcements published yet.
                                </div>
                              ) : (
                                posts
                                  .filter((p) => p.type === 'college')
                                  .map((ann, idx) => (
                                    <div key={idx} className="p-4 bg-[#1f2c34] border border-[#2b3942] rounded-xl">
                                      <p className="text-xs font-bold text-white">{ann.title}</p>
                                      <p className="text-[10px] text-text-secondary mt-1">{ann.content}</p>
                                      <span className="block text-[8px] text-purple-400 font-bold uppercase mt-2">
                                        Posted by @{ann.author?.username}
                                      </span>
                                    </div>
                                  ))
                              )}
                            </div>
                          ) : (
                            messages.map((msg, idx) => {
                              const isMe = msg.sender?._id === user._id || msg.sender === 'me' || msg.sender?._id === 'me';
                              const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              });

                              return (
                                <div key={msg._id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                  <div className={`max-w-[80%] px-3.5 py-2.5 relative ${isMe ? 'bg-[#005c4b] text-white rounded-[15px_15px_0px_15px]' : 'bg-[#202c33] text-white rounded-[15px_15px_15px_0px]'}`}>
                                    {!isMe && activeChat.type === 'group' && (
                                      <p className="text-[9px] text-purple-300 font-extrabold mb-0.5">{msg.sender?.fullName || 'Peer'}</p>
                                    )}
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap pr-10">{msg.content}</p>
                                    <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                      <span className="text-[8px] text-white/50">{timeStr}</span>
                                      {isMe && <span className="text-[10px] text-[#53bdeb] font-bold leading-none">✓✓</span>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </div>

                      {/* Chat Input form */}
                      <div className="p-3 border-t border-[#232d36] shrink-0" style={{ background: '#101d25' }}>
                        <form onSubmit={sendMessage} className="flex items-center gap-2">
                          <div className="flex-1 flex items-center bg-[#1f2c34] rounded-full px-3 py-1">
                            <button
                              type="button"
                              onClick={() => toast.success('Emoji selector coming soon!')}
                              className="p-1.5 text-[#8696a0] hover:text-white transition-colors"
                            >
                              <Sparkles size={16} />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                                className="p-1.5 text-[#8696a0] hover:text-white transition-colors cursor-pointer"
                              >
                                <Paperclip size={16} />
                              </button>
                              
                              {showAttachmentMenu && (
                                <div className="absolute bottom-12 left-0 w-44 bg-[#1f2c34] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 flex flex-col">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAttachmentMenu(false);
                                      const url = prompt('Enter Image URL:');
                                      if (url) {
                                        setChatAttachment({ url, type: 'image', name: 'Shared Image' });
                                        setMessageText(prev => prev + ` 🖼️ [Image: ${url}]`);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] text-white hover:bg-white/5 flex items-center gap-2 cursor-pointer font-medium"
                                  >
                                    🖼️ Share Image
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAttachmentMenu(false);
                                      const url = prompt('Enter PDF URL:');
                                      if (url) {
                                        setChatAttachment({ url, type: 'pdf', name: 'Shared PDF' });
                                        setMessageText(prev => prev + ` 📄 [PDF: ${url}]`);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] text-white hover:bg-white/5 flex items-center gap-2 cursor-pointer font-medium"
                                  >
                                    📄 Share PDF Document
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAttachmentMenu(false);
                                      fetchMyNotesForShare();
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] text-white hover:bg-white/5 flex items-center gap-2 cursor-pointer font-medium"
                                  >
                                    📖 Share Class Note
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAttachmentMenu(false);
                                      const title = prompt('Enter Project Title to Share:');
                                      if (title) {
                                        setMessageText(prev => prev + ` 💻 [Shared Project]: ${title}`);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] text-white hover:bg-white/5 flex items-center gap-2 cursor-pointer font-medium"
                                  >
                                    💻 Share Code Project
                                  </button>
                                </div>
                              )}
                            </div>
                            <input
                              type="text"
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 px-2 py-1.5 placeholder-[#8696a0]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={!messageText.trim()}
                            className="w-9 h-9 flex items-center justify-center bg-[#00a884] hover:bg-[#008f72] disabled:bg-[#1f2c34] text-white rounded-full disabled:opacity-40 transition-all shrink-0 animate-fade-in"
                          >
                            <Send size={15} />
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <MessageSquare size={36} className="text-[#8696a0] mx-auto mb-3.5" />
                      <h3 className="text-sm font-black text-white">Select a Chat to Start Messaging</h3>
                      <p className="text-[10px] text-text-secondary mt-1.5 max-w-[240px] mx-auto leading-relaxed">
                        Choose a direct connection or academic channel from the left sidebar panel.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {subView === 'profile' && (
              <div className="max-w-xl mx-auto px-4 py-5 space-y-6">
                {/* Back button to return to home */}
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setSubView('home')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-secondary hover:text-white transition-all flex items-center gap-1 text-xs font-black uppercase tracking-wider cursor-pointer">
                    <ArrowLeft size={14} /> Back to feed
                  </button>
                </div>

                {profileUserId && profileUserId !== user._id ? (
                  /* Render other student profile */
                  loadingProfile ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Loading Profile...</span>
                    </div>
                  ) : !otherUserProfileData ? (
                    <div className="p-8 text-center bg-white/5 border border-white/5 rounded-3xl">
                      <p className="text-xs text-text-secondary">Failed to retrieve profile data</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#0c0816]/40 border border-purple-500/10 rounded-3xl overflow-hidden relative pb-4">
                        <div
                          className="h-32 w-full relative bg-cover bg-center"
                          style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80')",
                          }}
                        >
                          <div className="absolute inset-0 bg-black/20" />
                        </div>

                        <div className="px-4 -mt-10 relative">
                          <div className="flex items-end justify-between">
                            <div className="relative shrink-0">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border-4 border-[#0b0714] flex items-center justify-center text-white font-black text-xl shadow-lg overflow-hidden">
                                {otherUserProfileData.user.avatar ? (
                                  <img src={otherUserProfileData.user.avatar} className="w-full h-full object-cover" alt="avatar" />
                                ) : (
                                  otherUserProfileData.user.fullName.charAt(0)
                                )}
                              </div>
                            </div>

                            {otherUserProfileData.user._id !== user._id && (
                              <button
                                onClick={() => handleToggleFollow(otherUserProfileData.user._id, otherUserProfileData.isFollowing)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                  otherUserProfileData.isFollowing
                                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                                    : 'bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25'
                                }`}
                              >
                                {otherUserProfileData.isFollowing ? 'Following' : 'Follow'}
                              </button>
                            )}
                          </div>

                          <div className="mt-3.5 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-lg font-black text-white">{otherUserProfileData.user.fullName}</h3>
                              <CircleCheck size={14} className="text-blue-400 fill-blue-400/15" />
                            </div>
                            <p className="text-xs text-text-secondary">
                              @{otherUserProfileData.user.username} • {otherUserProfileData.user.branch || 'CSE'} - {otherUserProfileData.user.semester ? `Semester ${otherUserProfileData.user.semester}` : 'Student'}
                            </p>
                            <p className="text-xs text-purple-300 font-bold">{otherUserProfileData.user.collegeName || 'Student OS University'}</p>
                            {otherUserProfileData.user.bio && (
                              <p className="text-xs text-text-secondary leading-relaxed pt-2 italic">"{otherUserProfileData.user.bio}"</p>
                            )}
                          </div>

                          {/* Stats Dashboard */}
                          <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 py-4 border-t border-b border-purple-500/10 mt-4 text-center">
                            <div>
                              <p className="text-sm font-black text-white">{otherUserProfileData.stats.postsCount || 0}</p>
                              <p className="text-[10px] text-text-secondary">Posts</p>
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">{otherUserProfileData.stats.followersCount || 0}</p>
                              <p className="text-[10px] text-text-secondary">Followers</p>
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">{otherUserProfileData.stats.followingCount || 0}</p>
                              <p className="text-[10px] text-text-secondary">Following</p>
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">{otherUserProfileData.stats.groupsCount || 0}</p>
                              <p className="text-[10px] text-text-secondary">Groups</p>
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">{otherUserProfileData.stats.notesCount || 0}</p>
                              <p className="text-[10px] text-text-secondary">Notes Shared</p>
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">{otherUserProfileData.stats.savedPostsCount || 0}</p>
                              <p className="text-[10px] text-text-secondary">Saved Posts</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sub content grids */}
                      <div className="space-y-4">
                        {/* Connect Section */}
                        {(() => {
                          const vis = otherUserProfileData.user.visibilitySettings || {};
                          const isFollower = otherUserProfileData.isFollowing;
                          const isMyself = otherUserProfileData.user._id === user._id;

                          const canShow = (key) => {
                            const visibility = vis[key] || 'public';
                            if (visibility === 'public') return true;
                            if (visibility === 'followers' && (isFollower || isMyself)) return true;
                            if (visibility === 'private' && isMyself) return true;
                            return false;
                          };

                          const links = [
                            { key: 'websiteUrl', val: otherUserProfileData.user.websiteUrl, icon: Globe, label: 'Website', color: 'hover:text-blue-400' },
                            { key: 'githubUrl', val: otherUserProfileData.user.githubUrl, icon: FileCode, label: 'GitHub', color: 'hover:text-purple-400' },
                            { key: 'linkedinUrl', val: otherUserProfileData.user.linkedinUrl, icon: User, label: 'LinkedIn', color: 'hover:text-indigo-400' },
                            { key: 'instagramUrl', val: otherUserProfileData.user.instagramUrl, icon: Image, label: 'Instagram', color: 'hover:text-pink-400' },
                            { key: 'youtubeUrl', val: otherUserProfileData.user.youtubeUrl, icon: Video, label: 'YouTube', color: 'hover:text-red-400' },
                            { key: 'telegramUrl', val: otherUserProfileData.user.telegramUrl, icon: Send, label: 'Telegram', color: 'hover:text-sky-400' }
                          ].filter(link => link.val && canShow(link.key));

                          const showEmail = otherUserProfileData.user.email && canShow('email');
                          const showMobile = otherUserProfileData.user.mobileNumber && canShow('mobileNumber');
                          const showLocation = otherUserProfileData.user.location && canShow('location');

                          if (links.length === 0 && !showEmail && !showMobile && !showLocation) return null;

                          return (
                            <div className="glass-card p-4 space-y-3">
                              <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Connect</p>
                              
                              {links.length > 0 && (
                                <div className="flex flex-wrap gap-2.5">
                                  {links.map((link) => {
                                    const IconComponent = link.icon;
                                    return (
                                      <a
                                        key={link.key}
                                        href={link.val}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary transition-all ${link.color} hover:bg-white/10 hover:scale-105`}
                                        title={link.label}
                                      >
                                        <IconComponent size={16} />
                                      </a>
                                    );
                                  })}
                                </div>
                              )}

                              {(showEmail || showMobile || showLocation) && (
                                <div className="space-y-1.5 pt-1 text-[10px] text-text-secondary font-bold">
                                  {showEmail && (
                                    <div className="flex items-center gap-2">
                                      <MessageCircle size={12} className="text-purple-400 shrink-0" />
                                      <a href={`mailto:${otherUserProfileData.user.email}`} className="text-white hover:underline transition-all">{otherUserProfileData.user.email}</a>
                                    </div>
                                  )}
                                  {showMobile && (
                                    <div className="flex items-center gap-2">
                                      <Phone size={12} className="text-purple-400 shrink-0" />
                                      <span className="text-white">{otherUserProfileData.user.mobileNumber}</span>
                                    </div>
                                  )}
                                  {showLocation && (
                                    <div className="flex items-center gap-2">
                                      <MapPin size={12} className="text-purple-400 shrink-0" />
                                      <span className="text-white">{otherUserProfileData.user.location}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Open to Opportunities Section */}
                        {(() => {
                          const opps = otherUserProfileData.user.openToOpportunities || {};
                          const list = [
                            { key: 'internships', label: 'Looking for Internships' },
                            { key: 'teamMembers', label: 'Looking for Team Members' },
                            { key: 'hackathons', label: 'Looking for Hackathons' },
                            { key: 'freelance', label: 'Available for Freelance' },
                            { key: 'mentoring', label: 'Open to Mentoring' },
                            { key: 'projectCollaborators', label: 'Looking for Project Collaborators' },
                            { key: 'studyPartners', label: 'Looking for Study Partners' },
                            { key: 'placementGroups', label: 'Looking for Placement Prep Groups' }
                          ].filter(o => opps[o.key]);

                          const customs = opps.custom || [];

                          if (list.length === 0 && customs.length === 0) return null;

                          return (
                            <div className="glass-card p-4 space-y-3">
                              <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">🚀 Open to Opportunities</p>
                              <div className="flex flex-wrap gap-2">
                                {list.map((opp) => (
                                  <span key={opp.key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/25 rounded-full text-[9px] font-black text-green-400 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <span>{opp.label}</span>
                                  </span>
                                ))}
                                {customs.map((tag, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/25 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                    <span>{tag}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Skills Section */}
                        {otherUserProfileData.user.skills && otherUserProfileData.user.skills.length > 0 && (
                          <div className="glass-card p-4 space-y-2.5">
                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Endorsed Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {otherUserProfileData.user.skills.map((skill, idx) => (
                                <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-text-primary font-bold">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* User's Recent Posts */}
                        <div className="space-y-3">
                          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Recent Activity</p>
                          {otherUserProfileData.recentPosts && otherUserProfileData.recentPosts.length === 0 ? (
                            <div className="p-6 text-center bg-white/5 border border-white/5 rounded-2xl text-[10px] text-text-secondary">
                              No recent updates published.
                            </div>
                          ) : (
                            otherUserProfileData.recentPosts.map((post) => (
                              <div key={post._id} className="glass-card p-4 hover:border-purple-500/25 transition-all duration-200">
                                <span className="inline-flex rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[8px] font-black text-purple-300 uppercase tracking-wider mb-2.5">
                                  {post.tag || 'Social Update'}
                                </span>
                                <h4 className="text-xs font-black text-white">{post.title}</h4>
                                <p className="text-[10px] text-text-secondary mt-1 leading-relaxed truncate">{post.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )
                ) : (<>
                  <div className="bg-[#0c0816]/40 border border-purple-500/10 rounded-3xl overflow-hidden relative pb-4">
                  <div
                    className="h-32 w-full relative bg-cover bg-center"
                    style={{
                      backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80')",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <button
                      onClick={() => document.getElementById('avatar-upload-file').click()}
                      className="absolute right-3 top-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all"
                    >
                      <CloudUpload size={14} />
                    </button>
                  </div>

                  <div className="px-4 -mt-10 relative">
                    <div className="flex items-end justify-between">
                      <div className="relative group cursor-pointer shrink-0">
                        <input
                          type="file"
                          id="avatar-upload-file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <div className="w-20 h-20 rounded-full p-1 bg-[#0b0714] overflow-hidden">
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 p-0.5 flex items-center justify-center relative overflow-hidden">
                            {user?.avatar ? (
                              <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="avatar" />
                            ) : (
                              <span className="text-2xl font-extrabold text-white">{user?.fullName?.charAt(0) || 'S'}</span>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                              <span className="text-[9px] font-black uppercase text-white tracking-wider">Change</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {user?.avatar && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="mt-3.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-lg font-black text-white">{user?.fullName || 'Student Name'}</h3>
                        <CircleCheck size={14} className="text-blue-400 fill-blue-400/15" />
                      </div>
                      <p className="text-xs text-text-secondary">
                        {user?.branch || 'Branch'} - {user?.year ? `${user.year}nd Year` : 'Student'}
                      </p>
                      <p className="text-xs text-purple-300 font-bold">{user?.collegeName || 'Student OS University'}</p>
                      <div className="flex items-center gap-1 text-[10px] text-text-secondary/80">
                        <MapPin size={11} className="text-purple-400" />
                        <span>Rayachoti, Andhra Pradesh</span>
                      </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 py-4 border-t border-b border-purple-500/10 mt-4 text-center">
                      <div>
                        <p className="text-sm font-black text-white">{profileStats.postsCount || 0}</p>
                        <p className="text-[10px] text-text-secondary">Posts</p>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{profileStats.followersCount || 0}</p>
                        <p className="text-[10px] text-text-secondary">Followers</p>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{profileStats.followingCount || 0}</p>
                        <p className="text-[10px] text-text-secondary">Following</p>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{profileStats.groupsCount || 0}</p>
                        <p className="text-[10px] text-text-secondary">Groups</p>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{profileStats.notesCount || 0}</p>
                        <p className="text-[10px] text-text-secondary">Uploaded Notes</p>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{profileStats.savedPostsCount || 0}</p>
                        <p className="text-[10px] text-text-secondary">Saved Posts</p>
                      </div>
                    </div>

                    {/* Edit Profile / Settings toggles */}
                    <div className="grid grid-cols-12 gap-2 mt-4">
                      <button
                        onClick={() => {
                          setProfileForm({
                            collegeName: user?.collegeName || '',
                            branch: user?.branch || '',
                            year: user?.year || 1,
                            semester: user?.semester || 1,
                            rollNumber: user?.rollNumber || '',
                            gender: user?.gender || 'Prefer Not To Say',
                            showGender: user?.showGender || false,
                          });
                          setShowEditProfileModal(true);
                        }}
                        className="col-span-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer"
                      >
                        Edit Profile
                      </button>

                      <button
                        onClick={() => {
                          setIsProfilePublic(user?.profileVisibility === 'public');
                          setShowPrivacyModal(true);
                        }}
                        className="col-span-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer"
                      >
                        Settings
                      </button>

                      <button
                        onClick={() => toast.success('Profile Actions opened')}
                        className="col-span-2 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Settings size={14} className="text-text-secondary" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub Menu bar */}
                <div className="flex p-0.5 bg-white/5 border border-white/5 rounded-xl">
                  {[
                    { id: 'posts', label: 'My Posts' },
                    { id: 'notes', label: 'Uploaded Notes' },
                    { id: 'friends', label: 'Friend Network' },
                    { id: 'saved', label: 'Saved Posts' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setPostsTab(item.id)}
                      className={`flex-1 py-2 text-[10px] font-black rounded-lg cursor-pointer ${
                        postsTab === item.id ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'text-text-secondary'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Tab content list view */}
                <div className="space-y-3">
                  {postsTab === 'posts' && (
                    posts.filter((p) => p.author?.username === user?.username).length === 0 ? (
                      <div className="p-6 text-center bg-white/5 border border-white/5 rounded-2xl text-[10px] text-text-secondary">
                        You have not published any feed posts yet.
                      </div>
                    ) : (
                      posts
                        .filter((p) => p.author?.username === user?.username)
                        .map((post) => (
                          <div key={post._id} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <span className="inline-flex rounded-full bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 text-[8px] font-black text-purple-300 uppercase tracking-wider mb-2.5">
                              {post.tag}
                            </span>
                            <h4 className="text-xs font-black text-white">{post.title}</h4>
                            <p className="text-[10px] text-text-secondary mt-1 leading-relaxed">{post.content}</p>
                          </div>
                        ))
                    )
                  )}

                  {postsTab === 'notes' && (
                    posts.filter((p) => p.author?.username === user?.username && p.type === 'notes').length === 0 ? (
                      <div className="p-6 text-center bg-white/5 border border-white/5 rounded-2xl text-[10px] text-text-secondary">
                        You have not uploaded any study resource PDFs yet.
                      </div>
                    ) : (
                      posts
                        .filter((p) => p.author?.username === user?.username && p.type === 'notes')
                        .map((post) => (
                          <div key={post._id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-3">
                              <FileText className="text-red-400" size={16} />
                              <span className="text-xs font-extrabold text-white truncate">{post.fileName}</span>
                            </div>
                            <a href={post.fileUrl} download className="p-1 bg-white/5 hover:bg-white/10 rounded">
                              <Download size={14} className="text-text-secondary" />
                            </a>
                          </div>
                        ))
                    )
                  )}

                  {postsTab === 'friends' && (
                    mappedFriends.filter((peer) => peer.type === 'user').length === 0 ? (
                      <div className="p-6 text-center bg-white/5 border border-white/5 rounded-2xl text-[10px] text-text-secondary">
                        Your friend network list is currently empty.
                      </div>
                    ) : (
                      mappedFriends
                        .filter((peer) => peer.type === 'user')
                        .map((peer) => (
                          <div key={peer._id} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] font-black shrink-0 overflow-hidden">
                                {peer.avatar ? (
                                  <img src={peer.avatar} className="w-full h-full object-cover" alt="avatar" />
                                ) : (
                                  peer.name.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate leading-tight">@{peer.username}</p>
                                <p className="text-[9px] text-text-secondary truncate mt-0.5">{peer.name}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleSelectChat(peer.originalData, 'user')}
                              className="p-1.5 bg-purple-600/10 border border-purple-500/25 hover:bg-purple-600/20 text-purple-300 rounded-lg text-[9px] font-extrabold"
                            >
                              Chat
                            </button>
                          </div>
                        ))
                    )
                  )}

                  {postsTab === 'saved' && (
                    savedPosts.length === 0 ? (
                      <div className="p-6 text-center bg-white/5 border border-white/5 rounded-2xl text-[10px] text-text-secondary">
                        Your saved bookmarks collection is currently empty.
                      </div>
                    ) : (
                      savedPosts.map((post) => (
                        <div key={post._id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <span className="inline-flex rounded-full bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 text-[8px] font-black text-purple-300 uppercase tracking-wider">
                              {post.category || 'Post'}
                            </span>
                            <button
                              onClick={() => toggleBookmark(post._id)}
                              className="text-[8px] font-bold text-red-400 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                          <h4 className="text-xs font-black text-white">{post.title}</h4>
                          <p className="text-[10px] text-text-secondary mt-1 leading-relaxed truncate">{post.content}</p>
                        </div>
                      ))
                    )
                  )}
                </div>
                </>
              )}
            </div>
          )}

            {subView === 'notifications' && (
              <div className="max-w-xl mx-auto px-4 py-5 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setSubView('home')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-secondary hover:text-white transition-all flex items-center gap-1 text-xs font-black uppercase tracking-wider cursor-pointer">
                    <ArrowLeft size={14} /> Back to feed
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Activity Feed</p>
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[9px] font-bold text-purple-400 hover:underline cursor-pointer"
                    >
                      Mark All Read
                    </button>
                  </div>

                  {dbNotifications.length === 0 ? (
                    <EmptyState
                      icon={Bell}
                      title="No notifications yet"
                      subtitle="Likes, comments, and follow updates will appear here in real-time."
                      color="text-purple-400"
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {dbNotifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            if (notif.senderId) openStudentProfile(notif.senderId);
                          }}
                          className={`p-3 border rounded-2xl flex items-center gap-3 hover:border-purple-500/20 transition-all cursor-pointer ${
                            notif.isRead ? 'bg-white/5 border-white/5' : 'bg-purple-600/10 border-purple-500/20'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-300 font-extrabold text-xs overflow-hidden shrink-0">
                            {notif.senderAvatar ? (
                              <img src={notif.senderAvatar} className="w-full h-full object-cover" alt="avatar" />
                            ) : (
                              notif.senderName?.charAt(0) || 'N'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white leading-snug">{notif.title}</p>
                            <p className="text-[10px] text-text-secondary mt-0.5 truncate">{notif.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Button for Posting */}
          {subView === 'home' && (
            <button
              onClick={() => setShowCreatePostModal(true)}
              className="fixed bottom-24 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer border border-purple-400/20"
              title="Create Post"
            >
              <Plus size={24} />
            </button>
          )}

          {/* Bottom Sheet Menu dialog */}
          <AnimatePresence>
            {showCreateMenu && (
              <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end justify-center">
                <div className="absolute inset-0 cursor-pointer" onClick={() => setShowCreateMenu(false)} />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-full max-w-md bg-[#0d091e] border-t border-purple-500/25 rounded-t-3xl p-5 pb-8 relative z-10 shadow-2xl"
                >
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5" />

                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Create New Content</h3>
                    <button onClick={() => setShowCreateMenu(false)} className="p-1 rounded-full bg-white/5 text-text-secondary hover:text-white">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Create Post', type: 'text', icon: MessageSquare, color: 'from-purple-500 to-indigo-500' },
                      { label: 'Upload Photo', type: 'image', icon: Image, color: 'from-pink-500 to-rose-500' },
                      { label: 'Upload Video', type: 'video', icon: Video, color: 'from-blue-500 to-cyan-500' },
                      { label: 'Upload PDF', type: 'pdf', icon: FileText, color: 'from-red-500 to-orange-500' },
                      { label: 'Upload Notes', type: 'notes', icon: FileIcon, color: 'from-emerald-500 to-teal-500' },
                      { label: 'Create Story', type: 'story', icon: Sparkles, color: 'from-yellow-500 to-amber-500' },
                      { label: 'Create Group', type: 'group', icon: UsersRound, color: 'from-violet-500 to-fuchsia-500' },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={async () => {
                            setShowCreateMenu(false);
                            if (item.type === 'story') {
                              const status = prompt('Share a status message / study update:');
                              if (status) {
                                try {
                                  const { data } = await API.post('/community/stories', {
                                    status,
                                    media: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
                                  });
                                  setStories((prev) => [data, ...prev]);
                                  toast.success('Your story has been uploaded!');
                                } catch {
                                  toast.error('Failed to upload story');
                                }
                              }
                            } else if (item.type === 'group') {
                              createGroup();
                            } else {
                              setPostCategory(item.type === 'notes' || item.type === 'pdf' ? 'notes' : item.type === 'video' ? 'project' : 'text');
                              setFileType(item.type);
                              setShowCreatePostModal(true);
                            }
                          }}
                          className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-left transition-all"
                        >
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0`}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">{item.label}</p>
                            <p className="text-[9px] text-text-secondary">Share to feed</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Create Post Dialog Overlay */}
          <AnimatePresence>
            {showCreatePostModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-[#0c0817] border border-purple-500/20 rounded-2xl p-5 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Plus size={16} className="text-purple-400" /> Share to Student Community
                    </h3>
                    <button onClick={() => setShowCreatePostModal(false)} className="p-1 text-text-secondary hover:text-white rounded-full bg-white/5 cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>

                  <form onSubmit={publishPost} className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Category</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'notes', label: 'Notes' },
                          { id: 'project', label: 'Project' },
                          { id: 'hackathon', label: 'Hackathon' },
                          { id: 'internship', label: 'Internship' },
                          { id: 'placement', label: 'Placement' },
                          { id: 'achievement', label: 'Award' },
                          { id: 'certificate', label: 'Certificate' },
                          { id: 'question', label: 'Question' },
                          { id: 'announcement', label: 'Notice' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setPostCategory(item.id);
                              setSelectedFile(null);
                              setFilePreviewUrl(null);
                              setFileType(null);
                            }}
                            className={`py-1.5 text-[9px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                              postCategory === item.id
                                ? 'bg-purple-600/25 border-purple-500/40 text-purple-200'
                                : 'bg-white/5 border-transparent text-text-secondary hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Single Document (PDF)</label>
                        <input
                          type="file"
                          id="post-file-picker-modal"
                          accept="application/pdf"
                          onChange={handleAttachmentChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('post-file-picker-modal').click()}
                          className="w-full py-2 bg-purple-600/10 hover:bg-purple-600/15 border border-dashed border-purple-500/35 text-purple-300 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Select PDF Document
                        </button>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Multiple Images</label>
                        <input
                          type="file"
                          id="multiple-images-picker"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            setSelectedFiles(files);
                            setFilePreviews(files.map(f => URL.createObjectURL(f)));
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('multiple-images-picker').click()}
                          className="w-full py-2 bg-purple-600/10 hover:bg-purple-600/15 border border-dashed border-purple-500/35 text-purple-300 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Select Images (Max 5)
                        </button>
                      </div>
                    </div>

                    {filePreviewUrl && (
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Document Attachment</p>
                        <div className="flex items-center gap-2 p-2 bg-[#0c0817] border border-white/5 rounded-lg">
                          <FileText className="text-red-400" size={20} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{postFileName || 'Document'}</p>
                            <p className="text-[9px] text-text-secondary">
                              {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''} • PDF Document
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {filePreviews.length > 0 && (
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Images Preview ({filePreviews.length})</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {filePreviews.map((url, idx) => (
                            <img key={idx} src={url} className="w-full aspect-square object-cover rounded-lg border border-white/5" alt="Preview" />
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Post Title / Heading</label>
                      <input
                        type="text"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="E.g. Computer Networks midterm reference sheets"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Post Description / Caption</label>
                      <textarea
                        rows={4}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Details about the notes, project code, or general discussion..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Location (Optional)</label>
                      <input
                        type="text"
                        value={postLocation}
                        onChange={(e) => setPostLocation(e.target.value)}
                        placeholder="E.g. Lobby, Library, Engineering block"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Hashtags (comma separated)</label>
                        <input
                          type="text"
                          value={postHashtags}
                          onChange={(e) => setPostHashtags(e.target.value)}
                          placeholder="e.g. dev, coding"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Subject Tags (comma separated)</label>
                        <input
                          type="text"
                          value={postSubjectTags}
                          onChange={(e) => setPostSubjectTags(e.target.value)}
                          placeholder="e.g. CS202, MATH101"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                    </div>

                    {postCategory === 'project' && (
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Source Repository / Link</label>
                        <input
                          type="url"
                          value={postLink}
                          onChange={(e) => setPostLink(e.target.value)}
                          placeholder="https://github.com/..."
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all uppercase tracking-wider mt-2"
                    >
                      Publish to Community
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Active Story Dialog viewer */}
          <AnimatePresence>
            {activeStoryGroup && activeStoryGroup.length > 0 && (() => {
              const currentStory = activeStoryGroup[activeStoryIndex];
              if (!currentStory) return null;
              
              const isOwner = currentStory.user?._id === user?._id;

              const categoryGradients = {
                certificates: 'from-blue-600 via-indigo-900 to-slate-900',
                hackathons: 'from-purple-800 via-indigo-950 to-[#0b0714]',
                internships: 'from-emerald-700 via-teal-900 to-zinc-950',
                projects: 'from-fuchsia-800 via-rose-950 to-stone-900',
                study_goals: 'from-amber-600 via-orange-950 to-neutral-950',
                study_progress: 'from-rose-700 via-red-950 to-[#0b0714]',
                notes: 'from-cyan-700 via-blue-950 to-[#0b0714]',
                college_events: 'from-pink-700 via-fuchsia-950 to-slate-950',
                placement_updates: 'from-yellow-600 via-amber-950 to-zinc-950'
              };

              const gradient = categoryGradients[currentStory.category] || 'from-purple-900 to-black';

              return (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                  <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveStoryGroup(null)} />
                  
                  <motion.div
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className={`relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-purple-500/20 bg-gradient-to-b ${gradient} flex flex-col justify-between`}
                    onMouseDown={() => setIsStoryPaused(true)}
                    onMouseUp={() => setIsStoryPaused(false)}
                    onTouchStart={() => setIsStoryPaused(true)}
                    onTouchEnd={() => setIsStoryPaused(false)}
                  >
                    {currentStory.media && (
                      <div className="absolute inset-0 z-0">
                        {currentStory.type === 'video' ? (
                          <video
                            src={currentStory.media}
                            autoPlay
                            playsInline
                            muted
                            loop
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={currentStory.media}
                            className="w-full h-full object-cover"
                            alt="story media"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/45" />
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col h-full justify-between p-4">
                      <div>
                        <div className="flex gap-1.5 mb-3.5">
                          {activeStoryGroup.map((story, idx) => (
                            <div key={story._id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-400 transition-all duration-75"
                                style={{
                                  width: idx < activeStoryIndex 
                                    ? '100%' 
                                    : idx === activeStoryIndex 
                                      ? `${storyProgress}%` 
                                      : '0%'
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/35 flex items-center justify-center text-white text-[10px] font-black uppercase overflow-hidden">
                              {currentStory.user?.avatar ? (
                                <img src={currentStory.user.avatar} className="w-full h-full object-cover" alt="avatar" />
                              ) : (
                                currentStory.user?.fullName?.charAt(0) || 'S'
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-white leading-none">{currentStory.user?.fullName}</h4>
                              <span className="inline-flex rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[7px] font-black text-purple-300 uppercase tracking-widest mt-1">
                                {currentStory.category?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {isOwner && (
                              <button
                                onClick={() => deleteMyStory(currentStory._id)}
                                className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white transition-all cursor-pointer mr-1"
                                title="Delete Story"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            <button onClick={() => setActiveStoryGroup(null)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer">
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-x-0 top-20 bottom-24 flex z-20">
                        <div className="w-[35%] h-full cursor-w-resize" onClick={(e) => { e.stopPropagation(); handlePrevStory(); }} />
                        <div className="w-[30%] h-full" onClick={() => setIsStoryPaused(!isStoryPaused)} />
                        <div className="w-[35%] h-full cursor-e-resize" onClick={(e) => { e.stopPropagation(); handleNextStory(); }} />
                      </div>

                      {currentStory.type === 'text' && !currentStory.media && (
                        <div className="flex-1 flex items-center justify-center px-6 py-12 text-center text-white font-extrabold text-xs leading-relaxed select-none">
                          {currentStory.status}
                        </div>
                      )}

                      <div className="mt-auto space-y-3 z-30">
                        {currentStory.media && currentStory.status && (
                          <div className="p-3 bg-black/55 backdrop-blur-sm border border-white/5 rounded-2xl">
                            <p className="text-[10px] text-white leading-relaxed font-semibold">{currentStory.status}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3">
                          {isOwner ? (
                            <button
                              onClick={() => fetchStoryViewers(currentStory._id)}
                              className="flex items-center gap-1.5 bg-black/60 hover:bg-black/85 text-purple-300 hover:text-white px-3 py-2 rounded-xl border border-white/5 transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer"
                            >
                              <Eye size={13} />
                              <span>{currentStory.views?.length || 0}</span>
                            </button>
                          ) : (
                            <div className="w-1" />
                          )}

                          {!isOwner && (
                            <form onSubmit={replyToStory} className="flex-1 flex gap-1.5 items-center">
                              <input
                                type="text"
                                value={storyReplyText}
                                onChange={(e) => setStoryReplyText(e.target.value)}
                                placeholder={`Reply to ${currentStory.user?.fullName?.split(' ')[0]}...`}
                                className="flex-1 bg-black/65 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none placeholder-text-secondary font-bold"
                              />
                              <button
                                type="submit"
                                disabled={!storyReplyText.trim()}
                                className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 flex items-center justify-center text-white transition-all cursor-pointer"
                              >
                                <Send size={12} />
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })()}
          </AnimatePresence>

          {/* Create Story Modal */}
          <AnimatePresence>
            {showCreateStoryModal && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                <div className="absolute inset-0 cursor-pointer" onClick={() => setShowCreateStoryModal(false)} />
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-[#0d091e] border border-purple-500/25 rounded-3xl p-5 w-full max-w-md relative z-10 shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Share an Educational Story</h3>
                    <button onClick={() => setShowCreateStoryModal(false)} className="p-1 rounded-full bg-white/5 text-text-secondary hover:text-white cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={createNewStory} className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Story Format</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['text', 'image', 'video'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setStoryForm((prev) => ({ ...prev, type }))}
                            className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all cursor-pointer ${
                              storyForm.type === type 
                                ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-md' 
                                : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Educational Category</label>
                      <select
                        value={storyForm.category}
                        onChange={(e) => setStoryForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="certificates">Certificates</option>
                        <option value="hackathons">Hackathons</option>
                        <option value="internships">Internships</option>
                        <option value="projects">Projects</option>
                        <option value="study_goals">Study Goals</option>
                        <option value="study_progress">Study Progress</option>
                        <option value="notes">Notes Shared</option>
                        <option value="college_events">College Events</option>
                        <option value="placement_updates">Placement Updates</option>
                      </select>
                    </div>

                    {storyForm.type !== 'text' && (
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Media Attachment URL</label>
                        <input
                          type="url"
                          value={storyForm.media}
                          onChange={(e) => setStoryForm((prev) => ({ ...prev, media: e.target.value }))}
                          placeholder={`Paste standard ${storyForm.type === 'video' ? 'video' : 'image'} URL...`}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">
                        {storyForm.type === 'text' ? 'Story Text Body' : 'Story Caption'}
                      </label>
                      <textarea
                        value={storyForm.status}
                        onChange={(e) => setStoryForm((prev) => ({ ...prev, status: e.target.value }))}
                        placeholder={storyForm.type === 'text' ? 'Write your study goals, coding progress, or notes update...' : 'Add a caption to your upload...'}
                        rows={3}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 resize-none font-medium leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Who can view this?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'public', label: 'Public' },
                          { id: 'followers', label: 'Followers Only' }
                        ].map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setStoryForm((prev) => ({ ...prev, visibility: v.id }))}
                            className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all cursor-pointer ${
                              storyForm.visibility === v.id 
                                ? 'bg-purple-600/20 border-purple-500 text-purple-200' 
                                : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                            }`}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all uppercase tracking-wider"
                    >
                      Publish Story
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Story Viewers List Modal */}
          <AnimatePresence>
            {showViewersModal && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
                <div className="absolute inset-0 cursor-pointer" onClick={() => setShowViewersModal(false)} />
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-[#0c0816] border border-purple-500/25 rounded-3xl p-5 w-full max-w-sm relative z-10 shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Eye size={15} className="text-purple-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">Story Viewers ({storyViewersList.length})</h3>
                    </div>
                    <button onClick={() => setShowViewersModal(false)} className="p-1 rounded-full bg-white/5 text-text-secondary hover:text-white cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                    {storyViewersList.length === 0 ? (
                      <p className="text-[10px] text-text-secondary text-center py-4 font-bold">No views recorded yet.</p>
                    ) : (
                      storyViewersList.map((viewer) => (
                        <div
                          key={viewer._id}
                          className="flex items-center gap-2.5 p-2 bg-white/5 border border-white/5 rounded-2xl"
                        >
                          <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-white text-[9px] font-black uppercase overflow-hidden">
                            {viewer.avatar ? (
                              <img src={viewer.avatar} className="w-full h-full object-cover" alt="avatar" />
                            ) : (
                              viewer.fullName?.charAt(0) || 'V'
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white leading-none">{viewer.fullName}</p>
                            <p className="text-[8px] text-text-secondary mt-0.5">@{viewer.username || 'student'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Comments Modal Overlay */}
          <AnimatePresence>
            {commentPostId && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-dark-bg border border-dark-border rounded-2xl p-5 w-full max-w-sm shadow-2xl relative"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Comments list</h4>
                    <button onClick={() => setCommentPostId(null)} className="p-1 text-text-secondary hover:text-white rounded-full bg-dark-surface cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin">
                    {comments.length === 0 ? (
                      <p className="text-[10px] text-text-secondary text-center py-4">No comments published yet. Be the first!</p>
                    ) : (
                      comments.map((comm) => (
                        <div key={comm._id} className="text-xs space-y-2 leading-normal bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-white">
                              {comm.author?.fullName || 'Student'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setReplyToCommentId(comm._id);
                                  setReplyToCommentAuthor(comm.author?.fullName || 'Student');
                                  setCommentText('');
                                }}
                                className="text-[8px] font-black text-purple-400 uppercase tracking-widest hover:underline cursor-pointer"
                              >
                                Reply
                              </button>
                              {comm.author?._id === user?._id && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comm._id);
                                      setEditText(comm.content);
                                    }}
                                    className="text-[8px] font-black text-amber-400 uppercase tracking-widest hover:underline cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comm._id)}
                                    className="text-[8px] font-black text-red-400 uppercase tracking-widest hover:underline cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {editingCommentId === comm._id ? (
                            <div className="flex gap-1.5 mt-1">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                              />
                              <button
                                onClick={() => handleEditComment(comm._id)}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[9px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-2 py-1 bg-white/10 hover:bg-white/15 text-white rounded text-[9px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-text-secondary">{comm.content}</p>
                          )}

                          {/* Nested Replies */}
                          {comm.replies && comm.replies.length > 0 && (
                            <div className="pl-4 border-l border-purple-500/20 space-y-2 mt-2">
                              {comm.replies.map((rep) => (
                                <div key={rep._id} className="text-[11px] bg-white/5 p-1.5 rounded-lg border border-white/5 space-y-1">
                                  <div className="flex justify-between items-start">
                                    <span className="font-extrabold text-white">
                                      {rep.author?.fullName || 'Student'}
                                    </span>
                                    {rep.author?._id === user?._id && (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => {
                                            setEditingCommentId(rep._id);
                                            setEditText(rep.content);
                                          }}
                                          className="text-[8px] font-black text-amber-400 uppercase tracking-widest hover:underline cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(rep._id)}
                                          className="text-[8px] font-black text-red-400 uppercase tracking-widest hover:underline cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {editingCommentId === rep._id ? (
                                    <div className="flex gap-1.5 mt-1">
                                      <input
                                        type="text"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                                      />
                                      <button
                                        onClick={() => handleEditComment(rep._id)}
                                        className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[8px] font-bold"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingCommentId(null)}
                                        className="px-2 py-1 bg-white/10 hover:bg-white/15 text-white rounded text-[8px]"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-text-secondary">{rep.content}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {replyToCommentId && (
                    <div className="flex justify-between items-center bg-purple-600/10 border border-purple-500/25 px-3 py-1.5 rounded-xl mb-2.5">
                      <span className="text-[10px] text-purple-300">
                        Replying to <span className="font-extrabold">{replyToCommentAuthor}</span>
                      </span>
                      <button
                        onClick={() => {
                          setReplyToCommentId(null);
                          setReplyToCommentAuthor('');
                        }}
                        className="text-[10px] text-text-secondary hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <form onSubmit={addComment} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={replyToCommentId ? "Add a reply..." : "Add a public comment..."}
                      className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs disabled:opacity-40 transition-all cursor-pointer"
                    >
                      Send
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Report Post Modal Dialog */}
          <AnimatePresence>
            {reportPostId && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-[#0b0714] border border-dark-border rounded-2xl p-5 w-full max-w-sm shadow-2xl relative"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Shield size={14} className="text-red-400" /> Report Content
                    </h4>
                    <button onClick={() => setReportPostId(null)} className="p-1 text-text-secondary hover:text-white rounded-full bg-dark-surface cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>

                  <form onSubmit={submitPostReport} className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Reason</label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="Spam" className="bg-[#0b0714]">Spam or Duplicated</option>
                        <option value="Harassment" className="bg-[#0b0714]">Harassment / Hate Speech</option>
                        <option value="Inappropriate" className="bg-[#0b0714]">Inappropriate Content</option>
                        <option value="Other" className="bg-[#0b0714]">Other Violation</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all uppercase tracking-wider mt-2 cursor-pointer"
                    >
                      Submit Report
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Edit Post Modal Dialog */}
          <AnimatePresence>
            {showEditPostModal && editPostData && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-[#0c0817] border border-purple-500/20 rounded-2xl p-5 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      Edit Published Post
                    </h3>
                    <button onClick={() => { setShowEditPostModal(false); setEditPostData(null); }} className="p-1 text-text-secondary hover:text-white rounded-full bg-white/5 cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>

                  <form onSubmit={handleEditPost} className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Title</label>
                      <input
                        type="text"
                        value={editPostData.title}
                        onChange={(e) => setEditPostData({ ...editPostData, title: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Caption / Content</label>
                      <textarea
                        rows={4}
                        value={editPostData.content}
                        onChange={(e) => setEditPostData({ ...editPostData, content: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Category</label>
                      <select
                        value={editPostData.category}
                        onChange={(e) => setEditPostData({ ...editPostData, category: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="project" className="bg-[#0b0714]">Project</option>
                        <option value="hackathon" className="bg-[#0b0714]">Hackathon</option>
                        <option value="internship" className="bg-[#0b0714]">Internship</option>
                        <option value="placement" className="bg-[#0b0714]">Placement</option>
                        <option value="notes" className="bg-[#0b0714]">Notes</option>
                        <option value="achievement" className="bg-[#0b0714]">Achievement</option>
                        <option value="certificate" className="bg-[#0b0714]">Certificate</option>
                        <option value="question" className="bg-[#0b0714]">Question</option>
                        <option value="announcement" className="bg-[#0b0714]">Announcement</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Location</label>
                      <input
                        type="text"
                        value={postLocation}
                        onChange={(e) => setPostLocation(e.target.value)}
                        placeholder="E.g. Engineering Block"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Hashtags (comma separated)</label>
                        <input
                          type="text"
                          value={postHashtags}
                          onChange={(e) => setPostHashtags(e.target.value)}
                          placeholder="e.g. dev, coding"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Subject Tags (comma separated)</label>
                        <input
                          type="text"
                          value={postSubjectTags}
                          onChange={(e) => setPostSubjectTags(e.target.value)}
                          placeholder="e.g. CS202, MATH101"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all uppercase tracking-wider mt-2 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Edit Profile Modal Dialog */}
          <AnimatePresence>
            {showEditProfileModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-dark-bg border border-dark-border rounded-2xl p-5 w-full max-w-sm shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Edit College Info</h4>
                    <button onClick={() => setShowEditProfileModal(false)} className="p-1 text-text-secondary hover:text-white rounded-full bg-dark-surface cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>

                  <form onSubmit={saveProfileChanges} className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">College / University Name</label>
                      <input
                        type="text"
                        value={profileForm.collegeName}
                        onChange={(e) => setProfileForm({ ...profileForm, collegeName: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Branch / Department</label>
                      <input
                        type="text"
                        value={profileForm.branch}
                        onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Academic Year</label>
                        <select
                          value={profileForm.year}
                          onChange={(e) => setProfileForm({ ...profileForm, year: Number(e.target.value) })}
                          className="w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5].map((y) => (
                            <option key={y} value={y}>Year {y}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Current Semester</label>
                        <select
                          value={profileForm.semester}
                          onChange={(e) => setProfileForm({ ...profileForm, semester: Number(e.target.value) })}
                          className="w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={s}>Sem {s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Gender</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Male', 'Female', 'Prefer Not To Say'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setProfileForm({ ...profileForm, gender: g })}
                            className={`py-2 text-[10px] font-bold rounded-xl border text-center transition-all ${
                              profileForm.gender === g
                                ? 'bg-purple-600/25 border-purple-500/40 text-purple-200'
                                : 'bg-white/5 border-transparent text-text-secondary hover:text-white'
                            }`}
                          >
                            {g === 'Prefer Not To Say' ? 'N/A' : g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all uppercase tracking-wider"
                    >
                      Save Profile Changes
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Privacy Settings modal */}
          <AnimatePresence>
            {showPrivacyModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-dark-bg border border-dark-border rounded-2xl p-5 w-full max-w-sm shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Privacy Settings</h4>
                    <button onClick={() => setShowPrivacyModal(false)} className="p-1 text-text-secondary hover:text-white rounded-full bg-dark-surface cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-2">Profile Visibility</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'public', label: 'Public' },
                          { id: 'friends_only', label: 'Friends' },
                          { id: 'private', label: 'Private' },
                        ].map((visibility) => (
                          <button
                            key={visibility.id}
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await updateProfile({ profileVisibility: visibility.id });
                                if (res.ok) {
                                  setIsProfilePublic(visibility.id === 'public');
                                  toast.success(`Profile visibility updated to ${visibility.label}!`);
                                } else {
                                  toast.error('Failed to change privacy settings.');
                                }
                              } catch {
                                toast.error('Server error updating privacy.');
                              }
                            }}
                            className={`py-2 text-[10px] font-bold rounded-xl border text-center transition-all ${
                              user?.profileVisibility === visibility.id
                                ? 'bg-purple-600/25 border-purple-500/40 text-purple-200'
                                : 'bg-white/5 border-transparent text-text-secondary hover:text-white'
                            }`}
                          >
                            {visibility.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="max-w-[70%]">
                        <p className="text-xs font-bold text-white">Show Gender on Profile</p>
                        <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">Let other students see your gender on your profile card.</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const val = !user?.showGender;
                            const res = await updateProfile({ showGender: val });
                            if (res.ok) {
                              toast.success(val ? 'Gender is now visible!' : 'Gender is now hidden.');
                            } else {
                              toast.error('Failed to toggle gender visibility.');
                            }
                          } catch {
                            toast.error('Server error toggling gender.');
                          }
                        }}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${user?.showGender ? 'bg-purple-600' : 'bg-dark-border'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${user?.showGender ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl text-center">
                      <p className="text-[10px] text-text-secondary leading-relaxed">
                        Note: Regardless of this toggle, your mobile number and email address are never exposed publicly and can only be seen by accepted friends.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Preview PDF overlay dialog */}
          <AnimatePresence>
            {previewPdfUrl && (
              <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-[#0b0714] border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                >
                  <div className="h-14 bg-white/5 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
                    <p className="text-xs font-bold text-white truncate max-w-[70%]">{previewPdfName || 'Preview Document'}</p>
                    <button onClick={() => setPreviewPdfUrl(null)} className="p-1.5 text-text-secondary hover:text-white rounded-full bg-white/5 cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>
                  <iframe src={previewPdfUrl} className="flex-1 w-full border-none" title="PDF Preview" />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* Complete Profile Screen */
        <div className="flex-1 flex flex-col justify-center items-center p-6 relative overflow-y-auto min-h-0 bg-[#070413]">
          <div className="absolute top-4 left-4 z-50">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-text-secondary hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <ArrowLeft size={13} /> Exit to Student OS
            </button>
          </div>

          <div className="w-full max-w-md glass-card p-6 space-y-5 my-8">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mx-auto mb-2 animate-bounce">
                <Sparkles size={20} />
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Complete Your Community Profile</h2>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Customize your student card to join chat channels, discover student groups, and share campus notes.
              </p>
            </div>

            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-black uppercase shrink-0">
                    {completeProfileForm.avatar ? (
                      <img src={completeProfileForm.avatar} className="w-full h-full rounded-full object-cover" alt="avatar" />
                    ) : (
                      completeProfileForm.fullName.charAt(0) || 'S'
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={completeProfileForm.avatar}
                      onChange={(e) => setCompleteProfileForm({ ...completeProfileForm, avatar: e.target.value })}
                      placeholder="Paste Image URL..."
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
                      ].map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCompleteProfileForm({ ...completeProfileForm, avatar: url })}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 ${completeProfileForm.avatar === url ? 'border-purple-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={url} className="w-full h-full object-cover" alt="sample avatar" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Full Name</label>
                <input
                  type="text"
                  value={completeProfileForm.fullName}
                  onChange={(e) => setCompleteProfileForm({ ...completeProfileForm, fullName: e.target.value })}
                  placeholder="E.g. Indrasena Reddy"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={completeProfileForm.username}
                    onChange={(e) =>
                      setCompleteProfileForm({
                        ...completeProfileForm,
                        username: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                      })
                    }
                    placeholder="indrasena"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                  {checkingUsername && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
                </div>

                {usernameChecked && (
                  <div className="mt-1 text-[10px]">
                    {isUsernameAvailable ? (
                      <p className="text-emerald-400 font-bold flex items-center gap-1">✅ Username Available</p>
                    ) : (
                      <div className="space-y-1 bg-red-500/5 border border-red-500/10 p-2 rounded-xl">
                        <p className="text-red-400 font-bold flex items-center gap-1">❌ Username already taken</p>
                        {usernameSuggestions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="text-[9px] text-text-secondary">Suggestions:</span>
                            {usernameSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => setCompleteProfileForm({ ...completeProfileForm, username: suggestion })}
                                className="text-[9px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20 hover:bg-purple-500/25"
                              >
                                @{suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Prefer Not To Say'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setCompleteProfileForm({ ...completeProfileForm, gender: g })}
                      className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                        completeProfileForm.gender === g
                          ? 'bg-purple-600/25 border-purple-500/40 text-purple-200'
                          : 'bg-white/5 border-transparent text-text-secondary hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">College / University Name</label>
                <input
                  type="text"
                  value={completeProfileForm.collegeName}
                  onChange={(e) => setCompleteProfileForm({ ...completeProfileForm, collegeName: e.target.value })}
                  placeholder="E.g. JNTUH College of Engineering"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Branch</label>
                  <input
                    type="text"
                    value={completeProfileForm.branch}
                    onChange={(e) => setCompleteProfileForm({ ...completeProfileForm, branch: e.target.value })}
                    placeholder="E.g. CSE"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Semester</label>
                  <select
                    value={completeProfileForm.semester}
                    onChange={(e) =>
                      setCompleteProfileForm({
                        ...completeProfileForm,
                        semester: Number(e.target.value),
                        year: Math.ceil(Number(e.target.value) / 2),
                      })
                    }
                    className="w-full bg-[#0d0a1d] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all uppercase tracking-wider mt-2"
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1. CREATE GROUP MODAL */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0b1b] border border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative custom-scrollbar">
            <button onClick={() => setShowCreateGroupModal(false)} className="absolute top-4 right-4 text-text-secondary hover:text-white cursor-pointer">
              <X size={18} />
            </button>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">🚀 Create Campus Group</h3>
              <p className="text-[10px] text-text-secondary">Host classes, share project components, notes, or events with classmates.</p>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-purple-300 uppercase tracking-widest block mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-[#050308] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  placeholder="e.g. Placement Prep Cohort"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-purple-300 uppercase tracking-widest block mb-1">Description</label>
                <textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="w-full bg-[#050308] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 h-16 resize-none"
                  placeholder="What is this group for?"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black text-purple-300 uppercase tracking-widest block mb-1">Category</label>
                  <select
                    value={groupCategory}
                    onChange={(e) => {
                      setGroupCategory(e.target.value);
                    }}
                    className="w-full bg-[#050308] border border-[#a855f7]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- Choose Category * --</option>
                    {dbCategories.map(c => (
                      <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-purple-300 uppercase tracking-widest block mb-1">Privacy</label>
                  <select
                    value={groupPrivacy}
                    onChange={(e) => setGroupPrivacy(e.target.value)}
                    className="w-full bg-[#050308] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-black text-purple-300 uppercase tracking-widest block mb-1">College (Opt)</label>
                  <input
                    type="text"
                    value={groupCollege}
                    onChange={(e) => setGroupCollege(e.target.value)}
                    className="w-full bg-[#050308] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    placeholder="College"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-purple-300 uppercase tracking-widest block mb-1">Branch (Opt)</label>
                  <input
                    type="text"
                    value={groupBranch}
                    onChange={(e) => setGroupBranch(e.target.value)}
                    className="w-full bg-[#050308] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    placeholder="Branch"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-purple-300 uppercase tracking-widest block mb-1">Year (Opt)</label>
                  <input
                    type="text"
                    value={groupYear}
                    onChange={(e) => setGroupYear(e.target.value)}
                    className="w-full bg-[#050308] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    placeholder="Year"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-purple-300 uppercase tracking-widest block mb-1">Group Image URL</label>
                <input
                  type="text"
                  value={groupAvatar}
                  onChange={(e) => setGroupAvatar(e.target.value)}
                  className="w-full bg-[#050308] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              {/* Members Selection list */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-purple-300 uppercase tracking-widest block">Invite Friends / Classmates</label>
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full bg-[#050308] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  placeholder="Search friends by name..."
                />
                
                <div className="max-h-28 overflow-y-auto border border-white/5 bg-[#050308] rounded-xl p-2 space-y-1.5 custom-scrollbar">
                  {friendsList
                    .filter(f => f.fullName.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                    .map(f => {
                      const isSelected = selectedMembers.includes(f._id);
                      return (
                        <div key={f._id} className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg">
                          <span className="text-[11px] text-white font-medium">{f.fullName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMembers(prev =>
                                isSelected ? prev.filter(id => id !== f._id) : [...prev, f._id]
                              );
                            }}
                            className={"px-2 py-0.5 rounded text-[8px] font-black uppercase " + (isSelected ? 'bg-purple-600 text-white' : 'bg-white/5 text-text-secondary')}
                          >
                            {isSelected ? 'Invited' : 'Invite'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs rounded-xl shadow-lg hover:opacity-90 transition-all uppercase tracking-wider mt-2 cursor-pointer"
              >
                Create Group
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ACADEMIC NOTES SHARING MODAL */}
      {showNotesShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0b1b] border border-white/10 rounded-2xl w-full max-w-sm max-h-[70vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative custom-scrollbar">
            <button onClick={() => setShowNotesShareModal(false)} className="absolute top-4 right-4 text-text-secondary hover:text-white cursor-pointer">
              <X size={18} />
            </button>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">📖 Share Academic Note</h3>
              <p className="text-[10px] text-text-secondary">Select a note material to attach to your channel transcript.</p>
            </div>
            
            <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
              {myNotesList.length === 0 ? (
                <p className="text-[10px] text-text-secondary text-center py-4">No notes created yet. Go to Notes module to add.</p>
              ) : (
                myNotesList.map((note) => (
                  <button
                    key={note._id}
                    onClick={() => {
                      setMessageText(prev => prev + ' 📖 [Note]: ' + note.title + ' - ' + note.content.substring(0, 80) + '...');
                      setShowNotesShareModal(false);
                    }}
                    className="w-full text-left p-3 hover:bg-white/5 border border-white/5 hover:border-purple-500/25 rounded-xl transition-all flex flex-col gap-1 cursor-pointer"
                  >
                    <p className="text-xs font-bold text-white truncate">{note.title}</p>
                    <p className="text-[9px] text-text-secondary truncate">{note.subject || 'General'}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. GROUP INFO & SETTINGS MODAL */}
      {showGroupInfoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0b1b] border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative custom-scrollbar">
            <button onClick={() => setShowGroupInfoModal(false)} className="absolute top-4 right-4 text-text-secondary hover:text-white cursor-pointer">
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-3.5 pb-3 border-b border-white/5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 font-black text-base shrink-0 overflow-hidden">
                {activeChat.avatar ? <img src={activeChat.avatar} className="w-full h-full object-cover" /> : <UsersRound size={20} />}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white truncate">{activeChat.name}</h3>
                <p className="text-[10px] text-text-secondary">Role: <span className="text-purple-300 uppercase font-black">{myGroupRole}</span></p>
              </div>
            </div>

            {/* Main Tabs / Info Blocks */}
            <div className="space-y-4">
              {/* Profile details & edits */}
              {['owner', 'admin'].includes(myGroupRole) ? (
                <form onSubmit={handleSaveGroupEdit} className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest">📝 Edit Group Settings</p>
                  <div>
                    <label className="text-[8px] font-black text-text-secondary uppercase tracking-widest block mb-1">Group Name</label>
                    <input
                      type="text"
                      required
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      className="w-full bg-[#050308] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-text-secondary uppercase tracking-widest block mb-1">Description</label>
                    <textarea
                      value={editGroupDesc}
                      onChange={(e) => setEditGroupDesc(e.target.value)}
                      className="w-full bg-[#050308] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none h-12 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-black text-text-secondary uppercase tracking-widest block mb-1">Category</label>
                      <select
                        value={editGroupCategory}
                        onChange={(e) => setEditGroupCategory(e.target.value)}
                        className="w-full bg-[#050308] border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        {['Study', 'Projects', 'Hackathons', 'Placements', 'Notes', 'Events'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-text-secondary uppercase tracking-widest block mb-1">Privacy</label>
                      <select
                        value={editGroupPrivacy}
                        onChange={(e) => setEditGroupPrivacy(e.target.value)}
                        className="w-full bg-[#050308] border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer">
                    Save Details
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest">ℹ️ Group Information</p>
                  <p className="text-[11px] text-white font-medium">{activeChat.description || 'No description provided.'}</p>
                  <p className="text-[9px] text-text-secondary">Category: {activeChat.category || 'Study'} | Privacy: {activeChat.privacy || 'public'}</p>
                </div>
              )}

              {/* Mute and Pin preferences */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={"flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all " + (groupMuted ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-white/5 border-white/5 text-text-secondary hover:text-white')}
                >
                  🔔 {groupMuted ? 'Muted' : 'Mute Notifications'}
                </button>
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className={"flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all " + (groupPinned ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-white/5 border-white/5 text-text-secondary hover:text-white')}
                >
                  📌 {groupPinned ? 'Pinned' : 'Pin Group'}
                </button>
              </div>

              {/* Members section */}
              <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest">👥 Members ({groupMembersList.length})</p>
                
                {/* Invite more members dropdown */}
                {['owner', 'admin'].includes(myGroupRole) && (
                  <div className="space-y-2 pb-3 border-b border-white/5">
                    <p className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Invite New Classmates</p>
                    <div className="flex gap-2">
                      <div className="flex-1 max-h-24 overflow-y-auto border border-white/5 bg-[#050308] rounded-lg p-1.5 space-y-1.5 custom-scrollbar">
                        {friendsList
                          .filter(f => !groupMembersList.some(m => m.user && m.user._id === f._id))
                          .map(f => {
                            const isSelected = addMembersSelected.includes(f._id);
                            return (
                              <div key={f._id} className="flex items-center justify-between p-1 hover:bg-white/5 rounded">
                                <span className="text-[10px] text-white">{f.fullName}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddMembersSelected(prev =>
                                      isSelected ? prev.filter(id => id !== f._id) : [...prev, f._id]
                                    );
                                  }}
                                  className={"px-1.5 py-0.5 rounded text-[7px] font-black uppercase " + (isSelected ? 'bg-purple-600 text-white' : 'bg-white/5 text-text-secondary')}
                                >
                                  {isSelected ? 'Invited' : 'Invite'}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMembersSubmit}
                        className="px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* List group members */}
                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {groupMembersList.map((m) => {
                    if (!m.user) return null;
                    const isMe = m.user._id === user._id;
                    return (
                      <div key={m._id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 text-[10px] overflow-hidden">
                            {m.user.avatar ? <img src={m.user.avatar} className="w-full h-full object-cover" /> : m.user.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-white">
                              {m.user.fullName} {isMe && <span className="text-text-secondary">(you)</span>}
                            </p>
                            <p className="text-[8px] text-text-secondary uppercase">@{m.user.username} | {m.user.branch || 'CSE'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded text-[7px] font-black uppercase">
                            {m.role}
                          </span>
                          
                          {/* Actions */}
                          {myGroupRole === 'owner' && !isMe && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTransferOwnership(m.user._id)}
                                className="px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 rounded text-[7px] font-black uppercase cursor-pointer"
                                title="Transfer Ownership"
                              >
                                Owner
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMemberSubmit(m.user._id)}
                                className="p-0.5 hover:bg-white/5 text-red-400 rounded cursor-pointer"
                              >
                                <Trash2 size={10} />
                              </button>
                            </>
                          )}
                          {myGroupRole === 'admin' && !isMe && m.role !== 'owner' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMemberSubmit(m.user._id)}
                              className="p-0.5 hover:bg-white/5 text-red-400 rounded cursor-pointer"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Search Messages tab */}
              <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest">🔍 Search Message Log</p>
                <input
                  type="text"
                  value={groupMessageSearchQuery}
                  onChange={(e) => handleSearchGroupMessages(e.target.value)}
                  className="w-full bg-[#050308] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  placeholder="Type words to search chat transcripts..."
                />

                {isSearchingGroupMessages && (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                    {groupMessageSearchResults.length === 0 ? (
                      <p className="text-[8px] text-text-secondary text-center py-2">No matching messages found.</p>
                    ) : (
                      groupMessageSearchResults.map((m) => (
                        <div key={m._id} className="p-2 bg-white/5 rounded-lg space-y-0.5 border border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-purple-300">{m.sender ? m.sender.fullName : 'Classmate'}</span>
                            <span className="text-[7px] text-text-secondary">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[10px] text-white">{m.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
