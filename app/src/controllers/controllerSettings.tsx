// ControllerSettings.tsx
import React, {useEffect, useState} from 'react';
import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RootStackParamList} from "../../../App.tsx";
import {StackNavigationProp} from "@react-navigation/stack";


type ControllerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Controller'>;

type ControllerScreenProps = {
    navigation: ControllerScreenNavigationProp;
};

const validateIp = (ip: string): boolean => {
    const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regex.test(ip);
};

const validatePort = (port: string): boolean => {
    const regex = /^[0-9]+$/;
    const portNumber = parseInt(port, 10);
    return regex.test(port) && portNumber >= 0 && portNumber <= 65535;
};

const ControllerSettings: React.FC<ControllerScreenProps> = ({navigation}) => {
    const [videoPort, setVideoPort] = useState<string>('');
    const [socketIp, setSocketIp] = useState<string>('');
    const [socketPort, setSocketPort] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [socketPortError, setSocketPortError] = useState<string>('');
    const [portError, setPortError] = useState<string>('');

    const saveUrl = async () => {
        let validate: boolean = true
        if(videoPort != '')
        if (!validatePort(videoPort)) {
            setPortError("Port musi być wartością od 0 do 65535")
            validate = false
        } else {
            setPortError("")
        }
        if(socketIp != '')
        if (!validateIp(socketIp)) {
            setError("Ip musi być w formacie 0.0.0.0 do 255.255.255.255")
            validate = false
        } else {
            setError("")
        }
        if(socketPort != '')
        if (!validatePort(socketPort)) {
            setSocketPortError("Port musi być wartością od 0 do 65535")
            validate = false
        } else {
            setSocketPortError("")
        }

        if(validate){
            await AsyncStorage.setItem('serverVideoPort', videoPort);
            await AsyncStorage.setItem('serverSocketIp', socketIp);
            await AsyncStorage.setItem('serverSocketPort', socketPort);
            navigation.navigate('Home');
        }
    };

    const loadUrl = async () => {
        try {
            const savedVideoPort = await AsyncStorage.getItem('serverVideoPort');
            const savedSocketUrl = await AsyncStorage.getItem('serverSocketIp');
            const savedSocketPort = await AsyncStorage.getItem('serverSocketPort');

            if (savedVideoPort && validatePort(savedVideoPort)) {
                setVideoPort(savedVideoPort);
            }
            if (savedSocketUrl && validateIp(savedSocketUrl)) {
                setSocketIp(savedSocketUrl);
            }
            if (savedSocketPort && validatePort(savedSocketPort)) {
                setSocketPort(savedSocketPort)
            }
        } catch (error) {
            console.error('Error loading URL:', error);
        }
    };


    useEffect(() => {
        loadUrl();
    }, []);

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Wprowadź port serwera video</Text>
            <TextInput
                style={[styles.input]}
                placeholder="Wprowadź port"
                value={videoPort}
                onChangeText={(text) => {
                    setVideoPort(text);
                    setError('');
                }}
            />
            {portError ? <Text style={styles.errorText}>{portError}</Text> : null}
            <Text style={styles.title}>Wprowadź socket serwera</Text>
            <TextInput
                style={[styles.input]}
                placeholder="Wprowadź IP"
                value={socketIp}
                onChangeText={(text) => {
                    setSocketIp(text);
                    setPortError('');
                }}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TextInput
                style={[styles.input]}
                placeholder="Wprowadź port"
                value={socketPort}
                onChangeText={(text) => {
                    setSocketPort(text);
                    setSocketPortError('');
                }}
            />
            {socketPortError ? <Text style={styles.errorText}>{socketPortError}</Text> : null}
            <Button title="Zapisz" onPress={saveUrl}/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222',
        padding: 20,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 20,
        color: '#fff',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
        width: '100%',
    },
    errorInput: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    text: {
        textAlign: 'center',
        marginTop: 20,
        color: '#fff',
    },
});

export default ControllerSettings;
