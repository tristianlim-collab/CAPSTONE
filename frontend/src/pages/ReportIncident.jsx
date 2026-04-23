import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { incidentAPI, uploadAPI, evidenceAPI, incidentTypeAPI } from '../api';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiMapPin, FiCamera, FiSend, FiX } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Click Handler Component
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

const ReportIncident = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    photo_url: '',
  });
  const [position, setPosition] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [incidentTypes, setIncidentTypes] = useState([]);

  // Default center (Negros Island Region)
  const defaultCenter = [10.0000, 122.9000];

  // Get user's current location and fetch incident types on mount
  useEffect(() => {
    getCurrentLocation();
    fetchIncidentTypes();
  }, []);

  const fetchIncidentTypes = async () => {
    try {
      const response = await incidentTypeAPI.getAll();
      setIncidentTypes(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch incident types:', error);
      toast.error('Could not load incident types');
    }
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.info('Using default location. Click map to set incident location.');
          setPosition(defaultCenter);
          setGettingLocation(false);
        }
      );
    } else {
      toast.info('Geolocation not supported. Click map to set location.');
      setPosition(defaultCenter);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));

    // Upload immediately
    await uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    setUploading(true);
    try {
      const response = await uploadAPI.uploadPhoto(file);
      const photoUrl = response.data.data.url;
      setUploadedPhotoUrl(photoUrl);
      setFormData({ ...formData, photo_url: photoUrl });
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
      setPhoto(null);
      setPhotoPreview(null);
      setUploadedPhotoUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setUploadedPhotoUrl(null);
    setFormData({ ...formData, photo_url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!position) {
      toast.error('Please set incident location on the map');
      return;
    }

    if (!formData.type) {
      toast.error('Please select incident type');
      return;
    }

    setSubmitting(true);

    try {
      const incidentData = {
        incident_type_id: formData.type,
        description: formData.description,
        latitude: position[0],
        longitude: position[1],
      };

      const incidentResponse = await incidentAPI.create(incidentData);
      console.log('Incident created:', incidentResponse.data);

      // Get incident_id from response
      const incidentId = incidentResponse.data?.incident_id;

      if (!incidentId) {
        console.error('No incident_id in response:', incidentResponse.data);
        throw new Error('Failed to get incident ID from server');
      }

      // If photo was uploaded, create evidence record
      if (uploadedPhotoUrl && incidentId) {
        try {
          console.log('Creating evidence for incident:', incidentId, 'Photo URL:', uploadedPhotoUrl);
          const evidenceResponse = await evidenceAPI.uploadFromUrl({
            incident_id: incidentId,
            file_path: uploadedPhotoUrl,
            file_type: photo?.type || 'image/jpeg',
            file_name: photo?.name || 'incident-photo.jpg'
          });
          console.log('Evidence created:', evidenceResponse.data);
          toast.success('Photo evidence saved!');
        } catch (error) {
          console.error('Failed to save evidence:', error);
          toast.warning('Incident reported but photo evidence could not be saved');
        }
      }

      toast.success('Incident reported successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to report incident';
      console.error('Incident submission error:', error);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-400 hover:text-white">
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-white">Report Incident</h1>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Incident Type */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Incident Type *
          </label>
          {incidentTypes.length === 0 ? (
            <p className="text-sm text-gray-400">Loading incident types...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {incidentTypes.map((type) => (
                <button
                  key={type.type_id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.type_id })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === type.type_id
                      ? 'border-primary bg-primary/10'
                      : 'border-dark-border hover:border-dark-border/80'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon_label || '⚠️'}</div>
                  <div className="text-sm text-gray-300">{type.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-3">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Describe the incident in detail..."
          />
        </div>

        {/* Photo Upload */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Photo Evidence (Optional)
          </label>

          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
              >
                <FiX />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-dark-border rounded-lg cursor-pointer hover:border-primary transition-colors">
              <FiCamera className="w-12 h-12 text-gray-500 mb-2" />
              <span className="text-sm text-gray-400">
                {uploading ? 'Uploading...' : 'Click to upload photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Location Map */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-300">
              Incident Location *
            </label>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
            >
              <FiMapPin className="w-3 h-3" />
              {gettingLocation ? 'Getting location...' : 'Use current location'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Click on the map to set the incident location
          </p>

          <div className="h-64 rounded-lg overflow-hidden border border-dark-border">
            {position && (
              <MapContainer
                center={position}
                zoom={14}
                minZoom={5}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            )}
          </div>

          {position && (
            <p className="text-xs text-gray-500 mt-2">
              Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || uploading || !position}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSend />
          {submitting ? 'Submitting Report...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default ReportIncident;
