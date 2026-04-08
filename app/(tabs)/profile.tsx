import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, useColorScheme, Image, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collection, onSnapshot, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../lib/colors';
import { SettingsIcon, LogoutIcon, AIIcon, HeartIcon, CommentIcon, CloseIcon } from '../../components/icons';

interface Post {
  id: string;
  uid: string;
  content: string;
  imageURL?: string;
  likes: string[];
  comments: any[];
  createdAt: any;
}

export default function ProfileScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<'posts' | 'liked'>('posts');
  const { user, profile, logout } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'posts'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Post[]);
    });
    return unsubscribe;
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/ai-chat')}>
            <AIIcon size={26} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <LogoutIcon size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={[styles.cover, { backgroundColor: Colors.primary }]}>
          <View style={styles.coverGradient} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={[styles.profileAvatar, { backgroundColor: Colors.primary, borderColor: theme.background }]}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.profileAvatarImg} />
            ) : (
              <Text style={styles.profileAvatarText}>
                {profile?.displayName?.[0]?.toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {profile?.displayName}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
              {user?.email}
            </Text>
            {profile?.bio ? (
              <Text style={[styles.profileBio, { color: theme.text }]}>{profile.bio}</Text>
            ) : null}
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { borderColor: theme.border }]}>
            {[
              { label: 'Posts', value: posts.length },
              { label: 'Likes', value: totalLikes },
              { label: 'Following', value: profile?.following?.length || 0 },
              { label: 'Followers', value: profile?.followers?.length || 0 },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={[styles.editBtn, { borderColor: theme.border }]}>
            <Text style={[styles.editBtnText, { color: theme.text }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderColor: theme.border }]}>
          {(['posts', 'liked'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && { borderBottomColor: Colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? Colors.primary : theme.textSecondary }]}>
                {t === 'posts' ? 'My Posts' : 'Liked'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts */}
        {posts.map((post) => (
          <View key={post.id} style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.postContent, { color: theme.text }]}>{post.content}</Text>
            {post.imageURL && (
              <Image source={{ uri: post.imageURL }} style={styles.postImage} resizeMode="cover" />
            )}
            <View style={styles.postFooter}>
              <View style={styles.postStat}>
                <HeartIcon size={16} color={Colors.light.like} filled={post.likes?.includes(user?.uid || '')} />
                <Text style={[styles.postStatText, { color: theme.textSecondary }]}>
                  {post.likes?.length || 0}
                </Text>
              </View>
              <View style={styles.postStat}>
                <CommentIcon size={16} color={theme.textSecondary} />
                <Text style={[styles.postStatText, { color: theme.textSecondary }]}>
                  {post.comments?.length || 0}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteDoc(doc(db, 'posts', post.id))}>
                <CloseIcon size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {posts.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No posts yet</Text>
            <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
              Share something with the world!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cover: { height: 140 },
  coverGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
  },
  profileSection: { paddingHorizontal: 16, paddingBottom: 16 },
  profileAvatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -44, borderWidth: 4, overflow: 'hidden',
  },
  profileAvatarImg: { width: '100%', height: '100%' },
  profileAvatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  profileInfo: { marginTop: 12, gap: 4 },
  profileName: { fontSize: 22, fontWeight: '800' },
  profileEmail: { fontSize: 14 },
  profileBio: { fontSize: 15, marginTop: 4 },
  statsRow: {
    flexDirection: 'row', marginTop: 16,
    paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12 },
  editBtn: {
    borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 10, alignItems: 'center', marginTop: 16,
  },
  editBtnText: { fontSize: 15, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 15, fontWeight: '700' },
  postCard: {
    marginHorizontal: 12, marginTop: 12,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 14,
  },
  postContent: { fontSize: 15, lineHeight: 22 },
  postImage: { width: '100%', height: 200, marginTop: 10, borderRadius: 10 },
  postFooter: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, marginTop: 12,
  },
  postStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatText: { fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '700' },
  emptySubText: { fontSize: 14 },
});
