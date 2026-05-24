from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = '/api/token/'  # Default JWT token URL usually
        self.user_data = {
            'email': 'test@v4h.com',
            'password': 'testpassword123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'SOLICITANTE'
        }

    def test_registration_success(self):
        """Test user registration with valid data"""
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().email, 'test@v4h.com')

    def test_registration_specialist_with_specialty(self):
        """Test specialist registration persists specialty field"""
        data = self.user_data.copy()
        data.update({
            'email': 'specialist@v4h.com',
            'role': 'ESPECIALISTA',
            'specialty': 'CARDIOLOGIA'
        })
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='specialist@v4h.com')
        self.assertEqual(user.role, 'ESPECIALISTA')
        self.assertEqual(user.specialty, 'CARDIOLOGIA')

    def test_registration_duplicate_email(self):
        """Test registration fails with an existing email"""
        User.objects.create_user(email='test@v4h.com', password='password123')
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        """Test successful login returns JWT tokens"""
        User.objects.create_user(email='test@v4h.com', password='testpassword123')
        login_data = {
            'email': 'test@v4h.com',
            'password': 'testpassword123'
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_me_endpoint(self):
        """Test /api/users/me/ returns current user info"""
        user = User.objects.create_user(email='test@v4h.com', password='password123', role='ESPECIALISTA')
        self.client.force_authenticate(user=user)
        url = reverse('user-detail')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@v4h.com')
        self.assertEqual(response.data['role'], 'ESPECIALISTA')
