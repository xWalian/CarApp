import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {ReactNativeJoystick} from "@korsolutions/react-native-joystick";
import {useCameraDevices, useCameraPermission} from 'react-native-vision-camera';
import Orientation from "react-native-orientation-locker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TcpSocket from 'react-native-tcp-socket';
import CryptoJS from 'crypto-js';

const SOCKET_HOST = '192.168.0.157';
const SOCKET_PORT = 12345;

const ControllerScreen: React.FC = () => {
    const [url, setUrl] = useState<string>('');
    const [isHolding, setIsHolding] = useState(false);
    const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const socketIpRef = useRef<string | null>(null);
    const socketPortRef = useRef<number | null>(null);

    const {hasPermission, requestPermission} = useCameraPermission();
    const devices = useCameraDevices();
    const device = devices.find(device => device.position === 'front');

    const clientRef = useRef<TcpSocket.Socket | null>(null);

    const loadUrl = async () => {
        try {
            const savedUrl: string | null = await AsyncStorage.getItem('serverUrl');
            const savedSocketUrl: string | null = await AsyncStorage.getItem('serverSocketIp');
            const savedSocketPort: string | null = await AsyncStorage.getItem('serverSocketPort');
            console.debug("url", savedUrl);
            if (savedUrl) {
                setUrl(savedUrl);
            }
            if (savedSocketUrl) {
                console.log("savedSocketUrl value", savedSocketUrl);
                socketIpRef.current = savedSocketUrl;
            }
            if (savedSocketPort) {
                console.log("savedSocketPort value", savedSocketPort);
                socketPortRef.current = parseInt(savedSocketPort);
            }
        } catch (error) {
            console.error('Error loading URL:', error);
        }
    };

    const reconnect = () => {
        if (!clientRef.current) {
            const newClient = TcpSocket.createConnection(
                {host: socketIpRef.current ?? '', port: socketPortRef.current ?? 0},
                () => {
                    console.log("Successfully connected to server");
                    clientRef.current = newClient;
                }
            );

            newClient.on('connect', () => {
                console.log("Event: Connected to server");
            });

            // newClient.on('error', (error) => {
            //     console.error("Client connection error:", error);
            // });

            newClient.on('close', (hadError) => {
                console.log("Client connection closed", hadError ? 'with error' : 'without error');
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
                if (latestDataRef.current.type == "stop") {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    latestDataRef.current = null;
                }
                if (clientRef.current) {
                    if (latestDataRef.current == prevDataRef.current && latestDataRef.current) {
                        if (latestDataRef.current.type) {
                            const message = JSON.stringify(latestDataRef.current);
                            const encryptedMessage = encryptData("jsonaaaaaaaaaaaa" + message);
                            console.log("encryptedMessage", encryptedMessage);

                            if(encryptedMessage){
                                clientRef.current.write(encryptedMessage);
                            }

                            latestDataRef.current.type = "hold"
                        }
                    }

                    prevDataRef.current = latestDataRef.current
                    if (latestDataRef.current) {
                        const message = JSON.stringify(latestDataRef.current);

                        const encryptedMessage = encryptData("jsonaaaaaaaaaaaa" + message);
                        console.log("encryptedMessage", encryptedMessage);
                        if(encryptedMessage){
                            clientRef.current.write(encryptedMessage);
                        }
                        console.log("Joystick data sent:", message);
                    } else {
                        console.log("stopped");
                    }
                }
            }
        }, 100);
    }

    const [joystickData, setJoystickData] = useState<{ x: number; y: number }>({x: 0, y: 0});
    const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleJoystickMove = useCallback(
        (data: any) => {
            if (!clientRef.current || clientRef.current.readyState !== "open") {
                return;
            }
            try {
                latestDataRef.current = data;
            } catch (error) {
                console.error("Failed to send message:", error);
            }
        },
        []
    );

    const handleJoystickStart = useCallback(
        (data: any) => {
            if (!clientRef.current || clientRef.current.readyState !== "open") {
                return;
            }
            try {
                if (!intervalRef.current) {
                    interval()
                }

                latestDataRef.current = data
            } catch (error) {
                console.error("Failed to send message:", error);
            }
        },
        []
    );

    const handleJoystickStop = useCallback(
        (data: any) => {
            if (!clientRef.current || clientRef.current.readyState !== "open") {
                return;
            }
            try {
                const message = JSON.stringify(latestDataRef.current);

                latestDataRef.current = data;
                if (clientRef.current) {
                    const encryptedMessage = encryptData("jsonaaaaaaaaaaaa" + message);
                    console.log("encryptedMessage", encryptedMessage);
                    if(encryptedMessage){
                        clientRef.current.write(encryptedMessage);
                    }
                }

            } catch (error) {
                console.error("Failed to send message:", error);
            }
        },
        []
    );

    const key = useRef<any | null>(null);
    const iv = useRef<any | null>(null);

    const initEncryption = useCallback(() => {
        const password = 'veryStrongPassword';
        const salt = CryptoJS.enc.Hex.parse(
            'da02d941cd19d955d78e10c1b592bd0e8e4189af4df96b0fa2b645b6'
        );
        const initializationVector = CryptoJS.enc.Hex.parse('da385e282f16d7d094c4a87d6e11eea1');

        // key.current = CryptoJS.PBKDF2(password, salt, { keySize: 256 / 8 });
        key.current = CryptoJS.enc.Hex.parse('de3fb02a2f1db0f5adf4a633f50cbcb229e19b086e93da786d1d9f845ae8f623');
        console.log("key", key.current.toString());
        iv.current = initializationVector;
        console.log("iv", iv.current.toString());
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
            console.error('Decryption failed:', error);
            return null;
        }
    };


    if (device == null) return <View style={styles.container}/>;

    return (
        <View style={styles.container}>
            {/*<VideoClient port={parseInt(url)} />*/}
            <View style={styles.joystickContainer}>
                <ReactNativeJoystick
                    color="#06b6d4"
                    radius={80}
                    onMove={(data) => handleJoystickMove(data)}
                    onStart={(data) => handleJoystickStart(data)}
                    onStop={(data) => handleJoystickStop(data)}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    joystickContainer: {
        margin: 20,
    },
    video: {
        backgroundColor: '#111',
        width: '100%',
        height: '100%',
    },
});

export default ControllerScreen;
