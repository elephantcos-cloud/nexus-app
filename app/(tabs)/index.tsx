import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, useColorScheme, Image,
  TextInput, Modal, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, doc, updateDoc, arrayUnion, arrayRemove,
  serverTimestamp, deleteDoc,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../lib/colors';
import {
  NexusLogo, HeartIcon, CommentIcon, ShareIcon,
  ImageIcon, PlusIcon, AIIcon, MenuIcon, CloseIcon,
} from '../../components/icons';

interface Post {
  id: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  content: string;
  imageURL?: string;
  likes: string[];
  comments: Comment[];
  createdAt: any;
}

interface Comment {
  uid: string;
  displayName: string;
  text: string;
  createdAt: any;
}

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(postsData);
    });
    return unsubscribe;
  }, []);

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        uid: user.uid,
        displayName: profile?.displayName || user.email,
        photoURL: profile?.photoURL || '',
        content: newPost.trim(),
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
      });
      setNewPost('');
      setShowCreatePost(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, likes: string[]) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    if (likes.includes(user.uid)) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim() || !user) return;
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion({
        uid: user.uid,
        displayName: profile?.displayName || user.email,
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      }),
    });
    setCommentText('');
    setSelectedPost(null);
  };

  const handleDelete = async (postId: string, postUid: string) => {
    if (postUid !== user?.uid) return;
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(doc(db, 'posts', postId)) },
    ]);
  };

  const timeAgo = (timestamp: any) => {
    if (!timestamp) return 'just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = item.likes?.includes(user?.uid || '');
    return (
      <View style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => router.push(`/user/${item.uid}`)}
          >
            <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
              {item.photoURL ? (
                <Image source={{ uri: item.photoURL }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{item.displayName?.[0]?.toUpperCase()}</Text>
              )}
            </View>
            <View>
              <Text style={[styles.userName, { color: theme.text }]}>{item.displayName}</Text>
              <Text style={[styles.postTime, { color: theme.textSecondary }]}>{timeAgo(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
          {item.uid === user?.uid && (
            <TouchableOpacity onPress={() => handleDelete(item.id, item.uid)}>
              <CloseIcon size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.postContent, { color: theme.text }]}>{item.content}</Text>

        {item.imageURL && (
          <Image source={{ uri: item.imageURL }} style={styles.postImage} resizeMode="cover" />
        )}

        <View style={[styles.postStats, { borderColor: theme.border }]}>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {item.likes?.length || 0} likes
          </Text>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {item.comments?.length || 0} comments
          </Text>
        </View>

        <View style={[styles.postActions, { borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleLike(item.id, item.likes || [])}
          >
            <HeartIcon size={22} color={isLiked ? Colors.light.like : theme.textSecondary} filled={isLiked} />
            <Text style={[styles.actionText, { color: isLiked ? Colors.light.like : theme.textSecondary }]}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setSelectedPost(selectedPost === item.id ? null : item.id)}
          >
            <CommentIcon size={22} color={theme.textSecondary} />
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <ShareIcon size={22} color={theme.textSecondary} />
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>Share</Text>
          </TouchableOpacity>
        </View>

        {selectedPost === item.id && (
          <View style={[styles.commentBox, { borderColor: theme.border }]}>
            {item.comments?.slice(-3).map((c, i) => (
              <View key={i} style={styles.commentItem}>
                <Text style={[styles.commentName, { color: Colors.primary }]}>{c.displayName}: </Text>
                <Text style={[styles.commentText, { color: theme.text }]}>{c.text}</Text>
              </View>
            ))}
            <View style={[styles.commentInput, { backgroundColor: theme.input }]}>
              <TextInput
                style={[styles.commentTextInput, { color: theme.text }]}
                placeholder="Write a comment..."
                placeholderTextColor={theme.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={() => handleComment(item.id)}
              />
              <TouchableOpacity onPress={() => handleComment(item.id)}>
                <Text style={{ color: Colors.primary, fontWeight: '700' }}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { backgroundColor: theme.header, borderColor: theme.border }]}>
        <NexusLogo size={32} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>Nexus</Text>
        <TouchableOpacity onPress={() => router.push('/ai-chat')}>
          <AIIcon size={26} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} colors={[Colors.primary]} />
        }
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.createPostBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setShowCreatePost(true)}
          >
            <View style={[styles.miniAvatar, { backgroundColor: Colors.primary }]}>
              <Text style={styles.avatarText}>{profile?.displayName?.[0]?.toUpperCase()}</Text>
            </View>
            <Text style={[styles.createPostText, { color: theme.textSecondary }]}>What's on your mind?</Text>
            <ImageIcon size={22} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <Modal visible={showCreatePost} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Create Post</Text>
              <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                <CloseIcon size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.postInput, { color: theme.text, backgroundColor: theme.input }]}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.textSecondary}
              value={newPost}
              onChangeText={setNewPost}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.postBtn, loading && { opacity: 0.7 }]}
              onPress={handleCreatePost}
              disabled={loading}
            >
              <Text style={styles.postBtnText}>{loading ? 'Posting...' : 'Post'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  createPostBtn: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, padding: 14, borderRadius: 16,
    borderWidth: 1, gap: 12,
  },
  miniAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  createPostText: { flex: 1, fontSize: 15 },
  postCard: {
    marginHorizontal: 12, marginBottom: 12,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userName: { fontSize: 15, fontWeight: '700' },
  postTime: { fontSize: 12, marginTop: 2 },
  postContent: { fontSize: 15, lineHeight: 22, paddingHorizontal: 14, paddingBottom: 12 },
  postImage: { width: '100%', height: 240 },
  postStats: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1,
  },
  statText: { fontSize: 13 },
  postActions: {
    flexDirection: 'row', borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 10,
  },
  actionText: { fontSize: 14, fontWeight: '600' },
  commentBox: { borderTopWidth: 1, padding: 12, gap: 8 },
  commentItem: { flexDirection: 'row', flexWrap: 'wrap' },
  commentName: { fontSize: 13, fontWeight: '700' },
  commentText: { fontSize: 13 },
  commentInput: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, gap: 10,
  },
  commentTextInput: { flex: 1, fontSize: 14 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 16,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  postInput: {
    borderRadius: 14, padding: 14, fontSize: 16,
    minHeight: 120, textAlignVertical: 'top',
  },
  postBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  postBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
