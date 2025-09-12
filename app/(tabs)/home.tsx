import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../index';
import { router } from 'expo-router';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Complaint {
  id: string;
  title: string;
  description: string;
  citizen_name: string;
  citizen_phone: string;
  category: string;
  priority: string;
  status: string;
  color_code: string;
  location_address: string;
  citizen_image?: string;
  assigned_employee_name?: string;
  created_at: string;
  updated_at: string;
}

export default function HomeScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const auth = useContext(AuthContext);

  const fetchComplaints = async (isRefresh = false) => {
    if (!auth?.token) return;

    try {
      if (!isRefresh) setLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/complaints`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      } else {
        console.error('Failed to fetch complaints:', response.status);
        if (response.status === 401) {
          Alert.alert('Session Expired', 'Please login again');
          auth.logout();
        }
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      Alert.alert('Error', 'Failed to load complaints');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints(true);
  };

  const getStatusColor = (colorCode: string) => {
    switch (colorCode) {
      case 'green': return '#48bb78'; // resolved
      case 'orange': return '#ed8936'; // active
      case 'yellow': return '#ecc94b'; // pending
      default: return '#a0aec0';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return 'checkmark-circle';
      case 'active': return 'time';
      case 'pending': return 'hourglass';
      default: return 'help-circle';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#e53e3e';
      case 'high': return '#ff6b35';
      case 'medium': return '#38b2ac';
      case 'low': return '#4299e1';
      default: return '#a0aec0';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const handleComplaintPress = (complaint: Complaint) => {
    router.push(`/complaint/${complaint.id}`);
  };

  const renderComplaint = (complaint: Complaint) => {
    const statusColor = getStatusColor(complaint.color_code);
    const priorityColor = getPriorityColor(complaint.priority);

    return (
      <TouchableOpacity
        key={complaint.id}
        style={[styles.complaintCard, { borderLeftColor: statusColor }]}
        onPress={() => handleComplaintPress(complaint)}
        activeOpacity={0.7}
      >
        <View style={styles.complaintHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.complaintTitle} numberOfLines={1}>
              {complaint.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Ionicons 
                name={getStatusIcon(complaint.status)} 
                size={12} 
                color="#ffffff" 
              />
              <Text style={styles.statusText}>
                {complaint.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.metaRow}>
            <View style={styles.categoryTag}>
              <Ionicons
                name={complaint.category === 'electrical' ? 'flash' : 'trash'}
                size={14}
                color="#4299e1"
              />
              <Text style={styles.categoryText}>{complaint.category}</Text>
            </View>
            
            <View style={[styles.priorityTag, { backgroundColor: priorityColor }]}>
              <Text style={styles.priorityText}>{complaint.priority}</Text>
            </View>
          </View>
        </View>

        <View style={styles.complaintBody}>
          <Text style={styles.complaintDescription} numberOfLines={2}>
            {complaint.description}
          </Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#a0aec0" />
            <Text style={styles.locationText} numberOfLines={1}>
              {complaint.location_address}
            </Text>
          </View>

          <View style={styles.citizenRow}>
            <Ionicons name="person" size={14} color="#a0aec0" />
            <Text style={styles.citizenText}>
              {complaint.citizen_name} • {complaint.citizen_phone}
            </Text>
          </View>
        </View>

        <View style={styles.complaintFooter}>
          {complaint.citizen_image && (
            <View style={styles.imageIndicator}>
              <Ionicons name="image" size={16} color="#4299e1" />
              <Text style={styles.imageText}>Photo attached</Text>
            </View>
          )}
          
          <View style={styles.footerRight}>
            {complaint.assigned_employee_name && (
              <Text style={styles.assignedText}>
                Assigned to: {complaint.assigned_employee_name}
              </Text>
            )}
            <Text style={styles.dateText}>
              {formatDate(complaint.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={styles.loadingText}>Loading complaints...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a202c" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Municipal Complaints</Text>
          <Text style={styles.headerSubtitle}>
            {auth?.employee?.name} • {auth?.employee?.department}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => fetchComplaints()}
        >
          <Ionicons name="refresh" size={24} color="#4299e1" />
        </TouchableOpacity>
      </View>

      {/* Complaints List */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4299e1"
            colors={['#4299e1']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.complaintsContainer}>
          {complaints.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#4a5568" />
              <Text style={styles.emptyTitle}>No Complaints</Text>
              <Text style={styles.emptyText}>
                There are no complaints assigned to you at the moment.
              </Text>
            </View>
          ) : (
            complaints.map(renderComplaint)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a202c',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4a5568',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a0aec0',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  complaintsContainer: {
    padding: 16,
  },
  complaintCard: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  complaintHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  complaintTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a365d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#4299e1',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  complaintBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  complaintDescription: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#a0aec0',
    marginLeft: 6,
    flex: 1,
  },
  citizenRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  citizenText: {
    fontSize: 12,
    color: '#a0aec0',
    marginLeft: 6,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#4a5568',
  },
  imageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageText: {
    fontSize: 12,
    color: '#4299e1',
    marginLeft: 4,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  assignedText: {
    fontSize: 10,
    color: '#68d391',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 10,
    color: '#a0aec0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});