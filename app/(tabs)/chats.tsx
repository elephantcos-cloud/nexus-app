import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, useColorScheme, Image, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collection, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../lib/colors';
import { SearchIcon, AIIcon, PlusIcon } from '../../components/icons';

interface ChatPreview {
  id: string;
  otherUser: {
    uid: string;
    displayName: string;
    photoURL?: string;
    online?: boolean;
  };
  lastMessage?: string;
  lastMessageTime?: any;
  unread?: number;
}

export default function ChatsScreen() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList: ChatPreview[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherUid = data.participants.find((p: string) => p !== user.uid);
        if (!otherUid) continue;
        const userQuery = query(collection(db, 'users'), where('uid', '==', otherUid));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          const otherUser = userSnap.docs[0].data();
          chatList.push({
            id: docSnap.id,
            otherUser: {
              uid: otherUid,
              displayName: otherUser.displayName,
              photoURL: otherUser.photoURL,
              online: otherUser.online,
            },
            lastMessage: data.lastMessage,
            lastMessageTime: data.lastMessageTime,
          });
        }
      }
      setChats(chatList.sort((a, b) => {
        const aTime = a.lastMessageTime?.toMillis?.() || 0;
        const bTime = b.lastMessageTime?.toMillis?.() || 0;
        return bTime - aTime;
      }));
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs
        .map((d) => d.data())
        .filter((u) => u.uid !== user?.uid);
      setUsers(usersData);
    });
    return unsubscribe;
  }, []);

  const filteredUsers = users.filter((u) =>
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const openChat = (otherUid: string, displayName: string) => {
    const chatId = [user?.uid, otherUid].sort().join('_');
    router.push(`/chat/${chatId}?otherUid=${otherUid}&name=${displayName}`);
  };

  const timeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/ai-chat')}>
            <AIIcon size={26} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowUsers(!showUsers)} style={styles.newChatBtn}>
            <PlusIcon size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.input }]}>
        <SearchIcon size={18} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search messages"
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={(t) => { setSearch(t); setShowUsers(t.length > 0); }}
        />
      </View>

      {showUsers ? (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chatItem, { borderColor: theme.border }]}
              onPress={() => { openChat(item.uid, item.displayName); setShowUsers(false); setSearch(''); }}
            >
              <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
                {item.photoURL ? (
                  <Image source={{ uri: item.photoURL }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>{item.displayName?.[0]?.toUpperCase()}</Text>
                )}
                {item.online && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.chatInfo}>
                <Text style={[styles.chatName, { color: theme.text }]}>{item.displayName}</Text>
                <Text style={[styles.chatSub, { color: theme.textSecondary }]}>
                  {item.online ? 'Online' : 'Offline'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chatItem, { borderColor: theme.border }]}
              onPress={() => openChat(item.otherUser.uid, item.otherUser.displayName)}
            >
              <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
                {item.otherUser.photoURL ? (
                  <Image source={{ uri: item.otherUser.photoURL }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>{item.otherUser.displayName?.[0]?.toUpperCase()}</Text>
                )}
                {item.otherUser.online && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.chatInfo}>
                <Text style={[styles.chatName, { color: theme.text }]}>{item.otherUser.displayName}</Text>
                <Text style={[styles.chatSub, { color: theme.textSecondary }]} numberOfLines={1}>
                  {item.lastMessage || 'Start a conversation'}
                </Text>
              </View>
              {item.lastMessageTime && (
                <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
                  {timeAgo(item.lastMessageTime)}
                </Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No messages yet</Text>
              <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
                Tap + to start a conversation
              </Text>
            </View>
          }
        />
      )}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  newChatBtn: {
    backgroundColor: Colors.primary, width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 12, borderRadius: 14, paddingHorizontal: 14, height: 44,
  },
  searchInput: { flex: 1, fontSize: 15 },
  chatItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff',
  },
  chatInfo: { flex: 1, marginLeft: 12 },
  chatName: { fontSize: 16, fontWeight: '700' },
  chatSub: { fontSize: 14, marginTop: 3 },
  chatTime: { fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '700' },
  emptySubText: { fontSize: 14 },
});
