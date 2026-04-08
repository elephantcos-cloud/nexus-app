import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, useColorScheme, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../lib/colors';
import { BackIcon, SendIcon, ImageIcon, MicIcon } from '../../components/icons';

interface Message {
  id: string;
  uid: string;
  text: string;
  createdAt: any;
  seen?: boolean;
}

export default function ChatScreen() {
  const { id, otherUid, name } = useLocalSearchParams<{ id: string; otherUid: string; name: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const chatId = id || [user?.uid, otherUid].sort().join('_');

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[];
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    const msgText = text.trim();
    setText('');
    setSending(true);
    try {
      await setDoc(doc(db, 'chats', chatId), {
        participants: [user.uid, otherUid],
        lastMessage: msgText,
        lastMessageTime: serverTimestamp(),
      }, { merge: true });

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        uid: user.uid,
        text: msgText,
        createdAt: serverTimestamp(),
        seen: false,
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.uid === user?.uid;
    const prevMsg = messages[index - 1];
    const showAvatar = !isOwn && (!prevMsg || prevMsg.uid !== item.uid);

    return (
      <View style={[styles.messageRow, isOwn ? styles.ownRow : styles.otherRow]}>
        {!isOwn && (
          <View style={[styles.msgAvatar, { backgroundColor: Colors.primary, opacity: showAvatar ? 1 : 0 }]}>
            <Text style={styles.msgAvatarText}>{name?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={[
          styles.bubble,
          isOwn
            ? [styles.ownBubble, { backgroundColor: Colors.primary }]
            : [styles.otherBubble, { backgroundColor: theme.bubble }],
        ]}>
          <Text style={[styles.bubbleText, { color: isOwn ? '#fff' : theme.text }]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
            {formatTime(item.createdAt)}
          </Text>
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
        <View style={[styles.headerAvatar, { backgroundColor: Colors.primary }]}>
          <Text style={styles.headerAvatarText}>{name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: theme.text }]}>{name}</Text>
          <Text style={[styles.headerStatus, { color: Colors.light.online }]}>Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, gap: 4 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={[styles.emptyChatText, { color: theme.textSecondary }]}>
                Say hello to {name}!
              </Text>
            </View>
          }
        />

        <View style={[styles.inputBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.inputAction}>
            <ImageIcon size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
            placeholder="Message..."
            placeholderTextColor={theme.textSecondary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          {text.trim() ? (
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: Colors.primary }]}
              onPress={sendMessage}
              disabled={sending}
            >
              <SendIcon size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.inputAction}>
              <MicIcon size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
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
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 17, fontWeight: '700' },
  headerStatus: { fontSize: 13 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2 },
  ownRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start', gap: 8 },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bubble: {
    maxWidth: '75%', borderRadius: 18, padding: 12,
    paddingBottom: 6,
  },
  ownBubble: { borderBottomRightRadius: 4 },
  otherBubble: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 11, marginTop: 4, textAlign: 'right' },
  emptyChat: { flex: 1, alignItems: 'center', paddingTop: 40 },
  emptyChatText: { fontSize: 15 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, gap: 10,
  },
  inputAction: { padding: 4, paddingBottom: 6 },
  input: {
    flex: 1, borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
