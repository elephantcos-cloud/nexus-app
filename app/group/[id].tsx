import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, useColorScheme, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../lib/colors';
import { BackIcon, SendIcon, GroupIcon } from '../../components/icons';

interface Message {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt: any;
}

export default function GroupChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'groups', id, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[];
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsubscribe;
  }, [id]);

  const sendMessage = async () => {
    if (!text.trim() || !user || !id) return;
    const msgText = text.trim();
    setText('');
    await addDoc(collection(db, 'groups', id, 'messages'), {
      uid: user.uid,
      displayName: profile?.displayName || user.email,
      text: msgText,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'groups', id), {
      lastMessage: msgText,
      lastMessageTime: serverTimestamp(),
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.uid === user?.uid;
    const prevMsg = messages[index - 1];
    const showName = !isOwn && (!prevMsg || prevMsg.uid !== item.uid);

    return (
      <View style={[styles.messageRow, isOwn ? styles.ownRow : styles.otherRow]}>
        {!isOwn && (
          <View style={[styles.msgAvatar, { backgroundColor: Colors.primary, opacity: showName ? 1 : 0 }]}>
            <Text style={styles.msgAvatarText}>{item.displayName?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.bubbleContainer}>
          {showName && (
            <Text style={[styles.senderName, { color: Colors.primary }]}>{item.displayName}</Text>
          )}
          <View style={[
            styles.bubble,
            isOwn
              ? { backgroundColor: Colors.primary }
              : { backgroundColor: theme.bubble },
          ]}>
            <Text style={[styles.bubbleText, { color: isOwn ? '#fff' : theme.text }]}>
              {item.text}
            </Text>
            <Text style={[styles.bubbleTime, { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { backgroundColor: theme.header, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <BackIcon size={26} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.groupAvatar, { backgroundColor: Colors.primary + '20' }]}>
          <GroupIcon size={22} color={Colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: theme.text }]}>{name}</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Group Chat</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, gap: 4 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                No messages yet. Say hello!
              </Text>
            </View>
          }
        />

        <View style={[styles.inputBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
            placeholder="Message group..."
            placeholderTextColor={theme.textSecondary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: text.trim() ? Colors.primary : theme.input }]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <SendIcon size={20} color={text.trim() ? '#fff' : theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, gap: 12,
  },
  groupAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 13 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2 },
  ownRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start', gap: 8 },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bubbleContainer: { maxWidth: '75%' },
  senderName: { fontSize: 12, fontWeight: '700', marginBottom: 4, marginLeft: 4 },
  bubble: { borderRadius: 18, padding: 12, paddingBottom: 6 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 11, marginTop: 4, textAlign: 'right' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, gap: 10,
  },
  input: {
    flex: 1, borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
