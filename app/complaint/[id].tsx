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
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '../index';
import { Image } from 'expo-image';
// import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ComplaintDetail {
  id: string;
  title: string;
  description: string;
  citizen_name: string;
  citizen_phone: string;
  citizen_email?: string;
  category: string;
  priority: string;
  status: string;
  color_code: string;
  location_address: string;
  location_coordinates?: { lat: number; lng: number };
  citizen_image?: string;
  assigned_employee_id?: string;
  assigned_employee_name?: string;
  progress_photos: Array<{
    image: string;
    note?: string;
    timestamp: string;
    added_by: string;
    employee_id: string;
  }>;
  created_at: string;
  updated_at: string;
}

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const auth = useContext(AuthContext);

  const fetchComplaint = async () => {
    if (!auth?.token || !id) return;

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/complaints/${id}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComplaint(data);
      } else {
        console.error('Failed to fetch complaint:', response.status);
        if (response.status === 401) {
          Alert.alert('Session Expired', 'Please login again');
          auth.logout();
        } else if (response.status === 404) {
          Alert.alert('Not Found', 'Complaint not found');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      Alert.alert('Error', 'Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (newStatus: string) => {
    if (!auth?.token || !complaint) return;

    try {
      setUpdating(true);
      const response = await fetch(`${BACKEND_URL}/api/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          assigned_employee_id: auth.employee?.employee_id,
          assigned_employee_name: auth.employee?.name,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', `Complaint status updated to ${newStatus}`);
        fetchComplaint(); // Refresh data
      } else {
        Alert.alert('Error', 'Failed to update complaint status');
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      Alert.alert('Error', 'Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  const addProgressPhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }

      Alert.alert(
        'Add Progress Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => takePicture() },
          { text: 'Choose from Gallery', onPress: () => pickFromGallery() },
        ]
      );
    } catch (error) {
      console.error('Error requesting camera permission:', error);
    }
  };

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        uploadProgressPhoto(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        uploadProgressPhoto(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProgressPhoto = async (base64Image: string) => {
    if (!auth?.token || !complaint) return;

    try {
      setUpdating(true);
      const response = await fetch(`${BACKEND_URL}/api/complaints/${complaint.id}/progress-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaint_id: complaint.id,
          image: base64Image,
          note: 'Progress update',
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Progress photo added successfully');
        fetchComplaint(); // Refresh data
      } else {
        Alert.alert('Error', 'Failed to upload progress photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUpdating(false);
    }
  };

  const openImageModal = (imageBase64: string) => {
    setSelectedImage(imageBase64);
    setShowImageModal(true);
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const getStatusColor = (colorCode: string) => {
    switch (colorCode) {
      case 'green': return '#48bb78';
      case 'orange': return '#ed8936';
      case 'yellow': return '#ecc94b';
      default: return '#a0aec0';
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={styles.loadingText}>Loading complaint...</Text>
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#e53e3e" />
        <Text style={styles.errorText}>Complaint not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = getStatusColor(complaint.color_code);
  const priorityColor = getPriorityColor(complaint.priority);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a202c" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complaint Details</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchComplaint}>
          <Ionicons name="refresh" size={24} color="#4299e1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Status and Priority Header */}
        <View style={styles.statusHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{complaint.status.toUpperCase()}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>{complaint.priority.toUpperCase()}</Text>
          </View>
        </View>

        {/* Title and Description */}
        <View style={styles.mainCard}>
          <Text style={styles.complaintTitle}>{complaint.title}</Text>
          <Text style={styles.complaintDescription}>{complaint.description}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaRow}>
              <Ionicons name="folder" size={16} color="#4299e1" />
              <Text style={styles.metaText}>Category: {complaint.category}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time" size={16} color="#a0aec0" />
              <Text style={styles.metaText}>Created: {formatDate(complaint.created_at)}</Text>
            </View>
            {complaint.updated_at !== complaint.created_at && (
              <View style={styles.metaRow}>
                <Ionicons name="sync" size={16} color="#a0aec0" />
                <Text style={styles.metaText}>Updated: {formatDate(complaint.updated_at)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Citizen Information */}
        <View style={styles.citizenCard}>
          <Text style={styles.cardTitle}>Citizen Information</Text>
          <View style={styles.citizenInfo}>
            <View style={styles.citizenRow}>
              <Ionicons name="person" size={16} color="#4299e1" />
              <Text style={styles.citizenText}>{complaint.citizen_name}</Text>
            </View>
            <View style={styles.citizenRow}>
              <Ionicons name="call" size={16} color="#4299e1" />
              <Text style={styles.citizenText}>{complaint.citizen_phone}</Text>
            </View>
            {complaint.citizen_email && (
              <View style={styles.citizenRow}>
                <Ionicons name="mail" size={16} color="#4299e1" />
                <Text style={styles.citizenText}>{complaint.citizen_email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationCard}>
          <Text style={styles.cardTitle}>Location</Text>
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color="#4299e1" />
            <Text style={styles.locationText}>{complaint.location_address}</Text>
          </View>
          
          {complaint.location_coordinates && (
            <View style={styles.mapContainer}>
              <Text style={styles.mapPlaceholder}>
                📍 Location: {complaint.location_coordinates.lat.toFixed(4)}, {complaint.location_coordinates.lng.toFixed(4)}
              </Text>
              <Text style={styles.mapNote}>
                Map integration will be available in the next update
              </Text>
            </View>
          )}
        </View>

        {/* Citizen Image */}
        {complaint.citizen_image && (
          <View style={styles.imageCard}>
            <Text style={styles.cardTitle}>Citizen Photo</Text>
            <TouchableOpacity onPress={() => openImageModal(complaint.citizen_image!)}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${complaint.citizen_image}` }}
                style={styles.citizenImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Photos */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardTitle}>Progress Photos</Text>
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={addProgressPhoto}
              disabled={updating}
            >
              <Ionicons name="camera" size={16} color="#ffffff" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
          
          {complaint.progress_photos.length === 0 ? (
            <Text style={styles.noPhotosText}>No progress photos yet</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photosContainer}>
                {complaint.progress_photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.progressPhotoContainer}
                    onPress={() => openImageModal(photo.image)}
                  >
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${photo.image}` }}
                      style={styles.progressPhoto}
                      contentFit="cover"
                    />
                    <View style={styles.photoInfo}>
                      <Text style={styles.photoDate}>
                        {formatDate(photo.timestamp)}
                      </Text>
                      <Text style={styles.photoAuthor}>
                        by {photo.added_by}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Assignment Info */}
        {complaint.assigned_employee_name && (
          <View style={styles.assignmentCard}>
            <Text style={styles.cardTitle}>Assignment</Text>
            <View style={styles.assignmentInfo}>
              <Ionicons name="person-circle" size={16} color="#48bb78" />
              <Text style={styles.assignmentText}>
                Assigned to: {complaint.assigned_employee_name}
              </Text>
            </View>
          </View>
        )}

        {/* Status Update Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Update Status</Text>
          <View style={styles.actionButtons}>
            {complaint.status !== 'active' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ed8936' }]}
                onPress={() => updateComplaintStatus('active')}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>Mark as Active</Text>
                )}
              </TouchableOpacity>
            )}
            
            {complaint.status !== 'resolved' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#48bb78' }]}
                onPress={() => updateComplaintStatus('resolved')}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>Mark as Resolved</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalContent}>
              {selectedImage && (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                  style={styles.modalImage}
                  contentFit="contain"
                />
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImageModal(false)}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
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
  backButton: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4a5568',
  },
  backIcon: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  refreshButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#2d3748',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  complaintTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  complaintDescription: {
    fontSize: 16,
    color: '#e2e8f0',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaInfo: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#a0aec0',
    fontSize: 14,
    marginLeft: 8,
  },
  citizenCard: {
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
    marginBottom: 12,
  },
  citizenInfo: {
    gap: 8,
  },
  citizenRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  citizenText: {
    color: '#e2e8f0',
    fontSize: 14,
    marginLeft: 8,
  },
  locationCard: {
    backgroundColor: '#2d3748',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationText: {
    color: '#e2e8f0',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  mapContainer: {
    height: 100,
    borderRadius: 8,
    backgroundColor: '#4a5568',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mapPlaceholder: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  mapNote: {
    color: '#a0aec0',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  imageCard: {
    backgroundColor: '#2d3748',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  citizenImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  progressCard: {
    backgroundColor: '#2d3748',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4299e1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addPhotoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  noPhotosText: {
    color: '#a0aec0',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  progressPhotoContainer: {
    width: 120,
  },
  progressPhoto: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoInfo: {
    alignItems: 'center',
  },
  photoDate: {
    color: '#a0aec0',
    fontSize: 10,
  },
  photoAuthor: {
    color: '#a0aec0',
    fontSize: 10,
  },
  assignmentCard: {
    backgroundColor: '#2d3748',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignmentText: {
    color: '#48bb78',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionsCard: {
    backgroundColor: '#2d3748',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.7,
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
});