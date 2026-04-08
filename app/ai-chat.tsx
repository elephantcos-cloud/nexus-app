import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, useColorScheme, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { sendMessageToGroq, Message } from '../../lib/groq';
import { Colors } from '../../lib/colors';
import { BackIcon, SendIcon, AIIcon, CloseIcon } from '../../components/icons';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'What can you help me with?',
  'Write a post for me',
  'Give me a fun fact',
  'How to make new friends?',
];

export default function AIChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText) return;
    setInput('');

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: msgText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    const groqMessages: Message[] = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await sendMessageToGroq(groqMessages);
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
    setMessages([...updatedMessages, aiMsg]);
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: Colors.primary }]}>
            <AIIcon size={16} color="#fff" />
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser
            ? { backgroundColor: Colors.primary }
            : { backgroundColor: theme.bubble },
        ]}>
          <Text style={[styles.bubbleText, { color: isUser ? '#fff' : theme.text }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <BackIcon size={26} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.aiAvatarLarge, { backgroundColor: Colors.primary }]}>
            <AIIcon size={22} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerName, { color: theme.text }]}>Nexus AI</Text>
            <Text style={[styles.headerSub, { color: Colors.light.online }]}>Always here for you</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setMessages([])}>
          <CloseIcon size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyAvatarLarge, { backgroundColor: Colors.primary }]}>
              <AIIcon size={48} color="#fff" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Hi! I'm Nexus AI</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Ask me anything — I'm here to help!
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.suggestionChip, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}
                  onPress={() => sendMessage(s)}
                >
                  <Text style={[styles.suggestionText, { color: Colors.primary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListFooterComponent={
              loading ? (
                <View style={[styles.messageRow, styles.aiRow]}>
                  <View style={[styles.aiAvatar, { backgroundColor: Colors.primary }]}>
                    <AIIcon size={16} color="#fff" />
                  </View>
                  <View style={[styles.bubble, { backgroundColor: theme.bubble }]}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        <View style={[styles.inputBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
            placeholder="Ask Nexus AI..."
            placeholderTextColor={theme.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() ? Colors.primary : theme.input }]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <SendIcon size={20} color={input.trim() ? '#fff' : theme.textSecondary} />
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
    borderBottomWidth: 1, justifyContent: 'space-between',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatarLarge: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerName: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 13 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  emptyAvatarLarge: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 24, fontWeight: '800' },
  emptySubtitle: { fontSize: 16, textAlign: 'center' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 8 },
  suggestionChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1,
  },
  suggestionText: { fontSize: 14, fontWeight: '600' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 14 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
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
