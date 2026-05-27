import type {
    TouristProfileRequest,
    TouristProfileResponse,
    TouristProfileExistsResponse
} from '../types/tourist-profile';

const API_BASE_URL = 'http://localhost:8080';

class TouristProfileService {
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };

        console.log('Auth headers:', headers);
        return headers;
    }

    async createProfile(profileData: TouristProfileRequest): Promise<TouristProfileResponse> {
        console.log('Creating profile with data:', profileData);
        console.log('API URL:', `${API_BASE_URL}/api/tourist-profile`);
        console.log('Headers:', this.getAuthHeaders());

        const response = await fetch(`${API_BASE_URL}/api/tourist-profile`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(profileData),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error response:', errorData);
            throw new Error(errorData.message || 'Failed to create profile');
        }

        const result = await response.json();
        console.log('Success response:', result);
        return result;
    }

    async updateProfile(profileData: TouristProfileRequest): Promise<TouristProfileResponse> {
        const response = await fetch(`${API_BASE_URL}/api/tourist-profile`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(profileData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update profile');
        }

        return response.json();
    }

    async getProfile(): Promise<TouristProfileResponse> {
        const response = await fetch(`${API_BASE_URL}/api/tourist-profile`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to get profile');
        }

        return response.json();
    }

    async checkProfileExists(): Promise<boolean> {
        const response = await fetch(`${API_BASE_URL}/api/tourist-profile/exists`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            return false;
        }

        const data: TouristProfileExistsResponse = await response.json();
        return data.exists;
    }

    async deleteProfile(): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/tourist-profile`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete profile');
        }
    }
}

export const touristProfileService = new TouristProfileService();