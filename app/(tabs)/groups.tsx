import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, useColorScheme, TextInput,
  Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  collection, addDoc, onSnapshot, query,
  where, serverTimestamp, arrayUnion, updateDoc, doc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../lib/colors';
import { PlusIcon, GroupIcon, CloseIcon } from '../../components/icons';

interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdBy: string;
  lastMessage?: string;
  lastMessageTime?: any;
  createdAt: any;
}

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Group[];
      setGroups(groupsData);
    });
    return unsubscribe;
  }, [user]);

  const createGroup = async () => {
    if (!groupName.trim() || !user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        description: groupDesc.trim(),
        members: [user.uid],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        lastMessage: '',
      });
      setGroupName('');
      setGroupDesc('');
      setShowCreate(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Groups</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: Colors.primary }]}
          onPress={() => setShowCreate(true)}
        >
          <PlusIcon size={20} color="#fff" />
          <Text style={styles.createBtnText}>New Group</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.groupItem, { borderColor: theme.border }]}
            onPress={() => router.push(`/group/${item.id}?name=${item.name}`)}
          >
            <View style={[styles.groupIcon, { backgroundColor: Colors.primary + '20' }]}>
              <GroupIcon size={28} color={Colors.primary} />
            </View>
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.groupSub, { color: theme.textSecondary }]}>
                {item.members.length} members {item.lastMessage ? `• ${item.lastMessage}` : ''}
              </Text>
            </View>
            {item.lastMessageTime && (
              <Text style={[styles.groupTime, { color: theme.textSecondary }]}>
                {timeAgo(item.lastMessageTime)}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <GroupIcon size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No groups yet</Text>
            <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
              Create or join a group to get started
            </Text>
          </View>
        }
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Create Group</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <CloseIcon size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
              placeholder="Group Name"
              placeholderTextColor={theme.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.textSecondary}
              value={groupDesc}
              onChangeText={setGroupDesc}
            />

            <TouchableOpacity
              style={[styles.createGroupBtn, loading && { opacity: 0.7 }]}
              onPress={createGroup}
              disabled={loading}
            >
              <Text style={styles.createGroupBtnText}>
                {loading ? 'Creating...' : 'Create Group'}
              </Text>
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
    paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  groupItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  groupIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  groupInfo: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 16, fontWeight: '700' },
  groupSub: { fontSize: 14, marginTop: 3 },
  groupTime: { fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '700' },
  emptySubText: { fontSize: 14, textAlign: 'center' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 14,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  input: {
    borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 16,
  },
  createGroupBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  createGroupBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
