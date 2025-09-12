import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../index';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ProfileData {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  contact_phone: string;
  is_active: boolean;
  created_at: string;
  performance_stats: {
    total_complaints_assigned: number;
    total_complaints_resolved: number;
    resolution_rate: number;
    last_activity: string;
  };
}

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useContext(AuthContext);

  const fetchProfile = async () => {
    if (!auth?.token) return;

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else {
        console.error('Failed to fetch profile:', response.status);
        if (response.status === 401) {
          Alert.alert('Session Expired', 'Please login again');
          auth.logout();
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => auth?.logout()
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department.toLowerCase()) {
      case 'sanitation': return 'trash';
      case 'electrical': return 'flash';
      case 'admin': return 'shield-checkmark';
      default: return 'person';
    }
  };

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90) return { level: 'Excellent', color: '#48bb78' };
    if (rate >= 75) return { level: 'Good', color: '#38b2ac' };
    if (rate >= 60) return { level: 'Average', color: '#ecc94b' };
    return { level: 'Needs Improvement', color: '#ed8936' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#e53e3e" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const performance = getPerformanceLevel(profileData.performance_stats.resolution_rate);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a202c" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employee Profile</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchProfile}>
          <Ionicons name="refresh" size={24} color="#4299e1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons
                name={getDepartmentIcon(profileData.department)}
                size={32}
                color="#4299e1"
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.employeeName}>{profileData.name}</Text>
              <Text style={styles.employeeId}>ID: {profileData.employee_id}</Text>
              <View style={styles.departmentBadge}>
                <Text style={styles.departmentText}>
                  {profileData.department.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="mail" size={16} color="#a0aec0" />
              <Text style={styles.contactText}>{profileData.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call" size={16} color="#a0aec0" />
              <Text style={styles.contactText}>{profileData.contact_phone}</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="calendar" size={16} color="#a0aec0" />
              <Text style={styles.contactText}>
                Joined: {formatDate(profileData.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Performance Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="folder-open" size={24} color="#4299e1" />
              </View>
              <Text style={styles.statValue}>
                {profileData.performance_stats.total_complaints_assigned}
              </Text>
              <Text style={styles.statLabel}>Assigned</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#48bb78" />
              </View>
              <Text style={styles.statValue}>
                {profileData.performance_stats.total_complaints_resolved}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="trending-up" size={24} color={performance.color} />
              </View>
              <Text style={[styles.statValue, { color: performance.color }]}>
                {profileData.performance_stats.resolution_rate}%
              </Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>

          <View style={styles.performanceIndicator}>
            <Text style={styles.performanceLabel}>Performance Level:</Text>
            <Text style={[styles.performanceLevel, { color: performance.color }]}>
              {performance.level}
            </Text>
          </View>
        </View>

        {/* Work History */}
        <View style={styles.historyCard}>
          <Text style={styles.cardTitle}>Work History</Text>
          
          <View style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Ionicons name="time" size={20} color="#4299e1" />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Last Activity</Text>
              <Text style={styles.historyText}>
                {formatDate(profileData.performance_stats.last_activity)}
              </Text>
            </View>
          </View>

          <View style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#48bb78" />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Account Status</Text>
              <Text style={[styles.historyText, { color: '#48bb78' }]}>
                {profileData.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Ionicons name="business" size={20} color="#38b2ac" />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Department</Text>
              <Text style={styles.historyText}>
                {profileData.department.charAt(0).toUpperCase() + profileData.department.slice(1)} Department
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={20} color="#4299e1" />
            <Text style={styles.actionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={16} color="#a0aec0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={20} color="#4299e1" />
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color="#a0aec0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={20} color="#4299e1" />
            <Text style={styles.actionText}>Work Report</Text>
            <Ionicons name="chevron-forward" size={16} color="#a0aec0" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#e53e3e" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a202c',
    padding: 20,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  refreshButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#2d3748',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a365d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 14,
    color: '#a0aec0',
    marginBottom: 8,
  },
  departmentBadge: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  departmentText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  contactInfo: {
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    color: '#e2e8f0',
    fontSize: 14,
    marginLeft: 12,
  },
  statsCard: {
    backgroundColor: '#2d3748',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
  },
  performanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#4a5568',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#a0aec0',
    marginRight: 8,
  },
  performanceLevel: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#2d3748',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyIcon: {
    marginRight: 16,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  historyText: {
    fontSize: 12,
    color: '#a0aec0',
  },
  actionsCard: {
    backgroundColor: '#2d3748',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d3748',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e53e3e',
  },
  logoutText: {
    color: '#e53e3e',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});