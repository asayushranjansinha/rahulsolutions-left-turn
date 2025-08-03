// App.tsx or screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

const API_URL = 'http://43.204.116.26/api/health';

export default function App() {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setStatus(data.status || 'Success'))
      .catch(err => {
        console.error(err);
        setStatus('Failed to connect');
      });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>API Status:</Text>
      <Text>{status}</Text>
    </View>
  );
}
