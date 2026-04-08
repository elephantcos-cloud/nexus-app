import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, useColorScheme, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../lib/colors';
import { HeartIcon, CommentIcon, UserIcon, BellIcon } from '../../components/icons';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow';
  fromUid: string;
  fromName: string;
  fromPhoto?: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('toUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Notification[];
      setNotifications(notifs);
    });
    return unsubscribe;
  }, [user]);

  const markRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <HeartIcon size={20} color={Colors.light.like} filled />;
      case 'comment': return <CommentIcon size={20} color={Colors.primary} />;
      case 'follow': return <UserIcon size={20} color={Colors.accent} />;
      default: return <BellIcon size={20} color={Colors.primary} />;
    }
  };

  const timeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notifItem,
              { borderColor: theme.border, backgroundColor: item.read ? theme.background : Colors.primary + '08' },
            ]}
            onPress={() => markRead(item.id)}
          >
            <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
              {item.fromPhoto ? (
                <Image source={{ uri: item.fromPhoto }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{item.fromName?.[0]?.toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.notifInfo}>
              <Text style={[styles.notifText, { color: theme.text }]}>
                <Text style={{ fontWeight: '700' }}>{item.fromName}</Text> {item.message}
              </Text>
              <Text style={[styles.notifTime, { color: theme.textSecondary }]}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
            <View style={[styles.iconBadge, { backgroundColor: theme.surface }]}>
              {getIcon(item.type)}
            </View>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: Colors.primary }]} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <BellIcon size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No notifications yet</Text>
            <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
              When someone likes or comments on your posts, you'll see it here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  notifItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, gap: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  notifInfo: { flex: 1 },
  notifText: { fontSize: 14, lineHeight: 20 },
  notifTime: { fontSize: 12, marginTop: 4 },
  iconBadge: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    position: 'absolute', top: 14, right: 14,
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '700' },
  emptySubText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
