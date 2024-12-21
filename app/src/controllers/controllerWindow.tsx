import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ReactNativeJoystick} from '@korsolutions/react-native-joystick';
import {useCameraDevices} from 'react-native-vision-camera';
import Orientation from 'react-native-orientation-locker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TcpSocket from 'react-native-tcp-socket';
import CryptoJS from 'crypto-js';
import VideoClient from './controllerSocket.tsx';
import ProgressBar from '../components/progressBar.tsx';

const ControllerScreen: React.FC = () => {
  const [url, setUrl] = useState<string>('');

  const socketIpRef = useRef<string | null>(null);
  const socketPortRef = useRef<number | null>(null);

  const devices = useCameraDevices();
  const device = devices.find(device => device.position === 'front');

  const clientRef = useRef<TcpSocket.Socket | null>(null);

  const loadUrl = async () => {
    try {
      const savedUrl: string | null = await AsyncStorage.getItem('serverUrl');
      const savedSocketUrl: string | null = await AsyncStorage.getItem(
        'serverSocketIp',
      );
      const savedSocketPort: string | null = await AsyncStorage.getItem(
        'serverSocketPort',
      );
      console.debug('url', savedUrl);
      if (savedUrl) {
        setUrl(savedUrl);
      }
      if (savedSocketUrl) {
        console.log('savedSocketUrl value', savedSocketUrl);
        socketIpRef.current = savedSocketUrl;
      }
      if (savedSocketPort) {
        console.log('savedSocketPort value', savedSocketPort);
        socketPortRef.current = parseInt(savedSocketPort);
      }
    } catch (error) {
      console.error('Error loading URL:', error);
    }
  };
  const [currentVelocity, setCurrentVelocity] = useState(0);
  const [maxVelocity, setMaxVelocity] = useState(100);
  const reconnect = () => {
    if (!clientRef.current) {
      const newClient = TcpSocket.createConnection(
        {host: socketIpRef.current ?? '', port: socketPortRef.current ?? 0},
        () => {
          console.log('Successfully connected to server');
          clientRef.current = newClient;
        },
      );

      newClient.on('connect', () => {
        console.log('Event: Connected to server');
      });

      newClient.on('data', data => {
        try {
          const response = data.toString();
          const decryptedMessage = decryptData(response);
          console.log('Otrzymano odpowiedź od serwera:', decryptedMessage);
          if (decryptedMessage) {
            const json = JSON.parse(decryptedMessage);
            if (json.current_velocity) {
              setCurrentVelocity(json.current_velocity || 0);
            }
            if (json.max_velocity) {
              setMaxVelocity(json.max_velocity || 100);
            }
          }
        } catch (error) {
          console.error('Błąd podczas przetwarzania odpowiedzi:', error);
        }
      });

      // newClient.on('error', error => {
      //   // console.error('Błąd klienta:', error);
      // });

      newClient.on('close', hadError => {
        console.log(
          'Client connection closed',
          hadError ? 'with error' : 'without error',
        );
        clientRef.current = null;
        setTimeout(reconnect, 5000);
      });
    }
  };

  const latestDataRef = useRef<any | null>(null);
  const prevDataRef = useRef<any | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadUrl();
    initEncryption();
    Orientation.lockToLandscape();
    reconnect();

    return () => {
      if (clientRef.current) clientRef.current.destroy();
      Orientation.lockToPortrait();
    };
  }, []);

  function interval() {
    intervalRef.current = setInterval(() => {
      if (latestDataRef.current) {
        if (latestDataRef.current.type == 'stop') {
          const message = JSON.stringify(latestDataRef.current);
          const encryptedMessage = encryptData('jsonaaaaaaaaaaaa' + message);
          console.log('encryptedMessage', encryptedMessage);

          if (encryptedMessage && clientRef.current) {
            clientRef.current.write(encryptedMessage);
          }
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          latestDataRef.current = null;
        }
        if (clientRef.current) {
          if (
            latestDataRef.current == prevDataRef.current &&
            latestDataRef.current
          ) {
            if (
              latestDataRef.current.type &&
              latestDataRef.current.type != 'break'
            ) {
              const message = JSON.stringify(latestDataRef.current);
              const encryptedMessage = encryptData(
                'jsonaaaaaaaaaaaa' + message,
              );
              console.log('encryptedMessage', encryptedMessage);

              if (encryptedMessage) {
                clientRef.current.write(encryptedMessage);
              }

              latestDataRef.current.type = 'hold';
            }
          }

          prevDataRef.current = latestDataRef.current;
          if (latestDataRef.current) {
            const message = JSON.stringify(latestDataRef.current);

            const encryptedMessage = encryptData('jsonaaaaaaaaaaaa' + message);
            console.log('encryptedMessage', encryptedMessage);
            if (encryptedMessage) {
              clientRef.current.write(encryptedMessage);
            }
            console.log('Joystick data sent:', message);
          } else {
            console.log('stopped');
          }
        }
      }
    }, 100);
  }

  const handleJoystickMove = useCallback((data: any) => {
    if (!clientRef.current || clientRef.current.readyState !== 'open') {
      return;
    }
    try {
      latestDataRef.current = data;
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, []);

  const handleJoystickStart = useCallback((data: any) => {
    if (!clientRef.current || clientRef.current.readyState !== 'open') {
      return;
    }
    try {
      if (!intervalRef.current) {
        interval();
      }

      latestDataRef.current = data;
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, []);

  const handleJoystickStop = useCallback((data: any) => {
    if (!clientRef.current || clientRef.current.readyState !== 'open') {
      return;
    }
    try {
      latestDataRef.current = data;
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, []);

  const key = useRef<any | null>(null);
  const iv = useRef<any | null>(null);

  const initEncryption = useCallback(() => {
    // const password = 'veryStrongPassword';
    // const salt = CryptoJS.enc.Hex.parse(
    //   'da02d941cd19d955d78e10c1b592bd0e8e4189af4df96b0fa2b645b6',
    // );
    const initializationVector = CryptoJS.enc.Hex.parse(
      'da385e282f16d7d094c4a87d6e11eea1',
    );

    // key.current = CryptoJS.PBKDF2(password, salt, { keySize: 256 / 8 });
    key.current = CryptoJS.enc.Hex.parse(
      'de3fb02a2f1db0f5adf4a633f50cbcb229e19b086e93da786d1d9f845ae8f623',
    );
    console.log('key', key.current.toString());
    iv.current = initializationVector;
    console.log('iv', iv.current.toString());
  }, []);

  const encryptData = (data: string) => {
    if (!key.current || !iv.current) {
      console.error('Encryption key or IV not initialized');
      return null;
    }

    const encrypted = CryptoJS.AES.encrypt(data, key.current, {
      iv: iv.current,
      mode: CryptoJS.mode.CBC,
    });

    return encrypted.toString();
  };

  const decryptData = (encryptedData: string) => {
    if (!key.current || !iv.current) {
      console.error('Encryption key or IV not initialized');
      return null;
    }

    try {
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, key.current, {
        iv: iv.current,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return decryptedBytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.log('Decryption failed:', error);
      return null;
    }
  };

  const [joystickDisabled, setJoystickDisabled] = useState(false);

  const handleBrakePress = useCallback(() => {
    if (!clientRef.current || clientRef.current.readyState !== 'open') {
      return;
    }
    try {
      setJoystickDisabled(true); // Zablokowanie joysticka
      if (!intervalRef.current) {
        interval();
      }
      latestDataRef.current = JSON.parse(
        '{"position":{"x":0,"y":0},"angle":{"radian":0,"degree":0},"force":0,"type":"break"}',
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, []);

  const handleBrakeRelease = useCallback(() => {
    if (!clientRef.current || clientRef.current.readyState !== 'open') {
      return;
    }
    try {
      setJoystickDisabled(false); // Odblokowanie joysticka
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, []);

  const progress = maxVelocity > 0 ? currentVelocity : 0;

  const getProgressBarColor = () => {
    if (progress <= 33) {
      return '#4caf50';
    } else if (progress > 33 && progress <= 66) {
      return '#ffeb3b';
    } else {
      return '#f44336';
    }
  };

  if (device == null) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <Text style={styles.label}>
          Aktualna prędkość: {currentVelocity} / {maxVelocity} km/h
        </Text>
        <ProgressBar
          progress={progress}
          height={30}
          fillColor={getProgressBarColor()}
        />
      </View>
      <VideoClient port={parseInt(url, 10)} />
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.brakeButton}
          onPressIn={handleBrakePress}
          onPressOut={handleBrakeRelease}>
          <Text style={styles.brakeButtonText}>Hamulec</Text>
        </TouchableOpacity>
        <View style={styles.joystickContainer}>
          <ReactNativeJoystick
            color="#06b6d4"
            radius={80}
            onMove={
              joystickDisabled ? undefined : data => handleJoystickMove(data)
            }
            onStart={
              joystickDisabled ? undefined : data => handleJoystickStart(data)
            }
            onStop={
              joystickDisabled ? undefined : data => handleJoystickStop(data)
            }
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    margin: 20,
  },
  joystickContainer: {
    marginLeft: 20,
  },
  video: {
    backgroundColor: '#111',
    width: '100%',
    height: '100%',
  },
  brakeButton: {
    backgroundColor: '#514f4f',
    height: 120,
    padding: 15,
    marginLeft: 20,
    borderRadius: 10,
  },
  brakeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    color: '#fff',
  },
  progressBar: {
    bottom: 0,
    zIndex: 2000,
    display: 'flex',
    position: 'absolute',
    width: 400,
  },
});

export default ControllerScreen;
